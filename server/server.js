'use strict';

/**
 * Serveur REST de l'appli Hubz.
 * Voir la documentatation dans `documentation/api.md` pour plus d'infos
 */

var configDefault = require('../config.js.default');
//machine locale
if (configDefault.environment === 'local') {
    var config = require('../config.js');
}
else {
    // sur les serveurs de dev : les fichiers de config sont dans le sous répertoir private + nom du server
    var config = require('../../../private/hubz-server/config.js');
}

var RestServer = require('../core/RestServer');
var ChatServer = require('../core/ChatServer');
var pause = require('connect-pause');
var AppErrors = require('./AppErrors');
var PhoneFormatter = require('./PhoneFormatter');
var SMS = require('./SMS');
var uuid = require('node-uuid');
var messages = require('./messages');
var format = require('format');
var path = require('path');
var moment = require('moment');
moment.locale('fr');
var HubzerList = require('./modules/HubzerList');
var Match = require('./modules/Match');
var express = require('../core/node_modules/express');
var knex = require('../core/server_modules/bookshelf').knex;
var Match = require('./modules/Match');

// Modèles
var Users = require('./models/Users');
var AdActions = require('./models/AdActions');
var AdCategoriesParents = require('./models/AdCategoriesParents');
var AdCategoryDurations = require('./models/AdCategoryDurations');
var AdStatuses = require('./models/AdStatuses');
var Ads = require('./models/Ads');
var AdKeywords = require('./models/AdKeywords');

var server = new RestServer({
    useMysql: true,
});

var chatServer = new ChatServer();

var match = new Match();
var hubzerList = new HubzerList(config.distance_max_show_meters);

var nodemailer = require('nodemailer');
var sendmailTransport = require('nodemailer-sendmail-transport');


// Permet d'ajouter du délai aux requêtes pour les tests (config.addedDelayMs)
if (config.addedDelayMs) {
    server.app.use(pause(config.addedDelayMs));
}

var implementAuth = require('./implementAuth');
implementAuth(server);

/**
 * Fetch models based on the passed options.
 * If onlyOne is true, only one model will be returned.
 */
var fetchCollection = function (Model, queryOptions, fetchOptions) {

    queryOptions = queryOptions || {};
    fetchOptions = fetchOptions || {};

     var fetch = Model
        .forge()
        .query(queryOptions)
        .fetchAll(fetchOptions)
    ;

    return fetch;
};

/**
 * Envoie les données JSON retournées par la promise.
 * En cas d'erreur, une erreur 500 est envoyée.
 */
var sendJson = function (res, mysqlPromise, filterRows) {

    filterRows = filterRows || function (rows) { return rows; };

    mysqlPromise
        .then(function(rows) {
            res.json(filterRows(rows));
        })
        .catch(function(err) {
            res.sendStatus(500);
            console.error(err.message);
        })
    ;
};

function hubzMatch(hubzToCompare, idAction, idSubCategory, is_offer, is_demand) {

    var hubz_match = false;
    // si aucune action renseignée, lorsque on demande de match via le res de la liste déroulante
    if (idAction) {
        // si les actions matchent, ou c'est la cas acheter/vendre, oui
        if ( (idAction === hubzToCompare.ad_actions_id) || ((hubzToCompare.ad_actions_id === 1 ) && (idAction === 2)) || ((hubzToCompare.ad_actions_id === 2 ) && (idAction === 1)) ) {
            // check si c'est couple offre/demande, sauf pour action rencontre echange et partage qui matchent que demande avec demande
            if (  (hubzToCompare.is_offer === 1 && is_demand) || (hubzToCompare.is_demand === 1 && is_offer) || ( (hubzToCompare.ad_actions_id === 8) && (idAction === 8) && (is_demand) && (hubzToCompare.is_demand === 1)  ) || ( (hubzToCompare.ad_actions_id === 5) && (idAction === 5) && (is_demand) && (hubzToCompare.is_demand === 1)  ) || ( (hubzToCompare.ad_actions_id === 4) && (idAction === 4) && (is_demand) && (hubzToCompare.is_demand === 1)  )   ) {
                // si les catégories matchent aussi
                if (hubzToCompare.ad_category_id === idSubCategory) {
                    hubz_match = true;
                }
            }
        }
    }
    else {

        // c'est une demande, donc ne filtrer que les hubz qui sont des offres
        if (hubzToCompare.is_offer === 1) {
            // si les catégories matchent aussi
            if (hubzToCompare.ad_category_id === idSubCategory) {
                hubz_match = true;
            }
        }
    }
    return hubz_match;
}

/**
 * @async
 * retourne les hubz qui match avec les miens
 * ou null si il n'y en a pas
 */
function listMatchingHubz(id_hubzer, done) {
    var tabIdHubzMatchWithMe = [];
    var listHubzMatchWithMe = {};
    /*{
        'myHubzId1': {
            'hubzMatchedIdA': myHubzId1,
            'hubzMatchedIdB': myHubzId2
        },
        'myHubzId2': {
            'hubzMatchedIdC': myHubzId2,
            'hubzMatchedIdD': myHubzId2
        },
    }*/

    var listHubzerNearMe = {};

    /*{
        'idNearHubzerA':{
            coordGps: {
                latitude: '48.700232',
                longitude: '6.176436'
            },
            distance: 32
        },
        'idNearHubzerB':{
            coordGps: {
                latitude: '48.700232',
                longitude: '6.176436'
            },
            distance: 32
        }
    }*/

    var now = new Date();
    var hourNow = moment().format('hh:mm');
    // récupère le couple d'id hubz qui match lorsque je suis applicant
    var matchHubzList1 = knex('ads')
        .join('user_linkings', 'user_linkings.id_applicant', '=', 'ads.id')
        .select('user_linkings.id_receiver', 'user_linkings.id_applicant')
        .where('user_id', '=', id_hubzer)
        .andWhere(function() {
          this.where('ads.ad_status_id', '=', 1).orWhere('ads.ad_status_id', '=', 4)
        })
        .andWhere('ads.disabled_abuse', '=', 0)
        .andWhere('ads.date_start', '<=', now)
        .andWhere('ads.date_end', '>=', now);
    matchHubzList1
        .bind({})
        .then(function (idMatchHubzList1) {

            idMatchHubzList1.map(function(el, i) {
                if (typeof listHubzMatchWithMe[idMatchHubzList1[i].id_applicant] === 'undefined') {
                    listHubzMatchWithMe[idMatchHubzList1[i].id_applicant] = {};
                }
                listHubzMatchWithMe[idMatchHubzList1[i].id_applicant][idMatchHubzList1[i].id_receiver] = idMatchHubzList1[i].id_applicant;
                // ajoute au tab les id des hubz qui matchent avec moi
                tabIdHubzMatchWithMe.push(idMatchHubzList1[i].id_receiver);
            });

            // récupère le couple d'id hubz qui match lorsque je suis receiver
            var matchHubzList2 = knex('ads')
                .join('user_linkings', 'user_linkings.id_receiver', '=', 'ads.id')
                .select('user_linkings.id_applicant', 'user_linkings.id_receiver')
                .where('user_id', '=', id_hubzer)
                .andWhere(function() {
                  this.where('ads.ad_status_id', '=', 1).orWhere('ads.ad_status_id', '=', 4)
                })
                .andWhere('ads.disabled_abuse', '=', 0)
                .andWhere('ads.date_start', '<=', now)
                .andWhere('ads.date_end', '>=', now);

            matchHubzList2

                .bind({})
                .then(function (idMatchHubzList2) {

                    // listHubzMatchWithMe = {id de mon hubz: id hubz qui match}
                    idMatchHubzList2.map(function(el, i) {

                        if (typeof listHubzMatchWithMe[idMatchHubzList2[i].id_receiver] === 'undefined') {
                            listHubzMatchWithMe[idMatchHubzList2[i].id_receiver] = {};
                        }
                        listHubzMatchWithMe[idMatchHubzList2[i].id_receiver][idMatchHubzList2[i].id_applicant] = idMatchHubzList2[i].id_receiver;
                        // ajoute au tab les id des hubz qui matchent avec moi
                        tabIdHubzMatchWithMe.push(idMatchHubzList2[i].id_applicant);
                    });

                    var nearHubzer;
                    // je me positionne dans la liste de hubzers, afin de connaitre mes voisins
                    if (typeof hubzerList.hubzers[id_hubzer] !== 'undefined'){
                       nearHubzer  = hubzerList.hubzers[id_hubzer].nearHubzerList;
                    }

                    // je parcourt mes voisins et je mets leurs id (id_hubzer) dans un tableau
                    // je prend également leurs coordonnées gps ainsi que la distance
                    for (var near in nearHubzer) {
                        listHubzerNearMe[nearHubzer[near].idHubzer] = {
                            coordGps : hubzerList.hubzers[id_hubzer].nearHubzerList[near].coordGps,
                            distance : hubzerList.hubzers[id_hubzer].nearHubzerList[near].distance,
                        };
                    }

                    if (Object.keys(listHubzerNearMe).length === 0){
                        done(null, null);
                        return;
                    }
                    var now = new Date();

                    // grace aux id_hubzer de mes voisins, je récupère les id de leurs hubz
                    // mais ou les id sont présents dans le tab d'id hubz qui matchent avec moi
                    var hubzMatchedWithMe = knex('ads')
                        .select('ads.id as ads_id',
                                'users.username',
                                'users.id as user_id',
                                'users.phone_number',
                                'ads.title as ads_title',
                                'ads.description as ads_description',
                                'ad_actions.label as action_label',
                                'ad_actions.path_picto_marker',
                                'ads.ad_category_id',
                                'ads.ad_actions_id',
                                'ads.price_fixed',
                                'ads.price_range_min',
                                'ads.price_range_max',
                                'ads.is_demand',
                                'ads.is_offer',
                                'ad_statuses.id as id_status',
                                'users.offline_hour_start',
                                'users.offline_hour_end',
                                'users.date_temporary_offline_end',
                                'ads.date_start',
                                function() {
                                    this.from('ad_ratings').avg('value').where(knex.raw('ad_id = ads.id')).as('rating');
                                })

                        .join('users', 'users.id', '=', 'ads.user_id')
                        .join('ad_actions', 'ad_actions.id', '=', 'ads.ad_actions_id')
                        .join('ad_categories', 'ad_categories.id', '=', 'ads.ad_category_id')
                        .join('ad_statuses', 'ad_statuses.id', '=', 'ads.ad_status_id')

                        .where('user_id', 'in', Object.keys(listHubzerNearMe))
                        .andWhere(function() {
                          this.where('ads.ad_status_id', '=', 1).orWhere('ads.ad_status_id', '=', 4)
                        })
                        .andWhere('ads.id', 'in', tabIdHubzMatchWithMe)
                        .andWhere('ads.date_start', '<=', now)
                        .andWhere('ads.date_end', '>=', now)
                        .andWhere('ads.disabled_abuse', '=', 0)
                        // .andWhereNot(function() {
                        //     this.where('users.offline_hour_start', '<', hourNow)
                        //         .andWhere('users.offline_hour_end', '>', hourNow)
                        // })
                        // .andWhere('users.date_temporary_offline_end', '<', now)
                    ;


                    hubzMatchedWithMe

                        .bind({})
                        // donc j'ai ici les hubz qui matchent avec moi et qui sont à proximités
                        .then(function (hubzMatched) {

                            if (hubzMatched.length === 0){
                                done(null, null);
                                return;
                            }

                            var hubzList = [];

                            Object.keys(listHubzMatchWithMe).map(function(fl, j) {

                                Object.keys(listHubzMatchWithMe[fl]).map(function(gl, k) {
                                    // premier param : id hubz qui match avec moi, 2eme param mon id hubz
                                    match.setMatch(gl, listHubzMatchWithMe[fl][gl], id_hubzer);
                                });

                            });

                            if (Object.keys(listHubzMatchWithMe).length === 0 ) { // pas de match, on ne retourne rien
                                done(null, null);
                                return;
                            }
                            else {
                                hubzMatched.map(function(el, i) {
                                    hubzMatched[i].coordinate = listHubzerNearMe[hubzMatched[i].user_id].coordGps;
                                    hubzMatched[i].distance = listHubzerNearMe[hubzMatched[i].user_id].distance;

                                    // check si la distance est vraiment proche
                                    if (hubzMatched[i].distance <= config.distanceautomaticallyLinking) {
                                        // alors on doit notifier la personne et mettre les deux hubz en relation directement
                                        hubzMatched[i].toNotifiedCauseNearHubzer = true;
                                    }

                                    var idHubzMatched = hubzMatched[i].ads_id;
                                    var myHubz;

                                    Object.keys(listHubzMatchWithMe).map(function(fl, j) {
                                        Object.keys(listHubzMatchWithMe[fl]).map(function(gl, k) {
                                            if (parseInt(gl) === parseInt(idHubzMatched)) {
                                                myHubz = fl;
                                            }
                                        });
                                    });

                                    hubzMatched[i].myHubz = myHubz;

                                    hubzList[hubzMatched[i].ads_id] = hubzMatched[i];
                                    hubzList[hubzMatched[i].ads_id].images = [];
                                });
                                this.hubzList = hubzList;

                                return knex('ad_images').where('ad_id', 'in', Object.keys(hubzList));
                            }
                        })
                        .then(function (rowsImg) {
                            // ajoute a chaque hubz ses images correspondantes
                            for (var img in rowsImg) {
                                this.hubzList[rowsImg[img].ad_id].images.push(rowsImg[img]);
                            }

                            done(null, this.hubzList);
                        })
                        .catch(function (err) {
                            console.error(err.message);
                        })
                    ;
                })
            ;
        })
    ;
}

