'use strict';

var InfoHubzer = function(infosHubzerData) {
	this.updateData(infosHubzerData);
};

InfoHubzer.prototype = {
	constructor: InfoHubzer,

	idHubzer: null,
	timer: null,
	coordGps: {
		latitude: null,
		longitude: null,
	},
	prefDistance: 100,
	nearHubzerList: {},

	// Mise à jour des données coordGps et prefDistance
	updateData: function(infosHubzerData) {
		this.idHubzer = infosHubzerData.idHubzer;
		this.coordGps = infosHubzerData.coordGps;
		this.prefDistance = infosHubzerData.prefDistance;
	},

	addNearHubzer: function(newNearHubzer, idHubzer, distance) {
		newNearHubzer.distance = distance;
		newNearHubzer.nearHubzerList = {};
		this.nearHubzerList[idHubzer] = newNearHubzer;
	},

	clearNearList: function() {
		//  Nettoie la nearHubzerList
		this.nearHubzerList = {};
	}
};

module.exports = InfoHubzer;
