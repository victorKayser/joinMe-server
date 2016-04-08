INSERT INTO `database_versions` (`label`) VALUES ('v18');

ALTER TABLE  `ad_categories` CHANGE  `default_description`  `default_description` TINYTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL ;
UPDATE  `hubz_dev`.`ad_categories` SET  `default_description` =  'Surface:
Type:' WHERE  `ad_categories`.`id` =59;

UPDATE  `hubz_dev`.`ad_categories` SET  `default_description` =  'Kms:
Puissance:' WHERE  `ad_categories`.`id` =41;

UPDATE  `hubz_dev`.`ad_categories` SET  `default_description` =  'Cylindré:' WHERE  `ad_categories`.`id` =43;
