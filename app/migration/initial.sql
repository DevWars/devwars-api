-- MySQL dump 10.13  Distrib 5.7.23, for Linux (x86_64)
--
-- Host: localhost    Database: devwars_api
-- ------------------------------------------------------
-- Server version	5.7.23

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activities`
--

DROP TABLE IF EXISTS `activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `description` varchar(255) NOT NULL,
  `coins` int(11) NOT NULL,
  `xp` int(11) NOT NULL,
  `userId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_5a2cfe6f705df945b20c1b22c71` (`userId`),
  CONSTRAINT `FK_5a2cfe6f705df945b20c1b22c71` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `badges`
--

DROP TABLE IF EXISTS `badges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `badges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `name` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `coins` int(11) NOT NULL,
  `xp` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_9c91fc9c4a4ae01712baad1e9f` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=216 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `badges_users_users`
--

DROP TABLE IF EXISTS `badges_users_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `badges_users_users` (
  `badgesId` int(11) NOT NULL,
  `usersId` int(11) NOT NULL,
  PRIMARY KEY (`badgesId`,`usersId`),
  KEY `FK_7cdda64ef3e8e76ae840962cb81` (`usersId`),
  CONSTRAINT `FK_08998de9aa50f382fb15f2605f2` FOREIGN KEY (`badgesId`) REFERENCES `badges` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_7cdda64ef3e8e76ae840962cb81` FOREIGN KEY (`usersId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `blog_posts`
--

DROP TABLE IF EXISTS `blog_posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `blog_posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `title` varchar(255) DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `imageUrl` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `slug` varchar(255) NOT NULL,
  `authorId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_09269227c7acf3cdf47ea4051e1` (`authorId`),
  CONSTRAINT `FK_09269227c7acf3cdf47ea4051e1` FOREIGN KEY (`authorId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `competitors`
--

DROP TABLE IF EXISTS `competitors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `competitors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `dob` datetime DEFAULT NULL,
  `ratings` text NOT NULL,
  `userId` int(11) DEFAULT NULL,
  `nameFirstname` varchar(255) DEFAULT NULL,
  `nameLastname` varchar(255) DEFAULT NULL,
  `addressAddressone` varchar(255) DEFAULT NULL,
  `addressAddresstwo` varchar(255) DEFAULT NULL,
  `addressCity` varchar(255) DEFAULT NULL,
  `addressState` varchar(255) DEFAULT NULL,
  `addressZip` varchar(255) DEFAULT NULL,
  `addressCountry` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_4abe41f1e07be2a23e2506a982a` (`userId`),
  CONSTRAINT `FK_4abe41f1e07be2a23e2506a982a` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=603 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `email_verifications`
--

DROP TABLE IF EXISTS `email_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `email_verifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `token` varchar(255) NOT NULL DEFAULT '',
  `userId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_4e63a91e0a684b31496bd50733e` (`userId`),
  CONSTRAINT `FK_4e63a91e0a684b31496bd50733e` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `game_application`
--

DROP TABLE IF EXISTS `game_application`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `game_application` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `gameId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_65b5032282545acbe918f9b350e` (`gameId`),
  KEY `FK_40226c72bac1227a8445fb0ef89` (`userId`),
  CONSTRAINT `FK_40226c72bac1227a8445fb0ef89` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  CONSTRAINT `FK_65b5032282545acbe918f9b350e` FOREIGN KEY (`gameId`) REFERENCES `games` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=605 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `game_teams`
--

DROP TABLE IF EXISTS `game_teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `game_teams` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `name` varchar(255) NOT NULL,
  `winner` tinyint(4) NOT NULL,
  `status` varchar(255) DEFAULT NULL,
  `votes` text NOT NULL,
  `gameId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_64634e4f6374a7d87e5093f7099` (`gameId`),
  CONSTRAINT `FK_64634e4f6374a7d87e5093f7099` FOREIGN KEY (`gameId`) REFERENCES `games` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=207 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `game_teams_completed_objectives_objectives`
--

DROP TABLE IF EXISTS `game_teams_completed_objectives_objectives`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `game_teams_completed_objectives_objectives` (
  `gameTeamsId` int(11) NOT NULL,
  `objectivesId` int(11) NOT NULL,
  PRIMARY KEY (`gameTeamsId`,`objectivesId`),
  KEY `FK_68fb01871df38974f6d979b9988` (`objectivesId`),
  CONSTRAINT `FK_68fb01871df38974f6d979b9988` FOREIGN KEY (`objectivesId`) REFERENCES `objectives` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_7d1ee82c83956c82b67435cab82` FOREIGN KEY (`gameTeamsId`) REFERENCES `game_teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `games`
--

DROP TABLE IF EXISTS `games`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `games` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `status` int(11) NOT NULL DEFAULT '0',
  `startTime` datetime NOT NULL,
  `season` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `theme` varchar(255) DEFAULT NULL,
  `videoUrl` varchar(255) DEFAULT NULL,
  `languageTemplates` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=104 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `linked_accounts`
--

DROP TABLE IF EXISTS `linked_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `linked_accounts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `username` varchar(255) NOT NULL,
  `storage` text,
  `provider` varchar(255) NOT NULL,
  `providerId` varchar(255) NOT NULL,
  `userId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_2c77d2a0c06eeab6e62dc35af64` (`userId`),
  CONSTRAINT `FK_2c77d2a0c06eeab6e62dc35af64` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `timestamp` bigint(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `objectives`
--

DROP TABLE IF EXISTS `objectives`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `objectives` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `description` varchar(255) DEFAULT NULL,
  `number` int(11) NOT NULL,
  `bonus` tinyint(4) NOT NULL DEFAULT '0',
  `gameId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_31db9f4aa2763ae949da407f2f5` (`gameId`),
  CONSTRAINT `FK_31db9f4aa2763ae949da407f2f5` FOREIGN KEY (`gameId`) REFERENCES `games` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=364 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `token` varchar(255) NOT NULL DEFAULT '',
  `userId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_d95569f623f28a0bf034a55099e` (`userId`),
  CONSTRAINT `FK_d95569f623f28a0bf034a55099e` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `players`
--

DROP TABLE IF EXISTS `players`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `players` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `language` varchar(255) NOT NULL,
  `teamId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_ecaf0c4aabc76f1a3d1a91ea33c` (`teamId`),
  KEY `FK_7c11c744c0601ab432cfa6ff7ad` (`userId`),
  CONSTRAINT `FK_7c11c744c0601ab432cfa6ff7ad` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  CONSTRAINT `FK_ecaf0c4aabc76f1a3d1a91ea33c` FOREIGN KEY (`teamId`) REFERENCES `game_teams` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=611 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `email` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `token` varchar(255) DEFAULT NULL,
  `avatarUrl` varchar(255) DEFAULT NULL,
  `analytics` text,
  `profileAbout` text,
  `profileForhire` tinyint(4) DEFAULT NULL,
  `profileLocation` varchar(255) DEFAULT NULL,
  `profileWebsiteurl` varchar(255) DEFAULT NULL,
  `statisticsCoins` int(11) NOT NULL DEFAULT '0',
  `statisticsXp` int(11) NOT NULL DEFAULT '0',
  `statisticsWins` int(11) NOT NULL DEFAULT '0',
  `statisticsLosses` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1106 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users_played_games_games`
--

DROP TABLE IF EXISTS `users_played_games_games`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users_played_games_games` (
  `usersId` int(11) NOT NULL,
  `gamesId` int(11) NOT NULL,
  PRIMARY KEY (`usersId`,`gamesId`),
  KEY `FK_3401228378a5b11de3c925a62c7` (`gamesId`),
  CONSTRAINT `FK_3401228378a5b11de3c925a62c7` FOREIGN KEY (`gamesId`) REFERENCES `games` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_94edf4bbe10d5b7c14666ca8430` FOREIGN KEY (`usersId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2019-02-16 20:51:03
