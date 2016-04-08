SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';


-- -----------------------------------------------------
-- Table `user_statuses`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_statuses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(45) NOT NULL,
  `label_dev` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table `users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `status_id` INT NOT NULL,
  `username` VARCHAR(45) NOT NULL,
  `password` VARCHAR(64) NOT NULL COMMENT 'Le mot de passe est généré par l\'application à l\'inscription',
  `phone_number` VARCHAR(45) NOT NULL,
  `mail` VARCHAR(200) NULL,
  `image_path` VARCHAR(255) NULL,
  `distance_max_linking_meters` INT NULL COMMENT 'distance maxi de mise en relation\nSi null, on prend la valeur par défaut.',
  `distance_max_show_meters` INT NULL COMMENT 'distance d\'affichage des annonces sur la carte\nSi null, on prend la valeur par défaut.',
  `offline_hour_start` DATETIME NULL COMMENT 'heure de début de la période \"ne pas être dérangé\" chaque jours',
  `offline_hour_end` DATETIME NULL COMMENT 'heure de fin de la période \"ne pas être dérangé\" chaque jours',
  `date_temporary_offline_end` DATETIME NULL COMMENT 'date jusqu\'a laquelle l\'utilisateur ne doit pas etre dérangé',
  `access_token` VARCHAR(36) NULL,
  `reset_token` VARCHAR(36) NULL,
  `date_subscribe` DATETIME NULL,
  PRIMARY KEY (`id`))
ENGINE = MyISAM
DEFAULT CHARACTER SET = utf8
COLLATE = utf8_general_ci;

CREATE INDEX `fk_user_1_idx` ON `users` (`status_id` ASC);


-- -----------------------------------------------------
-- Table `ad_statuses`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ad_statuses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(100) NOT NULL,
  `label_dev` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table `ad_category_durations`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ad_category_durations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `value_ms` BIGINT NOT NULL,
  `label` VARCHAR(45) NOT NULL,
  `label_dev` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table `ad_categories_parents`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ad_categories_parents` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table `ad_categories`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ad_categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ad_parent_category_id` INT NOT NULL,
  `default_duration_unit_id` INT NULL COMMENT 'Unité de la durée par défaut de ce type d\'Hubz',
  `default_duration_factor` INT NULL COMMENT 'Nombre d\'unité de durée par défaut (par exemple 3, pour 3 heures)',
  `default_description` TEXT NULL,
  `label` VARCHAR(45) NOT NULL,
  `has_price` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = MyISAM;

CREATE INDEX `fk_ads_category_duration1_idx` ON `ad_categories` (`default_duration_unit_id` ASC);

CREATE INDEX `fk_ad_categories_ad_parent_categories1_idx` ON `ad_categories` (`ad_parent_category_id` ASC);


-- -----------------------------------------------------
-- Table `ad_actions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ad_actions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(45) NOT NULL,
  `label_dev` VARCHAR(45) NOT NULL,
  `can_be_offered` TINYINT(1) NOT NULL COMMENT 'Vrai si on peut créer une offre à partir de cette action',
  `can_be_demanded` TINYINT(1) NOT NULL COMMENT 'Vrai si on peut créer une demande à partir de cette action',
  `path_picto_marker` VARCHAR(255) NOT NULL,
  `path_picto` VARCHAR(255) NOT NULL,
  `color` VARCHAR(12) NOT NULL,
  `order` BIGINT NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table `ads`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ads` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `ad_actions_id` INT NOT NULL COMMENT 'Type d\'action du hubz (donner, acheter, vendre, ...)\n',
  `ad_category_id` INT NOT NULL COMMENT 'Catégorie du Hubz (Automobile, Immobilier, ...)',
  `ad_status_id` INT NOT NULL,
  `ad_category_duration_id` INT NOT NULL,
  `duration_factor` INT NOT NULL,
  `title` VARCHAR(120) NOT NULL,
  `description` VARCHAR(200) NOT NULL,
  `date_creation` DATETIME NOT NULL,
  `date_start` DATETIME NOT NULL,
  `date_end` DATETIME NOT NULL,
  `price_fixed` FLOAT NULL,
  `price_range_min` FLOAT NULL,
  `price_range_max` FLOAT NULL,
  `disabled_abuse` TINYINT(1) NOT NULL DEFAULT 0,
  `favorite` TINYINT(1) NOT NULL DEFAULT 0,
  `is_demand` TINYINT(1) NOT NULL,
  `is_offer` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = MyISAM;

CREATE INDEX `fk_ads_1_idx` ON `ads` (`ad_status_id` ASC);

CREATE INDEX `fk_ads_2_idx` ON `ads` (`ad_category_id` ASC);

CREATE INDEX `fk_ads_user1_idx` ON `ads` (`user_id` ASC);

CREATE INDEX `fk_ads_ad_actions1_idx` ON `ads` (`ad_actions_id` ASC);

CREATE INDEX `fk_ads_ad_category_durations1_idx` ON `ads` (`ad_category_duration_id` ASC);


-- -----------------------------------------------------
-- Table `user_linking_statuses`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_linking_statuses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(45) NOT NULL,
  `label_dev` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table `discussions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `discussions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`))
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table `user_linkings`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_linkings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ad_1_id` INT NOT NULL,
  `ad_2_id` INT NOT NULL,
  `user_linking_status_id` INT NOT NULL,
  `discussion_id` INT NOT NULL,
  `date` DATETIME NOT NULL,
  `latitude` DOUBLE NOT NULL,
  `longitude` DOUBLE NOT NULL,
  `picture_showed` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = MyISAM;

CREATE INDEX `fk_user_linking_ads1_idx` ON `user_linkings` (`ad_1_id` ASC);

CREATE INDEX `fk_user_linking_ads2_idx` ON `user_linkings` (`ad_2_id` ASC);

CREATE INDEX `fk_user_linking_user_linking_status1_idx` ON `user_linkings` (`user_linking_status_id` ASC);

CREATE INDEX `fk_user_linking_discussions1_idx` ON `user_linkings` (`discussion_id` ASC);


-- -----------------------------------------------------
-- Table `advertisements`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `advertisements` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `image_path` VARCHAR(120) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `ad_impression_types`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ad_impression_types` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(45) NOT NULL COMMENT '								',
  `label_dev` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table `ad_impressions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ad_impressions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ad_id` INT NOT NULL,
  `match_id` INT NOT NULL,
  `ad_impression_type_id` INT NOT NULL,
  `date` DATETIME NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = MyISAM;

