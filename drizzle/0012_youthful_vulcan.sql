CREATE TABLE `customer_agent_tokens` (
	`customer_id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customer_agent_tokens_token_hash_unique` ON `customer_agent_tokens` (`token_hash`);--> statement-breakpoint
CREATE TABLE `deprovisioning_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`customer_slug` text NOT NULL,
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
CREATE INDEX `idx_deprovisioning_jobs_customer` ON `deprovisioning_jobs` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_deprovisioning_jobs_status_created` ON `deprovisioning_jobs` (`status`,`created_at`);--> statement-breakpoint
PRAGMA optimize;
