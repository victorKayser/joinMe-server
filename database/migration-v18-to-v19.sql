INSERT INTO `database_versions` (`label`) VALUES ('v19');

ALTER TABLE  `users` ADD  `rating_to_notify` BOOLEAN NOT NULL ;
ALTER TABLE  `users` ADD  `rating_notified` BOOLEAN NOT NULL ;
ALTER TABLE `ad_abuses` ADD `status` BOOLEAN NULL DEFAULT NULL ;

ALTER TABLE `advertisements` ADD `libelle` VARCHAR( 250 ) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL ,
ADD  `active` TINYINT( 1 ) NOT NULL ,
ADD `url` TEXT CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL ;

ALTER TABLE `users` CHANGE `status_id` `user_statuses_id` INT( 11 ) NOT NULL ;