CREATE INDEX `fk_ads_impression_ads1_idx` ON `ad_impressions` (`ad_id` ASC);

CREATE INDEX `fk_ads_impressions_ads_impression_types1_idx` ON `ad_impressions` (`ad_impression_type_id` ASC);

CREATE INDEX `fk_ad_impressions_ads1_idx` ON `ad_impressions` (`match_id` ASC);


-- -----------------------------------------------------
-- Table `ad_abuses`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ad_abuses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ad_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `date` DATETIME NOT NULL,
  `text` VARCHAR(300) NULL,
  PRIMARY KEY (`id`))
ENGINE = MyISAM;

CREATE INDEX `fk_reporting_ads1_idx` ON `ad_abuses` (`ad_id` ASC);

CREATE INDEX `fk_abuse_user1_idx` ON `ad_abuses` (`user_id` ASC);


-- -----------------------------------------------------
-- Table `ad_ratings`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ad_ratings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ad_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `value` INT NOT NULL,
  `date` DATETIME NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = MyISAM;

CREATE INDEX `fk_notation_ads1_idx` ON `ad_ratings` (`ad_id` ASC);

CREATE INDEX `fk_notation_user1_idx` ON `ad_ratings` (`user_id` ASC);


-- -----------------------------------------------------
-- Table `ad_action_links`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ad_action_links` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ad_actions_id_1` INT NOT NULL,
  `ad_actions_id_2` INT NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = MyISAM;

CREATE INDEX `fk_ad_action_links_ad_actions2_idx` ON `ad_action_links` (`ad_actions_id_1` ASC);

CREATE INDEX `fk_ad_action_links_ad_actions1_idx` ON `ad_action_links` (`ad_actions_id_2` ASC);


-- -----------------------------------------------------
-- Table `ad_images`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ad_images` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ad_id` INT NOT NULL,
  `path` VARCHAR(255) NOT NULL,
  `index` INT NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = MyISAM;

