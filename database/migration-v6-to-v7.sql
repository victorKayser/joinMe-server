INSERT INTO `database_versions` (`label`) VALUES ('v7');

ALTER TABLE `ads` ADD `ad_category_durations_id` INT NOT NULL AFTER `ad_status_id` ,
ADD `duration_factor` INT NOT NULL AFTER `ad_category_durations_id` ;
CREATE INDEX `fk_ads_ad_category_durations1_idx` ON `ads` (`ad_category_durations_id` ASC);
