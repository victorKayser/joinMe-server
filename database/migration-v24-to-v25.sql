INSERT INTO `database_versions` (`label`) VALUES ('v25');

ALTER TABLE `discussion_messages` CHANGE `content` `content` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL ;
ALTER TABLE `discussion_messages` ADD `is_image` TINYINT NOT NULL DEFAULT '0' AFTER `date` ;
