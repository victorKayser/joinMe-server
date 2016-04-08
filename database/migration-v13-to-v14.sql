INSERT INTO `database_versions` (`label`) VALUES ('v14');

ALTER TABLE `users` CHANGE `image_path` `image_path` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL ;
