INSERT INTO `database_versions` (`label`) VALUES ('v26');

ALTER TABLE `user_linkings` DROP `picture_showed` ;
ALTER TABLE `user_linkings` ADD `show_avatar_applicant` TINYINT NOT NULL AFTER `rating_notified` ,
ADD `show_avatar_receiver` TINYINT NOT NULL AFTER `show_avatar_applicant` ;
