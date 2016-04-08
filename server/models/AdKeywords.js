'use strict';

var bookshelf = require('../../core/server_modules/bookshelf');
var Bluebird = require('bluebird');

var AdKeywords = bookshelf.model('AdKeywords', bookshelf.Model.extend({
    tableName: 'ad_keywords',
    idAttribute: 'id',
}));

/**
 * Remplace les mots-clé du Hubz par ceux passés en paramètre (une fois parsés).
 * @async Promise
 */
AdKeywords.updateHubzKeywords = function(adId, rawKeywords) {
    return new Bluebird(function(resolve, reject) {

        // Parsing des mots clés
        var keywords = rawKeywords.split(/,/);
        keywords.map(function(keyword, i) {
            keywords[i] = keyword.trim();
        });

        // Suppression des keywords existants
        AdKeywords
            .forge()
            .where({ad_id: adId})
            .destroy()
            .then(function() {

                var saveKeywords = [];
                // Enregistrement de tous les keywords
                keywords.forEach(function(keyword) {
                    saveKeywords.push(
                        AdKeywords.forge({
                            ad_id: adId,
                            label: keyword,
                        })
                        .save()
                    );
                });
                return Bluebird.all(saveKeywords);
            })
            .then(function() {
                resolve();
            })
            .catch(function(err) {
                reject(err);
            })
        ;
    });
};

module.exports = AdKeywords;
