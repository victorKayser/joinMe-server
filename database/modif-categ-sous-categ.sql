DELETE FROM `ad_categories` WHERE `ad_categories`.`id` = 77;
DELETE FROM `ad_categories` WHERE `ad_categories`.`id` = 78;
DELETE FROM `ad_categories` WHERE `ad_categories`.`id` = 98;
DELETE FROM `ad_categories` WHERE `ad_categories`.`id` = 99;

DELETE FROM `ad_categories_parents` WHERE `ad_categories_parents`.`id` = 20;
DELETE FROM `ad_categories_parents` WHERE `ad_categories_parents`.`id` = 21;
DELETE FROM `ad_categories_parents` WHERE `ad_categories_parents`.`id` = 30;
DELETE FROM `ad_categories_parents` WHERE `ad_categories_parents`.`id` = 41;

DELETE FROM `ad_actions_ad_categories_parents` WHERE `ad_actions_ad_categories_parents`.`id` = 56;
DELETE FROM `ad_actions_ad_categories_parents` WHERE `ad_actions_ad_categories_parents`.`id` = 57;
DELETE FROM `ad_actions_ad_categories_parents` WHERE `ad_actions_ad_categories_parents`.`id` = 72;

UPDATE  `ad_actions_ad_categories_parents` SET  `ad_categories_parent_id` =  '16' WHERE `ad_actions_ad_categories_parents`.`id` =84;

UPDATE  `ad_categories_parents` SET  `label` =  'Garde d’enfants' WHERE  `ad_categories_parents`.`id` =17;

UPDATE  `ad_categories` SET  `label` =  'Autres' WHERE  `ad_categories`.`id` =126;

INSERT INTO `ad_categories_parents` (`id`, `label`) VALUES
(44, 'Autres'),
(45, 'Un « Truc »');

INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `max_duration`, `default_description`, `label`, `has_price`) VALUES
(130, 12, NULL, NULL, NULL, NULL, 'Mes codes Wifi', 1),
(131, 12, NULL, NULL, NULL, NULL, 'Mon Réseau', 1),
(132, 13, NULL, NULL, NULL, NULL, 'Gros équipement', 1),
(133, 13, NULL, NULL, NULL, NULL, 'Petit équipement', 1),
(134, 19, NULL, NULL, NULL, NULL, 'Caravane', 1),
(135, 19, NULL, NULL, NULL, NULL, 'Caravaning', 1),
(136, 19, NULL, NULL, NULL, NULL, 'Equipements', 1),
(137, 19, NULL, NULL, NULL, NULL, 'Motos, scooters, quad', 1),
(138, 19, NULL, NULL, NULL, NULL, 'Nautisme', 1),
(139, 19, NULL, NULL, NULL, NULL, 'Utilitaires', 1),
(140, 19, NULL, NULL, NULL, NULL, 'Vélos', 1),
(141, 19, NULL, NULL, NULL, NULL, 'Voiture', 1),
(142, 24, NULL, NULL, NULL, NULL, 'Intellectuel', 1),
(143, 24, NULL, NULL, NULL, NULL, 'Physique', 1),
(144, 25, NULL, NULL, NULL, NULL, 'Aide aux devoirs', 1),
(145, 25, NULL, NULL, NULL, NULL, 'Remise à niveau', 1),
(146, 25, NULL, NULL, NULL, NULL, 'Autres', 1),
(147, 32, NULL, NULL, NULL, NULL, 'CDD', 1),
(148, 32, NULL, NULL, NULL, NULL, 'CDI', 1),
(149, 32, NULL, NULL, NULL, NULL, 'Interim', 1),
(150, 32, NULL, NULL, NULL, NULL, 'Stages', 1),
(151, 32, NULL, NULL, NULL, NULL, 'Autres', 1),
(152, 33, NULL, NULL, NULL, NULL, 'Book', 1),
(153, 33, NULL, NULL, NULL, NULL, 'Evénements', 1),
(154, 33, NULL, NULL, NULL, NULL, 'Portrait', 1),
(155, 33, NULL, NULL, NULL, NULL, 'Shooting', 1),
(156, 33, NULL, NULL, NULL, NULL, 'Autres', 1),
(157, 35, NULL, NULL, NULL, NULL, 'Restauration traditionnelle', 1),
(158, 40, NULL, NULL, NULL, NULL, 'Femme', 1),
(159, 40, NULL, NULL, NULL, NULL, 'Homme', 1),
(160, 42, NULL, NULL, NULL, NULL, 'Discuter', 1),
(161, 42, NULL, NULL, NULL, NULL, 'Pratiquer', 1),
(162, 17, NULL, NULL, NULL, NULL, 'Baby-sitting', 1),
(163, 17, NULL, NULL, NULL, NULL, 'Nourrice', 1),
(164, 45, NULL, NULL, NULL, NULL, 'Accessoires', 1),
(165, 45, NULL, NULL, NULL, NULL, 'Objets', 1),
(166, 45, NULL, NULL, NULL, NULL, 'Vêtements', 1),
(167, 44, NULL, NULL, NULL, NULL, 'Autres', 1);

INSERT INTO `ad_actions_ad_categories_parents` (`id`, `ad_action_id`, `ad_categories_parent_id`) VALUES
(92, 1, 19),
(93, 2, 19),
(94, 3, 19),
(95, 5, 19),
(96, 6, 45);