function checkMaximumHubz (user_id, id_action, id_categ, done) {
    var now = new Date();
    // récupère les actions des différents hubz d'une personne (sans doublons)
    var adsActions = knex('ads')
        .distinct('ad_actions_id')
        .where('ads.user_id', '=', user_id)
        .andWhere('ads.ad_status_id', '=', 1) // annonce en ligne
        .andWhere('ads.date_start', '<=', now)
        .andWhere('ads.date_end', '>=', now)
        .andWhere('ads.disabled_abuse', '=', 0)
    ;

    adsActions
        .bind({})
        .then(function (actions) {

            var actionOk = false;

            // si il y a moins de x actions, alors cet user peut encore ajouter un hubz de cette action
            if (actions.length < config.maxActions ) {
                actionOk = true;
            }
            else { // sinon il y a déja 5 actions et on check si il la nouvelle est déja dedans
                for (var eachActions in actions) { // sinon pour chaque actions
                    // on check si la nouvelle action fait déja partie des siennes
                    if (actions[eachActions].ad_actions_id === id_action){
                        if (actions.length < config.maxActions) {
                            actionOk = true;
                        }
                    }
                }
            }

            if (!actionOk) {
                done(actionOk);
            }

            var hubzCateg = knex('ads')
                .select('ad_categories.ad_parent_category_id')
                .count('ads.id as NbHubz')
                .join('ad_categories', 'ad_categories.id', '=', 'ads.ad_category_id')
                .groupBy('ad_categories.ad_parent_category_id')
                .where('ads.user_id', '=', user_id)
                .andWhere('ads.ad_status_id ', '=', 1) // annonce en ligne
                .andWhere('ads.date_start', '<=', now)
                .andWhere('ads.date_end', '>=', now)
                .andWhere('ads.disabled_abuse', '=', 0)
            ;

            hubzCateg
                .bind({})
                .then(function (categ) {

                    var categOk = true;

                    for (var cat in categ) {
                        if (categ[cat].ad_parent_category_id === id_categ) {
                            if (categ[cat].NbHubz >= config.maxHubzByCategory) {
                                categOk = false;
                            }
                        }
                    }
                    done(categOk);
                })
            ;
        })
    ;
}

