PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`username` text NOT NULL,
	`display_name` text NOT NULL,
	`bio` text,
	`avatar_url` text,
	`logo_url` text,
	`show_qr` integer DEFAULT true NOT NULL,
	`show_icons` integer DEFAULT true NOT NULL,
	`theme_preset_id` text DEFAULT 'monochrome',
	`theme_json` text,
	`custom_colors` text,
	`created_at` integer DEFAULT (unixepoch('now') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_profiles`("id", "user_id", "username", "display_name", "bio", "avatar_url", "logo_url", "show_qr", "show_icons", "theme_preset_id", "theme_json", "custom_colors", "created_at") SELECT "id", "user_id", "username", "display_name", "bio", "avatar_url", "logo_url", "show_qr", "show_icons", "theme_preset_id", "theme_json", "custom_colors", "created_at" FROM `profiles`;--> statement-breakpoint
DROP TABLE `profiles`;--> statement-breakpoint
ALTER TABLE `__new_profiles` RENAME TO `profiles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_username_unique` ON `profiles` (`username`);