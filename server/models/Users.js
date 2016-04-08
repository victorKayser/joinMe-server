'use strict';

var bookshelf = require('../../core/server_modules/bookshelf');
var UserStatuses = require('./UserStatuses');
var generateRandomString = require('../generateRandomString');
var crypto = require('crypto');

module.exports = bookshelf.model('Users', bookshelf.Model.extend({
    tableName: 'users',
    idAttribute: 'id',
    status: function() {
        return this.belongsTo('UserStatuses', 'id');
    },

    /**
     * Génère un nouveau mot de passe pour l'User courant et le retourne.
     */
    generateNewPassword: function() {
        var password = generateRandomString(6);
        this.set('password', crypto.createHash('sha256').update(password).digest('hex'));
        return password;
    },

    /**
     * Crée un utilisateur de statut label_dev passé en paramètre
     */
    createFromStatus: function(statusLabel) {
        var that = this;
        return UserStatuses
            .forge({
                label_dev: statusLabel
            })
            .fetch()
            .then(function(statusRows) {

                if (!statusRows) {
                    throw new Error('Le statut utilisateur "' + statusLabel + '" n\'existe pas');
                }

                that.set('user_statuses_id', statusRows.get('id'));

                return that.save();
            });
    },
}));
