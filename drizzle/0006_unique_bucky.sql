ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `avatarGlyph` varchar(16);--> statement-breakpoint
ALTER TABLE `users` ADD `alienBio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `preferredVoice` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `voiceRate` int DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `voicePitch` int DEFAULT 100 NOT NULL;