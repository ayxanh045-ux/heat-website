CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`customer_name` text NOT NULL,
	`site_name` text NOT NULL,
	`device_name` text NOT NULL,
	`device_id` text NOT NULL,
	`collector_mode` text DEFAULT 'polling' NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`grafana_port` integer,
	`influx_port` integer,
	`owner_user_id` text NOT NULL,
	`owner_email` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_customers_slug_unique` ON `customers` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_customers_device_id_unique` ON `customers` (`device_id`);--> statement-breakpoint
CREATE TABLE `provisioning_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`encrypted_payload` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`status_message` text,
	`locked_at` text,
	`completed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_provisioning_jobs_customer_unique` ON `provisioning_jobs` (`customer_id`);