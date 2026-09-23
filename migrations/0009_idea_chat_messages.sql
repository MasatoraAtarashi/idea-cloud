CREATE TABLE `idea_chat_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`idea_id` integer NOT NULL,
	`role` text NOT NULL,
	`body` text NOT NULL,
	`model` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`idea_id`) REFERENCES `ideas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idea_chat_messages_idea_created_idx` ON `idea_chat_messages` (`idea_id`,`created_at`);
