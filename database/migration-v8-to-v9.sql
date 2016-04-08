INSERT INTO `database_versions` (`label`) VALUES ('v9');

ALTER TABLE  `ad_actions` CHANGE  `path_picto`  `path_picto_marker` VARCHAR( 255 ) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL ;

ALTER TABLE  `ad_actions` ADD  `path_picto` VARCHAR( 255 ) NOT NULL AFTER  `path_picto_marker` ;

INSERT INTO `ad_actions` (`id`, `label`, `label_dev`, `can_be_offered`, `can_be_demanded`, `path_picto_marker`, `path_picto`, `color`, `order`) VALUES
(1, 'À acheter', 'buy', 0, 1, 'img/POI-aacheter-c.png', '/img/picto-aacheter-blanc.png', '#0082CA', 1),
(2, 'À vendre', 'sell', 1, 0, 'img/POI-avendre-c.png', '/img/picto-avendre-blanc.png', '#F7123F', 2),
(3, 'Prêter', 'lend', 1, 0, 'img/POI-preter-c.png', '/img/picto-preter-blanc.png', '#00AF41', 3),
(4, 'Partager', 'share', 1, 1, 'img/POI-partager-c.png', '/img/picto-partager-blanc.png', '#544587', 4),
(5, 'Échanger', 'trade', 1, 1, 'img/POI-echanger-c.png', '/img/picto-echanger-blanc.png', '#009877', 5),
(6, 'Trouvé / Perdu', 'found_lost', 1, 1, 'img/POI-trouver-c.png', '/img/picto-trouver-blanc.png', '#FF5A00', 6),
(7, 'Louer', 'rent', 1, 1, 'img/POI-louer-c.png', '/img/picto-louer-blanc.png', '#004197', 7),
(8, 'Rencontrer', 'meet', 1, 1, 'img/POI-rencontrer-c.png', '/img/picto-rencontrer-blanc.png', '#FFAA61', 8),
(9, 'Promos', 'promo', 1, 1, 'img/POI-promo-c.png', '/img/picto-promo-blanc.png', '#8C0022', 9),
(10, 'Services', 'services', 1, 1, 'img/POI-services-c.png', '/img/picto-services-blanc.png', '#F295CD', 10);
