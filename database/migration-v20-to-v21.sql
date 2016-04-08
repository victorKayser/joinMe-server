INSERT INTO `database_versions` (`label`) VALUES ('v21');

ALTER TABLE `users` ADD `getTrialPeriod` TINYINT NOT NULL DEFAULT '0' AFTER `rating_notified` ,
ADD `date_end_pro` DATETIME NOT NULL DEFAULT '0000-00-00 00:00' AFTER `getTrialPeriod`
