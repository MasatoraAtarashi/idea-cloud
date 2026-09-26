CREATE TABLE `workspace_api_keys` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace_id` integer NOT NULL,
	`name` text NOT NULL,
	`token_hash` text NOT NULL,
	`prefix` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`last_used_at` text,
	`revoked_at` text,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_api_keys_token_unique` ON `workspace_api_keys` (`token_hash`);--> statement-breakpoint
CREATE TABLE `workspace_invites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace_id` integer NOT NULL,
	`token_hash` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`expires_at` text NOT NULL,
	`revoked_at` text,
	`uses` integer DEFAULT 0 NOT NULL,
	`max_uses` integer DEFAULT 10 NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_invites_token_unique` ON `workspace_invites` (`token_hash`);--> statement-breakpoint
CREATE TABLE `workspace_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace_id` integer NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_members_ws_email_unique` ON `workspace_members` (`workspace_id`,`email`);--> statement-breakpoint
CREATE INDEX `workspace_members_email_idx` ON `workspace_members` (`email`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_by` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
-- Pre-tenancy rows all belong to workspace 1. It has no members yet: the first
-- sign-in (or any ACCESS_ALLOWED_EMAILS entry) claims it. See docs/spec/workspaces.md.
-- No REFERENCES on the new columns: SQLite cannot add an FK column with a default.
INSERT INTO `workspaces` (`id`, `name`, `created_by`) VALUES (1, '既定のワークスペース', '');--> statement-breakpoint
DROP INDEX `categories_name_unique`;--> statement-breakpoint
ALTER TABLE `categories` ADD `workspace_id` integer NOT NULL DEFAULT 1;--> statement-breakpoint
CREATE UNIQUE INDEX `categories_ws_name_unique` ON `categories` (`workspace_id`,`name`);--> statement-breakpoint
ALTER TABLE `ideas` ADD `workspace_id` integer NOT NULL DEFAULT 1;--> statement-breakpoint
CREATE INDEX `ideas_workspace_idx` ON `ideas` (`workspace_id`);--> statement-breakpoint
ALTER TABLE `inspirations` ADD `workspace_id` integer NOT NULL DEFAULT 1;--> statement-breakpoint
CREATE INDEX `inspirations_workspace_idx` ON `inspirations` (`workspace_id`);--> statement-breakpoint
ALTER TABLE `saved_views` ADD `workspace_id` integer NOT NULL DEFAULT 1;