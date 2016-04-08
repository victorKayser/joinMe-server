'use strict';

/**
 * A simple and easy to configure rest server.
 *
 * Server properties :
 *     this.config : loaded config
 *     this.router : express instance
 *
 * Server Options :
 *     useMongo (default : false) ; If true, mongoConnection and mongoose will be defined
 *         this.app.set('mongoose') : Mongoose instance
 *     useMysql (default : false) ; If true, mysqlConnection will be defined
 *         that.app.set('bookshelf') : bookshelf instance
 *         core/server_modules/bookshelf : bookshelf instance
 *
 */

 var knex = require('../core/server_modules/bookshelf').knex;

 var configDefault = require('../config.js.default');
 //machine locale
 if (configDefault.environment === 'local') {
     var config = require('../config.js');
 }
 else {
     // sur les serveurs de dev : les fichiers de config sont dans le sous répertoir private + nom du server
     var config = require('../../../private/hubz-server/config.js');
 }

var ChatServer = function() {

    var that = this;

    var server = require('http').createServer();
    var io = require('socket.io')(server);

    var prefixedUserRoom = 'room';

    io.sockets.on('connection', function (socket) {


        var idConversation;
        var linking_id;

        socket.on('disconnect', function () {
        });

        socket.emit('authentification');

        socket.on('setMyId', function(id) {
            socket.join(prefixedUserRoom + id);
            socket.emit('checkAuth', id);
        });

        // obtient l'id de la discussion depuis le client
        socket.on('getDiscussionId', function (idConvers, idLinking, state, scroll) {

            // on récupère les données de la convers
            if(idConvers !== 0) {
                var messages = knex('discussion_messages')
                    .join('users', 'users.id', '=', 'discussion_messages.user_id')
                    .where('discussion_id', '=', parseInt(idConvers))
                    .orderBy('date', 'desc')
                ;
                messages
                    .then(function(mess) {
                        var checkShowImg = knex('user_linkings')
                            .where('id', '=', idLinking)
                        ;
                        checkShowImg
                            .then(function(linking) {
                                var show;
                                if (state === 'receiver') {
                                    show = linking[0].show_avatar_applicant;
                                }
                                else {
                                    show = linking[0].show_avatar_receiver;
                                }
                                socket.emit('loadMessages', mess, show, scroll);

                                var updateAllMsg = knex('discussion_messages')
                                    .where('discussion_id', '=', idConvers)
                                ;
                                if (state === 'applicant') {
                                    updateAllMsg
                                        .where('view_applicant', '!=', 1)
                                        .update({
                                            view_applicant: 1,
                                        })
                                    ;
                                }
                                else {
                                    updateAllMsg
                                        .where('view_receiver', '!=', 1)
                                        .update({
                                            view_receiver: 1,
                                        })
                                    ;
                                }
                                updateAllMsg
                                    .then(function(){
                                    })
                                ;
                            })
                        ;
                    })
                    .catch(function() {
                    })
                ;
            }
            // la discution n'existe encore pas, on va la créer
            else {
                socket.emit('loadMessages', false, 0, scroll);
            }

            idConversation = idConvers;
            linking_id = idLinking;

        });

        // recoit un message
        socket.on('sendMessage', function(message, user_id, picture, state) {

            var linking = knex('user_linkings')
                .where('user_linkings.id', '=', linking_id)
                .join('ads', function() {
                  this.on('user_linkings.id_applicant', '=', 'ads.id').orOn('user_linkings.id_receiver', '=', 'ads.id');
                })
                .andWhere('user_linkings.user_linking_status_id', '!=', 7) // impossible d'envoyer un msg dans une mer supprimée
            ;
            linking
                .then(function(linkInfos) {
                    if (linkInfos.length > 0) {
                        var otherUserId;
                        var idHubzOffer;
                        var hubz_applicant;
                        var hubz_receiver;

                        linkInfos.map(function(el, i) {
                            if (el.user_id !== user_id) {
                                otherUserId = el.user_id;
                            }
                            if (el.is_offer) {
                                idHubzOffer = el.id;
                            }
                            hubz_applicant = el.id_applicant;
                            hubz_receiver = el.id_receiver;
                        });
                        var show;
                        linkInfos.map(function(el, i) {
                            if (otherUserId === el.user_id){
                                if (el.id === el.id_applicant) {
                                    show = el.show_avatar_receiver;
                                }
                                else {
                                    show = el.show_avatar_applicant;
                                }
                            }
                        });

                        if (idConversation === 0 ) { // si lors de l'envoi d'un message la conversation n'est pas crée

                            // récupère l'id max des conversations existantes
                            var maxDiscussionId = knex('discussions').max('id as maxId');

                            maxDiscussionId
                                .then(function(discussion) {

                                    var newId;

                                    if (discussion[0].maxId === null) {
                                        newId = 1;
                                    }
                                    else {
                                        newId = parseInt(discussion[0].maxId) + 1;
                                    }

                                    // crée une nouvelle discution
                                    var insertNewDiscussion = knex('discussions').insert({id: newId});
                                    insertNewDiscussion
                                        .then(function(id) {

                                            idConversation = id;

                                            // insert le message avec l'id de la nouvelle conversation

                                            var insertMsg = knex('discussion_messages')
                                                .insert({
                                                    discussion_id: idConversation,
                                                    user_id: user_id,
                                                    content: message,
                                                    date: new Date(),
                                                    is_image : (picture),
                                                    view_applicant: (state === 'applicant') ? 0 : 1,
                                                    view_receiver: (state === 'receiver') ? 0 : 1,
                                                })
                                            ;


                                            insertMsg
                                                .then(function(msgId) {

                                                    // récupère les infos de l'user qui envoi le message
                                                    var user = knex('users')
                                                        .where('id', '=', user_id)
                                                    ;

                                                    user
                                                        .then(function(usr) {

                                                            // met à jours la mise en relation en base avec le nouveau id de converation

                                                            var updateLinking = knex('user_linkings')
                                                                .where('id', '=', linking_id)
                                                                .update({
                                                                    discussion_id: idConversation,
                                                                })
                                                            ;
                                                            updateLinking
                                                                .then(function() {
                                                                    var url = '/linking/' + idHubzOffer + '/0/'+ hubz_applicant + '/' + hubz_receiver;
                                                                    if (!picture) {
                                                                        socket.broadcast.to(prefixedUserRoom + otherUserId).emit('sendNewMsg', message, usr, show);
                                                                        socket.broadcast.to(prefixedUserRoom + otherUserId).emit('notify', message, url, usr, linking_id, msgId[0], hubz_applicant, hubz_receiver);
                                                                    }
                                                                    else {
                                                                        socket.broadcast.to(prefixedUserRoom + otherUserId).emit('sendNewImg', message, usr, show);
                                                                        socket.broadcast.to(prefixedUserRoom + otherUserId).emit('notify', 'Vous avez reçu une image', url, usr, linking_id, msgId[0], hubz_applicant, hubz_receiver);
                                                                    }
                                                                })
                                                                .catch(function() {
                                                                })
                                                            ;
                                                        })
                                                        .catch(function() {
                                                        })
                                                    ;
                                                })
                                                .catch(function() {
                                                })
                                            ;
                                        })
                                        .catch(function() {
                                        })
                                    ;
                                })
                                .catch(function() {
                                })
                            ;
                        }
                        else {
                            var user = knex('users')
                                .where('id', '=', user_id)
                            ;
                            user
                                .then(function(usr) {
                                    var insertMsg = knex('discussion_messages')
                                        .insert({
                                            discussion_id: idConversation,
                                            user_id: user_id,
                                            content: message,
                                            date: new Date(),
                                            is_image : (picture),
                                            view_applicant: (state === 'applicant') ? 0 : 1,
                                            view_receiver: (state === 'receiver') ? 0 : 1,
                                        })
                                    ;

                                    insertMsg
                                        .then(function(msgId) {
                                            var url = '/linking/' + idHubzOffer + '/0/'+ hubz_applicant + '/' + hubz_receiver + '/true';
                                            if (!picture) {
                                                socket.broadcast.to(prefixedUserRoom + otherUserId).emit('sendNewMsg', message, usr, show);
                                                socket.broadcast.to(prefixedUserRoom + otherUserId).emit('notify', message, url, usr, linking_id, msgId[0], hubz_applicant, hubz_receiver);
                                            }
                                            else {
                                                socket.broadcast.to(prefixedUserRoom + otherUserId).emit('sendNewImg', message, usr, show);
                                                socket.broadcast.to(prefixedUserRoom + otherUserId).emit('notify', 'Vous avez reçu une image', url, usr, linking_id, msgId[0], hubz_applicant, hubz_receiver);
                                            }
                                        })
                                        .catch(function() {
                                        })
                                    ;
                                })
                                .catch(function() {

                                })
                            ;
                        }
                    }
            });
        });

        socket.on('checkRaiseLinking', function(user_id) {
            var linking = knex('user_linkings')
                .join('ads', 'user_linkings.id_receiver', '=', 'ads.id')
                .join('linking_process', 'linking_process.user_linkings_id', '=', 'user_linkings.id')
                .where('ads.user_id', '=', user_id)
                .andWhere('rating_to_notify', '=', 1)
                .andWhere('rating_notified', '=', 0)
                .select('user_linkings.id as id_linking',
                        'ads.title'
                )
            ;

            linking
                .then(function (link) {
                    var res;
                    if (link.length > 0) {
                        res = link[0];

                        var linkingNotified = knex('user_linkings')
                            .where('user_linkings.id', '=', link[0].id_linking)
                            .update({
                                rating_notified: 1,
                            })
                        ;

                        linkingNotified
                            .then(function () {
                                socket.emit('resultRaiseLinking', res);
                            })
                            .catch(function() {
                            })
                        ;
                    }
                    else {
                        res = false;
                        socket.emit('resultRaiseLinking', res);
                    }
                })
                .catch(function() {
                })
            ;
        });

        socket.on('checkProfilCompleted', function(user_id) {
            var user = knex('users')
                .where('ads.user_id', '=', user_id)
                .andWhere('rating_to_notify', '=', 1)
                .andWhere('rating_notified', '=', 0)

            ;

            user
                .then(function (user) {
                    var res;
                    if (user.length > 0) {
                        res = user[0];

                        var userNotified = knex('users')
                            .where('users.id', '=', user[0].id)
                            .update({
                                rating_notified: 1,
                            })
                        ;

                        userNotified
                            .then(function () {
                                socket.emit('resultCheckProfilCompleted', res);
                            })
                            .catch(function() {
                            })
                        ;
                    }
                    else {
                        res = false;
                        socket.emit('resultCheckProfilCompleted', res);
                    }
                })
                .catch(function() {
                })
            ;
        });

        socket.on('checkNewEvent', function(user_id) {


            var myHubz = knex('ads')
                .select('id')
                .where('user_id', '=', user_id)
            ;
            myHubz
                .then(function (myHubz) {
                    if (myHubz.length > 0) {
                        var tabId = [];

                        myHubz.map(function(el,i){
                            tabId.push(el.id);
                        });
                        var checkNewMsg = knex('user_linkings')
                            .select('user_linkings.id', 'discussion_messages.id as msgId', 'user_linkings.id_applicant', 'user_linkings.id_receiver')
                            .join('discussion_messages', 'discussion_messages.discussion_id', '=', 'user_linkings.discussion_id')
                            .where(function() {
                                this.where('user_linkings.id_applicant', 'in', tabId)
                                .andWhere('discussion_messages.view_applicant', '=', false)
                                .andWhere('user_linkings.user_linking_status_id', '!=', 7);
                            })
                            .orWhere(function(){
                                this.where('user_linkings.id_receiver', 'in', tabId)
                                .andWhere('discussion_messages.view_receiver', '=', false)
                                .andWhere('user_linkings.user_linking_status_id', '!=', 7);
                            })
                        ;

                        checkNewMsg
                            .then(function (news) {
                                socket.emit('returnNewMsg', news);
                            })
                            .catch(function(res) {
                                console.log(res);
                            })
                        ;
                    }
                    else {

                    }
                })
            ;
        });

    });

    this.server = server;

};

/**
 * Connect to database(s) and start rest server
 * @param  {function} onStart called when the databases are connected and the server is ready
 */
 ChatServer.prototype.start = function(onStart) {

    onStart = onStart || function() {};

    this.server.listen(config.chatServerPort, function() {
        console.log('Server listening on port ' + config.chatServerPort + '...');
        onStart();
    });
};

module.exports = ChatServer;
