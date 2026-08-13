CREATE TABLE `customer_daily_energy` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`device_id` text NOT NULL,
	`local_date` text NOT NULL,
	`energy_kwh` real NOT NULL,
	`cost_azn` real NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_customer_daily_energy_unique` ON `customer_daily_energy` (`customer_id`,`device_id`,`local_date`);--> statement-breakpoint
CREATE INDEX `idx_customer_daily_energy_lookup` ON `customer_daily_energy` (`customer_id`,`local_date`);