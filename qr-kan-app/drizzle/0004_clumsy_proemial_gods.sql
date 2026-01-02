CREATE TABLE `block_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`block_id` text NOT NULL,
	`variant_name` text NOT NULL,
	`data_json` text NOT NULL,
	`traffic_split` integer DEFAULT 50 NOT NULL,
	`impressions` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now') * 1000) NOT NULL,
	FOREIGN KEY (`block_id`) REFERENCES `blocks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `clicks` ADD `variant_id` text;