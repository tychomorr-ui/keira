CREATE TABLE `facts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subject` varchar(255) NOT NULL,
	`predicate` varchar(255) NOT NULL,
	`object` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `facts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ontologyClasses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`className` varchar(255) NOT NULL,
	`parentClassName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ontologyClasses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ontologyProperties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`propertyName` varchar(255) NOT NULL,
	`domain` varchar(255),
	`range` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ontologyProperties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `semanticIndex` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`instanceName` varchar(255) NOT NULL,
	`className` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `semanticIndex_id` PRIMARY KEY(`id`)
);
