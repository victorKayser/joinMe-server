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
var express = require('../core/node_modules/express');
var knex = require('../core/server_modules/bookshelf').knex;

var server = new RestServer({
    useMysql: true,
});

var chatServer = new ChatServer();

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

var onStart = function() {

    var app = server.app;
    var cache = server.apicache;

    var cacheEnabled = !server.config.cache || !server.config.cache.disable;

    app.use('/img', express.static(__dirname + '/../upload/img', { maxAge: cacheEnabled ? '3 days' : '' }));

};

server.start(onStart);

chatServer.start();
