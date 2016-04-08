'use strict';

var bookshelf = require('../../core/server_modules/bookshelf');
require('./AdCategories');

module.exports = bookshelf.model('AdCategoriesParents', bookshelf.Model.extend({
    tableName: 'ad_categories_parents',
    idAttribute: 'id',
    subcategories: function() {
        return this.hasMany('AdCategories', 'ad_parent_category_id');
    },
}));
