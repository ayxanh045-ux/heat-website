CREATE TABLE `customer_energy_settings` (
	`customer_id` text PRIMARY KEY NOT NULL,
	`monthly_budget_azn` real DEFAULT 500 NOT NULL,
	`working_hours_start` text DEFAULT '08:00' NOT NULL,
	`working_hours_end` text DEFAULT '22:00' NOT NULL,
	`peak_threshold_kw` real DEFAULT 10 NOT NULL,
	`budget_warning_percent` integer DEFAULT 80 NOT NULL,
	`alert_budget` integer DEFAULT true NOT NULL,
	`alert_after_hours` integer DEFAULT true NOT NULL,
	`alert_peak` integer DEFAULT true NOT NULL,
	`alert_anomaly` integer DEFAULT true NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `customer_energy_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`device_id` text NOT NULL,
	`measured_at` text NOT NULL,
	`total_power_kw` real NOT NULL,
	`phase_a_kw` real,
	`phase_b_kw` real,
	`phase_c_kw` real,
	`total_energy_kwh` real,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_customer_energy_snapshots_unique` ON `customer_energy_snapshots` (`customer_id`,`device_id`,`measured_at`);--> statement-breakpoint
CREATE INDEX `idx_customer_energy_snapshots_lookup` ON `customer_energy_snapshots` (`customer_id`,`measured_at`);
--> statement-breakpoint
PRAGMA optimize;
