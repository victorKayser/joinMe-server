INSERT INTO `database_versions` (`label`) VALUES ('v24');

UPDATE `ad_category_durations` SET `label` = 'Heure(s)' WHERE `ad_category_durations`.`id` =1;
UPDATE `ad_category_durations` SET `label` = 'Jour(s)' WHERE `ad_category_durations`.`id` =2;
UPDATE `ad_category_durations` SET `label` = 'Semaine(s)' WHERE `ad_category_durations`.`id` =3;
