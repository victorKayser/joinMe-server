INSERT INTO `database_versions` (`label`) VALUES ('v34');
ALTER TABLE `ad_categories` ADD `order` INT NOT NULL AFTER `has_price` ;