CREATE INDEX `fk_ads_images_ads1_idx` ON `ad_images` (`ad_id` ASC);


-- -----------------------------------------------------
-- Table `ad_keywords`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ad_keywords` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ad_id` INT NOT NULL,
  `label` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = MyISAM;

CREATE INDEX `fk_ads_keywords_ads1_idx` ON `ad_keywords` (`ad_id` ASC);


-- -----------------------------------------------------
-- Table `database_versions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `database_versions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = MyISAM;


-- -----------------------------------------------------
-- Table `discussion_messages`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `discussion_messages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `discussion_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `content` TEXT NOT NULL,
  `date` DATETIME NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = MyISAM;

CREATE INDEX `fk_messages_user1_idx` ON `discussion_messages` (`user_id` ASC);

CREATE INDEX `fk_discussion_messages_discussions1_idx` ON `discussion_messages` (`discussion_id` ASC);


-- -----------------------------------------------------
-- Table `user_linking_phone_calls`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_linking_phone_calls` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `date` DATETIME NOT NULL COMMENT '\n	',
  `user_linking_id` INT NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = MyISAM;

CREATE INDEX `fk_user_linking_phone_call_user_linking1_idx` ON `user_linking_phone_calls` (`user_linking_id` ASC);


-- -----------------------------------------------------
-- Table `ad_actions_ad_categories_parents`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `ad_actions_ad_categories_parents` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ad_action_id` INT NOT NULL,
  `ad_categories_parent_id` INT NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = MyISAM;

CREATE INDEX `fk_ad_actions_ad_categories_ad_actions1_idx` ON `ad_actions_ad_categories_parents` (`ad_action_id` ASC);

CREATE INDEX `fk_ad_actions_ad_parent_categories_ad_parent_categories1_idx` ON `ad_actions_ad_categories_parents` (`ad_categories_parent_id` ASC);


