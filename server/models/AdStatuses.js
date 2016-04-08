'use strict';

var bookshelf = require('../../core/server_modules/bookshelf');

module.exports = bookshelf.model('AdStatuses', bookshelf.Model.extend({
    tableName: 'ad_statuses',
    idAttribute: 'id',
}));
