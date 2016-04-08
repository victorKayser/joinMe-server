INSERT INTO `database_versions` (`label`) VALUES ('v10');

ALTER TABLE `ad_impressions` CHANGE `ad_id` `ad_1_id` INT( 11 ) NOT NULL ;
ALTER TABLE  `ad_impressions` ADD  `ad_2_id` INT( 11 ) NOT NULL AFTER  `ad_1_id` ;
