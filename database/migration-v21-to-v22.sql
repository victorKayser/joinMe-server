INSERT INTO `database_versions` (`label`) VALUES ('v22');

ALTER TABLE  `users` ADD  `birth_date` DATE NULL DEFAULT NULL AFTER  `username` ;