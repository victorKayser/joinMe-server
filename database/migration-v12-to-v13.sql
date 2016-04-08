INSERT INTO `database_versions` (`label`) VALUES ('v13');

ALTER TABLE  `ad_images` CHANGE  `path`  `path` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL ;
