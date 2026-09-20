ALTER TABLE `ideas` ADD `last_reviewed_at` text;--> statement-breakpoint
ALTER TABLE `ideas` ADD `review_status` text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `ideas` ADD `reflection_outcome` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `ideas` ADD `reflection_status` text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `ideas` ADD `reflection_notes` text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE `ideas` SET `review_status` = 'none' WHERE `review_status` IS NULL;--> statement-breakpoint
UPDATE `ideas` SET `reflection_status` = 'none' WHERE `reflection_status` IS NULL;--> statement-breakpoint
CREATE TABLE `inspirations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`url` text,
	`memo` text DEFAULT '' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT '' NOT NULL
);--> statement-breakpoint
UPDATE `inspirations` SET `updated_at` = `created_at` WHERE `updated_at` = '';
