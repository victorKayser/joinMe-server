INSERT INTO `database_versions` (`label`) VALUES ('v4');

ALTER TABLE `users` ADD `reset_token` VARCHAR( 36 ) NULL AFTER `access_token` ;
