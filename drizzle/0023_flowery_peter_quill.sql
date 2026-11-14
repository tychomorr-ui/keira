ALTER TABLE `keiraCorpusVectors` ADD `embeddingModel` varchar(128) DEFAULT 'nomic-embed-text' NOT NULL;--> statement-breakpoint
ALTER TABLE `keiraCorpusVectors` ADD `embeddingVersion` varchar(32) DEFAULT '1.0' NOT NULL;--> statement-breakpoint
ALTER TABLE `keiraCorpusVectors` ADD `embeddingDimension` int DEFAULT 768 NOT NULL;--> statement-breakpoint
ALTER TABLE `keiraCorpusVectors` ADD `embeddingRuntime` varchar(32) DEFAULT 'ollama' NOT NULL;--> statement-breakpoint
ALTER TABLE `keiraCorpusVectors` ADD `contentSha256` varchar(64);--> statement-breakpoint
UPDATE `keiraCorpusVectors` SET `contentSha256` = SHA2(`content`, 256) WHERE `contentSha256` IS NULL;
