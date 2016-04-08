INSERT INTO `database_versions` (`label`) VALUES ('v6');

DELETE FROM `ad_category_durations`;
INSERT INTO `ad_category_durations` (`id`, `value_ms`, `label`, `label_dev`) VALUES (1, 3600000, 'Heures', 'hours');
INSERT INTO `ad_category_durations` (`id`, `value_ms`, `label`, `label_dev`) VALUES (2, 86400000, 'Jours', 'days');
INSERT INTO `ad_category_durations` (`id`, `value_ms`, `label`, `label_dev`) VALUES (3, 604800000, 'Semaines', 'weeks');
