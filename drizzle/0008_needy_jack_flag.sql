CREATE TABLE `admin_bot_events` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text,
	`event_type` text NOT NULL,
	`outcome` text NOT NULL,
	`message` text NOT NULL,
	`delivered_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_admin_bot_events_created` ON `admin_bot_events` (`created_at`);--> statement-breakpoint
CREATE TABLE `admin_bot_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`encrypted_payload` text NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customer_system_health` (
	`customer_id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'unknown' NOT NULL,
	`status_message` text,
	`services_json` text DEFAULT '{}' NOT NULL,
	`last_heartbeat_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_status_change_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
