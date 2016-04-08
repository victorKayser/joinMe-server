'use strict';

var bookshelf = require('../../core/server_modules/bookshelf');

module.exports = bookshelf.model('AdCategoryDurations', bookshelf.Model.extend({
    tableName: 'ad_category_durations',
    idAttribute: 'id',
}));
