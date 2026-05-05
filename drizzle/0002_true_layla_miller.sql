CREATE TABLE `mirrorReflections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userInput` text NOT NULL,
	`reflection` text NOT NULL,
	`patterns` text,
	`unityScore` int NOT NULL,
	`opportunityScore` int NOT NULL,
	`resistanceLevel` int NOT NULL,
	`nextStep` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mirrorReflections_id` PRIMARY KEY(`id`)
);
