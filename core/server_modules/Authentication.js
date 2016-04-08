'use strict';

/**
 * Add authentication fonctionnality to the server
 * See the documentation for more informations :
 * http://dorian-marchal.gitbooks.io/phonegap-boilerplate-documentation/content/auth.html
 */
var Authentication = function() {

    var that = this;

    var passport = require('passport');
    var uuid = require('node-uuid');

    this.addTo = function(server) {

        server.passport = passport;

        server.app.use(server.passport.initialize());

        server.BearerStrategy = require('passport-http-bearer').Strategy;

        server.passport.use(new server.BearerStrategy(
            function(token, done) {

                that.findUserByToken(token, function(err, user) {
                    if (err || !user) {
                        if (err) { console.error(err.message); }
                        done();
                        return;
                    }

                    return done(null, user);
                });

            }
        ));

        /**
         * Require an authentication to hand over the new middleware
         */
        server.requireAuthentication = server.passport.authenticate('bearer', { session : false });

        /**
         * Authenticate the user of an access_token is passed but do not require
         * an authentication.
         */
        server.authenticate = function (req, res, next) {

            (server.passport.authenticate('bearer', { session : false }, function (err, user) {
                req.user = user;
                // In all cases, we next (even if an error occurs)
                next();
            }))(req, res, next);
        };

        /**
         * Check if User exists based on username/password
         */
        var loginMiddleware = function(req, res, next) {

            // username or password missing
            if (!(req.body.username && req.body.password)) {
                res.sendStatus(401);
                return;
            }

            that.findUserByUsernameAndPassword(req.body.username, req.body.password, function(err, user) {

                if (err || !user) {
                    res.sendStatus(401);
                    return;
                }

                req.user = user;
                next();
            });
        };

        /**
         * Update the token of the req.user and set the req.user.token var
         */
        var updateTokenMiddleware = function(req, res, next) {

            if (!req.user) {
                res.sendStatus(500);
                return console.error('req.user not set.');
            }

            var newToken = uuid.v4();

            that.updateUserToken(req.user, newToken, function(err, newTokenOverride) {
                if (err) {
                    res.sendStatus(500);
                    return console.error('User token update failed.');
                }

                req.user.token = newTokenOverride || newToken;
                next();
            });

        };

        /**
         * Null the token of the req.user
         */
        var clearTokenMiddleware = function(req, res, next) {

            if (!req.user) {
                res.sendStatus(500);
                return console.error('req.user not set');
            }

            that.updateUserToken(req.user, null, function(err) {
                if (err) {
                    res.sendStatus(500);
                    return console.error('User token clearance failed.');
                }

                next();
            });
        };

        // Set up our routes and start the server
        server.app.post('/login', loginMiddleware, updateTokenMiddleware, function(req, res) {
            res.json(req.user);
        });

        server.app.post('/logout', server.requireAuthentication, clearTokenMiddleware, function(req, res) {
            req.logout();
            res.sendStatus(200);
        });

        // Send status 200 if the user is authenticated. Else send 401 status.
        server.app.get('/logged-in', server.requireAuthentication, function(req, res) {
            res.sendStatus(200);
        });
    };

    /**
     * Retrieve a User based on a token
     * See the top of the file for more informations
     */
    this.findUserByToken = function() {
        throw new Error('Authentication.findUserByToken must be overriden.');
    };

    /**
     * Retrieve a User based on a username and a password
     * See the top of the file for more informations
     */
    this.findUserByUsernameAndPassword = function() {
        throw new Error('Authentication.findUserByUsernameAndPassword must be overriden.');
    };

    /**
     * Update the user token
     * See the top of the file for more informations
     */
    this.updateUserToken = function() {
        throw new Error('Authentication.updateUserToken must be overriden.');
    };
};

module.exports = new Authentication();