-- -----------------------------------------------------
-- Table `linking_process`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `linking_process` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_linkings_id` INT NOT NULL,
  `date_linking` DATETIME NULL,
  `date_viewed` DATETIME NULL,
  `date_accepted` DATETIME NULL,
  `date_denied` DATETIME NULL,
  PRIMARY KEY (`id`))
ENGINE = MyISAM;

CREATE INDEX `fk_linking_process_user_linkings1_idx` ON `linking_process` (`user_linkings_id` ASC);


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

-- -----------------------------------------------------
-- Data for table `user_statuses`
-- -----------------------------------------------------
START TRANSACTION;
INSERT INTO `user_statuses` (`id`, `label`, `label_dev`) VALUES (3, 'Particulier', 'individual');
INSERT INTO `user_statuses` (`id`, `label`, `label_dev`) VALUES (2, 'Pro', 'pro');
INSERT INTO `user_statuses` (`id`, `label`, `label_dev`) VALUES (1, 'Admin', 'admin');

COMMIT;


-- -----------------------------------------------------
-- Data for table `users`
-- -----------------------------------------------------
START TRANSACTION;
INSERT INTO `users` (`id`, `status_id`, `username`, `password`, `phone_number`, `mail`, `image_path`, `distance_max_linking_meters`, `distance_max_show_meters`, `offline_hour_start`, `offline_hour_end`, `date_temporary_offline_end`, `access_token`, `reset_token`, `date_subscribe`) VALUES (1, 1, 'admin', '11de4a293998d25cec386e7301fff2e8cdd6e0e555e2a0b5a3489465c23d9bbc', '0000000000', 'd.marchal@moobee.fr', '', 100, 200, '', '', '', '', NULL, '');

COMMIT;


-- -----------------------------------------------------
-- Data for table `ad_statuses`
-- -----------------------------------------------------
START TRANSACTION;
INSERT INTO `ad_statuses` (`id`, `label`, `label_dev`) VALUES (1, 'Activée', 'active');
INSERT INTO `ad_statuses` (`id`, `label`, `label_dev`) VALUES (2, 'Désactivée', 'inactive');
INSERT INTO `ad_statuses` (`id`, `label`, `label_dev`) VALUES (3, 'Supprimée', 'deleted');

COMMIT;


-- -----------------------------------------------------
-- Data for table `ad_category_durations`
-- -----------------------------------------------------
START TRANSACTION;
INSERT INTO `ad_category_durations` (`id`, `value_ms`, `label`, `label_dev`) VALUES (1, 3600000, 'Heures', 'hours');
INSERT INTO `ad_category_durations` (`id`, `value_ms`, `label`, `label_dev`) VALUES (2, 86400000, 'Jours', 'days');
INSERT INTO `ad_category_durations` (`id`, `value_ms`, `label`, `label_dev`) VALUES (3, 604800000, 'Semaines', 'weeks');

COMMIT;


-- -----------------------------------------------------
-- Data for table `ad_categories_parents`
-- -----------------------------------------------------
START TRANSACTION;
INSERT INTO `ad_categories_parents` (`id`, `label`) VALUES (1, 'Offre d’emploi / Services');
INSERT INTO `ad_categories_parents` (`id`, `label`) VALUES (2, 'Garde meuble');
INSERT INTO `ad_categories_parents` (`id`, `label`) VALUES (3, 'Alimentation');
INSERT INTO `ad_categories_parents` (`id`, `label`) VALUES (4, 'Véhicules');
INSERT INTO `ad_categories_parents` (`id`, `label`) VALUES (5, 'Transport');
INSERT INTO `ad_categories_parents` (`id`, `label`) VALUES (6, 'Immobilier');
INSERT INTO `ad_categories_parents` (`id`, `label`) VALUES (7, 'Multimédia');
INSERT INTO `ad_categories_parents` (`id`, `label`) VALUES (8, 'Maison');
INSERT INTO `ad_categories_parents` (`id`, `label`) VALUES (9, 'Loisir');
INSERT INTO `ad_categories_parents` (`id`, `label`) VALUES (10, 'Matériel professionnel');
INSERT INTO `ad_categories_parents` (`id`, `label`) VALUES (11, 'Animaux');
INSERT INTO `ad_categories_parents` (`id`, `label`) VALUES (12, 'Rencontre');
INSERT INTO `ad_categories_parents` (`id`, `label`) VALUES (13, 'Promos (-60 % mini)');

COMMIT;


-- -----------------------------------------------------
-- Data for table `ad_categories`
-- -----------------------------------------------------
START TRANSACTION;
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (1, 1, NULL, NULL, 'NULL', 'Aide aux personnes dépendantes', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (2, 1, NULL, NULL, 'NULL', 'Assistance administrative', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (3, 1, NULL, NULL, 'NULL', 'Assistance informatique', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (4, 1, NULL, NULL, 'NULL', 'Baby Sitting', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (5, 1, NULL, NULL, 'NULL', 'Coiffure', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (6, 1, NULL, NULL, 'NULL', 'Comptabilité', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (7, 1, NULL, NULL, 'NULL', 'Coup de main', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (8, 1, NULL, NULL, 'NULL', 'Cours particulier', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (9, 1, NULL, NULL, 'NULL', 'Cours de langue', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (10, 1, NULL, NULL, 'NULL', 'Crowdfunding', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (11, 1, NULL, NULL, 'NULL', 'Crowdsourcing', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (12, 1, NULL, NULL, 'NULL', 'Décoration', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (13, 1, NULL, NULL, 'NULL', 'Déménagement', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (14, 1, NULL, NULL, 'NULL', 'Electricité', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (15, 1, NULL, NULL, 'NULL', 'Financement', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (16, 2, NULL, NULL, 'NULL', 'Gardiennage', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (17, 2, NULL, NULL, 'NULL', 'Jardins partagés', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (18, 2, NULL, NULL, 'NULL', 'Co jardinage', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (19, 2, NULL, NULL, 'NULL', 'Maçonnerie', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (20, 2, NULL, NULL, 'NULL', 'Massage', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (21, 2, NULL, NULL, 'NULL', 'Ménage', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (22, 2, NULL, NULL, 'NULL', 'Peinture', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (23, 2, NULL, NULL, 'NULL', 'Pharmacie', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (24, 2, NULL, NULL, 'NULL', 'Photographie', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (25, 2, NULL, NULL, 'NULL', 'Plomberie', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (26, 2, NULL, NULL, 'NULL', 'Repassage', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (27, 2, NULL, NULL, 'NULL', 'Restaurant', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (28, 2, NULL, NULL, 'NULL', 'Restauration rapide', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (29, 2, NULL, NULL, 'NULL', 'Co Restauration à domicile', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (30, 2, NULL, NULL, 'NULL', 'Repas partagés', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (31, 2, NULL, NULL, 'NULL', 'Secrétariat', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (32, 2, NULL, NULL, 'NULL', 'Soins esthétiques', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (33, 2, NULL, NULL, 'NULL', 'Soutien scolaire', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (34, 3, NULL, NULL, 'NULL', 'Fruits', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (35, 3, NULL, NULL, 'NULL', 'Légumes', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (36, 3, NULL, NULL, 'NULL', 'Viandes', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (37, 3, NULL, NULL, 'NULL', 'Poissons', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (38, 3, NULL, NULL, 'NULL', 'Fromage', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (39, 3, NULL, NULL, 'NULL', 'Sucré', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (40, 3, NULL, NULL, 'NULL', 'Divers', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (41, 4, NULL, NULL, 'NULL', 'Voitures', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (42, 4, NULL, NULL, 'NULL', 'Voiture sans permis', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (43, 4, NULL, NULL, 'NULL', 'Motos, scooter, quad', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (44, 4, NULL, NULL, 'NULL', 'Vélos', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (45, 4, NULL, NULL, 'NULL', 'Utilitaires', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (46, 4, NULL, NULL, 'NULL', 'Utilitaires légers', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (47, 4, NULL, NULL, 'NULL', 'Caravaning', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (48, 4, NULL, NULL, 'NULL', 'Equipement caravaning', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (49, 4, NULL, NULL, 'NULL', 'Equipement auto', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (50, 4, NULL, NULL, 'NULL', 'Equipement moto', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (51, 4, NULL, NULL, 'NULL', 'Nautisme', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (52, 4, NULL, NULL, 'NULL', 'Equipement nautisme', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (53, 5, NULL, NULL, 'NULL', 'Co voiturage', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (54, 5, NULL, NULL, 'NULL', 'Colis voiturage', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (55, 5, NULL, NULL, 'NULL', 'Colis portage (train, avion, moto)', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (56, 5, NULL, NULL, 'NULL', 'Taxi', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (57, 5, NULL, NULL, 'NULL', 'Taxi partagé', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (58, 6, NULL, NULL, 'NULL', 'Studio', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (59, 6, NULL, NULL, 'NULL', 'F1 – F2 – F3 – F4 – F5 – F6 – F7', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (60, 6, NULL, NULL, 'NULL', 'Maison', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (61, 6, NULL, NULL, 'NULL', 'Immeuble', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (62, 6, NULL, NULL, 'NULL', 'Caravane', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (63, 6, NULL, NULL, 'NULL', 'Bureaux', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (64, 6, NULL, NULL, 'NULL', 'Commerces', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (65, 6, NULL, NULL, 'NULL', 'Colocation', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (66, 6, NULL, NULL, 'NULL', 'Location', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (67, 6, NULL, NULL, 'NULL', 'Viager', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (68, 6, NULL, NULL, 'NULL', 'Immobilier professionnel', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (69, 7, NULL, NULL, 'NULL', 'Console et jeux vidéo', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (70, 7, NULL, NULL, 'NULL', 'Image et son', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (71, 7, NULL, NULL, 'NULL', 'Informatique', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (72, 7, NULL, NULL, 'NULL', 'Téléphonie', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (73, 8, NULL, NULL, 'NULL', 'Ameublement', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (74, 8, NULL, NULL, 'NULL', 'Electroménager', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (75, 8, NULL, NULL, 'NULL', 'Arts de la table', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (76, 8, NULL, NULL, 'NULL', 'Décoration', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (77, 8, NULL, NULL, 'NULL', 'Linge de maison', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (78, 8, NULL, NULL, 'NULL', 'Bricolage', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (79, 8, NULL, NULL, 'NULL', 'Jardinage', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (80, 8, NULL, NULL, 'NULL', 'Vêtements', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (81, 8, NULL, NULL, 'NULL', 'Chaussures', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (82, 8, NULL, NULL, 'NULL', 'Accessoires et bagagerie', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (83, 8, NULL, NULL, 'NULL', 'Montres bijoux', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (84, 8, NULL, NULL, 'NULL', 'Equipement bébé', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (85, 8, NULL, NULL, 'NULL', 'Vêtements bébé', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (86, 8, NULL, NULL, 'NULL', 'Vêtements enfants', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (87, 8, NULL, NULL, 'NULL', 'Mobilier enfant', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (88, 9, NULL, NULL, 'NULL', 'Billetterie', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (89, 9, NULL, NULL, 'NULL', 'DVD/ Films', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (90, 9, NULL, NULL, 'NULL', 'CD/Musique', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (91, 9, NULL, NULL, 'NULL', 'Livres', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (92, 9, NULL, NULL, 'NULL', 'Animaux', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (93, 9, NULL, NULL, 'NULL', 'Vélos', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (94, 9, NULL, NULL, 'NULL', 'Sport', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (95, 9, NULL, NULL, 'NULL', 'Instrument de musique', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (96, 9, NULL, NULL, 'NULL', 'Collections', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (97, 9, NULL, NULL, 'NULL', 'Jeux et jouets', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (98, 9, NULL, NULL, 'NULL', 'Vins et gastronomie', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (99, 10, NULL, NULL, 'NULL', 'Transport – Manutention', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (100, 10, NULL, NULL, 'NULL', 'BTP – Chantier gros œuvre', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (101, 10, NULL, NULL, 'NULL', 'Matériel agricole', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (102, 10, NULL, NULL, 'NULL', 'Outillage – matériel 2nd œuvre', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (103, 10, NULL, NULL, 'NULL', 'Restauration hôtellerie', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (104, 10, NULL, NULL, 'NULL', 'Fournitures de bureau', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (105, 10, NULL, NULL, 'NULL', 'Commerces et marchés', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (106, 10, NULL, NULL, 'NULL', 'Matériel médical', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (107, 11, NULL, NULL, 'NULL', 'Animaux perdus/trouvés', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (108, 11, NULL, NULL, 'NULL', 'Chevaux', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (109, 11, NULL, NULL, 'NULL', 'Chiens', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (110, 11, NULL, NULL, 'NULL', 'Chats', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (111, 11, NULL, NULL, 'NULL', 'Garde', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (112, 11, NULL, NULL, 'NULL', 'Pension', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (113, 11, NULL, NULL, 'NULL', 'Promenade', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (114, 11, NULL, NULL, 'NULL', 'Autres', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (115, 12, NULL, NULL, 'NULL', 'Ami (e)', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (116, 12, NULL, NULL, 'NULL', 'Copain', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (117, 12, NULL, NULL, 'NULL', 'Jeux', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (118, 12, NULL, NULL, 'NULL', 'Groupe', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (119, 12, NULL, NULL, 'NULL', 'Sportif', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (120, 12, NULL, NULL, 'NULL', 'Littéraire', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (121, 12, NULL, NULL, 'NULL', 'Musique', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (122, 12, NULL, NULL, 'NULL', 'Association', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (123, 12, NULL, NULL, 'NULL', 'Professionnel', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (124, 12, NULL, NULL, 'NULL', 'Voyage', 1);
INSERT INTO `ad_categories` (`id`, `ad_parent_category_id`, `default_duration_unit_id`, `default_duration_factor`, `default_description`, `label`, `has_price`) VALUES (125, 12, NULL, NULL, 'NULL', '+++', 1);

COMMIT;


-- -----------------------------------------------------
-- Data for table `ad_actions`
-- -----------------------------------------------------
START TRANSACTION;
INSERT INTO `ad_actions` (`id`, `label`, `label_dev`, `can_be_offered`, `can_be_demanded`, `path_picto_marker`, `path_picto`, `color`, `order`) VALUES (1, 'À acheter', 'buy', 0, 1, 'img/POI-aacheter-c.png', '/img/picto-aacheter-blanc.png', '#0082CA', 1);
INSERT INTO `ad_actions` (`id`, `label`, `label_dev`, `can_be_offered`, `can_be_demanded`, `path_picto_marker`, `path_picto`, `color`, `order`) VALUES (2, 'À vendre', 'sell', 1, 0, 'img/POI-avendre-c.png', '/img/picto-avendre-blanc.png', '#F7123F', 2);
INSERT INTO `ad_actions` (`id`, `label`, `label_dev`, `can_be_offered`, `can_be_demanded`, `path_picto_marker`, `path_picto`, `color`, `order`) VALUES (3, 'Prêter', 'lend', 1, 0, 'img/POI-preter-c.png', '/img/picto-preter-blanc.png', '#00AF41', 3);
INSERT INTO `ad_actions` (`id`, `label`, `label_dev`, `can_be_offered`, `can_be_demanded`, `path_picto_marker`, `path_picto`, `color`, `order`) VALUES (4, 'Partager', 'share', 1, 1, 'img/POI-partager-c.png', '/img/picto-partager-blanc.png', '#544587', 4);
INSERT INTO `ad_actions` (`id`, `label`, `label_dev`, `can_be_offered`, `can_be_demanded`, `path_picto_marker`, `path_picto`, `color`, `order`) VALUES (5, 'Échanger', 'trade', 1, 1, 'img/POI-echanger-c.png', '/img/picto-echanger-blanc.png', '#009877', 5);
INSERT INTO `ad_actions` (`id`, `label`, `label_dev`, `can_be_offered`, `can_be_demanded`, `path_picto_marker`, `path_picto`, `color`, `order`) VALUES (6, 'Trouvé / Perdu', 'found_lost', 1, 1, 'img/POI-trouver-c.png', '/img/picto-trouver-blanc.png', '#FF5A00', 6);
INSERT INTO `ad_actions` (`id`, `label`, `label_dev`, `can_be_offered`, `can_be_demanded`, `path_picto_marker`, `path_picto`, `color`, `order`) VALUES (7, 'Louer', 'rent', 1, 1, 'img/POI-louer-c.png', '/img/picto-louer-blanc.png', '#004197', 7);
INSERT INTO `ad_actions` (`id`, `label`, `label_dev`, `can_be_offered`, `can_be_demanded`, `path_picto_marker`, `path_picto`, `color`, `order`) VALUES (8, 'Rencontrer', 'meet', 1, 1, 'img/POI-rencontrer-c.png', '/img/picto-rencontrer-blanc.png', '#FFAA61', 8);
INSERT INTO `ad_actions` (`id`, `label`, `label_dev`, `can_be_offered`, `can_be_demanded`, `path_picto_marker`, `path_picto`, `color`, `order`) VALUES (9, 'Promos', 'promo', 1, 1, 'img/POI-promo-c.png', '/img/picto-promo-blanc.png', '#8C0022', 9);
INSERT INTO `ad_actions` (`id`, `label`, `label_dev`, `can_be_offered`, `can_be_demanded`, `path_picto_marker`, `path_picto`, `color`, `order`) VALUES (10, 'Services', 'services', 1, 1, 'img/POI-services-c.png', '/img/picto-services-blanc.png', '#F295CD', 10);

COMMIT;


-- -----------------------------------------------------
-- Data for table `user_linking_statuses`
-- -----------------------------------------------------
START TRANSACTION;
INSERT INTO `user_linking_statuses` (`id`, `label`, `label_dev`) VALUES (1, 'Acceptée', 'accepted');
INSERT INTO `user_linking_statuses` (`id`, `label`, `label_dev`) VALUES (2, 'Refusée', 'denied');
INSERT INTO `user_linking_statuses` (`id`, `label`, `label_dev`) VALUES (3, 'En attente', 'pending');
INSERT INTO `user_linking_statuses` (`id`, `label`, `label_dev`) VALUES (4, 'Vue', 'viewed');

COMMIT;


-- -----------------------------------------------------
-- Data for table `ad_impression_types`
-- -----------------------------------------------------
START TRANSACTION;
INSERT INTO `ad_impression_types` (`id`, `label`, `label_dev`) VALUES (1, 'Notification', 'notification');
INSERT INTO `ad_impression_types` (`id`, `label`, `label_dev`) VALUES (2, 'Détail', 'detail');

COMMIT;


-- -----------------------------------------------------
-- Data for table `database_versions`
-- -----------------------------------------------------
START TRANSACTION;
INSERT INTO `database_versions` (`id`, `label`) VALUES (1, 'v9');

COMMIT;

