CREATE TABLE `energy_assessment_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`company_name` text NOT NULL,
	`business_type` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`location_count` integer,
	`monthly_electricity_cost` text,
	`message` text,
	`language` text DEFAULT 'az' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_energy_assessment_requests_created` ON `energy_assessment_requests` (`created_at`);