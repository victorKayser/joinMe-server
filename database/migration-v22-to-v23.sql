INSERT INTO `database_versions` (`label`) VALUES ('v23');

ALTER TABLE `ad_actions` ADD `has_price` TINYINT NOT NULL ;
UPDATE `ad_actions` SET `has_price` = '1' WHERE `ad_actions`.`id` =1;
UPDATE `ad_actions` SET `has_price` = '1' WHERE `ad_actions`.`id` =2;
UPDATE `ad_actions` SET `has_price` = '1' WHERE `ad_actions`.`id` =4;
UPDATE `ad_actions` SET `has_price` = '1' WHERE `ad_actions`.`id` =7;
UPDATE `ad_actions` SET `has_price` = '1' WHERE `ad_actions`.`id` =9;
UPDATE `ad_actions` SET `has_price` = '1' WHERE `ad_actions`.`id` =10;
