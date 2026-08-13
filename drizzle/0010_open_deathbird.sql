CREATE TABLE `admin_status_digest_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`scheduled_for` text NOT NULL,
	`delivered_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_admin_status_digest_scheduled_unique` ON `admin_status_digest_deliveries` (`scheduled_for`);