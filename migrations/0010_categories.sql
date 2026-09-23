CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);
--> statement-breakpoint
INSERT INTO `categories` (`name`, `sort_order`) VALUES ('執筆アイデア', 0), ('事業アイデア', 1), ('組織改善', 2);
--> statement-breakpoint
ALTER TABLE `ideas` ADD `category_id` integer REFERENCES `categories`(`id`) ON DELETE SET NULL;
