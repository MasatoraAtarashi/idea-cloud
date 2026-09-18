CREATE TABLE `idea_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`idea_id` integer NOT NULL,
	`body` text NOT NULL,
	`author_id` text NOT NULL,
	`author_name` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`idea_id`) REFERENCES `ideas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idea_comments_idea_created_idx` ON `idea_comments` (`idea_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `ideas` ADD `updated_at` text DEFAULT (datetime('now')) NOT NULL;--> statement-breakpoint
UPDATE `ideas` SET `updated_at` = `created_at`;