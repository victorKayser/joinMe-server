'use strict';

var bookshelf = require('../../core/server_modules/bookshelf');
require('./AdActionsAdCategoriesParents');

module.exports = bookshelf.model('AdActions', bookshelf.Model.extend({
    tableName: 'ad_actions',
    idAttribute: 'id',
    categories: function() {
        return this.belongsToMany('AdCategoriesParents').through('AdActionsAdCategoriesParents', 'id', 'ad_categories_parent_id');
    },
}));
