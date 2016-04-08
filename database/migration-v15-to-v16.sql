INSERT INTO `database_versions` (`label`) VALUES ('v16');

ALTER TABLE  `users` CHANGE  `image_path`  `image_path` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL ;

UPDATE  `hubz_dev`.`ad_actions` SET  `can_be_demanded` =  '1' WHERE  `ad_actions`.`id` =3;

ALTER TABLE  `user_linkings` ADD  `rating_to_notify` INT NOT NULL AFTER  `picture_showed` ;
ALTER TABLE  `user_linkings` ADD  `rating_notified` INT NOT NULL AFTER  `rating_to_notify` ;
