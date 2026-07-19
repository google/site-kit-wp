-- MySQL dump 10.19  Distrib 10.3.39-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: wordpress
-- ------------------------------------------------------
-- Server version	10.3.39-MariaDB-1:10.3.39+maria~ubu2004

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `wp_actionscheduler_actions`
--

DROP TABLE IF EXISTS `wp_actionscheduler_actions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_actionscheduler_actions` (
  `action_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `hook` varchar(191) NOT NULL,
  `status` varchar(20) NOT NULL,
  `scheduled_date_gmt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `scheduled_date_local` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `args` varchar(191) DEFAULT NULL,
  `schedule` longtext DEFAULT NULL,
  `group_id` bigint(20) unsigned NOT NULL DEFAULT 0,
  `attempts` int(11) NOT NULL DEFAULT 0,
  `last_attempt_gmt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `last_attempt_local` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `claim_id` bigint(20) unsigned NOT NULL DEFAULT 0,
  `extended_args` varchar(8000) DEFAULT NULL,
  PRIMARY KEY (`action_id`),
  KEY `hook` (`hook`),
  KEY `status` (`status`),
  KEY `scheduled_date_gmt` (`scheduled_date_gmt`),
  KEY `args` (`args`),
  KEY `group_id` (`group_id`),
  KEY `last_attempt_gmt` (`last_attempt_gmt`),
  KEY `claim_id` (`claim_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_actionscheduler_actions`
--

LOCK TABLES `wp_actionscheduler_actions` WRITE;
/*!40000 ALTER TABLE `wp_actionscheduler_actions` DISABLE KEYS */;
INSERT INTO `wp_actionscheduler_actions` VALUES (9,'action_scheduler/migration_hook','pending','2026-07-19 16:39:41','2026-07-19 16:39:41','[]','O:30:\"ActionScheduler_SimpleSchedule\":2:{s:22:\"\0*\0scheduled_timestamp\";i:1784479181;s:41:\"\0ActionScheduler_SimpleSchedule\0timestamp\";i:1784479181;}',1,0,'0000-00-00 00:00:00','0000-00-00 00:00:00',0,NULL);
/*!40000 ALTER TABLE `wp_actionscheduler_actions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_actionscheduler_claims`
--

DROP TABLE IF EXISTS `wp_actionscheduler_claims`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_actionscheduler_claims` (
  `claim_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `date_created_gmt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`claim_id`),
  KEY `date_created_gmt` (`date_created_gmt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_actionscheduler_claims`
--

LOCK TABLES `wp_actionscheduler_claims` WRITE;
/*!40000 ALTER TABLE `wp_actionscheduler_claims` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_actionscheduler_claims` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_actionscheduler_groups`
--

DROP TABLE IF EXISTS `wp_actionscheduler_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_actionscheduler_groups` (
  `group_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(255) NOT NULL,
  PRIMARY KEY (`group_id`),
  KEY `slug` (`slug`(191))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_actionscheduler_groups`
--

LOCK TABLES `wp_actionscheduler_groups` WRITE;
/*!40000 ALTER TABLE `wp_actionscheduler_groups` DISABLE KEYS */;
INSERT INTO `wp_actionscheduler_groups` VALUES (1,'action-scheduler-migration');
/*!40000 ALTER TABLE `wp_actionscheduler_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_actionscheduler_logs`
--

DROP TABLE IF EXISTS `wp_actionscheduler_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_actionscheduler_logs` (
  `log_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `action_id` bigint(20) unsigned NOT NULL,
  `message` text NOT NULL,
  `log_date_gmt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `log_date_local` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`log_id`),
  KEY `action_id` (`action_id`),
  KEY `log_date_gmt` (`log_date_gmt`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_actionscheduler_logs`
--

LOCK TABLES `wp_actionscheduler_logs` WRITE;
/*!40000 ALTER TABLE `wp_actionscheduler_logs` DISABLE KEYS */;
INSERT INTO `wp_actionscheduler_logs` VALUES (1,9,'action created','2026-07-19 16:38:41','2026-07-19 16:38:41');
/*!40000 ALTER TABLE `wp_actionscheduler_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_commentmeta`
--

DROP TABLE IF EXISTS `wp_commentmeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_commentmeta` (
  `meta_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `comment_id` bigint(20) unsigned NOT NULL DEFAULT 0,
  `meta_key` varchar(255) DEFAULT NULL,
  `meta_value` longtext DEFAULT NULL,
  PRIMARY KEY (`meta_id`),
  KEY `comment_id` (`comment_id`),
  KEY `meta_key` (`meta_key`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_commentmeta`
--

LOCK TABLES `wp_commentmeta` WRITE;
/*!40000 ALTER TABLE `wp_commentmeta` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_commentmeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_comments`
--

DROP TABLE IF EXISTS `wp_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_comments` (
  `comment_ID` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `comment_post_ID` bigint(20) unsigned NOT NULL DEFAULT 0,
  `comment_author` tinytext NOT NULL,
  `comment_author_email` varchar(100) NOT NULL DEFAULT '',
  `comment_author_url` varchar(200) NOT NULL DEFAULT '',
  `comment_author_IP` varchar(100) NOT NULL DEFAULT '',
  `comment_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `comment_date_gmt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `comment_content` text NOT NULL,
  `comment_karma` int(11) NOT NULL DEFAULT 0,
  `comment_approved` varchar(20) NOT NULL DEFAULT '1',
  `comment_agent` varchar(255) NOT NULL DEFAULT '',
  `comment_type` varchar(20) NOT NULL DEFAULT '',
  `comment_parent` bigint(20) unsigned NOT NULL DEFAULT 0,
  `user_id` bigint(20) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`comment_ID`),
  KEY `comment_post_ID` (`comment_post_ID`),
  KEY `comment_approved_date_gmt` (`comment_approved`,`comment_date_gmt`),
  KEY `comment_date_gmt` (`comment_date_gmt`),
  KEY `comment_parent` (`comment_parent`),
  KEY `comment_author_email` (`comment_author_email`(10)),
  KEY `woo_idx_comment_type` (`comment_type`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_comments`
--

LOCK TABLES `wp_comments` WRITE;
/*!40000 ALTER TABLE `wp_comments` DISABLE KEYS */;
INSERT INTO `wp_comments` VALUES (1,1,'A WordPress Commenter','wapuu@wordpress.example','https://wordpress.org/','','2025-01-01 00:00:00','2025-01-01 00:00:00','Hi, this is a comment.\nTo get started with moderating, editing, and deleting comments, please visit the Comments screen in the dashboard.\nCommenter avatars come from <a href=\"https://gravatar.com\">Gravatar</a>.',0,'1','','',0,0);
/*!40000 ALTER TABLE `wp_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_links`
--

DROP TABLE IF EXISTS `wp_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_links` (
  `link_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `link_url` varchar(255) NOT NULL DEFAULT '',
  `link_name` varchar(255) NOT NULL DEFAULT '',
  `link_image` varchar(255) NOT NULL DEFAULT '',
  `link_target` varchar(25) NOT NULL DEFAULT '',
  `link_description` varchar(255) NOT NULL DEFAULT '',
  `link_visible` varchar(20) NOT NULL DEFAULT 'Y',
  `link_owner` bigint(20) unsigned NOT NULL DEFAULT 1,
  `link_rating` int(11) NOT NULL DEFAULT 0,
  `link_updated` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `link_rel` varchar(255) NOT NULL DEFAULT '',
  `link_notes` mediumtext NOT NULL,
  `link_rss` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`link_id`),
  KEY `link_visible` (`link_visible`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_links`
--

LOCK TABLES `wp_links` WRITE;
/*!40000 ALTER TABLE `wp_links` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_links` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_options`
--

DROP TABLE IF EXISTS `wp_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_options` (
  `option_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `option_name` varchar(191) NOT NULL DEFAULT '',
  `option_value` longtext NOT NULL,
  `autoload` varchar(20) NOT NULL DEFAULT 'yes',
  PRIMARY KEY (`option_id`),
  UNIQUE KEY `option_name` (`option_name`)
) ENGINE=InnoDB AUTO_INCREMENT=272 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_options`
--

LOCK TABLES `wp_options` WRITE;
/*!40000 ALTER TABLE `wp_options` DISABLE KEYS */;
INSERT INTO `wp_options` VALUES (1,'siteurl','http://localhost:9002','yes'),(2,'home','http://localhost:9002','yes'),(3,'blogname','Google Site Kit Dev','yes'),(4,'blogdescription','Just another WordPress site','yes'),(5,'users_can_register','0','yes'),(6,'admin_email','test@test.com','yes'),(7,'start_of_week','1','yes'),(8,'use_balanceTags','0','yes'),(9,'use_smilies','1','yes'),(10,'require_name_email','1','yes'),(11,'comments_notify','1','yes'),(12,'posts_per_rss','10','yes'),(13,'rss_use_excerpt','0','yes'),(14,'mailserver_url','mail.example.com','yes'),(15,'mailserver_login','login@example.com','yes'),(16,'mailserver_pass','password','yes'),(17,'mailserver_port','110','yes'),(18,'default_category','1','yes'),(19,'default_comment_status','open','yes'),(20,'default_ping_status','open','yes'),(21,'default_pingback_flag','1','yes'),(22,'posts_per_page','10','yes'),(23,'date_format','F j, Y','yes'),(24,'time_format','g:i a','yes'),(25,'links_updated_date_format','F j, Y g:i a','yes'),(26,'comment_moderation','0','yes'),(27,'moderation_notify','1','yes'),(28,'permalink_structure','/%postname%','yes'),(29,'rewrite_rules','a:154:{s:24:\"^wc-auth/v([1]{1})/(.*)?\";s:63:\"index.php?wc-auth-version=$matches[1]&wc-auth-route=$matches[2]\";s:22:\"^wc-api/v([1-3]{1})/?$\";s:51:\"index.php?wc-api-version=$matches[1]&wc-api-route=/\";s:24:\"^wc-api/v([1-3]{1})(.*)?\";s:61:\"index.php?wc-api-version=$matches[1]&wc-api-route=$matches[2]\";s:7:\"shop/?$\";s:27:\"index.php?post_type=product\";s:37:\"shop/feed/(feed|rdf|rss|rss2|atom)/?$\";s:44:\"index.php?post_type=product&feed=$matches[1]\";s:32:\"shop/(feed|rdf|rss|rss2|atom)/?$\";s:44:\"index.php?post_type=product&feed=$matches[1]\";s:24:\"shop/page/([0-9]{1,})/?$\";s:45:\"index.php?post_type=product&paged=$matches[1]\";s:11:\"^wp-json/?$\";s:22:\"index.php?rest_route=/\";s:14:\"^wp-json/(.*)?\";s:33:\"index.php?rest_route=/$matches[1]\";s:21:\"^index.php/wp-json/?$\";s:22:\"index.php?rest_route=/\";s:24:\"^index.php/wp-json/(.*)?\";s:33:\"index.php?rest_route=/$matches[1]\";s:47:\"category/(.+?)/feed/(feed|rdf|rss|rss2|atom)/?$\";s:52:\"index.php?category_name=$matches[1]&feed=$matches[2]\";s:42:\"category/(.+?)/(feed|rdf|rss|rss2|atom)/?$\";s:52:\"index.php?category_name=$matches[1]&feed=$matches[2]\";s:23:\"category/(.+?)/embed/?$\";s:46:\"index.php?category_name=$matches[1]&embed=true\";s:35:\"category/(.+?)/page/?([0-9]{1,})/?$\";s:53:\"index.php?category_name=$matches[1]&paged=$matches[2]\";s:32:\"category/(.+?)/wc-api(/(.*))?/?$\";s:54:\"index.php?category_name=$matches[1]&wc-api=$matches[3]\";s:17:\"category/(.+?)/?$\";s:35:\"index.php?category_name=$matches[1]\";s:44:\"tag/([^/]+)/feed/(feed|rdf|rss|rss2|atom)/?$\";s:42:\"index.php?tag=$matches[1]&feed=$matches[2]\";s:39:\"tag/([^/]+)/(feed|rdf|rss|rss2|atom)/?$\";s:42:\"index.php?tag=$matches[1]&feed=$matches[2]\";s:20:\"tag/([^/]+)/embed/?$\";s:36:\"index.php?tag=$matches[1]&embed=true\";s:32:\"tag/([^/]+)/page/?([0-9]{1,})/?$\";s:43:\"index.php?tag=$matches[1]&paged=$matches[2]\";s:29:\"tag/([^/]+)/wc-api(/(.*))?/?$\";s:44:\"index.php?tag=$matches[1]&wc-api=$matches[3]\";s:14:\"tag/([^/]+)/?$\";s:25:\"index.php?tag=$matches[1]\";s:45:\"type/([^/]+)/feed/(feed|rdf|rss|rss2|atom)/?$\";s:50:\"index.php?post_format=$matches[1]&feed=$matches[2]\";s:40:\"type/([^/]+)/(feed|rdf|rss|rss2|atom)/?$\";s:50:\"index.php?post_format=$matches[1]&feed=$matches[2]\";s:21:\"type/([^/]+)/embed/?$\";s:44:\"index.php?post_format=$matches[1]&embed=true\";s:33:\"type/([^/]+)/page/?([0-9]{1,})/?$\";s:51:\"index.php?post_format=$matches[1]&paged=$matches[2]\";s:15:\"type/([^/]+)/?$\";s:33:\"index.php?post_format=$matches[1]\";s:55:\"product-category/(.+?)/feed/(feed|rdf|rss|rss2|atom)/?$\";s:50:\"index.php?product_cat=$matches[1]&feed=$matches[2]\";s:50:\"product-category/(.+?)/(feed|rdf|rss|rss2|atom)/?$\";s:50:\"index.php?product_cat=$matches[1]&feed=$matches[2]\";s:31:\"product-category/(.+?)/embed/?$\";s:44:\"index.php?product_cat=$matches[1]&embed=true\";s:43:\"product-category/(.+?)/page/?([0-9]{1,})/?$\";s:51:\"index.php?product_cat=$matches[1]&paged=$matches[2]\";s:25:\"product-category/(.+?)/?$\";s:33:\"index.php?product_cat=$matches[1]\";s:52:\"product-tag/([^/]+)/feed/(feed|rdf|rss|rss2|atom)/?$\";s:50:\"index.php?product_tag=$matches[1]&feed=$matches[2]\";s:47:\"product-tag/([^/]+)/(feed|rdf|rss|rss2|atom)/?$\";s:50:\"index.php?product_tag=$matches[1]&feed=$matches[2]\";s:28:\"product-tag/([^/]+)/embed/?$\";s:44:\"index.php?product_tag=$matches[1]&embed=true\";s:40:\"product-tag/([^/]+)/page/?([0-9]{1,})/?$\";s:51:\"index.php?product_tag=$matches[1]&paged=$matches[2]\";s:22:\"product-tag/([^/]+)/?$\";s:33:\"index.php?product_tag=$matches[1]\";s:35:\"product/[^/]+/attachment/([^/]+)/?$\";s:32:\"index.php?attachment=$matches[1]\";s:45:\"product/[^/]+/attachment/([^/]+)/trackback/?$\";s:37:\"index.php?attachment=$matches[1]&tb=1\";s:65:\"product/[^/]+/attachment/([^/]+)/feed/(feed|rdf|rss|rss2|atom)/?$\";s:49:\"index.php?attachment=$matches[1]&feed=$matches[2]\";s:60:\"product/[^/]+/attachment/([^/]+)/(feed|rdf|rss|rss2|atom)/?$\";s:49:\"index.php?attachment=$matches[1]&feed=$matches[2]\";s:60:\"product/[^/]+/attachment/([^/]+)/comment-page-([0-9]{1,})/?$\";s:50:\"index.php?attachment=$matches[1]&cpage=$matches[2]\";s:41:\"product/[^/]+/attachment/([^/]+)/embed/?$\";s:43:\"index.php?attachment=$matches[1]&embed=true\";s:24:\"product/([^/]+)/embed/?$\";s:40:\"index.php?product=$matches[1]&embed=true\";s:28:\"product/([^/]+)/trackback/?$\";s:34:\"index.php?product=$matches[1]&tb=1\";s:48:\"product/([^/]+)/feed/(feed|rdf|rss|rss2|atom)/?$\";s:46:\"index.php?product=$matches[1]&feed=$matches[2]\";s:43:\"product/([^/]+)/(feed|rdf|rss|rss2|atom)/?$\";s:46:\"index.php?product=$matches[1]&feed=$matches[2]\";s:36:\"product/([^/]+)/page/?([0-9]{1,})/?$\";s:47:\"index.php?product=$matches[1]&paged=$matches[2]\";s:43:\"product/([^/]+)/comment-page-([0-9]{1,})/?$\";s:47:\"index.php?product=$matches[1]&cpage=$matches[2]\";s:33:\"product/([^/]+)/wc-api(/(.*))?/?$\";s:48:\"index.php?product=$matches[1]&wc-api=$matches[3]\";s:39:\"product/[^/]+/([^/]+)/wc-api(/(.*))?/?$\";s:51:\"index.php?attachment=$matches[1]&wc-api=$matches[3]\";s:50:\"product/[^/]+/attachment/([^/]+)/wc-api(/(.*))?/?$\";s:51:\"index.php?attachment=$matches[1]&wc-api=$matches[3]\";s:32:\"product/([^/]+)(?:/([0-9]+))?/?$\";s:46:\"index.php?product=$matches[1]&page=$matches[2]\";s:24:\"product/[^/]+/([^/]+)/?$\";s:32:\"index.php?attachment=$matches[1]\";s:34:\"product/[^/]+/([^/]+)/trackback/?$\";s:37:\"index.php?attachment=$matches[1]&tb=1\";s:54:\"product/[^/]+/([^/]+)/feed/(feed|rdf|rss|rss2|atom)/?$\";s:49:\"index.php?attachment=$matches[1]&feed=$matches[2]\";s:49:\"product/[^/]+/([^/]+)/(feed|rdf|rss|rss2|atom)/?$\";s:49:\"index.php?attachment=$matches[1]&feed=$matches[2]\";s:49:\"product/[^/]+/([^/]+)/comment-page-([0-9]{1,})/?$\";s:50:\"index.php?attachment=$matches[1]&cpage=$matches[2]\";s:30:\"product/[^/]+/([^/]+)/embed/?$\";s:43:\"index.php?attachment=$matches[1]&embed=true\";s:12:\"robots\\.txt$\";s:18:\"index.php?robots=1\";s:48:\".*wp-(atom|rdf|rss|rss2|feed|commentsrss2)\\.php$\";s:18:\"index.php?feed=old\";s:20:\".*wp-app\\.php(/.*)?$\";s:19:\"index.php?error=403\";s:18:\".*wp-register.php$\";s:23:\"index.php?register=true\";s:32:\"feed/(feed|rdf|rss|rss2|atom)/?$\";s:27:\"index.php?&feed=$matches[1]\";s:27:\"(feed|rdf|rss|rss2|atom)/?$\";s:27:\"index.php?&feed=$matches[1]\";s:8:\"embed/?$\";s:21:\"index.php?&embed=true\";s:20:\"page/?([0-9]{1,})/?$\";s:28:\"index.php?&paged=$matches[1]\";s:17:\"wc-api(/(.*))?/?$\";s:29:\"index.php?&wc-api=$matches[2]\";s:41:\"comments/feed/(feed|rdf|rss|rss2|atom)/?$\";s:42:\"index.php?&feed=$matches[1]&withcomments=1\";s:36:\"comments/(feed|rdf|rss|rss2|atom)/?$\";s:42:\"index.php?&feed=$matches[1]&withcomments=1\";s:17:\"comments/embed/?$\";s:21:\"index.php?&embed=true\";s:26:\"comments/wc-api(/(.*))?/?$\";s:29:\"index.php?&wc-api=$matches[2]\";s:44:\"search/(.+)/feed/(feed|rdf|rss|rss2|atom)/?$\";s:40:\"index.php?s=$matches[1]&feed=$matches[2]\";s:39:\"search/(.+)/(feed|rdf|rss|rss2|atom)/?$\";s:40:\"index.php?s=$matches[1]&feed=$matches[2]\";s:20:\"search/(.+)/embed/?$\";s:34:\"index.php?s=$matches[1]&embed=true\";s:32:\"search/(.+)/page/?([0-9]{1,})/?$\";s:41:\"index.php?s=$matches[1]&paged=$matches[2]\";s:29:\"search/(.+)/wc-api(/(.*))?/?$\";s:42:\"index.php?s=$matches[1]&wc-api=$matches[3]\";s:14:\"search/(.+)/?$\";s:23:\"index.php?s=$matches[1]\";s:47:\"author/([^/]+)/feed/(feed|rdf|rss|rss2|atom)/?$\";s:50:\"index.php?author_name=$matches[1]&feed=$matches[2]\";s:42:\"author/([^/]+)/(feed|rdf|rss|rss2|atom)/?$\";s:50:\"index.php?author_name=$matches[1]&feed=$matches[2]\";s:23:\"author/([^/]+)/embed/?$\";s:44:\"index.php?author_name=$matches[1]&embed=true\";s:35:\"author/([^/]+)/page/?([0-9]{1,})/?$\";s:51:\"index.php?author_name=$matches[1]&paged=$matches[2]\";s:32:\"author/([^/]+)/wc-api(/(.*))?/?$\";s:52:\"index.php?author_name=$matches[1]&wc-api=$matches[3]\";s:17:\"author/([^/]+)/?$\";s:33:\"index.php?author_name=$matches[1]\";s:69:\"([0-9]{4})/([0-9]{1,2})/([0-9]{1,2})/feed/(feed|rdf|rss|rss2|atom)/?$\";s:80:\"index.php?year=$matches[1]&monthnum=$matches[2]&day=$matches[3]&feed=$matches[4]\";s:64:\"([0-9]{4})/([0-9]{1,2})/([0-9]{1,2})/(feed|rdf|rss|rss2|atom)/?$\";s:80:\"index.php?year=$matches[1]&monthnum=$matches[2]&day=$matches[3]&feed=$matches[4]\";s:45:\"([0-9]{4})/([0-9]{1,2})/([0-9]{1,2})/embed/?$\";s:74:\"index.php?year=$matches[1]&monthnum=$matches[2]&day=$matches[3]&embed=true\";s:57:\"([0-9]{4})/([0-9]{1,2})/([0-9]{1,2})/page/?([0-9]{1,})/?$\";s:81:\"index.php?year=$matches[1]&monthnum=$matches[2]&day=$matches[3]&paged=$matches[4]\";s:54:\"([0-9]{4})/([0-9]{1,2})/([0-9]{1,2})/wc-api(/(.*))?/?$\";s:82:\"index.php?year=$matches[1]&monthnum=$matches[2]&day=$matches[3]&wc-api=$matches[5]\";s:39:\"([0-9]{4})/([0-9]{1,2})/([0-9]{1,2})/?$\";s:63:\"index.php?year=$matches[1]&monthnum=$matches[2]&day=$matches[3]\";s:56:\"([0-9]{4})/([0-9]{1,2})/feed/(feed|rdf|rss|rss2|atom)/?$\";s:64:\"index.php?year=$matches[1]&monthnum=$matches[2]&feed=$matches[3]\";s:51:\"([0-9]{4})/([0-9]{1,2})/(feed|rdf|rss|rss2|atom)/?$\";s:64:\"index.php?year=$matches[1]&monthnum=$matches[2]&feed=$matches[3]\";s:32:\"([0-9]{4})/([0-9]{1,2})/embed/?$\";s:58:\"index.php?year=$matches[1]&monthnum=$matches[2]&embed=true\";s:44:\"([0-9]{4})/([0-9]{1,2})/page/?([0-9]{1,})/?$\";s:65:\"index.php?year=$matches[1]&monthnum=$matches[2]&paged=$matches[3]\";s:41:\"([0-9]{4})/([0-9]{1,2})/wc-api(/(.*))?/?$\";s:66:\"index.php?year=$matches[1]&monthnum=$matches[2]&wc-api=$matches[4]\";s:26:\"([0-9]{4})/([0-9]{1,2})/?$\";s:47:\"index.php?year=$matches[1]&monthnum=$matches[2]\";s:43:\"([0-9]{4})/feed/(feed|rdf|rss|rss2|atom)/?$\";s:43:\"index.php?year=$matches[1]&feed=$matches[2]\";s:38:\"([0-9]{4})/(feed|rdf|rss|rss2|atom)/?$\";s:43:\"index.php?year=$matches[1]&feed=$matches[2]\";s:19:\"([0-9]{4})/embed/?$\";s:37:\"index.php?year=$matches[1]&embed=true\";s:31:\"([0-9]{4})/page/?([0-9]{1,})/?$\";s:44:\"index.php?year=$matches[1]&paged=$matches[2]\";s:28:\"([0-9]{4})/wc-api(/(.*))?/?$\";s:45:\"index.php?year=$matches[1]&wc-api=$matches[3]\";s:13:\"([0-9]{4})/?$\";s:26:\"index.php?year=$matches[1]\";s:27:\".?.+?/attachment/([^/]+)/?$\";s:32:\"index.php?attachment=$matches[1]\";s:37:\".?.+?/attachment/([^/]+)/trackback/?$\";s:37:\"index.php?attachment=$matches[1]&tb=1\";s:57:\".?.+?/attachment/([^/]+)/feed/(feed|rdf|rss|rss2|atom)/?$\";s:49:\"index.php?attachment=$matches[1]&feed=$matches[2]\";s:52:\".?.+?/attachment/([^/]+)/(feed|rdf|rss|rss2|atom)/?$\";s:49:\"index.php?attachment=$matches[1]&feed=$matches[2]\";s:52:\".?.+?/attachment/([^/]+)/comment-page-([0-9]{1,})/?$\";s:50:\"index.php?attachment=$matches[1]&cpage=$matches[2]\";s:33:\".?.+?/attachment/([^/]+)/embed/?$\";s:43:\"index.php?attachment=$matches[1]&embed=true\";s:16:\"(.?.+?)/embed/?$\";s:41:\"index.php?pagename=$matches[1]&embed=true\";s:20:\"(.?.+?)/trackback/?$\";s:35:\"index.php?pagename=$matches[1]&tb=1\";s:40:\"(.?.+?)/feed/(feed|rdf|rss|rss2|atom)/?$\";s:47:\"index.php?pagename=$matches[1]&feed=$matches[2]\";s:35:\"(.?.+?)/(feed|rdf|rss|rss2|atom)/?$\";s:47:\"index.php?pagename=$matches[1]&feed=$matches[2]\";s:28:\"(.?.+?)/page/?([0-9]{1,})/?$\";s:48:\"index.php?pagename=$matches[1]&paged=$matches[2]\";s:35:\"(.?.+?)/comment-page-([0-9]{1,})/?$\";s:48:\"index.php?pagename=$matches[1]&cpage=$matches[2]\";s:25:\"(.?.+?)/wc-api(/(.*))?/?$\";s:49:\"index.php?pagename=$matches[1]&wc-api=$matches[3]\";s:28:\"(.?.+?)/order-pay(/(.*))?/?$\";s:52:\"index.php?pagename=$matches[1]&order-pay=$matches[3]\";s:33:\"(.?.+?)/order-received(/(.*))?/?$\";s:57:\"index.php?pagename=$matches[1]&order-received=$matches[3]\";s:25:\"(.?.+?)/orders(/(.*))?/?$\";s:49:\"index.php?pagename=$matches[1]&orders=$matches[3]\";s:29:\"(.?.+?)/view-order(/(.*))?/?$\";s:53:\"index.php?pagename=$matches[1]&view-order=$matches[3]\";s:28:\"(.?.+?)/downloads(/(.*))?/?$\";s:52:\"index.php?pagename=$matches[1]&downloads=$matches[3]\";s:31:\"(.?.+?)/edit-account(/(.*))?/?$\";s:55:\"index.php?pagename=$matches[1]&edit-account=$matches[3]\";s:31:\"(.?.+?)/edit-address(/(.*))?/?$\";s:55:\"index.php?pagename=$matches[1]&edit-address=$matches[3]\";s:34:\"(.?.+?)/payment-methods(/(.*))?/?$\";s:58:\"index.php?pagename=$matches[1]&payment-methods=$matches[3]\";s:32:\"(.?.+?)/lost-password(/(.*))?/?$\";s:56:\"index.php?pagename=$matches[1]&lost-password=$matches[3]\";s:34:\"(.?.+?)/customer-logout(/(.*))?/?$\";s:58:\"index.php?pagename=$matches[1]&customer-logout=$matches[3]\";s:37:\"(.?.+?)/add-payment-method(/(.*))?/?$\";s:61:\"index.php?pagename=$matches[1]&add-payment-method=$matches[3]\";s:40:\"(.?.+?)/delete-payment-method(/(.*))?/?$\";s:64:\"index.php?pagename=$matches[1]&delete-payment-method=$matches[3]\";s:45:\"(.?.+?)/set-default-payment-method(/(.*))?/?$\";s:69:\"index.php?pagename=$matches[1]&set-default-payment-method=$matches[3]\";s:31:\".?.+?/([^/]+)/wc-api(/(.*))?/?$\";s:51:\"index.php?attachment=$matches[1]&wc-api=$matches[3]\";s:42:\".?.+?/attachment/([^/]+)/wc-api(/(.*))?/?$\";s:51:\"index.php?attachment=$matches[1]&wc-api=$matches[3]\";s:24:\"(.?.+?)(?:/([0-9]+))?/?$\";s:47:\"index.php?pagename=$matches[1]&page=$matches[2]\";s:27:\"[^/]+/attachment/([^/]+)/?$\";s:32:\"index.php?attachment=$matches[1]\";s:37:\"[^/]+/attachment/([^/]+)/trackback/?$\";s:37:\"index.php?attachment=$matches[1]&tb=1\";s:57:\"[^/]+/attachment/([^/]+)/feed/(feed|rdf|rss|rss2|atom)/?$\";s:49:\"index.php?attachment=$matches[1]&feed=$matches[2]\";s:52:\"[^/]+/attachment/([^/]+)/(feed|rdf|rss|rss2|atom)/?$\";s:49:\"index.php?attachment=$matches[1]&feed=$matches[2]\";s:52:\"[^/]+/attachment/([^/]+)/comment-page-([0-9]{1,})/?$\";s:50:\"index.php?attachment=$matches[1]&cpage=$matches[2]\";s:33:\"[^/]+/attachment/([^/]+)/embed/?$\";s:43:\"index.php?attachment=$matches[1]&embed=true\";s:16:\"([^/]+)/embed/?$\";s:37:\"index.php?name=$matches[1]&embed=true\";s:20:\"([^/]+)/trackback/?$\";s:31:\"index.php?name=$matches[1]&tb=1\";s:40:\"([^/]+)/feed/(feed|rdf|rss|rss2|atom)/?$\";s:43:\"index.php?name=$matches[1]&feed=$matches[2]\";s:35:\"([^/]+)/(feed|rdf|rss|rss2|atom)/?$\";s:43:\"index.php?name=$matches[1]&feed=$matches[2]\";s:28:\"([^/]+)/page/?([0-9]{1,})/?$\";s:44:\"index.php?name=$matches[1]&paged=$matches[2]\";s:35:\"([^/]+)/comment-page-([0-9]{1,})/?$\";s:44:\"index.php?name=$matches[1]&cpage=$matches[2]\";s:25:\"([^/]+)/wc-api(/(.*))?/?$\";s:45:\"index.php?name=$matches[1]&wc-api=$matches[3]\";s:31:\"[^/]+/([^/]+)/wc-api(/(.*))?/?$\";s:51:\"index.php?attachment=$matches[1]&wc-api=$matches[3]\";s:42:\"[^/]+/attachment/([^/]+)/wc-api(/(.*))?/?$\";s:51:\"index.php?attachment=$matches[1]&wc-api=$matches[3]\";s:24:\"([^/]+)(?:/([0-9]+))?/?$\";s:43:\"index.php?name=$matches[1]&page=$matches[2]\";s:16:\"[^/]+/([^/]+)/?$\";s:32:\"index.php?attachment=$matches[1]\";s:26:\"[^/]+/([^/]+)/trackback/?$\";s:37:\"index.php?attachment=$matches[1]&tb=1\";s:46:\"[^/]+/([^/]+)/feed/(feed|rdf|rss|rss2|atom)/?$\";s:49:\"index.php?attachment=$matches[1]&feed=$matches[2]\";s:41:\"[^/]+/([^/]+)/(feed|rdf|rss|rss2|atom)/?$\";s:49:\"index.php?attachment=$matches[1]&feed=$matches[2]\";s:41:\"[^/]+/([^/]+)/comment-page-([0-9]{1,})/?$\";s:50:\"index.php?attachment=$matches[1]&cpage=$matches[2]\";s:22:\"[^/]+/([^/]+)/embed/?$\";s:43:\"index.php?attachment=$matches[1]&embed=true\";}','yes'),(30,'hack_file','0','yes'),(31,'blog_charset','UTF-8','yes'),(32,'moderation_keys','','no'),(33,'active_plugins','a:1:{i:0;s:35:\"google-site-kit/google-site-kit.php\";}','yes'),(34,'category_base','','yes'),(35,'ping_sites','http://rpc.pingomatic.com/','yes'),(36,'comment_max_links','2','yes'),(37,'gmt_offset','0','yes'),(38,'default_email_category','1','yes'),(39,'recently_edited','','no'),(40,'template','twentynineteen','yes'),(41,'stylesheet','twentynineteen','yes'),(42,'comment_whitelist','1','yes'),(43,'blacklist_keys','','no'),(44,'comment_registration','0','yes'),(45,'html_type','text/html','yes'),(46,'use_trackback','0','yes'),(47,'default_role','subscriber','yes'),(48,'db_version','44719','yes'),(49,'uploads_use_yearmonth_folders','1','yes'),(50,'upload_path','','yes'),(51,'blog_public','1','yes'),(52,'default_link_category','2','yes'),(53,'show_on_front','posts','yes'),(54,'tag_base','','yes'),(55,'show_avatars','1','yes'),(56,'avatar_rating','G','yes'),(57,'upload_url_path','','yes'),(58,'thumbnail_size_w','150','yes'),(59,'thumbnail_size_h','150','yes'),(60,'thumbnail_crop','1','yes'),(61,'medium_size_w','300','yes'),(62,'medium_size_h','300','yes'),(63,'avatar_default','mystery','yes'),(64,'large_size_w','1024','yes'),(65,'large_size_h','1024','yes'),(66,'image_default_link_type','none','yes'),(67,'image_default_size','','yes'),(68,'image_default_align','','yes'),(69,'close_comments_for_old_posts','0','yes'),(70,'close_comments_days_old','14','yes'),(71,'thread_comments','1','yes'),(72,'thread_comments_depth','5','yes'),(73,'page_comments','0','yes'),(74,'comments_per_page','50','yes'),(75,'default_comments_page','newest','yes'),(76,'comment_order','asc','yes'),(77,'sticky_posts','a:0:{}','yes'),(78,'widget_categories','a:2:{i:2;a:4:{s:5:\"title\";s:0:\"\";s:5:\"count\";i:0;s:12:\"hierarchical\";i:0;s:8:\"dropdown\";i:0;}s:12:\"_multiwidget\";i:1;}','yes'),(79,'widget_text','a:0:{}','yes'),(80,'widget_rss','a:0:{}','yes'),(81,'uninstall_plugins','a:0:{}','no'),(82,'timezone_string','','yes'),(83,'page_for_posts','0','yes'),(84,'page_on_front','0','yes'),(85,'default_post_format','0','yes'),(86,'link_manager_enabled','0','yes'),(87,'finished_splitting_shared_terms','1','yes'),(88,'site_icon','0','yes'),(89,'medium_large_size_w','768','yes'),(90,'medium_large_size_h','0','yes'),(91,'wp_page_for_privacy_policy','3','yes'),(92,'show_comments_cookies_opt_in','1','yes'),(93,'initial_db_version','44719','yes'),(94,'wp_user_roles','a:7:{s:13:\"administrator\";a:2:{s:4:\"name\";s:13:\"Administrator\";s:12:\"capabilities\";a:114:{s:13:\"switch_themes\";b:1;s:11:\"edit_themes\";b:1;s:16:\"activate_plugins\";b:1;s:12:\"edit_plugins\";b:1;s:10:\"edit_users\";b:1;s:10:\"edit_files\";b:1;s:14:\"manage_options\";b:1;s:17:\"moderate_comments\";b:1;s:17:\"manage_categories\";b:1;s:12:\"manage_links\";b:1;s:12:\"upload_files\";b:1;s:6:\"import\";b:1;s:15:\"unfiltered_html\";b:1;s:10:\"edit_posts\";b:1;s:17:\"edit_others_posts\";b:1;s:20:\"edit_published_posts\";b:1;s:13:\"publish_posts\";b:1;s:10:\"edit_pages\";b:1;s:4:\"read\";b:1;s:8:\"level_10\";b:1;s:7:\"level_9\";b:1;s:7:\"level_8\";b:1;s:7:\"level_7\";b:1;s:7:\"level_6\";b:1;s:7:\"level_5\";b:1;s:7:\"level_4\";b:1;s:7:\"level_3\";b:1;s:7:\"level_2\";b:1;s:7:\"level_1\";b:1;s:7:\"level_0\";b:1;s:17:\"edit_others_pages\";b:1;s:20:\"edit_published_pages\";b:1;s:13:\"publish_pages\";b:1;s:12:\"delete_pages\";b:1;s:19:\"delete_others_pages\";b:1;s:22:\"delete_published_pages\";b:1;s:12:\"delete_posts\";b:1;s:19:\"delete_others_posts\";b:1;s:22:\"delete_published_posts\";b:1;s:20:\"delete_private_posts\";b:1;s:18:\"edit_private_posts\";b:1;s:18:\"read_private_posts\";b:1;s:20:\"delete_private_pages\";b:1;s:18:\"edit_private_pages\";b:1;s:18:\"read_private_pages\";b:1;s:12:\"delete_users\";b:1;s:12:\"create_users\";b:1;s:17:\"unfiltered_upload\";b:1;s:14:\"edit_dashboard\";b:1;s:14:\"update_plugins\";b:1;s:14:\"delete_plugins\";b:1;s:15:\"install_plugins\";b:1;s:13:\"update_themes\";b:1;s:14:\"install_themes\";b:1;s:11:\"update_core\";b:1;s:10:\"list_users\";b:1;s:12:\"remove_users\";b:1;s:13:\"promote_users\";b:1;s:18:\"edit_theme_options\";b:1;s:13:\"delete_themes\";b:1;s:6:\"export\";b:1;s:18:\"manage_woocommerce\";b:1;s:24:\"view_woocommerce_reports\";b:1;s:12:\"edit_product\";b:1;s:12:\"read_product\";b:1;s:14:\"delete_product\";b:1;s:13:\"edit_products\";b:1;s:20:\"edit_others_products\";b:1;s:16:\"publish_products\";b:1;s:21:\"read_private_products\";b:1;s:15:\"delete_products\";b:1;s:23:\"delete_private_products\";b:1;s:25:\"delete_published_products\";b:1;s:22:\"delete_others_products\";b:1;s:21:\"edit_private_products\";b:1;s:23:\"edit_published_products\";b:1;s:20:\"manage_product_terms\";b:1;s:18:\"edit_product_terms\";b:1;s:20:\"delete_product_terms\";b:1;s:20:\"assign_product_terms\";b:1;s:15:\"edit_shop_order\";b:1;s:15:\"read_shop_order\";b:1;s:17:\"delete_shop_order\";b:1;s:16:\"edit_shop_orders\";b:1;s:23:\"edit_others_shop_orders\";b:1;s:19:\"publish_shop_orders\";b:1;s:24:\"read_private_shop_orders\";b:1;s:18:\"delete_shop_orders\";b:1;s:26:\"delete_private_shop_orders\";b:1;s:28:\"delete_published_shop_orders\";b:1;s:25:\"delete_others_shop_orders\";b:1;s:24:\"edit_private_shop_orders\";b:1;s:26:\"edit_published_shop_orders\";b:1;s:23:\"manage_shop_order_terms\";b:1;s:21:\"edit_shop_order_terms\";b:1;s:23:\"delete_shop_order_terms\";b:1;s:23:\"assign_shop_order_terms\";b:1;s:16:\"edit_shop_coupon\";b:1;s:16:\"read_shop_coupon\";b:1;s:18:\"delete_shop_coupon\";b:1;s:17:\"edit_shop_coupons\";b:1;s:24:\"edit_others_shop_coupons\";b:1;s:20:\"publish_shop_coupons\";b:1;s:25:\"read_private_shop_coupons\";b:1;s:19:\"delete_shop_coupons\";b:1;s:27:\"delete_private_shop_coupons\";b:1;s:29:\"delete_published_shop_coupons\";b:1;s:26:\"delete_others_shop_coupons\";b:1;s:25:\"edit_private_shop_coupons\";b:1;s:27:\"edit_published_shop_coupons\";b:1;s:24:\"manage_shop_coupon_terms\";b:1;s:22:\"edit_shop_coupon_terms\";b:1;s:24:\"delete_shop_coupon_terms\";b:1;s:24:\"assign_shop_coupon_terms\";b:1;}}s:6:\"editor\";a:2:{s:4:\"name\";s:6:\"Editor\";s:12:\"capabilities\";a:34:{s:17:\"moderate_comments\";b:1;s:17:\"manage_categories\";b:1;s:12:\"manage_links\";b:1;s:12:\"upload_files\";b:1;s:15:\"unfiltered_html\";b:1;s:10:\"edit_posts\";b:1;s:17:\"edit_others_posts\";b:1;s:20:\"edit_published_posts\";b:1;s:13:\"publish_posts\";b:1;s:10:\"edit_pages\";b:1;s:4:\"read\";b:1;s:7:\"level_7\";b:1;s:7:\"level_6\";b:1;s:7:\"level_5\";b:1;s:7:\"level_4\";b:1;s:7:\"level_3\";b:1;s:7:\"level_2\";b:1;s:7:\"level_1\";b:1;s:7:\"level_0\";b:1;s:17:\"edit_others_pages\";b:1;s:20:\"edit_published_pages\";b:1;s:13:\"publish_pages\";b:1;s:12:\"delete_pages\";b:1;s:19:\"delete_others_pages\";b:1;s:22:\"delete_published_pages\";b:1;s:12:\"delete_posts\";b:1;s:19:\"delete_others_posts\";b:1;s:22:\"delete_published_posts\";b:1;s:20:\"delete_private_posts\";b:1;s:18:\"edit_private_posts\";b:1;s:18:\"read_private_posts\";b:1;s:20:\"delete_private_pages\";b:1;s:18:\"edit_private_pages\";b:1;s:18:\"read_private_pages\";b:1;}}s:6:\"author\";a:2:{s:4:\"name\";s:6:\"Author\";s:12:\"capabilities\";a:10:{s:12:\"upload_files\";b:1;s:10:\"edit_posts\";b:1;s:20:\"edit_published_posts\";b:1;s:13:\"publish_posts\";b:1;s:4:\"read\";b:1;s:7:\"level_2\";b:1;s:7:\"level_1\";b:1;s:7:\"level_0\";b:1;s:12:\"delete_posts\";b:1;s:22:\"delete_published_posts\";b:1;}}s:11:\"contributor\";a:2:{s:4:\"name\";s:11:\"Contributor\";s:12:\"capabilities\";a:5:{s:10:\"edit_posts\";b:1;s:4:\"read\";b:1;s:7:\"level_1\";b:1;s:7:\"level_0\";b:1;s:12:\"delete_posts\";b:1;}}s:10:\"subscriber\";a:2:{s:4:\"name\";s:10:\"Subscriber\";s:12:\"capabilities\";a:2:{s:4:\"read\";b:1;s:7:\"level_0\";b:1;}}s:8:\"customer\";a:2:{s:4:\"name\";s:8:\"Customer\";s:12:\"capabilities\";a:1:{s:4:\"read\";b:1;}}s:12:\"shop_manager\";a:2:{s:4:\"name\";s:12:\"Shop manager\";s:12:\"capabilities\";a:92:{s:7:\"level_9\";b:1;s:7:\"level_8\";b:1;s:7:\"level_7\";b:1;s:7:\"level_6\";b:1;s:7:\"level_5\";b:1;s:7:\"level_4\";b:1;s:7:\"level_3\";b:1;s:7:\"level_2\";b:1;s:7:\"level_1\";b:1;s:7:\"level_0\";b:1;s:4:\"read\";b:1;s:18:\"read_private_pages\";b:1;s:18:\"read_private_posts\";b:1;s:10:\"edit_posts\";b:1;s:10:\"edit_pages\";b:1;s:20:\"edit_published_posts\";b:1;s:20:\"edit_published_pages\";b:1;s:18:\"edit_private_pages\";b:1;s:18:\"edit_private_posts\";b:1;s:17:\"edit_others_posts\";b:1;s:17:\"edit_others_pages\";b:1;s:13:\"publish_posts\";b:1;s:13:\"publish_pages\";b:1;s:12:\"delete_posts\";b:1;s:12:\"delete_pages\";b:1;s:20:\"delete_private_pages\";b:1;s:20:\"delete_private_posts\";b:1;s:22:\"delete_published_pages\";b:1;s:22:\"delete_published_posts\";b:1;s:19:\"delete_others_posts\";b:1;s:19:\"delete_others_pages\";b:1;s:17:\"manage_categories\";b:1;s:12:\"manage_links\";b:1;s:17:\"moderate_comments\";b:1;s:12:\"upload_files\";b:1;s:6:\"export\";b:1;s:6:\"import\";b:1;s:10:\"list_users\";b:1;s:18:\"edit_theme_options\";b:1;s:18:\"manage_woocommerce\";b:1;s:24:\"view_woocommerce_reports\";b:1;s:12:\"edit_product\";b:1;s:12:\"read_product\";b:1;s:14:\"delete_product\";b:1;s:13:\"edit_products\";b:1;s:20:\"edit_others_products\";b:1;s:16:\"publish_products\";b:1;s:21:\"read_private_products\";b:1;s:15:\"delete_products\";b:1;s:23:\"delete_private_products\";b:1;s:25:\"delete_published_products\";b:1;s:22:\"delete_others_products\";b:1;s:21:\"edit_private_products\";b:1;s:23:\"edit_published_products\";b:1;s:20:\"manage_product_terms\";b:1;s:18:\"edit_product_terms\";b:1;s:20:\"delete_product_terms\";b:1;s:20:\"assign_product_terms\";b:1;s:15:\"edit_shop_order\";b:1;s:15:\"read_shop_order\";b:1;s:17:\"delete_shop_order\";b:1;s:16:\"edit_shop_orders\";b:1;s:23:\"edit_others_shop_orders\";b:1;s:19:\"publish_shop_orders\";b:1;s:24:\"read_private_shop_orders\";b:1;s:18:\"delete_shop_orders\";b:1;s:26:\"delete_private_shop_orders\";b:1;s:28:\"delete_published_shop_orders\";b:1;s:25:\"delete_others_shop_orders\";b:1;s:24:\"edit_private_shop_orders\";b:1;s:26:\"edit_published_shop_orders\";b:1;s:23:\"manage_shop_order_terms\";b:1;s:21:\"edit_shop_order_terms\";b:1;s:23:\"delete_shop_order_terms\";b:1;s:23:\"assign_shop_order_terms\";b:1;s:16:\"edit_shop_coupon\";b:1;s:16:\"read_shop_coupon\";b:1;s:18:\"delete_shop_coupon\";b:1;s:17:\"edit_shop_coupons\";b:1;s:24:\"edit_others_shop_coupons\";b:1;s:20:\"publish_shop_coupons\";b:1;s:25:\"read_private_shop_coupons\";b:1;s:19:\"delete_shop_coupons\";b:1;s:27:\"delete_private_shop_coupons\";b:1;s:29:\"delete_published_shop_coupons\";b:1;s:26:\"delete_others_shop_coupons\";b:1;s:25:\"edit_private_shop_coupons\";b:1;s:27:\"edit_published_shop_coupons\";b:1;s:24:\"manage_shop_coupon_terms\";b:1;s:22:\"edit_shop_coupon_terms\";b:1;s:24:\"delete_shop_coupon_terms\";b:1;s:24:\"assign_shop_coupon_terms\";b:1;}}}','yes'),(95,'fresh_site','0','yes'),(96,'widget_search','a:2:{i:2;a:1:{s:5:\"title\";s:0:\"\";}s:12:\"_multiwidget\";i:1;}','yes'),(97,'widget_recent-posts','a:2:{i:2;a:2:{s:5:\"title\";s:0:\"\";s:6:\"number\";i:5;}s:12:\"_multiwidget\";i:1;}','yes'),(98,'widget_recent-comments','a:2:{i:2;a:2:{s:5:\"title\";s:0:\"\";s:6:\"number\";i:5;}s:12:\"_multiwidget\";i:1;}','yes'),(99,'widget_archives','a:2:{i:2;a:3:{s:5:\"title\";s:0:\"\";s:5:\"count\";i:0;s:8:\"dropdown\";i:0;}s:12:\"_multiwidget\";i:1;}','yes'),(100,'widget_meta','a:2:{i:2;a:1:{s:5:\"title\";s:0:\"\";}s:12:\"_multiwidget\";i:1;}','yes'),(101,'sidebars_widgets','a:3:{s:19:\"wp_inactive_widgets\";a:0:{}s:9:\"sidebar-1\";a:6:{i:0;s:8:\"search-2\";i:1;s:14:\"recent-posts-2\";i:2;s:17:\"recent-comments-2\";i:3;s:10:\"archives-2\";i:4;s:12:\"categories-2\";i:5;s:6:\"meta-2\";}s:13:\"array_version\";i:3;}','yes'),(102,'cron','a:1:{s:7:\"version\";i:2;}','yes'),(103,'widget_pages','a:1:{s:12:\"_multiwidget\";i:1;}','yes'),(104,'widget_calendar','a:1:{s:12:\"_multiwidget\";i:1;}','yes'),(105,'widget_media_audio','a:1:{s:12:\"_multiwidget\";i:1;}','yes'),(106,'widget_media_image','a:1:{s:12:\"_multiwidget\";i:1;}','yes'),(107,'widget_media_gallery','a:1:{s:12:\"_multiwidget\";i:1;}','yes'),(108,'widget_media_video','a:1:{s:12:\"_multiwidget\";i:1;}','yes'),(109,'widget_tag_cloud','a:1:{s:12:\"_multiwidget\";i:1;}','yes'),(110,'widget_nav_menu','a:1:{s:12:\"_multiwidget\";i:1;}','yes'),(111,'widget_custom_html','a:1:{s:12:\"_multiwidget\";i:1;}','yes'),(115,'googlesitekit_show_activation_notice','1','no'),(116,'action_scheduler_hybrid_store_demarkation','8','yes'),(117,'schema-ActionScheduler_StoreSchema','3.0.1784479120','yes'),(118,'schema-ActionScheduler_LoggerSchema','2.0.1784479120','yes'),(123,'woocommerce_schema_version','430','yes'),(124,'woocommerce_store_address','60 29th Street','yes'),(125,'woocommerce_store_address_2','','yes'),(126,'woocommerce_store_city','San Francisco','yes'),(127,'woocommerce_default_country','US:CA','yes'),(128,'woocommerce_store_postcode','94110','yes'),(129,'woocommerce_allowed_countries','all','yes'),(130,'woocommerce_all_except_countries','','yes'),(131,'woocommerce_specific_allowed_countries','','yes'),(132,'woocommerce_ship_to_countries','','yes'),(133,'woocommerce_specific_ship_to_countries','','yes'),(134,'woocommerce_default_customer_address','base','yes'),(135,'woocommerce_calc_taxes','no','yes'),(136,'woocommerce_enable_coupons','yes','yes'),(137,'woocommerce_calc_discounts_sequentially','no','no'),(138,'woocommerce_currency','USD','yes'),(139,'woocommerce_currency_pos','left','yes'),(140,'woocommerce_price_thousand_sep',',','yes'),(141,'woocommerce_price_decimal_sep','.','yes'),(142,'woocommerce_price_num_decimals','2','yes'),(143,'woocommerce_shop_page_id','','yes'),(144,'woocommerce_cart_redirect_after_add','no','yes'),(145,'woocommerce_enable_ajax_add_to_cart','yes','yes'),(146,'woocommerce_placeholder_image','8','yes'),(147,'woocommerce_weight_unit','kg','yes'),(148,'woocommerce_dimension_unit','cm','yes'),(149,'woocommerce_enable_reviews','yes','yes'),(150,'woocommerce_review_rating_verification_label','yes','no'),(151,'woocommerce_review_rating_verification_required','no','no'),(152,'woocommerce_enable_review_rating','yes','yes'),(153,'woocommerce_review_rating_required','yes','no'),(154,'woocommerce_manage_stock','yes','yes'),(155,'woocommerce_hold_stock_minutes','60','no'),(156,'woocommerce_notify_low_stock','yes','no'),(157,'woocommerce_notify_no_stock','yes','no'),(158,'woocommerce_stock_email_recipient','test@test.com','no'),(159,'woocommerce_notify_low_stock_amount','2','no'),(160,'woocommerce_notify_no_stock_amount','0','yes'),(161,'woocommerce_hide_out_of_stock_items','no','yes'),(162,'woocommerce_stock_format','','yes'),(163,'woocommerce_file_download_method','force','no'),(164,'woocommerce_downloads_require_login','no','no'),(165,'woocommerce_downloads_grant_access_after_payment','yes','no'),(166,'woocommerce_downloads_add_hash_to_filename','yes','yes'),(167,'woocommerce_prices_include_tax','no','yes'),(168,'woocommerce_tax_based_on','shipping','yes'),(169,'woocommerce_shipping_tax_class','inherit','yes'),(170,'woocommerce_tax_round_at_subtotal','no','yes'),(171,'woocommerce_tax_classes','','yes'),(172,'woocommerce_tax_display_shop','excl','yes'),(173,'woocommerce_tax_display_cart','excl','yes'),(174,'woocommerce_price_display_suffix','','yes'),(175,'woocommerce_tax_total_display','itemized','no'),(176,'woocommerce_enable_shipping_calc','yes','no'),(177,'woocommerce_shipping_cost_requires_address','no','yes'),(178,'woocommerce_ship_to_destination','billing','no'),(179,'woocommerce_shipping_debug_mode','no','yes'),(180,'woocommerce_enable_guest_checkout','yes','no'),(181,'woocommerce_enable_checkout_login_reminder','no','no'),(182,'woocommerce_enable_signup_and_login_from_checkout','no','no'),(183,'woocommerce_enable_myaccount_registration','no','no'),(184,'woocommerce_registration_generate_username','yes','no'),(185,'woocommerce_registration_generate_password','yes','no'),(186,'woocommerce_erasure_request_removes_order_data','no','no'),(187,'woocommerce_erasure_request_removes_download_data','no','no'),(188,'woocommerce_allow_bulk_remove_personal_data','no','no'),(189,'woocommerce_registration_privacy_policy_text','Your personal data will be used to support your experience throughout this website, to manage access to your account, and for other purposes described in our [privacy_policy].','yes'),(190,'woocommerce_checkout_privacy_policy_text','Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our [privacy_policy].','yes'),(191,'woocommerce_delete_inactive_accounts','a:2:{s:6:\"number\";s:0:\"\";s:4:\"unit\";s:6:\"months\";}','no'),(192,'woocommerce_trash_pending_orders','','no'),(193,'woocommerce_trash_failed_orders','','no'),(194,'woocommerce_trash_cancelled_orders','','no'),(195,'woocommerce_anonymize_completed_orders','a:2:{s:6:\"number\";s:0:\"\";s:4:\"unit\";s:6:\"months\";}','no'),(196,'woocommerce_email_from_name','Google Site Kit Dev','no'),(197,'woocommerce_email_from_address','test@test.com','no'),(198,'woocommerce_email_header_image','','no'),(199,'woocommerce_email_footer_text','{site_title} &mdash; Built with {WooCommerce}','no'),(200,'woocommerce_email_base_color','#96588a','no'),(201,'woocommerce_email_background_color','#f7f7f7','no'),(202,'woocommerce_email_body_background_color','#ffffff','no'),(203,'woocommerce_email_text_color','#3c3c3c','no'),(204,'woocommerce_cart_page_id','','no'),(205,'woocommerce_checkout_page_id','','no'),(206,'woocommerce_myaccount_page_id','','no'),(207,'woocommerce_terms_page_id','','no'),(208,'woocommerce_force_ssl_checkout','no','yes'),(209,'woocommerce_unforce_ssl_checkout','no','yes'),(210,'woocommerce_checkout_pay_endpoint','order-pay','yes'),(211,'woocommerce_checkout_order_received_endpoint','order-received','yes'),(212,'woocommerce_myaccount_add_payment_method_endpoint','add-payment-method','yes'),(213,'woocommerce_myaccount_delete_payment_method_endpoint','delete-payment-method','yes'),(214,'woocommerce_myaccount_set_default_payment_method_endpoint','set-default-payment-method','yes'),(215,'woocommerce_myaccount_orders_endpoint','orders','yes'),(216,'woocommerce_myaccount_view_order_endpoint','view-order','yes'),(217,'woocommerce_myaccount_downloads_endpoint','downloads','yes'),(218,'woocommerce_myaccount_edit_account_endpoint','edit-account','yes'),(219,'woocommerce_myaccount_edit_address_endpoint','edit-address','yes'),(220,'woocommerce_myaccount_payment_methods_endpoint','payment-methods','yes'),(221,'woocommerce_myaccount_lost_password_endpoint','lost-password','yes'),(222,'woocommerce_logout_endpoint','customer-logout','yes'),(223,'woocommerce_api_enabled','no','yes'),(224,'woocommerce_allow_tracking','no','no'),(225,'woocommerce_show_marketplace_suggestions','yes','no'),(226,'woocommerce_single_image_width','600','yes'),(227,'woocommerce_thumbnail_image_width','300','yes'),(228,'woocommerce_checkout_highlight_required_fields','yes','yes'),(229,'woocommerce_demo_store','no','no'),(230,'woocommerce_permalinks','a:5:{s:12:\"product_base\";s:7:\"product\";s:13:\"category_base\";s:16:\"product-category\";s:8:\"tag_base\";s:11:\"product-tag\";s:14:\"attribute_base\";s:0:\"\";s:22:\"use_verbose_page_rules\";b:0;}','yes'),(231,'current_theme_supports_woocommerce','yes','yes'),(232,'woocommerce_queue_flush_rewrite_rules','no','yes'),(235,'default_product_cat','15','yes'),(236,'woocommerce_admin_notices','a:3:{i:0;s:7:\"install\";i:1;s:20:\"no_secure_connection\";i:2;s:14:\"template_files\";}','yes'),(239,'woocommerce_version','4.4.4','yes'),(240,'woocommerce_db_version','4.4.4','yes'),(241,'woocommerce_homescreen_enabled','yes','yes'),(244,'woocommerce_maxmind_geolocation_settings','a:1:{s:15:\"database_prefix\";s:32:\"djl0DE3rVOP7lzmQWTVlExq2NcMjlRAe\";}','yes'),(246,'widget_woocommerce_widget_cart','a:1:{s:12:\"_multiwidget\";i:1;}','yes'),(247,'widget_woocommerce_layered_nav_filters','a:1:{s:12:\"_multiwidget\";i:1;}','yes'),(248,'widget_woocommerce_layered_nav','a:1:{s:12:\"_multiwidget\";i:1;}','yes'),(249,'widget_woocommerce_price_filter','a:1:{s:12:\"_multiwidget\";i:1;}','yes'),(250,'widget_woocommerce_product_categories','a:1:{s:12:\"_multiwidget\";i:1;}','yes'),(251,'widget_woocommerce_product_search','a:1:{s:12:\"_multiwidget\";i:1;}','yes'),(252,'widget_woocommerce_product_tag_cloud','a:1:{s:12:\"_multiwidget\";i:1;}','yes'),(253,'widget_woocommerce_products','a:1:{s:12:\"_multiwidget\";i:1;}','yes'),(254,'widget_woocommerce_recently_viewed_products','a:1:{s:12:\"_multiwidget\";i:1;}','yes'),(255,'widget_woocommerce_top_rated_products','a:1:{s:12:\"_multiwidget\";i:1;}','yes'),(256,'widget_woocommerce_recent_reviews','a:1:{s:12:\"_multiwidget\";i:1;}','yes'),(257,'widget_woocommerce_rating_filter','a:1:{s:12:\"_multiwidget\";i:1;}','yes'),(269,'category_children','a:0:{}','yes'),(270,'product_cat_children','a:0:{}','yes'),(271,'recently_activated','a:3:{s:27:\"woocommerce/woocommerce.php\";i:1784479135;s:41:\"wordpress-importer/wordpress-importer.php\";i:1784479134;i:0;b:0;}','yes');
/*!40000 ALTER TABLE `wp_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_postmeta`
--

DROP TABLE IF EXISTS `wp_postmeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_postmeta` (
  `meta_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `post_id` bigint(20) unsigned NOT NULL DEFAULT 0,
  `meta_key` varchar(255) DEFAULT NULL,
  `meta_value` longtext DEFAULT NULL,
  PRIMARY KEY (`meta_id`),
  KEY `post_id` (`post_id`),
  KEY `meta_key` (`meta_key`(191))
) ENGINE=InnoDB AUTO_INCREMENT=915 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_postmeta`
--

LOCK TABLES `wp_postmeta` WRITE;
/*!40000 ALTER TABLE `wp_postmeta` DISABLE KEYS */;
INSERT INTO `wp_postmeta` VALUES (1,2,'_wp_page_template','default'),(2,3,'_wp_page_template','default'),(3,4,'_pingme','1'),(4,4,'_encloseme','1'),(5,5,'_pingme','1'),(6,5,'_encloseme','1'),(7,6,'_pingme','1'),(8,6,'_encloseme','1'),(9,7,'_pingme','1'),(10,7,'_encloseme','1'),(11,8,'_wp_attached_file','woocommerce-placeholder.png'),(12,8,'_wp_attachment_metadata','a:5:{s:5:\"width\";i:1200;s:6:\"height\";i:1200;s:4:\"file\";s:27:\"woocommerce-placeholder.png\";s:5:\"sizes\";a:4:{s:9:\"thumbnail\";a:4:{s:4:\"file\";s:35:\"woocommerce-placeholder-150x150.png\";s:5:\"width\";i:150;s:6:\"height\";i:150;s:9:\"mime-type\";s:9:\"image/png\";}s:6:\"medium\";a:4:{s:4:\"file\";s:35:\"woocommerce-placeholder-300x300.png\";s:5:\"width\";i:300;s:6:\"height\";i:300;s:9:\"mime-type\";s:9:\"image/png\";}s:12:\"medium_large\";a:4:{s:4:\"file\";s:35:\"woocommerce-placeholder-768x768.png\";s:5:\"width\";i:768;s:6:\"height\";i:768;s:9:\"mime-type\";s:9:\"image/png\";}s:5:\"large\";a:4:{s:4:\"file\";s:37:\"woocommerce-placeholder-1024x1024.png\";s:5:\"width\";i:1024;s:6:\"height\";i:1024;s:9:\"mime-type\";s:9:\"image/png\";}}s:10:\"image_meta\";a:12:{s:8:\"aperture\";s:1:\"0\";s:6:\"credit\";s:0:\"\";s:6:\"camera\";s:0:\"\";s:7:\"caption\";s:0:\"\";s:17:\"created_timestamp\";s:1:\"0\";s:9:\"copyright\";s:0:\"\";s:12:\"focal_length\";s:1:\"0\";s:3:\"iso\";s:1:\"0\";s:13:\"shutter_speed\";s:1:\"0\";s:5:\"title\";s:0:\"\";s:11:\"orientation\";s:1:\"0\";s:8:\"keywords\";a:0:{}}}'),(13,9,'_sku','woo-vneck-tee'),(14,9,'_sale_price_dates_from',''),(15,9,'_sale_price_dates_to',''),(16,9,'total_sales','0'),(17,9,'_tax_status','taxable'),(18,9,'_tax_class',''),(19,9,'_manage_stock','no'),(20,9,'_backorders','no'),(21,9,'_low_stock_amount',''),(22,9,'_sold_individually','no'),(23,9,'_weight',''),(24,9,'_length',''),(25,9,'_width',''),(26,9,'_height',''),(27,9,'_upsell_ids','a:0:{}'),(28,9,'_crosssell_ids','a:0:{}'),(29,9,'_purchase_note',''),(30,9,'_default_attributes','a:0:{}'),(31,9,'_virtual','no'),(32,9,'_downloadable','no'),(33,9,'_product_image_gallery','32,33'),(34,9,'_download_limit','0'),(35,9,'_download_expiry','0'),(36,9,'_stock',''),(37,9,'_stock_status','instock'),(38,9,'_wc_average_rating','0'),(39,9,'_wc_rating_count','a:0:{}'),(40,9,'_wc_review_count','0'),(41,9,'_downloadable_files','a:0:{}'),(42,9,'_product_attributes','a:2:{s:8:\"pa_color\";a:6:{s:4:\"name\";s:8:\"pa_color\";s:5:\"value\";s:0:\"\";s:8:\"position\";i:0;s:10:\"is_visible\";i:1;s:12:\"is_variation\";i:1;s:11:\"is_taxonomy\";i:1;}s:7:\"pa_size\";a:6:{s:4:\"name\";s:7:\"pa_size\";s:5:\"value\";s:0:\"\";s:8:\"position\";i:1;s:10:\"is_visible\";i:1;s:12:\"is_variation\";i:1;s:11:\"is_taxonomy\";i:1;}}'),(43,9,'_product_version','3.5.3'),(44,9,'_thumbnail_id','31'),(45,9,'_price','15'),(46,9,'_price','20'),(47,9,'_regular_price',''),(48,9,'_sale_price',''),(49,10,'_sku','woo-hoodie'),(50,10,'_sale_price_dates_from',''),(51,10,'_sale_price_dates_to',''),(52,10,'total_sales','0'),(53,10,'_tax_status','taxable'),(54,10,'_tax_class',''),(55,10,'_manage_stock','no'),(56,10,'_backorders','no'),(57,10,'_low_stock_amount',''),(58,10,'_sold_individually','no'),(59,10,'_weight',''),(60,10,'_length',''),(61,10,'_width',''),(62,10,'_height',''),(63,10,'_upsell_ids','a:0:{}'),(64,10,'_crosssell_ids','a:0:{}'),(65,10,'_purchase_note',''),(66,10,'_default_attributes','a:0:{}'),(67,10,'_virtual','no'),(68,10,'_downloadable','no'),(69,10,'_product_image_gallery','35,36,37'),(70,10,'_download_limit','0'),(71,10,'_download_expiry','0'),(72,10,'_stock',''),(73,10,'_stock_status','instock'),(74,10,'_wc_average_rating','0'),(75,10,'_wc_rating_count','a:0:{}'),(76,10,'_wc_review_count','0'),(77,10,'_downloadable_files','a:0:{}'),(78,10,'_product_attributes','a:2:{s:8:\"pa_color\";a:6:{s:4:\"name\";s:8:\"pa_color\";s:5:\"value\";s:0:\"\";s:8:\"position\";i:0;s:10:\"is_visible\";i:1;s:12:\"is_variation\";i:1;s:11:\"is_taxonomy\";i:1;}s:4:\"logo\";a:6:{s:4:\"name\";s:4:\"Logo\";s:5:\"value\";s:8:\"Yes | No\";s:8:\"position\";i:1;s:10:\"is_visible\";i:1;s:12:\"is_variation\";i:1;s:11:\"is_taxonomy\";i:0;}}'),(79,10,'_product_version','3.5.3'),(80,10,'_thumbnail_id','34'),(81,10,'_price','42'),(82,10,'_price','45'),(83,10,'_regular_price',''),(84,10,'_sale_price',''),(85,11,'_sku','woo-hoodie-with-logo'),(86,11,'_regular_price','45'),(87,11,'_sale_price',''),(88,11,'_sale_price_dates_from',''),(89,11,'_sale_price_dates_to',''),(90,11,'total_sales','0'),(91,11,'_tax_status','taxable'),(92,11,'_tax_class',''),(93,11,'_manage_stock','no'),(94,11,'_backorders','no'),(95,11,'_low_stock_amount',''),(96,11,'_sold_individually','no'),(97,11,'_weight',''),(98,11,'_length',''),(99,11,'_width',''),(100,11,'_height',''),(101,11,'_upsell_ids','a:0:{}'),(102,11,'_crosssell_ids','a:0:{}'),(103,11,'_purchase_note',''),(104,11,'_default_attributes','a:0:{}'),(105,11,'_virtual','no'),(106,11,'_downloadable','no'),(107,11,'_product_image_gallery',''),(108,11,'_download_limit','0'),(109,11,'_download_expiry','0'),(110,11,'_stock',''),(111,11,'_stock_status','instock'),(112,11,'_wc_average_rating','0'),(113,11,'_wc_rating_count','a:0:{}'),(114,11,'_wc_review_count','0'),(115,11,'_downloadable_files','a:0:{}'),(116,11,'_product_attributes','a:1:{s:8:\"pa_color\";a:6:{s:4:\"name\";s:8:\"pa_color\";s:5:\"value\";s:0:\"\";s:8:\"position\";i:0;s:10:\"is_visible\";i:1;s:12:\"is_variation\";i:0;s:11:\"is_taxonomy\";i:1;}}'),(117,11,'_product_version','3.5.3'),(118,11,'_price','45'),(119,11,'_thumbnail_id','37'),(120,12,'_sku','woo-tshirt'),(121,12,'_regular_price','18'),(122,12,'_sale_price',''),(123,12,'_sale_price_dates_from',''),(124,12,'_sale_price_dates_to',''),(125,12,'total_sales','0'),(126,12,'_tax_status','taxable'),(127,12,'_tax_class',''),(128,12,'_manage_stock','no'),(129,12,'_backorders','no'),(130,12,'_low_stock_amount',''),(131,12,'_sold_individually','no'),(132,12,'_weight',''),(133,12,'_length',''),(134,12,'_width',''),(135,12,'_height',''),(136,12,'_upsell_ids','a:0:{}'),(137,12,'_crosssell_ids','a:0:{}'),(138,12,'_purchase_note',''),(139,12,'_default_attributes','a:0:{}'),(140,12,'_virtual','no'),(141,12,'_downloadable','no'),(142,12,'_product_image_gallery',''),(143,12,'_download_limit','0'),(144,12,'_download_expiry','0'),(145,12,'_stock',''),(146,12,'_stock_status','instock'),(147,12,'_wc_average_rating','0'),(148,12,'_wc_rating_count','a:0:{}'),(149,12,'_wc_review_count','0'),(150,12,'_downloadable_files','a:0:{}'),(151,12,'_product_attributes','a:1:{s:8:\"pa_color\";a:6:{s:4:\"name\";s:8:\"pa_color\";s:5:\"value\";s:0:\"\";s:8:\"position\";i:0;s:10:\"is_visible\";i:1;s:12:\"is_variation\";i:0;s:11:\"is_taxonomy\";i:1;}}'),(152,12,'_product_version','3.5.3'),(153,12,'_price','18'),(154,12,'_thumbnail_id','38'),(155,13,'_sku','woo-beanie'),(156,13,'_regular_price','20'),(157,13,'_sale_price','18'),(158,13,'_sale_price_dates_from',''),(159,13,'_sale_price_dates_to',''),(160,13,'total_sales','0'),(161,13,'_tax_status','taxable'),(162,13,'_tax_class',''),(163,13,'_manage_stock','no'),(164,13,'_backorders','no'),(165,13,'_low_stock_amount',''),(166,13,'_sold_individually','no'),(167,13,'_weight',''),(168,13,'_length',''),(169,13,'_width',''),(170,13,'_height',''),(171,13,'_upsell_ids','a:0:{}'),(172,13,'_crosssell_ids','a:0:{}'),(173,13,'_purchase_note',''),(174,13,'_default_attributes','a:0:{}'),(175,13,'_virtual','no'),(176,13,'_downloadable','no'),(177,13,'_product_image_gallery',''),(178,13,'_download_limit','0'),(179,13,'_download_expiry','0'),(180,13,'_stock',''),(181,13,'_stock_status','instock'),(182,13,'_wc_average_rating','0'),(183,13,'_wc_rating_count','a:0:{}'),(184,13,'_wc_review_count','0'),(185,13,'_downloadable_files','a:0:{}'),(186,13,'_product_attributes','a:1:{s:8:\"pa_color\";a:6:{s:4:\"name\";s:8:\"pa_color\";s:5:\"value\";s:0:\"\";s:8:\"position\";i:0;s:10:\"is_visible\";i:1;s:12:\"is_variation\";i:0;s:11:\"is_taxonomy\";i:1;}}'),(187,13,'_product_version','3.5.3'),(188,13,'_price','18'),(189,13,'_thumbnail_id','39'),(190,14,'_sku','woo-belt'),(191,14,'_regular_price','65'),(192,14,'_sale_price','55'),(193,14,'_sale_price_dates_from',''),(194,14,'_sale_price_dates_to',''),(195,14,'total_sales','0'),(196,14,'_tax_status','taxable'),(197,14,'_tax_class',''),(198,14,'_manage_stock','no'),(199,14,'_backorders','no'),(200,14,'_low_stock_amount',''),(201,14,'_sold_individually','no'),(202,14,'_weight',''),(203,14,'_length',''),(204,14,'_width',''),(205,14,'_height',''),(206,14,'_upsell_ids','a:0:{}'),(207,14,'_crosssell_ids','a:0:{}'),(208,14,'_purchase_note',''),(209,14,'_default_attributes','a:0:{}'),(210,14,'_virtual','no'),(211,14,'_downloadable','no'),(212,14,'_product_image_gallery',''),(213,14,'_download_limit','0'),(214,14,'_download_expiry','0'),(215,14,'_stock',''),(216,14,'_stock_status','instock'),(217,14,'_wc_average_rating','0'),(218,14,'_wc_rating_count','a:0:{}'),(219,14,'_wc_review_count','0'),(220,14,'_downloadable_files','a:0:{}'),(221,14,'_product_attributes','a:0:{}'),(222,14,'_product_version','3.5.3'),(223,14,'_price','55'),(224,14,'_thumbnail_id','40'),(225,15,'_sku','woo-cap'),(226,15,'_regular_price','18'),(227,15,'_sale_price','16'),(228,15,'_sale_price_dates_from',''),(229,15,'_sale_price_dates_to',''),(230,15,'total_sales','0'),(231,15,'_tax_status','taxable'),(232,15,'_tax_class',''),(233,15,'_manage_stock','no'),(234,15,'_backorders','no'),(235,15,'_low_stock_amount',''),(236,15,'_sold_individually','no'),(237,15,'_weight',''),(238,15,'_length',''),(239,15,'_width',''),(240,15,'_height',''),(241,15,'_upsell_ids','a:0:{}'),(242,15,'_crosssell_ids','a:0:{}'),(243,15,'_purchase_note',''),(244,15,'_default_attributes','a:0:{}'),(245,15,'_virtual','no'),(246,15,'_downloadable','no'),(247,15,'_product_image_gallery',''),(248,15,'_download_limit','0'),(249,15,'_download_expiry','0'),(250,15,'_stock',''),(251,15,'_stock_status','instock'),(252,15,'_wc_average_rating','0'),(253,15,'_wc_rating_count','a:0:{}'),(254,15,'_wc_review_count','0'),(255,15,'_downloadable_files','a:0:{}'),(256,15,'_product_attributes','a:1:{s:8:\"pa_color\";a:6:{s:4:\"name\";s:8:\"pa_color\";s:5:\"value\";s:0:\"\";s:8:\"position\";i:0;s:10:\"is_visible\";i:1;s:12:\"is_variation\";i:0;s:11:\"is_taxonomy\";i:1;}}'),(257,15,'_product_version','3.5.3'),(258,15,'_price','16'),(259,15,'_thumbnail_id','41'),(260,16,'_sku','woo-sunglasses'),(261,16,'_regular_price','90'),(262,16,'_sale_price',''),(263,16,'_sale_price_dates_from',''),(264,16,'_sale_price_dates_to',''),(265,16,'total_sales','0'),(266,16,'_tax_status','taxable'),(267,16,'_tax_class',''),(268,16,'_manage_stock','no'),(269,16,'_backorders','no'),(270,16,'_low_stock_amount',''),(271,16,'_sold_individually','no'),(272,16,'_weight',''),(273,16,'_length',''),(274,16,'_width',''),(275,16,'_height',''),(276,16,'_upsell_ids','a:0:{}'),(277,16,'_crosssell_ids','a:0:{}'),(278,16,'_purchase_note',''),(279,16,'_default_attributes','a:0:{}'),(280,16,'_virtual','no'),(281,16,'_downloadable','no'),(282,16,'_product_image_gallery',''),(283,16,'_download_limit','0'),(284,16,'_download_expiry','0'),(285,16,'_stock',''),(286,16,'_stock_status','instock'),(287,16,'_wc_average_rating','0'),(288,16,'_wc_rating_count','a:0:{}'),(289,16,'_wc_review_count','0'),(290,16,'_downloadable_files','a:0:{}'),(291,16,'_product_attributes','a:0:{}'),(292,16,'_product_version','3.5.3'),(293,16,'_price','90'),(294,16,'_thumbnail_id','42'),(295,17,'_sku','woo-hoodie-with-pocket'),(296,17,'_regular_price','45'),(297,17,'_sale_price','35'),(298,17,'_sale_price_dates_from',''),(299,17,'_sale_price_dates_to',''),(300,17,'total_sales','0'),(301,17,'_tax_status','taxable'),(302,17,'_tax_class',''),(303,17,'_manage_stock','no'),(304,17,'_backorders','no'),(305,17,'_low_stock_amount',''),(306,17,'_sold_individually','no'),(307,17,'_weight',''),(308,17,'_length',''),(309,17,'_width',''),(310,17,'_height',''),(311,17,'_upsell_ids','a:0:{}'),(312,17,'_crosssell_ids','a:0:{}'),(313,17,'_purchase_note',''),(314,17,'_default_attributes','a:0:{}'),(315,17,'_virtual','no'),(316,17,'_downloadable','no'),(317,17,'_product_image_gallery',''),(318,17,'_download_limit','0'),(319,17,'_download_expiry','0'),(320,17,'_stock',''),(321,17,'_stock_status','instock'),(322,17,'_wc_average_rating','0'),(323,17,'_wc_rating_count','a:0:{}'),(324,17,'_wc_review_count','0'),(325,17,'_downloadable_files','a:0:{}'),(326,17,'_product_attributes','a:1:{s:8:\"pa_color\";a:6:{s:4:\"name\";s:8:\"pa_color\";s:5:\"value\";s:0:\"\";s:8:\"position\";i:0;s:10:\"is_visible\";i:1;s:12:\"is_variation\";i:0;s:11:\"is_taxonomy\";i:1;}}'),(327,17,'_product_version','3.5.3'),(328,17,'_price','35'),(329,17,'_thumbnail_id','43'),(330,18,'_sku','woo-hoodie-with-zipper'),(331,18,'_regular_price','45'),(332,18,'_sale_price',''),(333,18,'_sale_price_dates_from',''),(334,18,'_sale_price_dates_to',''),(335,18,'total_sales','0'),(336,18,'_tax_status','taxable'),(337,18,'_tax_class',''),(338,18,'_manage_stock','no'),(339,18,'_backorders','no'),(340,18,'_low_stock_amount',''),(341,18,'_sold_individually','no'),(342,18,'_weight',''),(343,18,'_length',''),(344,18,'_width',''),(345,18,'_height',''),(346,18,'_upsell_ids','a:0:{}'),(347,18,'_crosssell_ids','a:0:{}'),(348,18,'_purchase_note',''),(349,18,'_default_attributes','a:0:{}'),(350,18,'_virtual','no'),(351,18,'_downloadable','no'),(352,18,'_product_image_gallery',''),(353,18,'_download_limit','0'),(354,18,'_download_expiry','0'),(355,18,'_stock',''),(356,18,'_stock_status','instock'),(357,18,'_wc_average_rating','0'),(358,18,'_wc_rating_count','a:0:{}'),(359,18,'_wc_review_count','0'),(360,18,'_downloadable_files','a:0:{}'),(361,18,'_product_attributes','a:0:{}'),(362,18,'_product_version','3.5.3'),(363,18,'_price','45'),(364,18,'_thumbnail_id','44'),(365,19,'_sku','woo-long-sleeve-tee'),(366,19,'_regular_price','25'),(367,19,'_sale_price',''),(368,19,'_sale_price_dates_from',''),(369,19,'_sale_price_dates_to',''),(370,19,'total_sales','0'),(371,19,'_tax_status','taxable'),(372,19,'_tax_class',''),(373,19,'_manage_stock','no'),(374,19,'_backorders','no'),(375,19,'_low_stock_amount',''),(376,19,'_sold_individually','no'),(377,19,'_weight',''),(378,19,'_length',''),(379,19,'_width',''),(380,19,'_height',''),(381,19,'_upsell_ids','a:0:{}'),(382,19,'_crosssell_ids','a:0:{}'),(383,19,'_purchase_note',''),(384,19,'_default_attributes','a:0:{}'),(385,19,'_virtual','no'),(386,19,'_downloadable','no'),(387,19,'_product_image_gallery',''),(388,19,'_download_limit','0'),(389,19,'_download_expiry','0'),(390,19,'_stock',''),(391,19,'_stock_status','instock'),(392,19,'_wc_average_rating','0'),(393,19,'_wc_rating_count','a:0:{}'),(394,19,'_wc_review_count','0'),(395,19,'_downloadable_files','a:0:{}'),(396,19,'_product_attributes','a:1:{s:8:\"pa_color\";a:6:{s:4:\"name\";s:8:\"pa_color\";s:5:\"value\";s:0:\"\";s:8:\"position\";i:0;s:10:\"is_visible\";i:1;s:12:\"is_variation\";i:0;s:11:\"is_taxonomy\";i:1;}}'),(397,19,'_product_version','3.5.3'),(398,19,'_price','25'),(399,19,'_thumbnail_id','45'),(400,20,'_sku','woo-polo'),(401,20,'_regular_price','20'),(402,20,'_sale_price',''),(403,20,'_sale_price_dates_from',''),(404,20,'_sale_price_dates_to',''),(405,20,'total_sales','0'),(406,20,'_tax_status','taxable'),(407,20,'_tax_class',''),(408,20,'_manage_stock','no'),(409,20,'_backorders','no'),(410,20,'_low_stock_amount',''),(411,20,'_sold_individually','no'),(412,20,'_weight',''),(413,20,'_length',''),(414,20,'_width',''),(415,20,'_height',''),(416,20,'_upsell_ids','a:0:{}'),(417,20,'_crosssell_ids','a:0:{}'),(418,20,'_purchase_note',''),(419,20,'_default_attributes','a:0:{}'),(420,20,'_virtual','no'),(421,20,'_downloadable','no'),(422,20,'_product_image_gallery',''),(423,20,'_download_limit','0'),(424,20,'_download_expiry','0'),(425,20,'_stock',''),(426,20,'_stock_status','instock'),(427,20,'_wc_average_rating','0'),(428,20,'_wc_rating_count','a:0:{}'),(429,20,'_wc_review_count','0'),(430,20,'_downloadable_files','a:0:{}'),(431,20,'_product_attributes','a:1:{s:8:\"pa_color\";a:6:{s:4:\"name\";s:8:\"pa_color\";s:5:\"value\";s:0:\"\";s:8:\"position\";i:0;s:10:\"is_visible\";i:1;s:12:\"is_variation\";i:0;s:11:\"is_taxonomy\";i:1;}}'),(432,20,'_product_version','3.5.3'),(433,20,'_price','20'),(434,20,'_thumbnail_id','46'),(435,21,'_sku','woo-album'),(436,21,'_regular_price','15'),(437,21,'_sale_price',''),(438,21,'_sale_price_dates_from',''),(439,21,'_sale_price_dates_to',''),(440,21,'total_sales','0'),(441,21,'_tax_status','taxable'),(442,21,'_tax_class',''),(443,21,'_manage_stock','no'),(444,21,'_backorders','no'),(445,21,'_low_stock_amount',''),(446,21,'_sold_individually','no'),(447,21,'_weight',''),(448,21,'_length',''),(449,21,'_width',''),(450,21,'_height',''),(451,21,'_upsell_ids','a:0:{}'),(452,21,'_crosssell_ids','a:0:{}'),(453,21,'_purchase_note',''),(454,21,'_default_attributes','a:0:{}'),(455,21,'_virtual','yes'),(456,21,'_downloadable','yes'),(457,21,'_product_image_gallery',''),(458,21,'_download_limit','1'),(459,21,'_download_expiry','1'),(460,21,'_stock',''),(461,21,'_stock_status','instock'),(462,21,'_wc_average_rating','0'),(463,21,'_wc_rating_count','a:0:{}'),(464,21,'_wc_review_count','0'),(465,21,'_downloadable_files','a:2:{s:36:\"356506a5-cc15-41b9-801b-9104dda1702c\";a:3:{s:2:\"id\";s:36:\"356506a5-cc15-41b9-801b-9104dda1702c\";s:4:\"name\";s:8:\"Single 1\";s:4:\"file\";s:85:\"https://demo.woothemes.com/woocommerce/wp-content/uploads/sites/56/2017/08/single.jpg\";}s:36:\"18e70c59-59f3-43a3-8525-ce1ea0c12943\";a:3:{s:2:\"id\";s:36:\"18e70c59-59f3-43a3-8525-ce1ea0c12943\";s:4:\"name\";s:8:\"Single 2\";s:4:\"file\";s:84:\"https://demo.woothemes.com/woocommerce/wp-content/uploads/sites/56/2017/08/album.jpg\";}}'),(466,21,'_product_attributes','a:0:{}'),(467,21,'_product_version','3.5.3'),(468,21,'_price','15'),(469,21,'_thumbnail_id','47'),(470,22,'_sku','woo-single'),(471,22,'_regular_price','3'),(472,22,'_sale_price','2'),(473,22,'_sale_price_dates_from',''),(474,22,'_sale_price_dates_to',''),(475,22,'total_sales','0'),(476,22,'_tax_status','taxable'),(477,22,'_tax_class',''),(478,22,'_manage_stock','no'),(479,22,'_backorders','no'),(480,22,'_low_stock_amount',''),(481,22,'_sold_individually','no'),(482,22,'_weight',''),(483,22,'_length',''),(484,22,'_width',''),(485,22,'_height',''),(486,22,'_upsell_ids','a:0:{}'),(487,22,'_crosssell_ids','a:0:{}'),(488,22,'_purchase_note',''),(489,22,'_default_attributes','a:0:{}'),(490,22,'_virtual','yes'),(491,22,'_downloadable','yes'),(492,22,'_product_image_gallery',''),(493,22,'_download_limit','1'),(494,22,'_download_expiry','1'),(495,22,'_stock',''),(496,22,'_stock_status','instock'),(497,22,'_wc_average_rating','0'),(498,22,'_wc_rating_count','a:0:{}'),(499,22,'_wc_review_count','0'),(500,22,'_downloadable_files','a:1:{s:36:\"a0fdda89-5f0e-440d-93f5-188e12c910d1\";a:3:{s:2:\"id\";s:36:\"a0fdda89-5f0e-440d-93f5-188e12c910d1\";s:4:\"name\";s:6:\"Single\";s:4:\"file\";s:85:\"https://demo.woothemes.com/woocommerce/wp-content/uploads/sites/56/2017/08/single.jpg\";}}'),(501,22,'_product_attributes','a:0:{}'),(502,22,'_product_version','3.5.3'),(503,22,'_price','2'),(504,22,'_thumbnail_id','48'),(505,23,'_sku','woo-vneck-tee-red'),(506,23,'_regular_price','20'),(507,23,'_sale_price',''),(508,23,'_sale_price_dates_from',''),(509,23,'_sale_price_dates_to',''),(510,23,'total_sales','0'),(511,23,'_tax_status','taxable'),(512,23,'_tax_class',''),(513,23,'_manage_stock','no'),(514,23,'_backorders','no'),(515,23,'_low_stock_amount',''),(516,23,'_sold_individually','no'),(517,23,'_weight',''),(518,23,'_length',''),(519,23,'_width',''),(520,23,'_height',''),(521,23,'_upsell_ids','a:0:{}'),(522,23,'_crosssell_ids','a:0:{}'),(523,23,'_purchase_note',''),(524,23,'_default_attributes','a:0:{}'),(525,23,'_virtual','no'),(526,23,'_downloadable','no'),(527,23,'_product_image_gallery',''),(528,23,'_download_limit','0'),(529,23,'_download_expiry','0'),(530,23,'_stock',''),(531,23,'_stock_status','instock'),(532,23,'_wc_average_rating','0'),(533,23,'_wc_rating_count','a:0:{}'),(534,23,'_wc_review_count','0'),(535,23,'_downloadable_files','a:0:{}'),(536,23,'_product_attributes','a:0:{}'),(537,23,'_product_version','3.5.3'),(538,23,'_price','20'),(539,23,'_variation_description','Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum sagittis orci ac odio dictum tincidunt. Donec ut metus leo. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Sed luctus, dui eu sagittis sodales, nulla nibh sagittis augue, vel porttitor diam enim non metus. Vestibulum aliquam augue neque. Phasellus tincidunt odio eget ullamcorper efficitur. Cras placerat ut turpis pellentesque vulputate. Nam sed consequat tortor. Curabitur finibus sapien dolor. Ut eleifend tellus nec erat pulvinar dignissim. Nam non arcu purus. Vivamus et massa massa.'),(540,23,'_thumbnail_id','31'),(541,23,'attribute_pa_color','red'),(542,23,'attribute_pa_size',''),(543,24,'_sku','woo-vneck-tee-green'),(544,24,'_regular_price','20'),(545,24,'_sale_price',''),(546,24,'_sale_price_dates_from',''),(547,24,'_sale_price_dates_to',''),(548,24,'total_sales','0'),(549,24,'_tax_status','taxable'),(550,24,'_tax_class',''),(551,24,'_manage_stock','no'),(552,24,'_backorders','no'),(553,24,'_low_stock_amount',''),(554,24,'_sold_individually','no'),(555,24,'_weight',''),(556,24,'_length',''),(557,24,'_width',''),(558,24,'_height',''),(559,24,'_upsell_ids','a:0:{}'),(560,24,'_crosssell_ids','a:0:{}'),(561,24,'_purchase_note',''),(562,24,'_default_attributes','a:0:{}'),(563,24,'_virtual','no'),(564,24,'_downloadable','no'),(565,24,'_product_image_gallery',''),(566,24,'_download_limit','0'),(567,24,'_download_expiry','0'),(568,24,'_stock',''),(569,24,'_stock_status','instock'),(570,24,'_wc_average_rating','0'),(571,24,'_wc_rating_count','a:0:{}'),(572,24,'_wc_review_count','0'),(573,24,'_downloadable_files','a:0:{}'),(574,24,'_product_attributes','a:0:{}'),(575,24,'_product_version','3.5.3'),(576,24,'_price','20'),(577,24,'_variation_description','Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum sagittis orci ac odio dictum tincidunt. Donec ut metus leo. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Sed luctus, dui eu sagittis sodales, nulla nibh sagittis augue, vel porttitor diam enim non metus. Vestibulum aliquam augue neque. Phasellus tincidunt odio eget ullamcorper efficitur. Cras placerat ut turpis pellentesque vulputate. Nam sed consequat tortor. Curabitur finibus sapien dolor. Ut eleifend tellus nec erat pulvinar dignissim. Nam non arcu purus. Vivamus et massa massa.'),(578,24,'_thumbnail_id','32'),(579,24,'attribute_pa_color','green'),(580,24,'attribute_pa_size',''),(581,25,'_sku','woo-vneck-tee-blue'),(582,25,'_regular_price','15'),(583,25,'_sale_price',''),(584,25,'_sale_price_dates_from',''),(585,25,'_sale_price_dates_to',''),(586,25,'total_sales','0'),(587,25,'_tax_status','taxable'),(588,25,'_tax_class',''),(589,25,'_manage_stock','no'),(590,25,'_backorders','no'),(591,25,'_low_stock_amount',''),(592,25,'_sold_individually','no'),(593,25,'_weight',''),(594,25,'_length',''),(595,25,'_width',''),(596,25,'_height',''),(597,25,'_upsell_ids','a:0:{}'),(598,25,'_crosssell_ids','a:0:{}'),(599,25,'_purchase_note',''),(600,25,'_default_attributes','a:0:{}'),(601,25,'_virtual','no'),(602,25,'_downloadable','no'),(603,25,'_product_image_gallery',''),(604,25,'_download_limit','0'),(605,25,'_download_expiry','0'),(606,25,'_stock',''),(607,25,'_stock_status','instock'),(608,25,'_wc_average_rating','0'),(609,25,'_wc_rating_count','a:0:{}'),(610,25,'_wc_review_count','0'),(611,25,'_downloadable_files','a:0:{}'),(612,25,'_product_attributes','a:0:{}'),(613,25,'_product_version','3.5.3'),(614,25,'_price','15'),(615,25,'_wpcom_is_markdown',''),(616,25,'_wp_old_slug','import-placeholder-for-78'),(617,25,'_variation_description','Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum sagittis orci ac odio dictum tincidunt. Donec ut metus leo. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Sed luctus, dui eu sagittis sodales, nulla nibh sagittis augue, vel porttitor diam enim non metus. Vestibulum aliquam augue neque. Phasellus tincidunt odio eget ullamcorper efficitur. Cras placerat ut turpis pellentesque vulputate. Nam sed consequat tortor. Curabitur finibus sapien dolor. Ut eleifend tellus nec erat pulvinar dignissim. Nam non arcu purus. Vivamus et massa massa.'),(618,25,'_thumbnail_id','33'),(619,25,'attribute_pa_color','blue'),(620,25,'attribute_pa_size',''),(621,26,'_sku','woo-hoodie-red'),(622,26,'_regular_price','45'),(623,26,'_sale_price','42'),(624,26,'_sale_price_dates_from',''),(625,26,'_sale_price_dates_to',''),(626,26,'total_sales','0'),(627,26,'_tax_status','taxable'),(628,26,'_tax_class',''),(629,26,'_manage_stock','no'),(630,26,'_backorders','no'),(631,26,'_low_stock_amount',''),(632,26,'_sold_individually','no'),(633,26,'_weight',''),(634,26,'_length',''),(635,26,'_width',''),(636,26,'_height',''),(637,26,'_upsell_ids','a:0:{}'),(638,26,'_crosssell_ids','a:0:{}'),(639,26,'_purchase_note',''),(640,26,'_default_attributes','a:0:{}'),(641,26,'_virtual','no'),(642,26,'_downloadable','no'),(643,26,'_product_image_gallery',''),(644,26,'_download_limit','0'),(645,26,'_download_expiry','0'),(646,26,'_stock',''),(647,26,'_stock_status','instock'),(648,26,'_wc_average_rating','0'),(649,26,'_wc_rating_count','a:0:{}'),(650,26,'_wc_review_count','0'),(651,26,'_downloadable_files','a:0:{}'),(652,26,'_product_attributes','a:0:{}'),(653,26,'_product_version','3.5.3'),(654,26,'_price','42'),(655,26,'_variation_description','Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum sagittis orci ac odio dictum tincidunt. Donec ut metus leo. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Sed luctus, dui eu sagittis sodales, nulla nibh sagittis augue, vel porttitor diam enim non metus. Vestibulum aliquam augue neque. Phasellus tincidunt odio eget ullamcorper efficitur. Cras placerat ut turpis pellentesque vulputate. Nam sed consequat tortor. Curabitur finibus sapien dolor. Ut eleifend tellus nec erat pulvinar dignissim. Nam non arcu purus. Vivamus et massa massa.'),(656,26,'_thumbnail_id','34'),(657,26,'attribute_pa_color','red'),(658,26,'attribute_logo','No'),(659,27,'_sku','woo-hoodie-green'),(660,27,'_regular_price','45'),(661,27,'_sale_price',''),(662,27,'_sale_price_dates_from',''),(663,27,'_sale_price_dates_to',''),(664,27,'total_sales','0'),(665,27,'_tax_status','taxable'),(666,27,'_tax_class',''),(667,27,'_manage_stock','no'),(668,27,'_backorders','no'),(669,27,'_low_stock_amount',''),(670,27,'_sold_individually','no'),(671,27,'_weight',''),(672,27,'_length',''),(673,27,'_width',''),(674,27,'_height',''),(675,27,'_upsell_ids','a:0:{}'),(676,27,'_crosssell_ids','a:0:{}'),(677,27,'_purchase_note',''),(678,27,'_default_attributes','a:0:{}'),(679,27,'_virtual','no'),(680,27,'_downloadable','no'),(681,27,'_product_image_gallery',''),(682,27,'_download_limit','0'),(683,27,'_download_expiry','0'),(684,27,'_stock',''),(685,27,'_stock_status','instock'),(686,27,'_wc_average_rating','0'),(687,27,'_wc_rating_count','a:0:{}'),(688,27,'_wc_review_count','0'),(689,27,'_downloadable_files','a:0:{}'),(690,27,'_product_attributes','a:0:{}'),(691,27,'_product_version','3.5.3'),(692,27,'_price','45'),(693,27,'_variation_description','Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum sagittis orci ac odio dictum tincidunt. Donec ut metus leo. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Sed luctus, dui eu sagittis sodales, nulla nibh sagittis augue, vel porttitor diam enim non metus. Vestibulum aliquam augue neque. Phasellus tincidunt odio eget ullamcorper efficitur. Cras placerat ut turpis pellentesque vulputate. Nam sed consequat tortor. Curabitur finibus sapien dolor. Ut eleifend tellus nec erat pulvinar dignissim. Nam non arcu purus. Vivamus et massa massa.'),(694,27,'_thumbnail_id','36'),(695,27,'attribute_pa_color','green'),(696,27,'attribute_logo','No'),(697,28,'_sku','woo-hoodie-blue'),(698,28,'_regular_price','45'),(699,28,'_sale_price',''),(700,28,'_sale_price_dates_from',''),(701,28,'_sale_price_dates_to',''),(702,28,'total_sales','0'),(703,28,'_tax_status','taxable'),(704,28,'_tax_class',''),(705,28,'_manage_stock','no'),(706,28,'_backorders','no'),(707,28,'_low_stock_amount',''),(708,28,'_sold_individually','no'),(709,28,'_weight',''),(710,28,'_length',''),(711,28,'_width',''),(712,28,'_height',''),(713,28,'_upsell_ids','a:0:{}'),(714,28,'_crosssell_ids','a:0:{}'),(715,28,'_purchase_note',''),(716,28,'_default_attributes','a:0:{}'),(717,28,'_virtual','no'),(718,28,'_downloadable','no'),(719,28,'_product_image_gallery',''),(720,28,'_download_limit','0'),(721,28,'_download_expiry','0'),(722,28,'_stock',''),(723,28,'_stock_status','instock'),(724,28,'_wc_average_rating','0'),(725,28,'_wc_rating_count','a:0:{}'),(726,28,'_wc_review_count','0'),(727,28,'_downloadable_files','a:0:{}'),(728,28,'_product_attributes','a:0:{}'),(729,28,'_product_version','3.5.3'),(730,28,'_price','45'),(731,28,'_variation_description','Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum sagittis orci ac odio dictum tincidunt. Donec ut metus leo. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Sed luctus, dui eu sagittis sodales, nulla nibh sagittis augue, vel porttitor diam enim non metus. Vestibulum aliquam augue neque. Phasellus tincidunt odio eget ullamcorper efficitur. Cras placerat ut turpis pellentesque vulputate. Nam sed consequat tortor. Curabitur finibus sapien dolor. Ut eleifend tellus nec erat pulvinar dignissim. Nam non arcu purus. Vivamus et massa massa.'),(732,28,'_thumbnail_id','35'),(733,28,'attribute_pa_color','blue'),(734,28,'attribute_logo','No'),(735,29,'_sku','Woo-tshirt-logo'),(736,29,'_regular_price','18'),(737,29,'_sale_price',''),(738,29,'_sale_price_dates_from',''),(739,29,'_sale_price_dates_to',''),(740,29,'total_sales','0'),(741,29,'_tax_status','taxable'),(742,29,'_tax_class',''),(743,29,'_manage_stock','no'),(744,29,'_backorders','no'),(745,29,'_low_stock_amount',''),(746,29,'_sold_individually','no'),(747,29,'_weight',''),(748,29,'_length',''),(749,29,'_width',''),(750,29,'_height',''),(751,29,'_upsell_ids','a:0:{}'),(752,29,'_crosssell_ids','a:0:{}'),(753,29,'_purchase_note',''),(754,29,'_default_attributes','a:0:{}'),(755,29,'_virtual','no'),(756,29,'_downloadable','no'),(757,29,'_product_image_gallery',''),(758,29,'_download_limit','0'),(759,29,'_download_expiry','0'),(760,29,'_stock',''),(761,29,'_stock_status','instock'),(762,29,'_wc_average_rating','0'),(763,29,'_wc_rating_count','a:0:{}'),(764,29,'_wc_review_count','0'),(765,29,'_downloadable_files','a:0:{}'),(766,29,'_product_attributes','a:1:{s:8:\"pa_color\";a:6:{s:4:\"name\";s:8:\"pa_color\";s:5:\"value\";s:0:\"\";s:8:\"position\";i:0;s:10:\"is_visible\";i:1;s:12:\"is_variation\";i:0;s:11:\"is_taxonomy\";i:1;}}'),(767,29,'_product_version','3.5.3'),(768,29,'_price','18'),(769,29,'_thumbnail_id','49'),(770,30,'_sku','Woo-beanie-logo'),(771,30,'_regular_price','20'),(772,30,'_sale_price','18'),(773,30,'_sale_price_dates_from',''),(774,30,'_sale_price_dates_to',''),(775,30,'total_sales','0'),(776,30,'_tax_status','taxable'),(777,30,'_tax_class',''),(778,30,'_manage_stock','no'),(779,30,'_backorders','no'),(780,30,'_low_stock_amount',''),(781,30,'_sold_individually','no'),(782,30,'_weight',''),(783,30,'_length',''),(784,30,'_width',''),(785,30,'_height',''),(786,30,'_upsell_ids','a:0:{}'),(787,30,'_crosssell_ids','a:0:{}'),(788,30,'_purchase_note',''),(789,30,'_default_attributes','a:0:{}'),(790,30,'_virtual','no'),(791,30,'_downloadable','no'),(792,30,'_product_image_gallery',''),(793,30,'_download_limit','0'),(794,30,'_download_expiry','0'),(795,30,'_stock',''),(796,30,'_stock_status','instock'),(797,30,'_wc_average_rating','0'),(798,30,'_wc_rating_count','a:0:{}'),(799,30,'_wc_review_count','0'),(800,30,'_downloadable_files','a:0:{}'),(801,30,'_product_attributes','a:1:{s:8:\"pa_color\";a:6:{s:4:\"name\";s:8:\"pa_color\";s:5:\"value\";s:0:\"\";s:8:\"position\";i:0;s:10:\"is_visible\";i:1;s:12:\"is_variation\";i:0;s:11:\"is_taxonomy\";i:1;}}'),(802,30,'_product_version','3.5.3'),(803,30,'_price','18'),(804,30,'_thumbnail_id','50'),(805,31,'_sku','logo-collection'),(806,31,'_sale_price_dates_from',''),(807,31,'_sale_price_dates_to',''),(808,31,'total_sales','0'),(809,31,'_tax_status','taxable'),(810,31,'_tax_class',''),(811,31,'_manage_stock','no'),(812,31,'_backorders','no'),(813,31,'_low_stock_amount',''),(814,31,'_sold_individually','no'),(815,31,'_weight',''),(816,31,'_length',''),(817,31,'_width',''),(818,31,'_height',''),(819,31,'_upsell_ids','a:0:{}'),(820,31,'_crosssell_ids','a:0:{}'),(821,31,'_purchase_note',''),(822,31,'_default_attributes','a:0:{}'),(823,31,'_virtual','no'),(824,31,'_downloadable','no'),(825,31,'_product_image_gallery','50,49,37'),(826,31,'_download_limit','0'),(827,31,'_download_expiry','0'),(828,31,'_stock',''),(829,31,'_stock_status','instock'),(830,31,'_wc_average_rating','0'),(831,31,'_wc_rating_count','a:0:{}'),(832,31,'_wc_review_count','0'),(833,31,'_downloadable_files','a:0:{}'),(834,31,'_product_attributes','a:0:{}'),(835,31,'_product_version','3.5.3'),(836,31,'_children','a:3:{i:0;i:8;i:1;i:9;i:2;i:10;}'),(837,31,'_thumbnail_id','51'),(838,31,'_price','18'),(839,31,'_price','45'),(840,32,'_sku','wp-pennant'),(841,32,'_regular_price','11.05'),(842,32,'_sale_price',''),(843,32,'_sale_price_dates_from',''),(844,32,'_sale_price_dates_to',''),(845,32,'total_sales','0'),(846,32,'_tax_status','taxable'),(847,32,'_tax_class',''),(848,32,'_manage_stock','no'),(849,32,'_backorders','no'),(850,32,'_low_stock_amount',''),(851,32,'_sold_individually','no'),(852,32,'_weight',''),(853,32,'_length',''),(854,32,'_width',''),(855,32,'_height',''),(856,32,'_upsell_ids','a:0:{}'),(857,32,'_crosssell_ids','a:0:{}'),(858,32,'_purchase_note',''),(859,32,'_default_attributes','a:0:{}'),(860,32,'_virtual','no'),(861,32,'_downloadable','no'),(862,32,'_product_image_gallery',''),(863,32,'_download_limit','0'),(864,32,'_download_expiry','0'),(865,32,'_stock',''),(866,32,'_stock_status','instock'),(867,32,'_wc_average_rating','0'),(868,32,'_wc_rating_count','a:0:{}'),(869,32,'_wc_review_count','0'),(870,32,'_downloadable_files','a:0:{}'),(871,32,'_product_attributes','a:0:{}'),(872,32,'_product_version','3.5.3'),(873,32,'_price','11.05'),(874,32,'_thumbnail_id','52'),(875,32,'_product_url','https://mercantile.wordpress.org/product/wordpress-pennant/'),(876,32,'_button_text','Buy on the WordPress swag store!'),(877,33,'_sku','woo-hoodie-blue-logo'),(878,33,'_regular_price','45'),(879,33,'_sale_price',''),(880,33,'_sale_price_dates_from',''),(881,33,'_sale_price_dates_to',''),(882,33,'total_sales','0'),(883,33,'_tax_status','taxable'),(884,33,'_tax_class',''),(885,33,'_manage_stock','no'),(886,33,'_backorders','no'),(887,33,'_low_stock_amount',''),(888,33,'_sold_individually','no'),(889,33,'_weight',''),(890,33,'_length',''),(891,33,'_width',''),(892,33,'_height',''),(893,33,'_upsell_ids','a:0:{}'),(894,33,'_crosssell_ids','a:0:{}'),(895,33,'_purchase_note',''),(896,33,'_default_attributes','a:0:{}'),(897,33,'_virtual','no'),(898,33,'_downloadable','no'),(899,33,'_product_image_gallery',''),(900,33,'_download_limit','0'),(901,33,'_download_expiry','0'),(902,33,'_stock',''),(903,33,'_stock_status','instock'),(904,33,'_wc_average_rating','0'),(905,33,'_wc_rating_count','a:0:{}'),(906,33,'_wc_review_count','0'),(907,33,'_downloadable_files','a:0:{}'),(908,33,'_product_attributes','a:0:{}'),(909,33,'_product_version','3.5.3'),(910,33,'_price','45'),(911,33,'_variation_description','Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum sagittis orci ac odio dictum tincidunt. Donec ut metus leo. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Sed luctus, dui eu sagittis sodales, nulla nibh sagittis augue, vel porttitor diam enim non metus. Vestibulum aliquam augue neque. Phasellus tincidunt odio eget ullamcorper efficitur. Cras placerat ut turpis pellentesque vulputate. Nam sed consequat tortor. Curabitur finibus sapien dolor. Ut eleifend tellus nec erat pulvinar dignissim. Nam non arcu purus. Vivamus et massa massa.'),(912,33,'_thumbnail_id','37'),(913,33,'attribute_pa_color','blue'),(914,33,'attribute_logo','Yes');
/*!40000 ALTER TABLE `wp_postmeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_posts`
--

DROP TABLE IF EXISTS `wp_posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_posts` (
  `ID` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `post_author` bigint(20) unsigned NOT NULL DEFAULT 0,
  `post_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `post_date_gmt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `post_content` longtext NOT NULL,
  `post_title` text NOT NULL,
  `post_excerpt` text NOT NULL,
  `post_status` varchar(20) NOT NULL DEFAULT 'publish',
  `comment_status` varchar(20) NOT NULL DEFAULT 'open',
  `ping_status` varchar(20) NOT NULL DEFAULT 'open',
  `post_password` varchar(255) NOT NULL DEFAULT '',
  `post_name` varchar(200) NOT NULL DEFAULT '',
  `to_ping` text NOT NULL,
  `pinged` text NOT NULL,
  `post_modified` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `post_modified_gmt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `post_content_filtered` longtext NOT NULL,
  `post_parent` bigint(20) unsigned NOT NULL DEFAULT 0,
  `guid` varchar(255) NOT NULL DEFAULT '',
  `menu_order` int(11) NOT NULL DEFAULT 0,
  `post_type` varchar(20) NOT NULL DEFAULT 'post',
  `post_mime_type` varchar(100) NOT NULL DEFAULT '',
  `comment_count` bigint(20) NOT NULL DEFAULT 0,
  PRIMARY KEY (`ID`),
  KEY `post_name` (`post_name`(191)),
  KEY `type_status_date` (`post_type`,`post_status`,`post_date`,`ID`),
  KEY `post_parent` (`post_parent`),
  KEY `post_author` (`post_author`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_posts`
--

LOCK TABLES `wp_posts` WRITE;
/*!40000 ALTER TABLE `wp_posts` DISABLE KEYS */;
INSERT INTO `wp_posts` VALUES (1,1,'2025-01-01 00:00:00','2025-01-01 00:00:00','<!-- wp:paragraph -->\n<p>Welcome to WordPress. This is your first post. Edit or delete it, then start writing!</p>\n<!-- /wp:paragraph -->','Hello world!','','publish','open','open','','hello-world','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'http://localhost:9002/?p=1',0,'post','',1),(2,1,'2025-01-01 00:00:00','2025-01-01 00:00:00','<!-- wp:paragraph -->\n<p>This is an example page. It\'s different from a blog post because it will stay in one place and will show up in your site navigation (in most themes). Most people start with an About page that introduces them to potential site visitors. It might say something like this:</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:quote -->\n<blockquote class=\"wp-block-quote\"><p>Hi there! I\'m a bike messenger by day, aspiring actor by night, and this is my website. I live in Los Angeles, have a great dog named Jack, and I like pi&#241;a coladas. (And gettin\' caught in the rain.)</p></blockquote>\n<!-- /wp:quote -->\n\n<!-- wp:paragraph -->\n<p>...or something like this:</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:quote -->\n<blockquote class=\"wp-block-quote\"><p>The XYZ Doohickey Company was founded in 1971, and has been providing quality doohickeys to the public ever since. Located in Gotham City, XYZ employs over 2,000 people and does all kinds of awesome things for the Gotham community.</p></blockquote>\n<!-- /wp:quote -->\n\n<!-- wp:paragraph -->\n<p>As a new WordPress user, you should go to <a href=\"http://localhost:9002/wp-admin/\">your dashboard</a> to delete this page and create new pages for your content. Have fun!</p>\n<!-- /wp:paragraph -->','Sample Page','','publish','closed','open','','sample-page','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'http://localhost:9002/?page_id=2',0,'page','',0),(3,1,'2025-01-01 00:00:00','2025-01-01 00:00:00','<!-- wp:heading --><h2>Who we are</h2><!-- /wp:heading --><!-- wp:paragraph --><p>Our website address is: http://localhost:9002.</p><!-- /wp:paragraph --><!-- wp:heading --><h2>What personal data we collect and why we collect it</h2><!-- /wp:heading --><!-- wp:heading {\"level\":3} --><h3>Comments</h3><!-- /wp:heading --><!-- wp:paragraph --><p>When visitors leave comments on the site we collect the data shown in the comments form, and also the visitor&#8217;s IP address and browser user agent string to help spam detection.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>An anonymized string created from your email address (also called a hash) may be provided to the Gravatar service to see if you are using it. The Gravatar service privacy policy is available here: https://automattic.com/privacy/. After approval of your comment, your profile picture is visible to the public in the context of your comment.</p><!-- /wp:paragraph --><!-- wp:heading {\"level\":3} --><h3>Media</h3><!-- /wp:heading --><!-- wp:paragraph --><p>If you upload images to the website, you should avoid uploading images with embedded location data (EXIF GPS) included. Visitors to the website can download and extract any location data from images on the website.</p><!-- /wp:paragraph --><!-- wp:heading {\"level\":3} --><h3>Contact forms</h3><!-- /wp:heading --><!-- wp:heading {\"level\":3} --><h3>Cookies</h3><!-- /wp:heading --><!-- wp:paragraph --><p>If you leave a comment on our site you may opt-in to saving your name, email address and website in cookies. These are for your convenience so that you do not have to fill in your details again when you leave another comment. These cookies will last for one year.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>If you visit our login page, we will set a temporary cookie to determine if your browser accepts cookies. This cookie contains no personal data and is discarded when you close your browser.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>When you log in, we will also set up several cookies to save your login information and your screen display choices. Login cookies last for two days, and screen options cookies last for a year. If you select &quot;Remember Me&quot;, your login will persist for two weeks. If you log out of your account, the login cookies will be removed.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>If you edit or publish an article, an additional cookie will be saved in your browser. This cookie includes no personal data and simply indicates the post ID of the article you just edited. It expires after 1 day.</p><!-- /wp:paragraph --><!-- wp:heading {\"level\":3} --><h3>Embedded content from other websites</h3><!-- /wp:heading --><!-- wp:paragraph --><p>Articles on this site may include embedded content (e.g. videos, images, articles, etc.). Embedded content from other websites behaves in the exact same way as if the visitor has visited the other website.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>These websites may collect data about you, use cookies, embed additional third-party tracking, and monitor your interaction with that embedded content, including tracking your interaction with the embedded content if you have an account and are logged in to that website.</p><!-- /wp:paragraph --><!-- wp:heading {\"level\":3} --><h3>Analytics</h3><!-- /wp:heading --><!-- wp:heading --><h2>Who we share your data with</h2><!-- /wp:heading --><!-- wp:heading --><h2>How long we retain your data</h2><!-- /wp:heading --><!-- wp:paragraph --><p>If you leave a comment, the comment and its metadata are retained indefinitely. This is so we can recognize and approve any follow-up comments automatically instead of holding them in a moderation queue.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>For users that register on our website (if any), we also store the personal information they provide in their user profile. All users can see, edit, or delete their personal information at any time (except they cannot change their username). Website administrators can also see and edit that information.</p><!-- /wp:paragraph --><!-- wp:heading --><h2>What rights you have over your data</h2><!-- /wp:heading --><!-- wp:paragraph --><p>If you have an account on this site, or have left comments, you can request to receive an exported file of the personal data we hold about you, including any data you have provided to us. You can also request that we erase any personal data we hold about you. This does not include any data we are obliged to keep for administrative, legal, or security purposes.</p><!-- /wp:paragraph --><!-- wp:heading --><h2>Where we send your data</h2><!-- /wp:heading --><!-- wp:paragraph --><p>Visitor comments may be checked through an automated spam detection service.</p><!-- /wp:paragraph --><!-- wp:heading --><h2>Your contact information</h2><!-- /wp:heading --><!-- wp:heading --><h2>Additional information</h2><!-- /wp:heading --><!-- wp:heading {\"level\":3} --><h3>How we protect your data</h3><!-- /wp:heading --><!-- wp:heading {\"level\":3} --><h3>What data breach procedures we have in place</h3><!-- /wp:heading --><!-- wp:heading {\"level\":3} --><h3>What third parties we receive data from</h3><!-- /wp:heading --><!-- wp:heading {\"level\":3} --><h3>What automated decision making and/or profiling we do with user data</h3><!-- /wp:heading --><!-- wp:heading {\"level\":3} --><h3>Industry regulatory disclosure requirements</h3><!-- /wp:heading -->','Privacy Policy','','draft','closed','open','','privacy-policy','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'http://localhost:9002/?page_id=3',0,'page','',0),(4,1,'2025-01-01 00:00:00','2025-01-01 00:00:00','','Hello Solar System!','','publish','open','open','','hello-solar-system','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'http://localhost:9002/?p=4',0,'post','',0),(5,1,'2025-01-01 00:00:00','2025-01-01 00:00:00','','Hello Milky Way!','','publish','open','open','','hello-milky-way','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'http://localhost:9002/?p=5',0,'post','',0),(6,1,'2025-01-01 00:00:00','2025-01-01 00:00:00','','Hello Universe!','','publish','open','open','','hello-universe','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'http://localhost:9002/?p=6',0,'post','',0),(7,1,'2025-01-01 00:00:00','2025-01-01 00:00:00','','Hello Spéçïåł čhāràćtęrß!','','publish','open','open','','hello-special-characters','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'http://localhost:9002/?p=7',0,'post','',0),(8,1,'2025-01-01 00:00:00','2025-01-01 00:00:00','','woocommerce-placeholder','','inherit','open','closed','','woocommerce-placeholder','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'http://localhost:9002/wp-content/uploads/2026/07/woocommerce-placeholder.png',0,'attachment','image/png',0),(9,6,'2025-01-01 00:00:00','2025-01-01 00:00:00','Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.','V-Neck T-Shirt','This is a variable product.','publish','open','closed','','v-neck-t-shirt','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'https://woocommercecore.mystagingwebsite.com/product/v-neck-t-shirt/',0,'product','',0),(10,6,'2025-01-01 00:00:00','2025-01-01 00:00:00','Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.','Hoodie','This is a variable product.','publish','open','closed','','hoodie','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'https://woocommercecore.mystagingwebsite.com/product/hoodie/',0,'product','',0),(11,6,'2025-01-01 00:00:00','2025-01-01 00:00:00','Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.','Hoodie with Logo','This is a simple product.','publish','open','closed','','hoodie-with-logo','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'https://woocommercecore.mystagingwebsite.com/product/hoodie-with-logo/',0,'product','',0),(12,6,'2025-01-01 00:00:00','2025-01-01 00:00:00','Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.','T-Shirt','This is a simple product.','publish','open','closed','','t-shirt','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'https://woocommercecore.mystagingwebsite.com/product/t-shirt/',0,'product','',0),(13,6,'2025-01-01 00:00:00','2025-01-01 00:00:00','Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.','Beanie','This is a simple product.','publish','open','closed','','beanie','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'https://woocommercecore.mystagingwebsite.com/product/beanie/',0,'product','',0),(14,6,'2025-01-01 00:00:00','2025-01-01 00:00:00','Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.','Belt','This is a simple product.','publish','open','closed','','belt','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'https://woocommercecore.mystagingwebsite.com/product/belt/',0,'product','',0),(15,6,'2025-01-01 00:00:00','2025-01-01 00:00:00','Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.','Cap','This is a simple product.','publish','open','closed','','cap','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'https://woocommercecore.mystagingwebsite.com/product/cap/',0,'product','',0),(16,6,'2025-01-01 00:00:00','2025-01-01 00:00:00','Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.','Sunglasses','This is a simple product.','publish','open','closed','','sunglasses','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'https://woocommercecore.mystagingwebsite.com/product/sunglasses/',0,'product','',0),(17,6,'2025-01-01 00:00:00','2025-01-01 00:00:00','Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.','Hoodie with Pocket','This is a simple product.','publish','open','closed','','hoodie-with-pocket','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'https://woocommercecore.mystagingwebsite.com/product/hoodie-with-pocket/',0,'product','',0),(18,6,'2025-01-01 00:00:00','2025-01-01 00:00:00','Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.','Hoodie with Zipper','This is a simple product.','publish','open','closed','','hoodie-with-zipper','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'https://woocommercecore.mystagingwebsite.com/product/hoodie-with-zipper/',0,'product','',0),(19,6,'2025-01-01 00:00:00','2025-01-01 00:00:00','Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.','Long Sleeve Tee','This is a simple product.','publish','open','closed','','long-sleeve-tee','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'https://woocommercecore.mystagingwebsite.com/product/long-sleeve-tee/',0,'product','',0),(20,6,'2025-01-01 00:00:00','2025-01-01 00:00:00','Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.','Polo','This is a simple product.','publish','open','closed','','polo','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'https://woocommercecore.mystagingwebsite.com/product/polo/',0,'product','',0),(21,6,'2025-01-01 00:00:00','2025-01-01 00:00:00','Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum sagittis orci ac odio dictum tincidunt. Donec ut metus leo. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Sed luctus, dui eu sagittis sodales, nulla nibh sagittis augue, vel porttitor diam enim non metus. Vestibulum aliquam augue neque. Phasellus tincidunt odio eget ullamcorper efficitur. Cras placerat ut turpis pellentesque vulputate. Nam sed consequat tortor. Curabitur finibus sapien dolor. Ut eleifend tellus nec erat pulvinar dignissim. Nam non arcu purus. Vivamus et massa massa.','Album','This is a simple, virtual product.','publish','open','closed','','album','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'https://woocommercecore.mystagingwebsite.com/product/album/',0,'product','',0),(22,6,'2025-01-01 00:00:00','2025-01-01 00:00:00','Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum sagittis orci ac odio dictum tincidunt. Donec ut metus leo. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Sed luctus, dui eu sagittis sodales, nulla nibh sagittis augue, vel porttitor diam enim non metus. Vestibulum aliquam augue neque. Phasellus tincidunt odio eget ullamcorper efficitur. Cras placerat ut turpis pellentesque vulputate. Nam sed consequat tortor. Curabitur finibus sapien dolor. Ut eleifend tellus nec erat pulvinar dignissim. Nam non arcu purus. Vivamus et massa massa.','Single','This is a simple, virtual product.','publish','open','closed','','single','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'https://woocommercecore.mystagingwebsite.com/product/single/',0,'product','',0),(23,6,'2025-01-01 00:00:00','2025-01-01 00:00:00','','V-Neck T-Shirt - Red','','publish','closed','closed','','v-neck-t-shirt-red','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',9,'https://woocommercecore.mystagingwebsite.com/product/v-neck-t-shirt-red/',0,'product_variation','',0),(24,6,'2025-01-01 00:00:00','2025-01-01 00:00:00','','V-Neck T-Shirt - Green','','publish','closed','closed','','v-neck-t-shirt-green','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',9,'https://woocommercecore.mystagingwebsite.com/product/v-neck-t-shirt-green/',0,'product_variation','',0),(25,6,'2025-01-01 00:00:00','2025-01-01 00:00:00','','V-Neck T-Shirt - Blue','','publish','closed','closed','','v-neck-t-shirt-blue','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',9,'https://woocommercecore.mystagingwebsite.com/product/v-neck-t-shirt-blue/',0,'product_variation','',0),(26,6,'2025-01-01 00:00:00','2025-01-01 00:00:00','','Hoodie - Red, No','','publish','closed','closed','','hoodie-red-no','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',10,'https://woocommercecore.mystagingwebsite.com/product/hoodie-red-no',1,'product_variation','',0),(27,6,'2025-01-01 00:00:00','2025-01-01 00:00:00','','Hoodie - Green, No','','publish','closed','closed','','hoodie-green-no','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',10,'https://woocommercecore.mystagingwebsite.com/product/hoodie-green-no/',2,'product_variation','',0),(28,6,'2025-01-01 00:00:00','2025-01-01 00:00:00','','Hoodie - Blue, No','','publish','closed','closed','','hoodie-blue-no','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',10,'https://woocommercecore.mystagingwebsite.com/product/hoodie-blue-no',3,'product_variation','',0),(29,6,'2025-01-01 00:00:00','2025-01-01 00:00:00','Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.','T-Shirt with Logo','This is a simple product.','publish','open','closed','','t-shirt-with-logo','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'https://woocommercecore.mystagingwebsite.com/product/t-shirt-with-logo/',0,'product','',0),(30,6,'2025-01-01 00:00:00','2025-01-01 00:00:00','Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.','Beanie with Logo','This is a simple product.','publish','open','closed','','beanie-with-logo','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'https://woocommercecore.mystagingwebsite.com/product/beanie-with-logo/',0,'product','',0),(31,6,'2025-01-01 00:00:00','2025-01-01 00:00:00','Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.','Logo Collection','This is a grouped product.','publish','open','closed','','logo-collection','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'https://woocommercecore.mystagingwebsite.com/product/logo-collection/',0,'product','',0),(32,6,'2025-01-01 00:00:00','2025-01-01 00:00:00','Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.','WordPress Pennant','This is an external product.','publish','open','closed','','wordpress-pennant','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',0,'https://woocommercecore.mystagingwebsite.com/product/wordpress-pennant/',0,'product','',0),(33,6,'2025-01-01 00:00:00','2025-01-01 00:00:00','','Hoodie - Blue, Yes','','publish','closed','closed','','hoodie-blue-yes','','','2025-01-01 00:00:00','2025-01-01 00:00:00','',10,'https://woocommercecore.mystagingwebsite.com/product/hoodie-blue-yes/',0,'product_variation','',0);
/*!40000 ALTER TABLE `wp_posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_term_relationships`
--

DROP TABLE IF EXISTS `wp_term_relationships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_term_relationships` (
  `object_id` bigint(20) unsigned NOT NULL DEFAULT 0,
  `term_taxonomy_id` bigint(20) unsigned NOT NULL DEFAULT 0,
  `term_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`object_id`,`term_taxonomy_id`),
  KEY `term_taxonomy_id` (`term_taxonomy_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_term_relationships`
--

LOCK TABLES `wp_term_relationships` WRITE;
/*!40000 ALTER TABLE `wp_term_relationships` DISABLE KEYS */;
INSERT INTO `wp_term_relationships` VALUES (1,1,0),(4,1,0),(5,1,0),(6,1,0),(7,1,0),(9,4,0),(9,8,0),(9,16,0),(9,17,0),(9,18,0),(9,19,0),(9,20,0),(9,21,0),(9,22,0),(10,4,0),(10,16,0),(10,17,0),(10,20,0),(10,23,0),(11,2,0),(11,16,0),(11,23,0),(12,2,0),(12,22,0),(12,24,0),(13,2,0),(13,20,0),(13,25,0),(14,2,0),(14,25,0),(15,2,0),(15,8,0),(15,25,0),(15,26,0),(16,2,0),(16,8,0),(16,25,0),(17,2,0),(17,6,0),(17,7,0),(17,8,0),(17,23,0),(17,24,0),(18,2,0),(18,8,0),(18,23,0),(19,2,0),(19,17,0),(19,22,0),(20,2,0),(20,16,0),(20,22,0),(21,2,0),(21,27,0),(22,2,0),(22,27,0),(29,2,0),(29,22,0),(29,24,0),(30,2,0),(30,20,0),(30,25,0),(31,3,0),(31,28,0),(32,5,0),(32,29,0);
/*!40000 ALTER TABLE `wp_term_relationships` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_term_taxonomy`
--

DROP TABLE IF EXISTS `wp_term_taxonomy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_term_taxonomy` (
  `term_taxonomy_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `term_id` bigint(20) unsigned NOT NULL DEFAULT 0,
  `taxonomy` varchar(32) NOT NULL DEFAULT '',
  `description` longtext NOT NULL,
  `parent` bigint(20) unsigned NOT NULL DEFAULT 0,
  `count` bigint(20) NOT NULL DEFAULT 0,
  PRIMARY KEY (`term_taxonomy_id`),
  UNIQUE KEY `term_id_taxonomy` (`term_id`,`taxonomy`),
  KEY `taxonomy` (`taxonomy`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_term_taxonomy`
--

LOCK TABLES `wp_term_taxonomy` WRITE;
/*!40000 ALTER TABLE `wp_term_taxonomy` DISABLE KEYS */;
INSERT INTO `wp_term_taxonomy` VALUES (1,1,'category','',0,5),(2,2,'product_type','',0,14),(3,3,'product_type','',0,1),(4,4,'product_type','',0,2),(5,5,'product_type','',0,1),(6,6,'product_visibility','',0,1),(7,7,'product_visibility','',0,1),(8,8,'product_visibility','',0,5),(9,9,'product_visibility','',0,0),(10,10,'product_visibility','',0,0),(11,11,'product_visibility','',0,0),(12,12,'product_visibility','',0,0),(13,13,'product_visibility','',0,0),(14,14,'product_visibility','',0,0),(15,15,'product_cat','',0,0),(16,16,'pa_color','',0,4),(17,17,'pa_color','',0,3),(18,18,'pa_size','',0,1),(19,19,'pa_size','',0,1),(20,20,'pa_color','',0,4),(21,21,'pa_size','',0,1),(22,22,'product_cat','',0,5),(23,23,'product_cat','',0,4),(24,24,'pa_color','',0,3),(25,25,'product_cat','',0,5),(26,26,'pa_color','',0,1),(27,27,'product_cat','',0,2),(28,28,'product_cat','',0,1),(29,29,'product_cat','',0,1);
/*!40000 ALTER TABLE `wp_term_taxonomy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_termmeta`
--

DROP TABLE IF EXISTS `wp_termmeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_termmeta` (
  `meta_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `term_id` bigint(20) unsigned NOT NULL DEFAULT 0,
  `meta_key` varchar(255) DEFAULT NULL,
  `meta_value` longtext DEFAULT NULL,
  PRIMARY KEY (`meta_id`),
  KEY `term_id` (`term_id`),
  KEY `meta_key` (`meta_key`(191))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_termmeta`
--

LOCK TABLES `wp_termmeta` WRITE;
/*!40000 ALTER TABLE `wp_termmeta` DISABLE KEYS */;
INSERT INTO `wp_termmeta` VALUES (1,22,'product_count_product_cat','5'),(2,23,'product_count_product_cat','3'),(3,25,'product_count_product_cat','5'),(4,27,'product_count_product_cat','2'),(5,28,'product_count_product_cat','1'),(6,29,'product_count_product_cat','1');
/*!40000 ALTER TABLE `wp_termmeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_terms`
--

DROP TABLE IF EXISTS `wp_terms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_terms` (
  `term_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL DEFAULT '',
  `slug` varchar(200) NOT NULL DEFAULT '',
  `term_group` bigint(10) NOT NULL DEFAULT 0,
  PRIMARY KEY (`term_id`),
  KEY `slug` (`slug`(191)),
  KEY `name` (`name`(191))
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_terms`
--

LOCK TABLES `wp_terms` WRITE;
/*!40000 ALTER TABLE `wp_terms` DISABLE KEYS */;
INSERT INTO `wp_terms` VALUES (1,'Uncategorized','uncategorized',0),(2,'simple','simple',0),(3,'grouped','grouped',0),(4,'variable','variable',0),(5,'external','external',0),(6,'exclude-from-search','exclude-from-search',0),(7,'exclude-from-catalog','exclude-from-catalog',0),(8,'featured','featured',0),(9,'outofstock','outofstock',0),(10,'rated-1','rated-1',0),(11,'rated-2','rated-2',0),(12,'rated-3','rated-3',0),(13,'rated-4','rated-4',0),(14,'rated-5','rated-5',0),(15,'Uncategorized','uncategorized',0),(16,'Blue','blue',0),(17,'Green','green',0),(18,'Large','large',0),(19,'Medium','medium',0),(20,'Red','red',0),(21,'Small','small',0),(22,'Tshirts','tshirts',0),(23,'Hoodies','hoodies',0),(24,'Gray','gray',0),(25,'Accessories','accessories',0),(26,'Yellow','yellow',0),(27,'Music','music',0),(28,'Clothing','clothing',0),(29,'Decor','decor',0);
/*!40000 ALTER TABLE `wp_terms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_usermeta`
--

DROP TABLE IF EXISTS `wp_usermeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_usermeta` (
  `umeta_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL DEFAULT 0,
  `meta_key` varchar(255) DEFAULT NULL,
  `meta_value` longtext DEFAULT NULL,
  PRIMARY KEY (`umeta_id`),
  KEY `user_id` (`user_id`),
  KEY `meta_key` (`meta_key`(191))
) ENGINE=InnoDB AUTO_INCREMENT=87 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_usermeta`
--

LOCK TABLES `wp_usermeta` WRITE;
/*!40000 ALTER TABLE `wp_usermeta` DISABLE KEYS */;
INSERT INTO `wp_usermeta` VALUES (1,1,'nickname','admin'),(2,1,'first_name',''),(3,1,'last_name',''),(4,1,'description',''),(5,1,'rich_editing','true'),(6,1,'syntax_highlighting','true'),(7,1,'comment_shortcuts','false'),(8,1,'admin_color','fresh'),(9,1,'use_ssl','0'),(10,1,'show_admin_bar_front','true'),(11,1,'locale',''),(12,1,'wp_capabilities','a:1:{s:13:\"administrator\";b:1;}'),(13,1,'wp_user_level','10'),(14,1,'dismissed_wp_pointers',''),(15,1,'show_welcome_panel','1'),(16,2,'nickname','admin-2'),(17,2,'first_name',''),(18,2,'last_name',''),(19,2,'description',''),(20,2,'rich_editing','true'),(21,2,'syntax_highlighting','true'),(22,2,'comment_shortcuts','false'),(23,2,'admin_color','fresh'),(24,2,'use_ssl','0'),(25,2,'show_admin_bar_front','true'),(26,2,'locale',''),(27,2,'wp_capabilities','a:1:{s:13:\"administrator\";b:1;}'),(28,2,'wp_user_level','10'),(29,2,'dismissed_wp_pointers',''),(30,3,'nickname','editor'),(31,3,'first_name',''),(32,3,'last_name',''),(33,3,'description',''),(34,3,'rich_editing','true'),(35,3,'syntax_highlighting','true'),(36,3,'comment_shortcuts','false'),(37,3,'admin_color','fresh'),(38,3,'use_ssl','0'),(39,3,'show_admin_bar_front','true'),(40,3,'locale',''),(41,3,'wp_capabilities','a:1:{s:6:\"editor\";b:1;}'),(42,3,'wp_user_level','7'),(43,3,'dismissed_wp_pointers',''),(44,4,'nickname','author'),(45,4,'first_name',''),(46,4,'last_name',''),(47,4,'description',''),(48,4,'rich_editing','true'),(49,4,'syntax_highlighting','true'),(50,4,'comment_shortcuts','false'),(51,4,'admin_color','fresh'),(52,4,'use_ssl','0'),(53,4,'show_admin_bar_front','true'),(54,4,'locale',''),(55,4,'wp_capabilities','a:1:{s:6:\"author\";b:1;}'),(56,4,'wp_user_level','2'),(57,4,'dismissed_wp_pointers',''),(58,5,'nickname','contributor'),(59,5,'first_name',''),(60,5,'last_name',''),(61,5,'description',''),(62,5,'rich_editing','true'),(63,5,'syntax_highlighting','true'),(64,5,'comment_shortcuts','false'),(65,5,'admin_color','fresh'),(66,5,'use_ssl','0'),(67,5,'show_admin_bar_front','true'),(68,5,'locale',''),(69,5,'wp_capabilities','a:1:{s:11:\"contributor\";b:1;}'),(70,5,'wp_user_level','1'),(71,5,'dismissed_wp_pointers',''),(72,1,'wc_last_active','1784419200'),(73,6,'nickname','shopmanager'),(74,6,'first_name',''),(75,6,'last_name',''),(76,6,'description',''),(77,6,'rich_editing','true'),(78,6,'syntax_highlighting','true'),(79,6,'comment_shortcuts','false'),(80,6,'admin_color','fresh'),(81,6,'use_ssl','0'),(82,6,'show_admin_bar_front','true'),(83,6,'locale',''),(84,6,'wp_capabilities','a:1:{s:10:\"subscriber\";b:1;}'),(85,6,'wp_user_level','0'),(86,6,'dismissed_wp_pointers','');
/*!40000 ALTER TABLE `wp_usermeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_users`
--

DROP TABLE IF EXISTS `wp_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_users` (
  `ID` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_login` varchar(60) NOT NULL DEFAULT '',
  `user_pass` varchar(255) NOT NULL DEFAULT '',
  `user_nicename` varchar(50) NOT NULL DEFAULT '',
  `user_email` varchar(100) NOT NULL DEFAULT '',
  `user_url` varchar(100) NOT NULL DEFAULT '',
  `user_registered` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `user_activation_key` varchar(255) NOT NULL DEFAULT '',
  `user_status` int(11) NOT NULL DEFAULT 0,
  `display_name` varchar(250) NOT NULL DEFAULT '',
  PRIMARY KEY (`ID`),
  KEY `user_login_key` (`user_login`),
  KEY `user_nicename` (`user_nicename`),
  KEY `user_email` (`user_email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_users`
--

LOCK TABLES `wp_users` WRITE;
/*!40000 ALTER TABLE `wp_users` DISABLE KEYS */;
INSERT INTO `wp_users` VALUES (1,'admin','$P$BVGAi9V8sCdRMhCPxhAnRLpqqMBk720','admin','test@test.com','','2025-01-01 00:00:00','',0,'admin'),(2,'admin-2','$P$BVGAi9V8sCdRMhCPxhAnRLpqqMBk720','admin-2','admin-2@example.com','','2025-01-01 00:00:00','',0,'admin-2'),(3,'editor','$P$BVGAi9V8sCdRMhCPxhAnRLpqqMBk720','editor','editor@example.com','','2025-01-01 00:00:00','',0,'editor'),(4,'author','$P$BVGAi9V8sCdRMhCPxhAnRLpqqMBk720','author','author@example.com','','2025-01-01 00:00:00','',0,'author'),(5,'contributor','$P$BVGAi9V8sCdRMhCPxhAnRLpqqMBk720','contributor','contributor@example.com','','2025-01-01 00:00:00','',0,'contributor'),(6,'shopmanager','$P$BVGAi9V8sCdRMhCPxhAnRLpqqMBk720','shopmanager','info@woocommerce.com','','2025-01-01 00:00:00','',0,'Shop Manager');
/*!40000 ALTER TABLE `wp_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_wc_download_log`
--

DROP TABLE IF EXISTS `wp_wc_download_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_wc_download_log` (
  `download_log_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `timestamp` datetime NOT NULL,
  `permission_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `user_ip_address` varchar(100) DEFAULT '',
  PRIMARY KEY (`download_log_id`),
  KEY `permission_id` (`permission_id`),
  KEY `timestamp` (`timestamp`),
  CONSTRAINT `fk_wp_wc_download_log_permission_id` FOREIGN KEY (`permission_id`) REFERENCES `wp_woocommerce_downloadable_product_permissions` (`permission_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_wc_download_log`
--

LOCK TABLES `wp_wc_download_log` WRITE;
/*!40000 ALTER TABLE `wp_wc_download_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_wc_download_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_wc_product_meta_lookup`
--

DROP TABLE IF EXISTS `wp_wc_product_meta_lookup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_wc_product_meta_lookup` (
  `product_id` bigint(20) NOT NULL,
  `sku` varchar(100) DEFAULT '',
  `virtual` tinyint(1) DEFAULT 0,
  `downloadable` tinyint(1) DEFAULT 0,
  `min_price` decimal(19,4) DEFAULT NULL,
  `max_price` decimal(19,4) DEFAULT NULL,
  `onsale` tinyint(1) DEFAULT 0,
  `stock_quantity` double DEFAULT NULL,
  `stock_status` varchar(100) DEFAULT 'instock',
  `rating_count` bigint(20) DEFAULT 0,
  `average_rating` decimal(3,2) DEFAULT 0.00,
  `total_sales` bigint(20) DEFAULT 0,
  `tax_status` varchar(100) DEFAULT 'taxable',
  `tax_class` varchar(100) DEFAULT '',
  PRIMARY KEY (`product_id`),
  KEY `virtual` (`virtual`),
  KEY `downloadable` (`downloadable`),
  KEY `stock_status` (`stock_status`),
  KEY `stock_quantity` (`stock_quantity`),
  KEY `onsale` (`onsale`),
  KEY `min_max_price` (`min_price`,`max_price`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_wc_product_meta_lookup`
--

LOCK TABLES `wp_wc_product_meta_lookup` WRITE;
/*!40000 ALTER TABLE `wp_wc_product_meta_lookup` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_wc_product_meta_lookup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_wc_reserved_stock`
--

DROP TABLE IF EXISTS `wp_wc_reserved_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_wc_reserved_stock` (
  `order_id` bigint(20) NOT NULL,
  `product_id` bigint(20) NOT NULL,
  `stock_quantity` double NOT NULL DEFAULT 0,
  `timestamp` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `expires` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`order_id`,`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_wc_reserved_stock`
--

LOCK TABLES `wp_wc_reserved_stock` WRITE;
/*!40000 ALTER TABLE `wp_wc_reserved_stock` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_wc_reserved_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_wc_tax_rate_classes`
--

DROP TABLE IF EXISTS `wp_wc_tax_rate_classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_wc_tax_rate_classes` (
  `tax_rate_class_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL DEFAULT '',
  `slug` varchar(200) NOT NULL DEFAULT '',
  PRIMARY KEY (`tax_rate_class_id`),
  UNIQUE KEY `slug` (`slug`(191))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_wc_tax_rate_classes`
--

LOCK TABLES `wp_wc_tax_rate_classes` WRITE;
/*!40000 ALTER TABLE `wp_wc_tax_rate_classes` DISABLE KEYS */;
INSERT INTO `wp_wc_tax_rate_classes` VALUES (1,'Reduced rate','reduced-rate'),(2,'Zero rate','zero-rate');
/*!40000 ALTER TABLE `wp_wc_tax_rate_classes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_wc_webhooks`
--

DROP TABLE IF EXISTS `wp_wc_webhooks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_wc_webhooks` (
  `webhook_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `status` varchar(200) NOT NULL,
  `name` text NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `delivery_url` text NOT NULL,
  `secret` text NOT NULL,
  `topic` varchar(200) NOT NULL,
  `date_created` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `date_created_gmt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `date_modified` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `date_modified_gmt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `api_version` smallint(4) NOT NULL,
  `failure_count` smallint(10) NOT NULL DEFAULT 0,
  `pending_delivery` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`webhook_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_wc_webhooks`
--

LOCK TABLES `wp_wc_webhooks` WRITE;
/*!40000 ALTER TABLE `wp_wc_webhooks` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_wc_webhooks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_woocommerce_api_keys`
--

DROP TABLE IF EXISTS `wp_woocommerce_api_keys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_woocommerce_api_keys` (
  `key_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `description` varchar(200) DEFAULT NULL,
  `permissions` varchar(10) NOT NULL,
  `consumer_key` char(64) NOT NULL,
  `consumer_secret` char(43) NOT NULL,
  `nonces` longtext DEFAULT NULL,
  `truncated_key` char(7) NOT NULL,
  `last_access` datetime DEFAULT NULL,
  PRIMARY KEY (`key_id`),
  KEY `consumer_key` (`consumer_key`),
  KEY `consumer_secret` (`consumer_secret`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_woocommerce_api_keys`
--

LOCK TABLES `wp_woocommerce_api_keys` WRITE;
/*!40000 ALTER TABLE `wp_woocommerce_api_keys` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_woocommerce_api_keys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_woocommerce_attribute_taxonomies`
--

DROP TABLE IF EXISTS `wp_woocommerce_attribute_taxonomies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_woocommerce_attribute_taxonomies` (
  `attribute_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `attribute_name` varchar(200) NOT NULL,
  `attribute_label` varchar(200) DEFAULT NULL,
  `attribute_type` varchar(20) NOT NULL,
  `attribute_orderby` varchar(20) NOT NULL,
  `attribute_public` int(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`attribute_id`),
  KEY `attribute_name` (`attribute_name`(20))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_woocommerce_attribute_taxonomies`
--

LOCK TABLES `wp_woocommerce_attribute_taxonomies` WRITE;
/*!40000 ALTER TABLE `wp_woocommerce_attribute_taxonomies` DISABLE KEYS */;
INSERT INTO `wp_woocommerce_attribute_taxonomies` VALUES (1,'color','Color','select','menu_order',0),(2,'size','Size','select','menu_order',0);
/*!40000 ALTER TABLE `wp_woocommerce_attribute_taxonomies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_woocommerce_downloadable_product_permissions`
--

DROP TABLE IF EXISTS `wp_woocommerce_downloadable_product_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_woocommerce_downloadable_product_permissions` (
  `permission_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `download_id` varchar(36) NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `order_id` bigint(20) unsigned NOT NULL DEFAULT 0,
  `order_key` varchar(200) NOT NULL,
  `user_email` varchar(200) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `downloads_remaining` varchar(9) DEFAULT NULL,
  `access_granted` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `access_expires` datetime DEFAULT NULL,
  `download_count` bigint(20) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`permission_id`),
  KEY `download_order_key_product` (`product_id`,`order_id`,`order_key`(16),`download_id`),
  KEY `download_order_product` (`download_id`,`order_id`,`product_id`),
  KEY `order_id` (`order_id`),
  KEY `user_order_remaining_expires` (`user_id`,`order_id`,`downloads_remaining`,`access_expires`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_woocommerce_downloadable_product_permissions`
--

LOCK TABLES `wp_woocommerce_downloadable_product_permissions` WRITE;
/*!40000 ALTER TABLE `wp_woocommerce_downloadable_product_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_woocommerce_downloadable_product_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_woocommerce_log`
--

DROP TABLE IF EXISTS `wp_woocommerce_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_woocommerce_log` (
  `log_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `timestamp` datetime NOT NULL,
  `level` smallint(4) NOT NULL,
  `source` varchar(200) NOT NULL,
  `message` longtext NOT NULL,
  `context` longtext DEFAULT NULL,
  PRIMARY KEY (`log_id`),
  KEY `level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_woocommerce_log`
--

LOCK TABLES `wp_woocommerce_log` WRITE;
/*!40000 ALTER TABLE `wp_woocommerce_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_woocommerce_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_woocommerce_order_itemmeta`
--

DROP TABLE IF EXISTS `wp_woocommerce_order_itemmeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_woocommerce_order_itemmeta` (
  `meta_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_item_id` bigint(20) unsigned NOT NULL,
  `meta_key` varchar(255) DEFAULT NULL,
  `meta_value` longtext DEFAULT NULL,
  PRIMARY KEY (`meta_id`),
  KEY `order_item_id` (`order_item_id`),
  KEY `meta_key` (`meta_key`(32))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_woocommerce_order_itemmeta`
--

LOCK TABLES `wp_woocommerce_order_itemmeta` WRITE;
/*!40000 ALTER TABLE `wp_woocommerce_order_itemmeta` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_woocommerce_order_itemmeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_woocommerce_order_items`
--

DROP TABLE IF EXISTS `wp_woocommerce_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_woocommerce_order_items` (
  `order_item_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_item_name` text NOT NULL,
  `order_item_type` varchar(200) NOT NULL DEFAULT '',
  `order_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`order_item_id`),
  KEY `order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_woocommerce_order_items`
--

LOCK TABLES `wp_woocommerce_order_items` WRITE;
/*!40000 ALTER TABLE `wp_woocommerce_order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_woocommerce_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_woocommerce_payment_tokenmeta`
--

DROP TABLE IF EXISTS `wp_woocommerce_payment_tokenmeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_woocommerce_payment_tokenmeta` (
  `meta_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `payment_token_id` bigint(20) unsigned NOT NULL,
  `meta_key` varchar(255) DEFAULT NULL,
  `meta_value` longtext DEFAULT NULL,
  PRIMARY KEY (`meta_id`),
  KEY `payment_token_id` (`payment_token_id`),
  KEY `meta_key` (`meta_key`(32))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_woocommerce_payment_tokenmeta`
--

LOCK TABLES `wp_woocommerce_payment_tokenmeta` WRITE;
/*!40000 ALTER TABLE `wp_woocommerce_payment_tokenmeta` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_woocommerce_payment_tokenmeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_woocommerce_payment_tokens`
--

DROP TABLE IF EXISTS `wp_woocommerce_payment_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_woocommerce_payment_tokens` (
  `token_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `gateway_id` varchar(200) NOT NULL,
  `token` text NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL DEFAULT 0,
  `type` varchar(200) NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`token_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_woocommerce_payment_tokens`
--

LOCK TABLES `wp_woocommerce_payment_tokens` WRITE;
/*!40000 ALTER TABLE `wp_woocommerce_payment_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_woocommerce_payment_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_woocommerce_sessions`
--

DROP TABLE IF EXISTS `wp_woocommerce_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_woocommerce_sessions` (
  `session_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `session_key` char(32) NOT NULL,
  `session_value` longtext NOT NULL,
  `session_expiry` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`session_id`),
  UNIQUE KEY `session_key` (`session_key`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_woocommerce_sessions`
--

LOCK TABLES `wp_woocommerce_sessions` WRITE;
/*!40000 ALTER TABLE `wp_woocommerce_sessions` DISABLE KEYS */;
INSERT INTO `wp_woocommerce_sessions` VALUES (1,'1','a:7:{s:4:\"cart\";s:6:\"a:0:{}\";s:11:\"cart_totals\";s:367:\"a:15:{s:8:\"subtotal\";i:0;s:12:\"subtotal_tax\";i:0;s:14:\"shipping_total\";i:0;s:12:\"shipping_tax\";i:0;s:14:\"shipping_taxes\";a:0:{}s:14:\"discount_total\";i:0;s:12:\"discount_tax\";i:0;s:19:\"cart_contents_total\";i:0;s:17:\"cart_contents_tax\";i:0;s:19:\"cart_contents_taxes\";a:0:{}s:9:\"fee_total\";i:0;s:7:\"fee_tax\";i:0;s:9:\"fee_taxes\";a:0:{}s:5:\"total\";i:0;s:9:\"total_tax\";i:0;}\";s:15:\"applied_coupons\";s:6:\"a:0:{}\";s:22:\"coupon_discount_totals\";s:6:\"a:0:{}\";s:26:\"coupon_discount_tax_totals\";s:6:\"a:0:{}\";s:21:\"removed_cart_contents\";s:6:\"a:0:{}\";s:8:\"customer\";s:705:\"a:26:{s:2:\"id\";s:1:\"1\";s:13:\"date_modified\";s:0:\"\";s:8:\"postcode\";s:0:\"\";s:4:\"city\";s:0:\"\";s:9:\"address_1\";s:0:\"\";s:7:\"address\";s:0:\"\";s:9:\"address_2\";s:0:\"\";s:5:\"state\";s:2:\"CA\";s:7:\"country\";s:2:\"GB\";s:17:\"shipping_postcode\";s:0:\"\";s:13:\"shipping_city\";s:0:\"\";s:18:\"shipping_address_1\";s:0:\"\";s:16:\"shipping_address\";s:0:\"\";s:18:\"shipping_address_2\";s:0:\"\";s:14:\"shipping_state\";s:2:\"CA\";s:16:\"shipping_country\";s:2:\"GB\";s:13:\"is_vat_exempt\";s:0:\"\";s:19:\"calculated_shipping\";s:0:\"\";s:10:\"first_name\";s:0:\"\";s:9:\"last_name\";s:0:\"\";s:7:\"company\";s:0:\"\";s:5:\"phone\";s:0:\"\";s:5:\"email\";s:13:\"test@test.com\";s:19:\"shipping_first_name\";s:0:\"\";s:18:\"shipping_last_name\";s:0:\"\";s:16:\"shipping_company\";s:0:\"\";}\";}',1784651923);
/*!40000 ALTER TABLE `wp_woocommerce_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_woocommerce_shipping_zone_locations`
--

DROP TABLE IF EXISTS `wp_woocommerce_shipping_zone_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_woocommerce_shipping_zone_locations` (
  `location_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `zone_id` bigint(20) unsigned NOT NULL,
  `location_code` varchar(200) NOT NULL,
  `location_type` varchar(40) NOT NULL,
  PRIMARY KEY (`location_id`),
  KEY `location_id` (`location_id`),
  KEY `location_type_code` (`location_type`(10),`location_code`(20))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_woocommerce_shipping_zone_locations`
--

LOCK TABLES `wp_woocommerce_shipping_zone_locations` WRITE;
/*!40000 ALTER TABLE `wp_woocommerce_shipping_zone_locations` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_woocommerce_shipping_zone_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_woocommerce_shipping_zone_methods`
--

DROP TABLE IF EXISTS `wp_woocommerce_shipping_zone_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_woocommerce_shipping_zone_methods` (
  `zone_id` bigint(20) unsigned NOT NULL,
  `instance_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `method_id` varchar(200) NOT NULL,
  `method_order` bigint(20) unsigned NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`instance_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_woocommerce_shipping_zone_methods`
--

LOCK TABLES `wp_woocommerce_shipping_zone_methods` WRITE;
/*!40000 ALTER TABLE `wp_woocommerce_shipping_zone_methods` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_woocommerce_shipping_zone_methods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_woocommerce_shipping_zones`
--

DROP TABLE IF EXISTS `wp_woocommerce_shipping_zones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_woocommerce_shipping_zones` (
  `zone_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `zone_name` varchar(200) NOT NULL,
  `zone_order` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`zone_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_woocommerce_shipping_zones`
--

LOCK TABLES `wp_woocommerce_shipping_zones` WRITE;
/*!40000 ALTER TABLE `wp_woocommerce_shipping_zones` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_woocommerce_shipping_zones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_woocommerce_tax_rate_locations`
--

DROP TABLE IF EXISTS `wp_woocommerce_tax_rate_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_woocommerce_tax_rate_locations` (
  `location_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `location_code` varchar(200) NOT NULL,
  `tax_rate_id` bigint(20) unsigned NOT NULL,
  `location_type` varchar(40) NOT NULL,
  PRIMARY KEY (`location_id`),
  KEY `tax_rate_id` (`tax_rate_id`),
  KEY `location_type_code` (`location_type`(10),`location_code`(20))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_woocommerce_tax_rate_locations`
--

LOCK TABLES `wp_woocommerce_tax_rate_locations` WRITE;
/*!40000 ALTER TABLE `wp_woocommerce_tax_rate_locations` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_woocommerce_tax_rate_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_woocommerce_tax_rates`
--

DROP TABLE IF EXISTS `wp_woocommerce_tax_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wp_woocommerce_tax_rates` (
  `tax_rate_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tax_rate_country` varchar(2) NOT NULL DEFAULT '',
  `tax_rate_state` varchar(200) NOT NULL DEFAULT '',
  `tax_rate` varchar(8) NOT NULL DEFAULT '',
  `tax_rate_name` varchar(200) NOT NULL DEFAULT '',
  `tax_rate_priority` bigint(20) unsigned NOT NULL,
  `tax_rate_compound` int(1) NOT NULL DEFAULT 0,
  `tax_rate_shipping` int(1) NOT NULL DEFAULT 1,
  `tax_rate_order` bigint(20) unsigned NOT NULL,
  `tax_rate_class` varchar(200) NOT NULL DEFAULT '',
  PRIMARY KEY (`tax_rate_id`),
  KEY `tax_rate_country` (`tax_rate_country`),
  KEY `tax_rate_state` (`tax_rate_state`(2)),
  KEY `tax_rate_class` (`tax_rate_class`(10)),
  KEY `tax_rate_priority` (`tax_rate_priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_woocommerce_tax_rates`
--

LOCK TABLES `wp_woocommerce_tax_rates` WRITE;
/*!40000 ALTER TABLE `wp_woocommerce_tax_rates` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_woocommerce_tax_rates` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

