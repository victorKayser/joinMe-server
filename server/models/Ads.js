'use strict';

var bookshelf = require('../../core/server_modules/bookshelf');
var Bluebird = require('bluebird');
var AdStatuses = require('./AdStatuses');
var AdCategoryDurations = require('./AdCategoryDurations');
require('./AdImages');
require('./AdKeywords');
require('./AdActions');
require('./AdCategories');

var Ads = bookshelf.model('Ads', bookshelf.Model.extend({
    tableName: 'ads',
    idAttribute: 'id',

    action: function() {
        return this.belongsTo('AdActions', 'ad_actions_id');
    },
    category: function() {
        return this.belongsTo('AdCategories', 'ad_category_id');
    },
    status: function() {
        return this.belongsTo('AdStatuses', 'ad_status_id');
    },
    duration_category: function() {
        return this.belongsTo('AdCategoryDurations', 'ad_category_duration_id');
    },
    keywords: function() {
        return this.hasMany('AdKeywords', 'ad_id');
    },
    images: function() {
        return this.hasMany('AdImages', 'ad_id');
    },

    /**
     * Set l'user id s'il n'existe pas, sinon vérifie que l'user est le même
     * Renvoie une erreur si les ids sont différents
     */
    checkAndSetUserId: function(userId) {
        if (this.get('user_id')) {
            if (this.get('user_id') !== userId) {
                throw new Error('User IDs are different');
            }
        }
        else {
            this.set('user_id', userId);
        }
    },

    /**
     * Vérifie le status. S'il n'existe pas, passe le hubz en "inactive"
     * @async Promise
     */
    setInactiveIfNotStatus: function() {
        var that = this;
        return new Bluebird(function(resolve, reject) {
            if (!that.get('ad_status_id')) {
                AdStatuses
                    .forge({ label_dev: 'inactive' })
                    .fetch()
                    .then(function(status) {
                        that.set('ad_status_id', status.id);
                        resolve();
                    })
                    .catch(function(err) {
                        reject(err);
                    })
                ;
            }
            else {
                resolve();
            }
        });
    },

    /**
     * Set la date de création si elle n'existe pas.
     */
    setCreationDate: function() {
        if (!this.get('date_creation')) {
            this.set('date_creation', new Date());
        }
    },

    /**
     * Set la date de début et de fin
     * @async Promise
     */
    setActivationDate: function() {
        var that = this;

        return new Bluebird(function(resolve, reject) {

            that.set('date_start', new Date());

            // On récupère le délai à ajouter à la date de fin
            AdCategoryDurations
                .forge({ id: that.get('ad_category_duration_id')})
                .fetch()
                .then(function(duration) {
                    var hubzDuration = that.get('duration_factor') * duration.get('value_ms');
                    that.set('date_end', new Date(Date.now() + hubzDuration));
                    resolve();
                })
                .catch(function(err) {
                    reject(err);
                })
            ;
        });
    },
}));

/**
 * Récupère ou crée un Hubz en fonction des données passées
 * @async Promise
 */
Ads.getFromData = function(modelData) {

    return new Bluebird(function(resolve, reject) {
        // Si un id est passé, on récupère le Hubz existant et on le met à jour
        if (modelData.id) {
            Ads
                .forge({ id: modelData.id })
                .fetch()
                .then(function(ad) {
                    ad.set(modelData);
                    resolve(ad);
                })
                .catch(function(err) {
                    reject(err);
                })
            ;
        }
        // Sinon, on retourne un nouveau modèle
        else {
            resolve(Ads.forge(modelData));
        }
    });
};

module.exports = Ads;
