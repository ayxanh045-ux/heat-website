CREATE TABLE `ai_analysis_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`encrypted_api_key` text NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`report_time` text DEFAULT '09:00' NOT NULL,
	`model` text DEFAULT 'gemini-2.5-flash' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ai_daily_analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`local_date` text NOT NULL,
	`status` text NOT NULL,
	`analysis_text` text,
	`error_message` text,
	`model` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_ai_daily_analyses_customer_date` ON `ai_daily_analyses` (`customer_id`,`local_date`);--> statement-breakpoint
PRAGMA optimize;
