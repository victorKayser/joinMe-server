INSERT INTO `database_versions` (`label`) VALUES ('v8');

ALTER TABLE `ads` CHANGE `ad_category_durations_id` `ad_category_duration_id` INT( 11 ) NOT NULL ;
ALTER TABLE `users` CHANGE `distance_max_linking_meters` `distance_max_linking_meters` INT( 11 ) NULL COMMENT 'distance maxi de mise en relationSi null, on prend la valeur par défaut.',
CHANGE `distance_max_show_meters` `distance_max_show_meters` INT( 11 ) NULL COMMENT 'distance d''affichage des annonces sur la carteSi null, on prend la valeur par défaut.';
