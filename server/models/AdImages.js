'use strict';

var bookshelf = require('../../core/server_modules/bookshelf');

var AdImages = bookshelf.model('AdImages', bookshelf.Model.extend({
    tableName: 'ad_images',
    idAttribute: 'id',
}));

module.exports = AdImages;
