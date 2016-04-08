INSERT INTO `database_versions` (`label`) VALUES ('v30');

INSERT INTO  `hubz_dev`.`ad_categories_parents` (`id` ,`label`)VALUES
(46,  'Promotions');

INSERT INTO `hubz_dev`.`ad_actions_ad_categories_parents` (`id`, `ad_action_id`, `ad_categories_parent_id`) VALUES
(97, '9', '46');

INSERT INTO `hubz_dev`.`ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `max_duration`, `default_description`, `label`, `has_price`) VALUES
(168, '46', NULL, NULL, NULL, NULL, 'Bar / boîte de nuit', '1'),
(169, '46', NULL, NULL, NULL, NULL, 'Bâtiment', '1'),
(170, '46', NULL, NULL, NULL, NULL, 'Boucherie/ Charcuterie', '1'),
(171, '46', NULL, NULL, NULL, NULL, 'Boulangerie / Patisserie', '1'),
(172, '46', NULL, NULL, NULL, NULL, 'Coiffure', '1'),
(173, '46', NULL, NULL, NULL, NULL, 'Chocolaterie', '1'),
(174, '46', NULL, NULL, NULL, NULL, 'Electricité', '1'),
(175, '46', NULL, NULL, NULL, NULL, 'Esthétique', '1'),
(176, '46', NULL, NULL, NULL, NULL, 'Fleuriste', '1'),
(177, '46', NULL, NULL, NULL, NULL, 'Hotellerie', '1'),
(178, '46', NULL, NULL, NULL, NULL, 'Kiné / Masseur ', '1'),
(179, '46', NULL, NULL, NULL, NULL, 'Supermarché / épicerie', '1'),
(180, '46', NULL, NULL, NULL, NULL, 'Mode', '1'),
(181, '46', NULL, NULL, NULL, NULL, 'Poissonnerie', '1'),
(182, '46', NULL, NULL, NULL, NULL, 'Restauration', '1'),
(183, '46', NULL, NULL, NULL, NULL, 'Transport ', '1');