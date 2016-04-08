INSERT INTO `database_versions` (`label`) VALUES ('v32');
UPDATE `hubz_dev`.`ad_actions` SET `can_be_offered` = '0' WHERE `ad_actions`.`id` =5;
