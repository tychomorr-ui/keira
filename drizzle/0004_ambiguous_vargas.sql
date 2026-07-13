CREATE TABLE `portalChatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','portal') NOT NULL,
	`content` text NOT NULL,
	`patterns` text,
	`emotionalTone` varchar(50),
	`growthIndicator` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portalChatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portalConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`summary` text,
	`messageCount` int NOT NULL DEFAULT 0,
	`lastMessageAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portalConversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portalLearningMemory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`corePatterns` text NOT NULL,
	`growthAreas` text NOT NULL,
	`resistancePoints` text NOT NULL,
	`breakthroughMoments` text,
	`evolutionTimeline` text,
	`lastAnalyzedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portalLearningMemory_id` PRIMARY KEY(`id`),
	CONSTRAINT `portalLearningMemory_userId_unique` UNIQUE(`userId`)
);
