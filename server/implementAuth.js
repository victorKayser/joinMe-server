'use strict';

var implementsAuth = function(server) {
    var auth = require('../core/server_modules/Authentication');
    auth.addTo(server);

    var knex = require('../core/server_modules/bookshelf').knex;
    var crypto = require('crypto');

    /**
     * Filtre et converti certains champs de l'utilisateur
     */
    function adaptUserFields(user) {

        // Renomme access_token en token
        user.token = user.access_token;
        delete user.access_token;

        // Supprime le mot de passe (pour éviter de le renvoyer au client)
        delete user.password;

        return user;
    }


    auth.findUserByToken = function(token, done) {

        // Code to search user by token
        var kSearchByToken = knex('users')
            .where('access_token', '=', token)
        ;

        kSearchByToken
            .then(function (rows) {
                // user found
                if (rows.length > 0) {
                    return done(null, adaptUserFields(rows[0]));
                }
                return done(new Error('User not found : function findUserByToken'));
            })
            .catch(function(err) {
                console.error(err.message);
                done(err);
            })
        ;

    };

    auth.findUserByUsernameAndPassword = function(username, password, done) {

        // Code to search user by username/password

        var kSearchByUsernamePassword = knex('users')
            .where('username', '=', username)
            .andWhere('password', '=', crypto.createHash('sha256').update(password).digest('hex'))
        ;
        kSearchByUsernamePassword
            .then(function (rows) {
                // user found
                if (rows.length > 0) {

                    // si c'est le première connexion de l'utilisateur
                    if (rows[0].date_subscribe === null) {

                        var dateSubscribe = new Date();
                        var kInsertDateSubscribe = knex('users')
                            .where('username', '=', username)
                            .andWhere('password', '=', crypto.createHash('sha256').update(password).digest('hex'))
                            .update('date_subscribe', dateSubscribe)
                        ;
                        kInsertDateSubscribe
                            //insert de la date subscribe ok
                            .then(function () {
                                // On met à jour la date d'inscription avant de la retourner au client
                                rows[0].date_subscribe = dateSubscribe;
                                return done(null, adaptUserFields(rows[0]));
                            })
                            .catch(function(err) {
                                console.error(err.message);
                                done(err);
                            })
                        ;

                    }
                    else {
                        return done(null, adaptUserFields(rows[0]));
                    }
                }
                else {
                    return done(new Error('User not found : findUserByUsernameAndPassword'));
                }

            })

            // user not found
            .catch(function(err) {
                console.error(err.message);
                done(err);
            });

    };

    auth.updateUserToken = function(user, token, done) {

        // Code to update user token

        var kUpdateUserToken = knex('users')
            .update({
                access_token: token,
            })
            .where('id', '=', user.id)
        ;

        kUpdateUserToken
            // update ok
            .then(function () {
                done();
                return;
            })

            // update failed
            .catch(function(err) {
                console.error(err.message);
                done(err);
            })
        ;

    };
};

module.exports = implementsAuth;
