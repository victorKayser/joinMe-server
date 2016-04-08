'use strict';

var bookshelf = require('../../core/server_modules/bookshelf');
require('./AdCategoriesParents');
require('./AdActionsAdCategoriesParents');
require('./AdCategoryDurations');

module.exports = bookshelf.model('AdCategories', bookshelf.Model.extend({
    tableName: 'ad_categories',
    idAttribute: 'id',
    parent: function() {
        return this.belongsTo('AdCategoriesParents', 'ad_parent_category_id');
    },
    actions: function() {
        return this.belongsToMany('AdActions').through('AdActionsAdCategoriesParents', 'id', 'ad_action_id');
    },
    defaultDurationUnit: function() {
        return this.belongsTo('AdCategoryDurations', 'default_duration_unit_id');
    },
}));
