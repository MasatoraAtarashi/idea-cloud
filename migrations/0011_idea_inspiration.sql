ALTER TABLE `ideas` ADD `inspiration_id` integer REFERENCES `inspirations`(`id`) ON DELETE SET NULL;
