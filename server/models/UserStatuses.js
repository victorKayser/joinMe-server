'use strict';

var bookshelf = require('../../core/server_modules/bookshelf');
require('./Users');

module.exports = bookshelf.model('UserStatuses', bookshelf.Model.extend({
    tableName: 'user_statuses',
    idAttribute: 'id',
    users: function() {
        return this.hasMany('Users', 'user_statuses_id');
    },
}));
