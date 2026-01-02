CREATE TABLE `clicks` (
	`id` text PRIMARY KEY NOT NULL,
	`block_id` text NOT NULL,
	`ts` integer DEFAULT (unixepoch('now') * 1000) NOT NULL,
	`referrer` text,
	`user_agent` text,
	`ip_hash` text,
	FOREIGN KEY (`block_id`) REFERENCES `blocks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `visits` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`ts` integer DEFAULT (unixepoch('now') * 1000) NOT NULL,
	`referrer` text,
	`user_agent` text,
	`ip_hash` text,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
