INSERT INTO `database_versions` (`label`) VALUES ('v33');
ALTER TABLE `users` ADD `siren_number` INT NULL AFTER `date_end_pro` ;
