INSERT INTO `database_versions` (`label`) VALUES ('v12');

CREATE TABLE IF NOT EXISTS `linking_process` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_linkings_id` INT NOT NULL,
  `date_linking` DATETIME NULL,
  `date_viewed` DATETIME NULL,
  `date_accepted` DATETIME NULL,
  `date_denied` DATETIME NULL,
  `notified` BOOLEAN NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`))
ENGINE = MyISAM;

CREATE INDEX `fk_linking_process_user_linkings1_idx` ON `linking_process` (`user_linkings_id` ASC);


ALTER TABLE  `user_linkings` CHANGE  `ad_1_id`  `id_applicant` INT( 11 ) NOT NULL ;
ALTER TABLE  `user_linkings` CHANGE  `ad_2_id`  `id_receiver` INT( 11 ) NOT NULL ;
