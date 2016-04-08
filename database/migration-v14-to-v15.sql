INSERT INTO `database_versions` (`label`) VALUES ('v15');

INSERT INTO  `hubz_dev`.`user_linking_statuses` (
`id` ,
`label` ,
`label_dev`
)
VALUES (
6 ,  'matchPosition',  'matchPosition'
);

ALTER TABLE  `ad_categories` ADD  `max_duration` INT NULL DEFAULT NULL AFTER  `default_duration_factor` ;


