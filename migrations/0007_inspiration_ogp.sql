ALTER TABLE `inspirations` ADD `og_title` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `inspirations` ADD `og_description` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `inspirations` ADD `og_image_url` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `inspirations` ADD `og_site_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `inspirations` ADD `og_fetched_at` text;--> statement-breakpoint
ALTER TABLE `inspirations` ADD `og_status` text DEFAULT 'none' NOT NULL;--> statement-breakpoint
UPDATE `inspirations` SET `og_status` = 'none' WHERE `og_status` IS NULL;
