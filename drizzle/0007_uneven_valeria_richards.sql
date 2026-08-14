ALTER TABLE `users` ADD `customPersona` text;--> statement-breakpoint
ALTER TABLE `users` ADD `customInstructions` text;--> statement-breakpoint
ALTER TABLE `users` ADD `modelTemperature` int DEFAULT 20 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `predictiveSensitivity` int DEFAULT 75 NOT NULL;