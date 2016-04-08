'use strict';

var InfoHubzer = require('./InfoHubzer');

var configDefault = require('../../config.js.default');
//machine locale
if (configDefault.environment === 'local') {
    var config = require('../../config.js');
}
else {
    // sur les serveurs de dev : les fichiers de config sont dans le sous répertoir private + nom du server
    var config = require('../../../../private/hubz-server/config.js');
}

var HubzerList = function(timeout) {
	timeout = timeout || 10000;
	this.timeout = timeout;
};

HubzerList.prototype = {
	constructor: HubzerList,

	// Liste d'infoHubzer
	hubzers: {},

	getHubzer: function(idHubzer) {
		return this.hubzers[idHubzer];
	},

	addOrUpdateHubzer: function(infoHubzerData) {
		// Récupération du hubzer
		var existingHubzer = this.getHubzer(infoHubzerData.idHubzer);
		// Vérifie si le hubzer existe déjà
		if (existingHubzer) {
			// Mise à jour des données coordGps et prefDistance
			existingHubzer.updateData(infoHubzerData);
		}
		else {
			// Création d'un nouvel hubzer
			existingHubzer = this.hubzers[infoHubzerData.idHubzer] = new InfoHubzer(infoHubzerData);
		}
		// Lancement du timer
		this.setTimerHubzer(existingHubzer);

		// Création de la liste des hubzers à proximité
		this.generateNearHubzerList(existingHubzer);
	},

	deleteHubzer: function(idHubzer) {
		// Suppression d'un hubzer
		delete this.hubzers[idHubzer];
	},

	setTimerHubzer: function(infoHubzer) {
		// Arrêt du timer si déjà lancée précédemment

		if (infoHubzer.timer !== null) {
			clearTimeout(infoHubzer.timer);
		}

		// Création du timer
		var timeoutID = setTimeout(function onTimeElapsed() {
			this.deleteHubzer(infoHubzer.idHubzer);
		}.bind(this), config.timeDeleteHubzerInListObject);

		// Enregistrement du timer dans mon objet infoHubzer
		infoHubzer.timer = timeoutID;
	},

	// Crée la liste des hubzers à proximité
	generateNearHubzerList: function(infoHubzer) {
		// On nettoie la liste déjà présente
		infoHubzer.clearNearList();

		for (var hubzerId in this.hubzers) {
			var currentHubzer = this.hubzers[hubzerId];
			// On calcule les distance entre mon hubzer actuel et chaque hubzer déjà présent dans ma liste général
			var distance = this.getDistance(infoHubzer.coordGps, currentHubzer.coordGps);

			// Si l'hubzer est assez proche on l'enregistre dans la liste des hubzers à proximité.
		 	if (distance > 0 && distance <= infoHubzer.prefDistance) {
		 		var newNearHubzer = new InfoHubzer(currentHubzer);
				infoHubzer.addNearHubzer(newNearHubzer, hubzerId, distance);
			}
		}

	},

	//Calcule la distance entre deux point sur la terre et retourne la distance entre les deux en métres.
	getDistance: function (pointA, pointB) {
	        var toRad = function (val) {
	            return val * Math.PI / 180;
	        };

	        var aRadLatitude = toRad(pointA.latitude);
	        var aRadLongitude = toRad(pointA.longitude);

	        var bRadLatitude = toRad(pointB.latitude);
	        var bRadLongitude = toRad(pointB.longitude);

	        return Math.round(6371030 * Math.acos(Math.sin(aRadLatitude) * Math.sin(bRadLatitude) +
	            Math.cos(aRadLatitude) * Math.cos(bRadLatitude) * Math.cos(aRadLongitude - bRadLongitude)));
	},
};

module.exports = HubzerList;
