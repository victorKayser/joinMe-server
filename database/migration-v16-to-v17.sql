INSERT INTO `database_versions` (`label`) VALUES ('v17');

ALTER TABLE `users` CHANGE `offline_hour_end` `offline_hour_end` VARCHAR( 5 ) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '00:00' COMMENT 'heure de début de la période "ne pas être dérangé" chaque jours';
ALTER TABLE `users` CHANGE `offline_hour_start` `offline_hour_start` VARCHAR( 5 ) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '00:00' COMMENT 'heure de début de la période "ne pas être dérangé" chaque jours';

// passez les deux champs ci dessus en varchar(5)
