'use strict';

var bookshelf = require('../../core/server_modules/bookshelf');
require('./AdCategoriesParents');
require('./AdActions');

module.exports = bookshelf.model('AdActionsAdCategoriesParents', bookshelf.Model.extend({
    tableName: 'ad_actions_ad_categories_parents',
    idAttribute: 'id',
    action: function() {
        return this.belongsTo('AdActions', 'ad_action_id');
    },
    category: function() {
        return this.belongsTo('AdCategoriesParents', 'ad_categories_parent_id');
    },
}));
