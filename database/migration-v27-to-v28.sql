INSERT INTO `database_versions` (`label`) VALUES ('v28');
ALTER TABLE `user_linkings` ADD `need_to_be_notified_cause_near` TINYINT NOT NULL AFTER `show_avatar_receiver` ;
ALTER TABLE `user_linkings` CHANGE `need_to_be_notified_cause_near` `applicant_need_to_be_notified_cause_near` TINYINT( 4 ) NOT NULL ;
ALTER TABLE `user_linkings` ADD `receiver_need_to_be_notified_cause_near` TINYINT NOT NULL AFTER `applicant_need_to_be_notified_cause_near` ;
