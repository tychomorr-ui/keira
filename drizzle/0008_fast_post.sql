CREATE TABLE `keiraContextEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`label` varchar(120) NOT NULL,
	`content` text NOT NULL,
	`kind` enum('fact','preference','goal','note') NOT NULL DEFAULT 'note',
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `keiraContextEntries_id` PRIMARY KEY(`id`)
);
