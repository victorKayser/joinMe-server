INSERT INTO `database_versions` (`label`) VALUES ('v11');

ALTER TABLE  `ad_impressions` CHANGE  `ad_1_id`  `ad_id` INT( 11 ) NOT NULL ;
ALTER TABLE  `ad_impressions` CHANGE  `ad_2_id`  `match_id` INT( 11 ) NOT NULL ;
