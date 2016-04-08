INSERT INTO `database_versions` (`label`) VALUES ('v29');
ALTER TABLE `discussion_messages` ADD `view_applicant` TINYINT NOT NULL AFTER `is_image` ,
ADD `view_receiver` TINYINT NOT NULL AFTER `view_applicant` ;


-- SELECT *
-- FROM ads, user_linkings, discussion_messages
-- WHERE user_linkings.discussion_id = discussion_messages.id
-- AND (
-- (
-- user_linkings.id_applicant
-- IN (
--
-- SELECT ads.id
-- FROM ads
-- WHERE ads.user_id =42
-- )
-- AND discussion_messages.view_applicant =
-- FALSE
-- )
-- OR (
-- user_linkings.id_receiver
-- IN (
--
-- SELECT ads.id
-- FROM ads
-- WHERE ads.user_id =42
-- )
-- AND discussion_messages.view_receiver =
-- FALSE
-- )
-- )