var onStart = function() {

    var app = server.app;
    var cache = server.apicache;

    config.appli_id = '2'; // C'est l'id qui permettra d'envoyer des sms
    config.senderlabel = 'HUBZ'; // C'est le label qui s'affichera lors de l'envoi de sms

    var cacheEnabled = !server.config.cache || !server.config.cache.disable;

    app.use('/img', express.static(__dirname + '/../upload/img', { maxAge: cacheEnabled ? '3 days' : '' }));

    /**
     * Inscrit un utilisateur (particulier). Envoie un SMS avec le mot de passe
     * généré au numéro fourni.
     */
    app.post('/register', function(req, res) {

        var errors = new AppErrors();

        var username = req.body.username;
        var phoneNumber;

        if (PhoneFormatter.isPhoneNumber(req.body.phoneNumber)) {
            phoneNumber = PhoneFormatter.format(req.body.phoneNumber);
        }
        else {
            errors.add('phoneNumber', messages.form.phoneFormat);
            return res.status(400).json(errors);
        }

        var kPhoneNumber = knex('users')
            .where('phone_number', '=', phoneNumber)
        ;

        kPhoneNumber.bind({})
            // On vérifie que le numéro de téléphone n'existe pas déjà
            .then(function(rowsPhoneNumber) {

                // Si le numéro de téléphone existe, on ajoute une erreur.
                if (rowsPhoneNumber.length > 0) {
                    errors.add('phoneNumber', messages.form.existingAccount);
                }

                return knex('users')
                    .where('username', '=', username)
                ;
            })
            // On vérifie que l'username n'existe pas déjà
            .then(function(rowsUsername) {
                if (rowsUsername.length > 0) {
                    errors.add('username', messages.form.existingUser);
                }
            })
            // On retourne 400 s'il y a une erreur, sinon on continue (création de l'user)
            .then(function() {
                // Si on a ajouté des erreurs, on s'arrête là
                if (!errors.isEmpty()) {
                    throw errors;
                }
                else {
                    // On génère un mot de passe et on crée un utilisateur à partir de celui-ci.
                    var newUser = Users.forge({
                        username: username,
                        phone_number: phoneNumber,
                    });

                    this.password = newUser.generateNewPassword();
                    return newUser.createFromStatus('individual');
                }
            })
            // L'utilisateur a été créé, on envoie un SMS
            .then(function() {
                SMS.send(format(messages.sms.registration, this.password, this.password, username), phoneNumber, function(err) {
                    if (err) {
                        throw err;
                    }
                    else {
                        // Tout s'est bien déroulé, on retourne 200
                        return res.sendStatus(200);
                    }
                });
            })
            .catch(function(err) {
                if (err instanceof AppErrors) {
                    return res.status(400).json(err);
                }
                else {
                    console.error(err);
                    return res.sendStatus(500);
                }
            })
        ;
    });

    /**
     * Envoie un SMS de reset du mot de passe à l'utilisateur si les infos
     * correspondent à un compte.
     * Génère un token de reset pour ce compte et le lie à l'utilisateur.
     */
    app.get('/requestPasswordReset/:username/:phoneNumber', function(req, res) {

        var errors = new AppErrors();

        // Vérifie que le couple nom d'utilisateur/numéro de téléphone existe
        Users
            .forge({
                username: req.params.username,
                phone_number: PhoneFormatter.format(req.params.phoneNumber),
            })
            .fetch()
            .bind({})
            .then(function(user) {
                // S'il existe, on génère un token
                if (user) {
                    this.user = user;
                    user.set('reset_token', uuid.v4());
                    return user.save();
                }
                else {
                    errors.add('user', messages.form.wrongPhoneOrPseudo);
                    throw errors;
                }
            })
            .then(function() {
                // L'utilisateur est enregistré, on envoie le token par SMS
                SMS.send(format(messages.sms.passwordResetLink, config.serverURL + '/passwordReset/' + this.user.get('reset_token')),
                    this.user.get('phone_number'),
                    function(err) {
                        if (err) {
                            throw err;
                        }
                        else {
                            // Tout s'est bien déroulé, on retourne 200
                            return res.sendStatus(200);
                        }
                    }
                );
            })
            .catch(function(err) {
                if (err instanceof AppErrors) {
                    return res.status(400).json(err);
                }
                else {
                    console.error(err.stack);
                    return res.sendStatus(500);
                }
            })
        ;
        // Envoie un SMS avec une url vers /passwordReset/token
    });

    /**
     * Reset le mot de passe du compte lié au token passé.
     * Efface le token après coup et envoie un SMS avec le nouveau
     * mot de passe à l'utilisateur concerné.
     */
    app.get('/passwordReset/:token', function(req, res) {

        var errors = new AppErrors();

        // Récupère l'utilisateur lié au token
        Users
            .forge({
                reset_token: req.params.token,
            })
            .fetch()
            .bind({})
            .then(function(user) {
                // S'il existe, on génère un nouveau mot de passe
                if (user) {
                    this.user = user;
                    this.password = user.generateNewPassword();
                    // On supprime le token
                    user.set('reset_token', null);
                    return user.save();
                }
                else {
                    throw errors.add('token', messages.form.pageExpired);
                }
            })
            .then(function() {
                SMS.send(format(messages.sms.passwordReset, this.password), this.user.get('phone_number'), function(err) {
                    if (err) {
                        throw err;
                    }
                    else {
                        // Tout s'est bien déroulé, on retourne l'HTML
                        return res.sendFile(path.join(__dirname + '/html/passwordReset.html'));
                    }
                });
            })
            .catch(function() {
                return res.sendFile(path.join(__dirname + '/html/passwordResetError.html'));
            })
        ;
    });

    /**
     * Retourne les actions possibles pour la création d'un hubz.
     */
    app.get('/actions', function(req, res) {
        sendJson(res, fetchCollection(AdActions, function(qb){
            qb.orderBy('order','ASC');
        }));
    });

    /**
     * Retourne les actions possibles pour la création d'un hubz.
     */
    app.get('/categories', function(req, res) {
        // On récupère les ids des catégories de l'action choisie
        var kCategoriesIds = knex('ad_actions_ad_categories_parents')
            .select('ad_categories_parent_id');

        if (req.query.actionId) {
            kCategoriesIds.where('ad_action_id', '=', req.query.actionId);
        }

        kCategoriesIds
            .then(function(categoriesIds) {

                // On ne conserve que les ids
                categoriesIds.map(function(row, index) {
                    categoriesIds[index] = row.ad_categories_parent_id;
                });

                return AdCategoriesParents
                    .forge()
                    .query('whereIn', 'id', categoriesIds)
                    .fetchAll({
                        withRelated: [
                            'subcategories.defaultDurationUnit',
                            { subcategories: function(query) { query.orderBy('order'); }}
                        ],
                    })
                ;
            })
            .then(function(rows) {
                res.json(rows);
            })
            .catch(function(err) {
                console.error(err.stack);
                return res.sendStatus(500);
            })
        ;
    });

    /**
     * Retourne toutes les durées possible pour un hubz
     */
    app.get('/categoryDurations', function(req, res) {
        sendJson(res, fetchCollection(AdCategoryDurations));
    });


    /**
     * Retourne tous les status possibles pour un Hubz
     */
    app.get('/adStatuses', function(req, res) {
        sendJson(res, fetchCollection(AdStatuses));
    });


    /**
     * Retourne un hubz avec ces données liées
     */
    app.get('/ads/:id', function(req, res) {
        sendJson(res, fetchCollection(Ads, {
            where: {
                id: req.params.id,
            },
        }, {
            withRelated: [
                'action',
                'category',
                'keywords',
                'status',
                'duration_category',
                'images',
            ],
        }), function(rows) {
            return rows.length > 0 ? rows.at(0) : null;
        });
    });

    /**
     * Enregistre le Hubz posté en base de données (si un modèle d'id passé existe, il sera mis à jour).
     */
    var addOrUpdateHubz = function(req, res) {

        var modelData = JSON.parse(req.body.model);

        // Récupère les données extra du modèle (action, rawKeywords, photos, ...)
        var action = modelData.extra.action;
        var rawKeywords = modelData.extra.rawKeywords;
        delete modelData.extra;

        Ads
            // Récupère ou crée le Hubz
            .getFromData(modelData)
            .bind({})
            .then(function(ad) {
                this.ad = ad;

                // Set l'id de l'user
                this.ad.checkAndSetUserId(req.user.id);

                // Renseigne le status si besoin
                return this.ad.setInactiveIfNotStatus();
            })
            .then(function() {
                // Set la date de création si nécessaire
                this.ad.setCreationDate();

                // Si une publication est demandée, on change les dates
                return this.ad.setActivationDate();
            })
            .then(function() {

                if (modelData.id) {
                    delete this.ad.attributes.action;
                    delete this.ad.attributes.category;
                    delete this.ad.attributes.keywords;
                    delete this.ad.attributes.status;
                    delete this.ad.attributes.duration_category;
                    delete this.ad.attributes.images;
                }
                // Enregistre le Hubz
                return this.ad.save();
            })
            .then(function() {
                // Enregistre les keywords lié au Hubz
                return AdKeywords.updateHubzKeywords(this.ad.id, rawKeywords);
            })
            // pour le cas modif de Hubz, on supprime toutes les mer avec le statut 5 concernant mon hubz modifié, car il ne match plus forcément avec les anciens
            .then(function() {
                var idNewHubz = this.ad.get('id');

                var checkOldMatch = knex('user_linkings')
                    .where('user_linking_status_id', '=', 5) //match
                    .andWhere(function() {
                      this.where('id_applicant', '=', idNewHubz)
                      .orWhere('id_receiver', '=', idNewHubz);
                    })
                    .del()
                ;
                checkOldMatch
                    .bind({})
                    .then(function (res) {
                        console.log(res);
                        console.log('ici anciennes mer deleted');
                    })
                ;
            })
            // regarde si mon nouveau hubz match avec des autres, et si oui ajoute en base une user_linking avec un statut particulier 5
            .then(function() {

                var that = this;

                var listHubz = knex('ads').select('*'); // récupère tous les hubz

                listHubz
                    .bind({})
                    .then(function (rowsHubz) {

                        var tab = []; // tableau nécessaire a la création de chaque insert

                        var i = 0;

                        var insertMatch = knex('user_linkings');

                        for (var hubz in rowsHubz) { // pour chaque hubz

                            var id_action = that.ad.get('ad_actions_id');
                            var id_categ = that.ad.get('ad_category_id');
                            var is_offer = that.ad.get('is_offer');
                            var is_demand = that.ad.get('is_demand');

                            if (rowsHubz[hubz].id === that.ad.get('id')) {
                                continue;
                            }

                            if (hubzMatch(rowsHubz[hubz], id_action, id_categ, is_offer, is_demand)) { // on regarde si ça match

                                tab[i] = { // on incrémente un tableau avec les bonnes données
                                    id_applicant : rowsHubz[hubz].id,
                                    id_receiver : that.ad.get('id'),
                                    user_linking_status_id : 5,
                                    date: new Date(),
                                };

                                i++;
                            }
                        }

                        if (tab.length !== 0) {
                            insertMatch.insert(tab); // puis on insert dans la table des match
                            insertMatch
                                .bind({})
                                .then(function () {
                                    console.log('insert ok');
                                })
                            ;
                        }


                    })
                ;
            })
            .then(function() {
                res.json(this.ad);
            })
            .catch(function(err) {
                console.log(err.stack || err);
                res.sendStatus(500);
            })
        ;
    };

    app.post('/ads', server.requireAuthentication, addOrUpdateHubz);
    app.put('/ads/:id', server.requireAuthentication, addOrUpdateHubz);


    /**
     * Retourne la liste des hubz en fonction des paramètres
     * Par défaut retourne la liste de tous les hubz
     * Param :
     *     -
     *     -
     */
    app.get('/adsList/:id?', server.requireAuthentication, function(req, res) {
        var now = new Date();
        var hourNow = moment().format('hh:mm');

        var myHubz = knex('ads').select('id').where('user_id', '=', req.query.user_id);
        myHubz
            .bind({})
            .then(function (myHubz) {
                var tabMyHubz = [];
                myHubz.map(function(el, i) {
                    tabMyHubz.push(el.id);
                });
                // récupération des hubz
                var hubz = knex('ads')
                    .select('ads.id as ads_id',
                            'users.username',
                            'users.user_statuses_id',
                            'users.id as user_id',
                            'users.phone_number',
                            'ads.title as ads_title',
                            'ads.description as ads_description',
                            'ad_actions.label as action_label',
                            'ad_actions.path_picto_marker',
                            'ads.ad_category_id',
                            'ads.ad_actions_id',
                            'ads.price_fixed',
                            'ads.price_range_min',
                            'ads.price_range_max',
                            'ads.is_demand',
                            'ads.is_offer',
                            'ad_statuses.id as id_status',
                            'ads.favorite',
                            'ad_categories.label as categorie_label',
                            'ad_categories.ad_parent_category_id',
                            'users.offline_hour_start',
                            'users.offline_hour_end',
                            'users.date_temporary_offline_end',
                            'ads.date_start',
                            'ad_actions.has_price',

                            // obtention de la moyenne du hubz intitulé rating
                            function() {
                                this.from('ad_ratings').avg('value').where(knex.raw('ad_id = ads.id')).as('rating');
                            })
                    .join('users', 'users.id', '=', 'ads.user_id')
                    .join('ad_actions', 'ad_actions.id', '=', 'ads.ad_actions_id')
                    .join('ad_categories', 'ad_categories.id', '=', 'ads.ad_category_id')
                    .join('ad_statuses', 'ad_statuses.id', '=', 'ads.ad_status_id')
                    .where('ads.date_start', '<=', now)
                    .andWhere('ads.date_end', '>=', now)
                    .andWhere('ads.disabled_abuse', '=', 0)
                ;

                // variable de match d'annonces définit de base à false
                var match = false;

                var tabHubzerId = [];

                // si la sous categ n'est pas passée en param, sauf si c'est pour un hubz unique
                if(!req.query.id_subcateg && !req.params.id && req.param.user_id) {
                    res.status(400).json('paramètres de sous catégorie manquant');
                }

                // si c'est pour retourner les hubz d'une sous catégorie
                if(req.query.id_subcateg && !req.params.id) {
                    var id_subcateg = parseInt(req.query.id_subcateg);

                    if (req.query.keyword.length > 2){
                        hubz.andWhere(function(){
                            this.whereRaw('LOWER(ads.title) LIKE ?', '%'+req.query.keyword.toLowerCase()+'%')
                            .orWhereRaw('LOWER(ads.description) LIKE ?', '%'+req.query.keyword.toLowerCase()+'%')
                        });
                    }
                    if (id_subcateg !== 0){
                        hubz.andWhere('ads.ad_category_id', '=', id_subcateg);
                    }
                    hubz.andWhere('ad_status_id', '=', 1);
                }

                // retourner les hubz d'une catégorie
                if(req.query.id_categ && !req.params.id) {
                    var id_categ = parseInt(req.query.id_categ);

                    if (id_categ !== 0){
                        hubz.andWhere('ad_categories.ad_parent_category_id', '=', id_categ);
                    }
                    hubz.andWhere('ad_status_id', '=', 1);
                }

                // si la route est appelée uniquement pour un hubz en question
                if (req.params.id) {
                    hubz
                        .andWhere('ads.id', '=', req.params.id)
                    ;
                    // match à true car aucun match ne sera effectué, c'est pour voir une unique annonce
                    match = true;
                }

                // si la route est appelée pour les hubz en cours, d'une personne, ACTIFS
                if (req.query.user_id && !req.query.linking && !req.query.inactive && !req.query.favorite) {
                    hubz
                        .andWhere('users.id', '=', req.query.user_id) // pour l'user en question
                        // filtre si le hubz est encore actif
                        .andWhere('ad_status_id', '=', 1) // que son annonce est activée (pas supprimée ni desactivée)
                    ;
                    match = true;
                }
                // si la route est appelée pour les hubz en cours, d'une personne, INACTIFS
                if (req.query.user_id && req.query.inactive && !req.query.favorite) {
                    hubz
                        .andWhere('users.id', '=', req.query.user_id) // pour l'user en question
                        // filtre si le hubz est encore actif
                        .andWhere('ad_status_id', '=', 2) // que son annonce est inactif
                    ;
                    match = true;
                }

                // si la route est appelée pour retourner les favoris d'une personne
                if (req.query.user_id && req.query.favorite && !req.query.inactive) {
                    hubz
                        .andWhere('users.id', '=', req.query.user_id) // pour l'user en question
                        .andWhere('ads.favorite', '=', 1) // mais conservés en favoris
                    ;
                    match = true;
                }

                // si la route est appelée depuis l'accueil : visualiser les hubz autour de moi en fonction de hubzerList
                if ((req.query.id_subcateg && req.query.id_user) || (req.query.id_categ && req.query.id_user)) {
                    var nearHubz = hubzerList.hubzers[req.query.id_user];
                    if (nearHubz) { // parcourt la liste de hubz à coté de moi
                        for(var tab in nearHubz.nearHubzerList) {
                            tabHubzerId[tab] = {
                                coordGps : nearHubz.nearHubzerList[tab].coordGps, // création d'un tableau d'id des hubzers, utilisé dans la requête qui suit
                                distance : nearHubz.nearHubzerList[tab].distance,
                            };
                        }
                    }
                    hubz
                        // si on a des hubzers aux alentours, on affiche tous les hubz de la personne à coté
                        .andWhere('ads.user_id', 'in', Object.keys(tabHubzerId))
                        .andWhere('ad_status_id', '=', 1) // que les annonces actives
                    ;
                    match = true;

                }
                // si on veut retourner les hubz mis en relation d'une personne
                if (req.query.user_id && req.query.linking) {
                    hubz
                        .join('user_linkings', function() {
                          this.on('user_linkings.id_applicant', '=', 'ads.id').orOn('user_linkings.id_receiver', '=', 'ads.id');
                        })
                        .join('linking_process', 'linking_process.user_linkings_id', '=', 'user_linkings.id')
                        .leftJoin('ad_ratings', 'ad_ratings.ad_id', '=', 'ads.id')
                        .select(
                            'user_linkings.id_applicant',
                            'user_linkings.id_receiver',
                            'user_linkings.user_linking_status_id',
                            'linking_process.date_linking as date_linking_en',
                            'ad_ratings.id as idRating',
                            'ad_ratings.value as valueRating'
                        )
                        .andWhere(function() {
                            this.where('user_linkings.id_applicant', 'in', tabMyHubz)
                            .orWhere('user_linkings.id_receiver', 'in', tabMyHubz);
                        })
                         // pas les supprimées
                        .andWhere('user_linking_status_id', '!=', 7)
                    ;
                    match = true;
                }

                // récupération de la liste de hubz
                hubz
                    .bind({})
                    .then(function (rowsHubz) {

                        // tableau de hubz avec la clef correspondant à l'id du hubz
                        var hubzList = [];
                        this.tabMerAdsId= [];
                        // remplit la liste
                        for (var key in rowsHubz) {
                            // formate la date de mise en relation
                            rowsHubz[key].date_linking = moment(rowsHubz[key].date_linking_en).format('DD/MM/YYYY HH:mm');

                            // simule le résultat de la liste déroulante
                            var idAction = false;

                            /*if (req.query.id_subcateg) { // on check le match seulement lorsqu'une catégeorie est passsée
                                // retourne si des hubz matchent avec celui que je recherche via la liste déroulante
                                match = hubzMatch(rowsHubz[key], idAction, id_subcateg, null, null);
                            }*/
                            if (match) { // l'annonce correspond à ce que je veux
                                var cle;

                                if (typeof rowsHubz[key].user_linking_id !== 'undefined') {
                                    cle = rowsHubz[key].user_linking_id;
                                    this.mer = true;
                                    if (typeof this.tabMerAdsId[rowsHubz[key].ads_id] === 'undefined') {
                                        this.tabMerAdsId[rowsHubz[key].ads_id] = [];
                                    }
                                    this.tabMerAdsId[rowsHubz[key].ads_id].push(cle);
                                }
                                else {
                                    cle = rowsHubz[key].ads_id;
                                    this.mer = false;
                                }

                                hubzList[cle] = rowsHubz[key];
                                hubzList[cle].images = []; // contiendra les futures images

                                if (tabHubzerId[hubzList[cle].user_id]) {// ajout des coordonnées
                                    hubzList[cle].coordinate = tabHubzerId[hubzList[cle].user_id].coordGps;
                                    hubzList[cle].distance = tabHubzerId[hubzList[cle].user_id].distance;
                                }
                            }
                        }
                        this.hubzList = hubzList;

                        if (this.mer) {
                            return knex('ad_images')
                                    .where('ad_images.ad_id', 'in', Object.keys(this.tabMerAdsId));
                        }
                        else {
                            // requête qui récupère un tableau d'images correspondant aux id des hubz
                            return knex('ad_images')
                            .where('ad_images.ad_id', 'in', Object.keys(hubzList));
                        }

                    })
                    .then(function (rowsImg) {
                        // ajoute a chaque hubz ses images correspondantes
                        for (var img in rowsImg) {
                            if (this.mer) {
                                for (var x in this.tabMerAdsId[rowsImg[img].ad_id]){
                                    this.hubzList[this.tabMerAdsId[rowsImg[img].ad_id][x]].images.push(rowsImg[img]);
                                }
                            }
                            else {
                                this.hubzList[rowsImg[img].ad_id].images.push(rowsImg[img]);
                            }
                        }

                        if ((typeof req.query.other !== 'undefined')) {
                            // supprime les éléments nuls
                            this.hubzList = this.hubzList.filter(function(n){ return n !== null; });
                            var limit = parseInt(req.query.other.limit) || config.maxHubzLimit;
                            var page = parseInt(req.query.other.page) || 1;

                            this.hubzList = this.hubzList.slice((page - 1) * limit, page * limit);

                            var that = this;
                            // attribution du score à chaque hubz
                            this.hubzList.map(function(el,i){
                                var now = new Date(moment(moment()._d).format('YYYY-MM-DD HH:mm:ss'));
                                var date_start = new Date (moment(el.date_start).format('YYYY-MM-DD HH:mm:ss'));
                                var diff = now - date_start;

                                var score_date = (1-((diff/86400000)/56))*100;

                                var score_pro;
                                if (el.user_statuses_id === 2) {
                                    score_pro = 100;
                                }
                                else {
                                    score_pro = 0;
                                }

                                var distanceMeters = el.distance/1000;
                                var score_distance = (1-(distanceMeters/config.distance_max_show_meters))*100;

                                that.hubzList[i].score = (score_date + (2*score_distance) + (3*score_pro))/6;
                            });
                            res.json(this.hubzList);
                        }
                        else {
                            this.hubzList = this.hubzList.filter(function(n){ return n !== null; });
                            res.json(this.hubzList);
                        }
                    })
                    .catch(function (err) {
                        console.error(err.message);
                    })
                ;
            })
        ;


    });

    // ajoute un hubzer à la liste des hubzers
    // param : id dans url
    //          lat, lng, prefDistance
    app.post('/setHubzer/:id?', server.requireAuthentication, function(req, res) {

        if (!req.params.id) {
            res.status(400).json('paramètres manquant : id hubzer');
        }

        if (!req.body.lat || !req.body.lng) {
            res.status(400).json('paramètres de requête post manquant : lat, lng requis');
        }

        var id_hubzer = parseInt(req.params.id);

        var tabHubzToNotifieCauseNear = [];
        //ajoute le hubzer au sein de la liste
        hubzerList.addOrUpdateHubzer({
            idHubzer: id_hubzer,
            coordGps: {
                latitude : req.body.lat, //48.8600575,
                longitude : req.body.lng,
            },
            prefDistance: req.body.prefDistance || config.distance_max_show_meters,
        });
        //////////////////////////////// Détection si mon hubz match avec ceux aux alentours
        listMatchingHubz(id_hubzer, function(err, matchingHubz) {
            if (err) {
                res.status(400).json('erreur pendant le chargements des matchs');
                console.log(err);
            }
            // effectue un check de toutes les mise en relations correspondant à l'utilisateur
            // et vérifie l'état : si en attente -> c'est une nouvelle, donc l'user doit etre notifié
            var tabMyHubz = [];

            // boucle sur l'objet liste qui contient les couples de match (les miens)
            for (var listmatch in match.listMatch[id_hubzer]){
                //boucle sur les hubz qui matchent avec les miens
                // afin d'obtenir uniquement la liste de mes hubz
                for (var hubz in matchingHubz){
                    if (parseInt(match.listMatch[id_hubzer][listmatch].id_hubzer_1) === matchingHubz[hubz].ads_id){
                        tabMyHubz.push(parseInt(match.listMatch[id_hubzer][listmatch].id_hubzer_2));
                    }
                    if (parseInt(match.listMatch[id_hubzer][listmatch].id_hubzer_2) === matchingHubz[hubz].ads_id){
                        tabMyHubz.push(parseInt(match.listMatch[id_hubzer][listmatch].id_hubzer_1));
                    }

                    // check si le retour de matching hubz contient une distance petite, et si oui met le couple de hubz dans un tableau
                    if (typeof matchingHubz[hubz].toNotifiedCauseNearHubzer !== 'undefined') {
                        tabHubzToNotifieCauseNear.push({
                            ads_id_1: matchingHubz[hubz].myHubz,
                            ads_id_2: matchingHubz[hubz].ads_id,
                        });
                    }
                }
            }

            // si on doit notifier deux personnes car elles viennent de matcher a moins de x mètres (tres proches)
            if (tabHubzToNotifieCauseNear.length > 0) {
                // création d'une mise en relation pour ce couple de hubz
                // check dans la table user linkings si la mise en relation est existante (avec le couple mon hubz/hubz de la personne)
                var query = 'applicant_need_to_be_notified_cause_near != 2 AND';
                query += ' receiver_need_to_be_notified_cause_near != 2 AND';
                query += ' user_linking_status_id = 5 AND (';

                tabHubzToNotifieCauseNear.map(function(el, i) {
                    query += '((id_applicant = '
                    + el.ads_id_1
                    + ' AND id_receiver = '
                    + el.ads_id_2
                    + ' ) OR (id_applicant = '
                    + el.ads_id_2
                    + ' AND id_receiver = '
                    + el.ads_id_1 + ' ))';

                    query += (i < tabHubzToNotifieCauseNear.length-1) ? ' OR ' : '';
                });

                query += ')';
                var checkLinkingExist = knex('user_linkings')
                    .whereRaw(query)
                ;

                checkLinkingExist
                    .bind({})
                    .then(function (linking) {
                        if (linking.length !== 0) {
                            linking.map(function(el,i) {
                                var setLinking = knex('linking_process')
                                    .insert({
                                        date_linking: new Date(),
                                        date_viewed: new Date(),
                                        date_accepted: new Date(),
                                        user_linkings_id: el.id,
                                        notified: 1,
                                    })
                                ;
                                setLinking
                                    .bind({})
                                    .then(function () {
                                        var getLinking = knex('user_linkings')
                                            .where('user_linkings.id', '=', el.id)
                                        ;
                                        getLinking
                                            .bind({})
                                            .then(function (myLinking) {
                                                var myHubz = knex('ads')
                                                    .where('user_id', '=', id_hubzer)
                                                ;
                                                myHubz
                                                    .bind({})
                                                    .then(function (myHubz) {
                                                        var imApplicant = false;
                                                        myHubz.map(function(el,i){
                                                            if (el.id === myLinking[0].id_applicant){
                                                                imApplicant = true;
                                                            }
                                                        });

                                                        var setHubz = knex('user_linkings')
                                                            .where('user_linkings.id', '=', el.id)
                                                        ;
                                                        if (imApplicant) {
                                                            setHubz
                                                                .update({
                                                                    applicant_need_to_be_notified_cause_near: 1,
                                                                })
                                                            ;
                                                        }
                                                        else {
                                                            setHubz
                                                                .update({
                                                                    receiver_need_to_be_notified_cause_near: 1,
                                                                })
                                                            ;
                                                        }
                                                        setHubz
                                                            .bind({})
                                                            .then(function () {
                                                            })
                                                        ;
                                                    })
                                                ;
                                            })
                                    })
                                ;
                            });
                        }
                    })
                ;
            }

            // essai de récupérer la mise en relation qui me concerne et qui est en attente
            var newLinking =
                knex('linking_process')
                    .join('user_linkings', 'user_linkings.id', '=', 'linking_process.user_linkings_id')
                    .where('id_receiver', 'in', tabMyHubz)
                    .whereNull('date_viewed')
                    .whereNull('date_accepted')
                    .whereNull('date_denied')
                    .andWhere('user_linking_status_id', '!=', 5)
                ;

            newLinking
                .bind({})
                .then(function (linking) {

                    // si y'a une mise en relation en attente
                    if (linking.length > 0) {

                        // je l'ajoute au retour de l'api pour l'exploiter sur le client
                        matchingHubz.push({
                            hubztoNotify: linking[0].id_receiver,
                            hubzMatched : linking[0].id_applicant,
                        });

                        // on part du principe que la notif est partie, donc je met a jour la date de visualisation
                        var updateLinking = knex('linking_process')
                            .where('user_linkings_id', '=', linking[0].id)
                            .update({
                                date_viewed: new Date(),
                            })
                        ;

                        updateLinking
                            .then(function() {
                                console.log('update ok');
                            })
                            .catch(function(err) {
                                console.error(err.message);
                                res.status(400).json('base de données innaccessible');
                            })
                        ;
                    }

                    // check si une mise en relation vient d'être acceptée ou refusée me concernant
                    var checkNewLinkingState = knex('linking_process')
                        .join('user_linkings', 'user_linkings.id', '=', 'linking_process.user_linkings_id')
                        .where('id_applicant', 'in', tabMyHubz)
                        .andWhere(function() {
                            this.where('date_accepted', '!=', 'NULL')
                            .orWhere('date_denied', '!=', 'NULL');
                        })
                        .andWhere('notified', '=', 0)
                    ;

                    checkNewLinkingState
                        .bind({})
                        .then(function (newLinking) {

                            if (newLinking.length > 0 ) {
                                matchingHubz.push({
                                    id_applicant: newLinking[0].id_applicant,
                                    id_receiver: newLinking[0].id_receiver,
                                    accepted : newLinking[0].date_accepted,
                                    denied : newLinking[0].date_denied,
                                });

                                var updateLinking = knex('linking_process')
                                    .where('user_linkings_id', '=', newLinking[0].id)
                                    .update({
                                        notified: 1,
                                    })
                                ;

                                updateLinking
                                    .then(function() {
                                        console.log('update ok');
                                    })
                                    .catch(function(err) {
                                        console.error(err.message);
                                        res.status(400).json('base de données innaccessible');
                                    })
                                ;
                            }

                            // check si on doit notifier la personne car elle match avec qqn qui est vraiment proche d'elle
                            var nearHubz = knex('ads')
                                .where('user_id', '=', id_hubzer)
                                .join('user_linkings', function() {
                                  this.on('user_linkings.id_applicant', '=', 'ads.id').orOn('user_linkings.id_receiver', '=', 'ads.id');
                                })
                                .where('applicant_need_to_be_notified_cause_near', '=', 1)
                                .orWhere('receiver_need_to_be_notified_cause_near', '=', 1)
                                .select('ads.id', 'user_linkings.id as user_linking_id', 'id_applicant', 'id_receiver', 'is_offer')
                            ;

                            nearHubz
                                .then(function(linkings) {
                                    var nearLinking = [];
                                    if (linkings.length >0) {
                                        linkings.map(function(el,i){
                                            var updateNotifyLinkingNear = knex('user_linkings')
                                                .where('id', '=', el.user_linking_id)
                                            ;
                                            if (el.id === el.id_applicant) { // si je suis applicant
                                                updateNotifyLinkingNear
                                                    .update({
                                                        applicant_need_to_be_notified_cause_near: 2,
                                                    })
                                                ;
                                            }
                                            else {
                                                updateNotifyLinkingNear
                                                    .update({
                                                        receiver_need_to_be_notified_cause_near: 2,
                                                    })
                                                ;
                                            }
                                            nearLinking.push({
                                                myAds: el.id,
                                                is_offer:el.is_offer,
                                                applicant: el.id_applicant,
                                                receiver: el.id_receiver,
                                            });
                                            matchingHubz.push({nearLinking: nearLinking});
                                            updateNotifyLinkingNear
                                                .then(function(){
                                                    console.log('update notif 2 ' + id_hubzer);
                                                })
                                            ;
                                        });
                                        res.json(matchingHubz);
                                    }
                                    else {
                                        res.json(matchingHubz);
                                    }
                                })
                            ;
                        })
                    ;
                })
            ;
        });
    });

    // set un nouveau statut au hubz
    // la route post prend en paramètre status
    // qui doit valoir active, inactive ou deleted
    app.post('/setAdStatus/:id?', server.requireAuthentication, function(req, res) {

        if (!req.params.id || !req.body.status) {
            res.status(400).json('paramètres manquant : id ad ou statut');
        }
        var id_ad = parseInt(req.params.id);

        if (req.body.status === 'favorite') {
            var hubz = knex('ads')
                .where('ads.id', '=', id_ad)
                .update({
                    favorite: req.body.state,
                })
            ;
            hubz
                .then(function() {
                    var msg = 'statut favoris mis à jour';
                    res.json(msg);
                })
                .catch(function(err) {
                    console.error(err.message);
                    res.status(400).json('base de données innaccessible');
                })
            ;

        }
        else {
            var status_id = knex('ad_statuses');

            switch (req.body.status) {
                case 'active':
                    status_id.where('label_dev', '=', 'active');
                    break;
                case 'inactive':
                    status_id.where('label_dev', '=', 'inactive');
                    break;
                case 'deleted':
                    status_id.where('label_dev', '=', 'deleted');
                    break;
                default:
                    res.status(400).json('paramètres status incorrect : active, inactive ou deleted');
                    break;
            }

            status_id
                .then(function(adStatus) {

                    var hubz = knex('ads')
                        .where('ads.id', '=', id_ad)
                        .update({
                            ad_status_id: adStatus[0].id
                        })
                    ;

                    hubz
                        .then(function() {
                            var msg = 'statut hubz mis à jour';
                            res.json(msg);
                        })
                        .catch(function(err) {
                            console.error(err.message);
                            res.status(400).json('base de données innaccessible');
                        })
                    ;
                })
                .catch(function(err) {
                    console.error(err.message);
                    res.status(400).json('base de données innaccessible');
                })
            ;
        }


    });

    // Retourne les informations nécessaire au profil de l'user
    app.get('/userProfil/:id?', server.requireAuthentication, function(req, res) {

        if (!req.params.id) {
            res.status(400).json('paramètres manquant : id user');
        }

        var isUser = parseInt(req.params.id);

        var user =
            knex('users')
            .where('id', isUser)
        ;

        user
            .bind({})
            .then(function (user) {
                res.json(user);
            })
        ;

    });

    // Mets à jour le profil d'un hubzer dans la BDD
    app.post('/updateProfil/:id?', server.requireAuthentication, function(req, res) {
        if (!req.params.id) {
            res.status(400).json('paramètres manquant : id user');
        }

        var idUser = parseInt(req.params.id);
        if (req.body.image_path === 'false') {
            var user =
                knex('users')
                .where('id', idUser)
                .update({
                    username: req.body.username,
                    birth_date: req.body.birth_date,
                    mail: req.body.mail,
                })
            ;
        }
        else {
            var user =
                knex('users')
                .where('id', idUser)
                .update({
                    username: req.body.username,
                    birth_date: req.body.birth_date,
                    mail: req.body.mail,
                    image_path: req.body.image_path
                })
            ;
        }
        user
            .then(function() {
                var msg = 'user mis à jour';
                res.json(msg);
            })
            .catch(function(err) {
                console.error(err.message);
                res.status(400).json('base de données innaccessible');
            })
        ;

    });

    // Mets à jour les préférences d'un hubzer dans la BDD
    app.post('/updatePreferences/:id?', server.requireAuthentication, function(req, res) {

        if (!req.params.id) {
            res.status(400).json('paramètres manquant : id user');
        }

        var idUser = parseInt(req.params.id);

        var user =
            knex('users')
            .where('id', idUser)
            .update({
                distance_max_linking_meters: req.body.distance_max_linking_meters,
                distance_max_show_meters: req.body.distance_max_show_meters,
                offline_hour_start: req.body.offline_hour_start,
                offline_hour_end: req.body.offline_hour_end,
                date_temporary_offline_end: req.body.date_temporary_offline_end
            })
        ;

        user
            .then(function() {
                var msg = 'péférences user mis à jour';
                res.json(msg);
            })
            .catch(function(err) {
                console.error(err.message);
                res.status(400).json('base de données innaccessible');
            })
        ;

    });


    // retourne les hubz d'un user
    app.get('/hubzUser/:id?', server.requireAuthentication, function (req, res) {
        sendJson(res, fetchCollection(Ads, {
            where: {user_id: parseInt(req.params.id)}
        }));
    });

    // retourne les hubz qui matchent avec moi et qui sont à proximité
    app.get('/matchingHubz/:id?', server.requireAuthentication, function (req, res) {

        listMatchingHubz(req.params.id, function(err, matchingHubz) {
            if (err) {
                res.status(400).json('erreur pendant le chargements des matchs');
                console.log(err);
            }
            if (matchingHubz !== null ) {
                // supprime les éléments nuls
                matchingHubz = matchingHubz.filter(function(n){ return n !== null; });
                // attribution du score à chaque hubz
                matchingHubz.map(function(el,i){
                    var now = new Date(moment(moment()._d).format('YYYY-MM-DD HH:mm:ss'));
                    var date_start = new Date (moment(el.date_start).format('YYYY-MM-DD HH:mm:ss'));
                    var diff = now - date_start;

                    var score_date = (1-((diff/86400000)/56))*100;

                    var score_pro;
                    if (el.user_statuses_id === 2) {
                        score_pro = 100;
                    }
                    else {
                        score_pro = 0;
                    }

                    var distanceMeters = el.distance/1000;
                    var score_distance = (1-(distanceMeters/config.distance_max_show_meters))*100;

                    matchingHubz[i].score = (score_date + (2*score_distance) + (3*score_pro))/6;

                    matchingHubz[i].match = true;
                });
            }

            res.json(matchingHubz);
        });
    });

    // retourne un couple de hubz qui match pour la 1ere fois
    app.get('/getImpressions/:id?', server.requireAuthentication, function(req, res) {



        var id_hubzer = req.params.id;

        // récupère tous les matchs
        var impressions =
            knex('ad_impressions')
            .join('ad_impression_types', 'ad_impression_types.id', '=', 'ad_impressions.ad_impression_type_id')
        ;

        impressions
            .bind({})
            .then(function (result) {
                var tabHubzNotified = [];

                for (var eachImpression in result) { // parcourt la liste de match (bdd) déjà notifiés

                    for (var eachMatch in match.listMatch[id_hubzer]) { // parcourt la liste de mes matchs

                        var hubz_match = parseInt(match.listMatch[id_hubzer][eachMatch].id_hubzer_1);
                        var myHubz = parseInt(match.listMatch[id_hubzer][eachMatch].id_hubzer_2);


                        // si mon match est déja dans la bdd
                        if ( (result[eachImpression].ad_id === myHubz && result[eachImpression].match_id === hubz_match)) {
                            // on ajoute a l'objet liste un attribut isInTable
                            match.listMatch[id_hubzer][eachMatch].isInTable = true;
                        }
                    }
                }

                // ensuite on reboucle sur l'objet liste
                for (var eachList in match.listMatch[id_hubzer]) {

                    var hubz_1 = parseInt(match.listMatch[id_hubzer][eachList].id_hubzer_1);
                    var hubz_2 = parseInt(match.listMatch[id_hubzer][eachList].id_hubzer_2);
                    // si l'attribut n'est pas setté, c'est que le match est nouveau
                    if (typeof match.listMatch[id_hubzer][eachList].isInTable === 'undefined') {
                        // donc on prépare la requête d'insertion
                        tabHubzNotified.push({
                            hubz_1 : hubz_1,
                            hubz_2 : hubz_2,
                        });
                    }
                }

                var insertNewMatch = knex('ad_impressions');

                var tab = [];
                var i = 0;
                // si il y a de nouveaux matchs
                if (tabHubzNotified.length > 0){

                    // pour chaque, on les inserts
                    for (var inc in tabHubzNotified) {
                        tab[i] = {
                            ad_id: tabHubzNotified[inc].hubz_2,
                            match_id: tabHubzNotified[inc].hubz_1,
                            ad_impression_type_id: 1, // 1 pour notify
                            date: new Date(),
                        };
                        i++;
                    }

                    insertNewMatch.insert(tab);

                    insertNewMatch
                        .bind({})
                        .then(function () {
                            console.log('insert okkkkk');
                        })
                    ;
                }
                res.json(tabHubzNotified);
            })
        ;
    });

    // insert ou met à jour une mise en relation entre deux hubz
    app.post('/linking', server.requireAuthentication, function(req, res) {
        // prend en param 'hubz_id' : hubz qui match avec le mien (donc le hubz de la personne en face)

        var id_hubz_linked = parseInt(req.body.hubz_id);

        // param : lat/lng
        var lat = req.body.lat;
        var lng = req.body.lng;
        var id_hubzer = parseInt(req.body.id_user);

        var myHubz;

        // traitement via l'objet match :
        // obtenir mon hubz car on a déja celui de l'autre personne
        for (var list in match.listMatch[id_hubzer]) {
            if (parseInt(match.listMatch[id_hubzer][list].id_hubzer_1) === id_hubz_linked) {
                myHubz = parseInt(match.listMatch[id_hubzer][list].id_hubzer_2);
                break;
            }
            else if(parseInt(match.listMatch[id_hubzer][list].id_hubzer_2) === id_hubz_linked) {
                myHubz = parseInt(match.listMatch[id_hubzer][list].id_hubzer_1);
                break;
            }
        }


        if (typeof myHubz !== 'undefined') {
            // check dans la table user linkings si la mise en relation est existante (avec le couple mon hubz/hubz de la personne)
            var checkLinkingExist = knex('linking_process')
                .join('user_linkings', 'user_linkings.id', '=', 'linking_process.user_linkings_id')
                .where(function() {
                  this.where('user_linkings.id_applicant', myHubz).andWhere('user_linkings.id_receiver', id_hubz_linked)
                  .orWhere('user_linkings.id_receiver', myHubz).andWhere('user_linkings.id_applicant', id_hubz_linked);
                })
            ;

            checkLinkingExist
                .bind({})
                .then(function (linking) {

                    // si vide, c'est une premiere mise en relation
                    if (linking.length === 0) {

                        // on insert en base
                        var setHubz = knex('user_linkings')
                            .insert({
                                id_applicant: myHubz,
                                id_receiver: id_hubz_linked,
                                date: new Date(),
                                user_linking_status_id: 3,
                                latitude: lat,
                                longitude: lng,
                            })
                        ;

                        setHubz
                            .bind({})
                            .then(function (user_linking) {

                                var setLinking = knex('linking_process')
                                    .insert({
                                        user_linkings_id: user_linking,
                                        date_linking: new Date(),
                                    })
                                ;

                                setLinking
                                    .bind({})
                                    .then(function () {
                                        res.json(false);
                                    })
                                ;
                            })
                        ;
                    }
                    else {
                        if (linking[0].user_linking_status_id !== 7) {
                            linking[0].applicant = myHubz;
                            linking[0].receiver = id_hubz_linked;

                            var hubz_offer = knex('ads')
                                .where('id', '=', myHubz)
                                .andWhere('is_offer', '=', 1)
                            ;
                            hubz_offer
                                .bind({})
                                .then(function (hubz) {
                                    if (hubz.length > 0 ) {
                                        linking[0].hubzOffer = myHubz;
                                    }
                                    else {
                                        linking[0].hubzOffer = id_hubz_linked;
                                    }
                                    res.json(linking);
                                })
                            ;
                        }
                        else {
                            res.json('deleted');
                        }
                    }
                })
            ;
        }
        // je veux une relation avec qqn mais je n'ai pas de hubz correspondant
        // on en crée un identique qui est sensé matché avec celui désiré en relation
        // si c'est acheter ou vendre, alors on crée l'autre complémentaire
        else {
            var hubz = req.body.hubz;
            var insertNewHubzMatch;
            var now = moment().format();

            var actionId;
            if (parseInt(hubz.ad_actions_id) === 1) {
                actionId = 2;
            }
            else if (parseInt(hubz.ad_actions_id) === 2) {
                actionId = 1;
            }
            else {
                actionId = hubz.ad_actions_id;
            }

            checkMaximumHubz(req.body.id_user, actionId, hubz.ad_category_id, function (result) {
                if (result) {
                    // si c'est un hubz hors acheté/vendre
                    if (actionId !== 1 && actionId !== 2 ) {
                        insertNewHubzMatch = knex('ads')
                            .insert({
                                user_id: req.body.id_user,
                                ad_actions_id: hubz.ad_actions_id,
                                ad_category_id: hubz.ad_category_id,
                                ad_status_id: 4, // copie
                                ad_category_duration_id: 2,
                                duration_factor: 1,
                                title: '(copie) '+ hubz.ads_title,
                                description: hubz.ads_description,
                                date_creation: now,
                                date_start: now,
                                date_end: moment().add(1, 'days')._d,
                                price_fixed: hubz.price_fixed === '' ? null : hubz.price_fixed,
                                price_range_min: hubz.price_range_min === '' ? null : hubz.price_range_min,
                                price_range_max: hubz.price_range_max === '' ? null : hubz.price_range_max,
                                disabled_abuse: 0,
                                favorite: 0,
                                is_demand: actionId === 8 ? 1 : !parseInt(hubz.is_demand),// si action rencontre, que des demandes
                                is_offer: actionId === 8 ? 0 : !parseInt(hubz.is_offer),
                            })
                        ;
                    }
                    //categ acheter/vendre
                    else {
                        insertNewHubzMatch = knex('ads')
                            .insert({
                                user_id: req.body.id_user,
                                ad_actions_id: parseInt(hubz.ad_actions_id) === 1 ? 2 : 1,
                                ad_category_id: hubz.ad_category_id,
                                ad_status_id: 4, // copie
                                ad_category_duration_id: 2,
                                duration_factor: 1,
                                title: '(copie) '+ hubz.ads_title,
                                description: hubz.ads_description,
                                date_creation: now,
                                date_start: now,
                                date_end: moment().add(1, 'days')._d,
                                price_fixed: hubz.price_fixed === '' ? null : hubz.price_fixed,
                                price_range_min: hubz.price_range_min === '' ? null : hubz.price_range_min,
                                price_range_max: hubz.price_range_max === '' ? null : hubz.price_range_max,
                                disabled_abuse: 0,
                                favorite: 0,
                                is_demand: actionId === 1 ? 1 : 0,
                                is_offer: actionId === 1 ? 0 : 1,
                            })
                        ;
                    }

                    insertNewHubzMatch
                        .then(function(idNewHubz){
                            // hubz crée
                            // création de la MeR avec la personne
                            // on insert en base
                            var setHubz = knex('user_linkings')
                                .insert({
                                    id_applicant: idNewHubz,
                                    id_receiver: id_hubz_linked,
                                    date: new Date(),
                                    user_linking_status_id: 3,
                                    latitude: lat,
                                    longitude: lng,
                                })
                            ;

                            setHubz
                                .bind({})
                                .then(function (user_linking) {

                                    var setLinking = knex('linking_process')
                                        .insert({
                                            user_linkings_id: user_linking,
                                            date_linking: new Date(),
                                        })
                                    ;

                                    setLinking
                                        .bind({})
                                        .then(function () {
                                            res.json(false);
                                        })
                                    ;
                                })
                            ;
                        })
                    ;
                }
                else {
                    res.json('maximuHubz');
                }
            });
        }
    });

    // retourne les informations d'une mise en relation, utilisées sur la page linking
    // en fonction d'un user et du hubz auquel appartien la page de mise en relation
    app.post('/linkingState', server.requireAuthentication, function(req, res) {

        var id_hubz_applicant = parseInt(req.body.id_hubz_applicant);
        var id_hubz_receiver = parseInt(req.body.id_hubz_receiver);
        var id_user = parseInt(req.body.id_user);

        var linking = knex('user_linkings')
            .join('linking_process', 'linking_process.user_linkings_id', '=', 'user_linkings.id')
            .where(function() {
                this.where('id_applicant', id_hubz_applicant)
                    .andWhere('id_receiver', id_hubz_receiver);
            })
            .orWhere(function() {
                this.where('id_receiver', id_hubz_applicant)
                    .andWhere('id_applicant', id_hubz_receiver);
            })

        ;

        linking
            .bind({})
            .then(function (state) {
                if (state.length > 0) {

                    state[0].date_linking = moment(state[0].date_linking).format('DD/MM/YYYY HH:mm');
                    state[0].date_viewed = moment(state[0].date_viewed).format('DD/MM/YYYY HH:mm');
                    state[0].date_accepted = moment(state[0].date_accepted).format('DD/MM/YYYY HH:mm');
                    state[0].date_denied = moment(state[0].date_denied).format('DD/MM/YYYY HH:mm');

                    var isApplicant = knex('ads')
                        .join('users', 'users.id', '=', 'ads.user_id')
                        .where('ads.id', '=', state[0].id_applicant)
                        .andWhere('user_id', '=',id_user)
                    ;

                    isApplicant
                        .bind({})
                        .then(function (hubz) {
                            // je suis un applicant
                            if (hubz.length > 0) {
                                state[0].state = 'applicant';
                            }
                            else {
                                state[0].state = 'receiver';
                            }

                            var getOtherUser = knex('ads');
                            // si je suis applicant je veux le receiver
                            if (state[0].state === 'applicant') {
                                getOtherUser.select('username', 'phone_number')
                                    .where('ads.id', '=', id_hubz_receiver)
                                ;
                            }
                            else {
                              getOtherUser.select('username', 'phone_number')
                                  .where('ads.id', '=', id_hubz_applicant)
                              ;
                            }
                            getOtherUser.join('users', 'ads.user_id', '=', 'users.id');
                            getOtherUser
                                .bind({})
                                .then(function (otherUser) {
                                    state[0].otherUser = otherUser;
                                    res.json(state);
                                })
                            ;

                        })
                    ;
                }
                else {
                    res.json(null);
                }
            })
        ;
    });

    app.post('/setLinkingState', server.requireAuthentication, function(req, res) {

        var id_linking_process = parseInt(req.body.id_linking_process);
        var state = req.body.state;

        var linkingP = knex('linking_process')
            .where('id', '=', id_linking_process)
        ;
        if (state === 'refused') {
            linkingP
                .update({
                    date_denied: new Date(),
                })
            ;
        }
        else {
            linkingP
                .update({
                    date_accepted: new Date(),
                })
            ;
        }

        linkingP
            .bind({})
            .then(function () {
                res.json('update ok');
            })
        ;

    });

    app.post('/setNewAdImg/:id?', server.requireAuthentication, function(req, res) {
        var adId = parseInt(req.params.id);

        var deleteImg = knex('ad_images')
            .where('ad_id', '=', adId)
            .del()
        ;
        deleteImg
            .bind({})
            .then(function () {
                var imgForNewHubz = knex('ad_images');

                var tab = [];
                var j = 0;
                for (var i in req.body.myImgs){
                    tab[j] = {
                        ad_id: adId,
                        path: req.body.myImgs[i],
                        index: j,
                    };
                    j++;
                }
                imgForNewHubz.insert(tab);

                imgForNewHubz
                    .bind({})
                    .then(function () {
                        res.json('insert ok');
                    })
                ;
            })
        ;


    });

    // ajoute une note à un hubz
    app.post('/setRating', server.requireAuthentication, function(req, res) {

        if (!req.body.hubzId || !req.body.userId || !req.body.rating) {
            res.status(400).json('paramètres manquants');
        }

        var hubzId = parseInt(req.body.hubzId);
        var userId = parseInt(req.body.userId);
        var rating = parseInt(req.body.rating);
        var applicant = parseInt(req.body.applicant);
        var receiver = parseInt(req.body.receiver);

        var insertRating = knex('ad_ratings')
            .insert({
                ad_id: hubzId,
                user_id: userId,
                value : rating,
                date: new Date(),
            })
        ;

        insertRating
            .bind({})
            .then(function () {
                res.json('insert ok');

                // insert en bdd l'info comme quoi le hubz est notifié, donc pas besoin de relance
                var noRaise = knex('user_linkings')
                    .where('id_applicant', '=', applicant)
                    .andWhere('id_receiver', '=', receiver)
                    .update({
                        rating_notified: 1,
                    })
                ;
                noRaise
                    .bind({})
                    .then(function () {
                        res.json('insert ok');
                    })
                ;
            })
        ;
    });

    app.post('/getRating', server.requireAuthentication, function (req, res) {
        var hubz_id = req.body.hubz_id;
        var user_id = req.body.user_id;

        if (!req.body.hubz_id || !req.body.user_id ) {
            res.status(400).json('paramètres manquants');
        }

        var ratingState = knex('ad_ratings')
            .where('ad_id', '=', hubz_id)
            .andWhere('user_id', '=', user_id)
        ;
        ratingState
            .bind({})
            .then(function (rating) {
                res.json(rating);
            })
        ;
    });

    // check les annonces d'un user en fonction des actions/categ
    // afin de déterminer si son quota est atteint
    app.post('/maximumHubz/:id?', server.requireAuthentication, function(req, res) {

        var user_id = parseInt(req.params.id);
        var id_action = parseInt(req.body.idAction);
        var id_categ = parseInt(req.body.idCateg);

        if (!user_id || !req.body.idAction || !req.body.idCateg) {
            res.status(400).json('paramètres manquants');
        }
        checkMaximumHubz(user_id, id_action, id_categ, function (result) {
            res.json(result);
        });
    });

    app.post('/newAbuse', server.requireAuthentication, function(req, res) {
        var ad_id = parseInt(req.body.ad_id);
        var user_id = parseInt(req.body.user_id);

        var checkAbuse = knex('ad_abuses')
            .where('ad_id', '=', ad_id)
            .andWhere('user_id', '=', user_id)
        ;

        checkAbuse
            .bind({})
            .then(function (abuse) {
                // si la personne n'a pas encore signalé cette annonce
                if (abuse.length === 0 ) {

                    // on insert la demande d'abus
                    var insertNewAbuse = knex('ad_abuses')
                        .insert({
                            ad_id : ad_id,
                            user_id : user_id,
                            date: new Date(),
                        })
                    ;
                    insertNewAbuse
                        .bind({})
                        .then(function () {
                            res.json('insert new abuse ok');
                        })
                    ;

                }
                else {
                    res.json('hubz signaled');
                }
            })
        ;


    });

    app.post('/sendMail', server.requireAuthentication, function(req, res) {

        if (!req.body.receiver || !req.body.subject || !req.body.message) {
            res.status(400).json('paramètres manquants');
        }

        var transporter = nodemailer.createTransport(sendmailTransport({
            path: 'sendmail',
            args: [ '-t', '-i' ],
        }));

        transporter.sendMail({
            from: config.sender,
            to: req.body.receiver,
            subject: req.body.subject,
            text: req.body.message,
            replyTo: config.noreplyAddress,
        }, function (err) {

            if (err) {
                console.log(err.message);
                return res.status(500).json('Erreur lors de l\'envoi du mail à :' + req.body.receiver);
            }
        });
    });

    app.post('/updateUserStatus', server.requireAuthentication, function(req, res) {

        var status = parseInt(req.body.status);
        var id_user = parseInt(req.body.user_id);
        var siren_number = parseInt(req.body.siren_number);

        var date_end_pro = moment().add(config.proTrialPeriod, 'd')._d;

        var user = knex('users')
                    .where('users.id', '=', id_user)
                    .andWhere('users.getTrialPeriod', '=', 0)
                    .update({
                        user_statuses_id: status,
                        getTrialPeriod: 1,
                        date_end_pro: date_end_pro,
                        siren_number: siren_number,
                    })
        ;
        user
            .bind({})
            .then(function (result) {
                res.json(result);
            })
        ;
    });

    app.post('/checkActionPrice', server.requireAuthentication, function(req, res) {
        if (!req.body.actionId) {
            res.status(400).json('paramètres manquants');
        }

        var price;
        if (req.body.price === '') {
            price = false;
        }
        else {
            price = true;
        }

        var priceSubCateg = knex('ad_actions')
            .where('id', '=', req.body.actionId)
        ;

        priceSubCateg
            .bind({})
            .then(function (resPrice) {
                if (resPrice[0].has_price === 1) {
                    res.json(true);
                }
                else {
                    res.json(false);
                }
            })
        ;
    });

    app.get('/getAd', server.requireAuthentication, function(req, res) {

        var advert = knex('advertisements')
            .select('image_path', 'url')
            .where('active', '=', 1)
        ;
        advert
            .bind({})
            .then(function (advert) {
                res.json(advert);
            })
        ;

    });
    app.post('/setLinkingImageShowed', server.requireAuthentication, function(req, res) {
        if (!req.body.id_user || !req.body.state || !req.body.id_hubz_applicant || !req.body.id_hubz_receiver) {
            res.status(400).json('paramètres manquants');
        }
        var id_hubz_applicant = parseInt(req.body.id_hubz_applicant);
        var id_hubz_receiver = parseInt(req.body.id_hubz_receiver);
        var id_user = parseInt(req.body.id_user);

        var linking = knex('user_linkings')
            .join('linking_process', 'linking_process.user_linkings_id', '=', 'user_linkings.id')
            .where('id_applicant', id_hubz_applicant)
            .andWhere('id_receiver', id_hubz_receiver)
        ;

        linking
            .bind({})
            .then(function (state) {
                if (state.length > 0) {
                    var isApplicant = knex('ads')
                        .join('users', 'users.id', '=', 'ads.user_id')
                        .where('ads.id', '=', state[0].id_applicant)
                        .andWhere('user_id', '=',id_user)
                    ;

                    isApplicant
                        .bind({})
                        .then(function (hubz) {
                            var show;
                            if (req.body.state === 'true') {
                                show = 1
                            }
                            else {
                                show = 0;
                            }
                            var updateLinking = knex('user_linkings')
                                .where('id', '=', state[0].user_linkings_id)
                            ;
                            // je suis applicant
                            if (hubz.length > 0) {
                                updateLinking.update({
                                    show_avatar_applicant: show,
                                });
                            }
                            else {
                                updateLinking.update({
                                    show_avatar_receiver: show,
                                });
                            }

                            updateLinking
                                .bind({})
                                .then(function (update) {
                                    res.json('update ok');
                                })
                            ;
                        })
                    ;
                }
            })
        ;
    });

    app.post('/deleteLinking', server.requireAuthentication, function(req, res) {
        if (!req.body.applicant || !req.body.receiver) {
            res.status(400).json('paramètres manquants');
        }

        var applicant = parseInt(req.body.applicant);
        var receiver = parseInt(req.body.receiver);

        var linking = knex('user_linkings')
            .where(function() {
                this.where('id_applicant', '=', applicant)
                .andWhere('id_receiver', '=', receiver);
            })
            .orWhere(function() {
                this.where('id_applicant', '=', receiver)
                .andWhere('id_receiver', '=', applicant);
            })
            .update({
                user_linking_status_id: 7,
            })
        ;
        linking
            .bind({})
            .then(function (link) {
                res.json('update ok');
            })
        ;
    });
    // retourne si un hubz est déja en relation avec quelqu'un ou non
    app.get('/checkHubzMatch/:id?', server.requireAuthentication, function(req, res) {
        if (!req.params.id ) {
            res.status(400).json('paramètres manquants');
        }
        var id = req.params.id;
        var checkAllMatches = knex('user_linkings')
            .where('user_linking_status_id', '!=', 5) // ni match
            .andWhere('user_linking_status_id', '!=', 7) // ni supprimée
            .andWhere(function() {
              this.where('id_applicant', '=', id)
              .orWhere('id_receiver', '=', id);
            })
        ;
        checkAllMatches
            .bind({})
            .then(function (match) {
                if (match.length > 0 ) {
                    res.json(true);
                }
                else {
                    res.json(false);
                }
            })
        ;
    });
};

server.start(onStart);

chatServer.start();
