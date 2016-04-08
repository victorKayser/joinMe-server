'use strict';

var Match = function() {

};

Match.prototype = {
	constructor: Match,

	match: {
		id_hubzer_1 : null,
		id_hubzer_2 : null,
	},

	matchExisted: false,

	listMatch : {},

	setMatch: function(id_hubz_matched, id_my_hubz, id_user) {

		if (typeof(this.listMatch[id_user]) !== 'undefined') {
			if (typeof(this.listMatch[id_user][id_hubz_matched]) === 'undefined') {
				this.listMatch[id_user][id_hubz_matched] = {
					id_hubzer_1 : id_hubz_matched,
					id_hubzer_2 : id_my_hubz,
				};
			}
		} else {
			this.listMatch[id_user] = {};
			this.listMatch[id_user][id_hubz_matched] = {
				id_hubzer_1 : id_hubz_matched,
				id_hubzer_2 : id_my_hubz,
			};
		}
	},
	clearMatch: function() {
		this.listMatch = {};
	}
};

module.exports = Match;
