CREATE TABLE `telegram_report_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`scheduled_for` text NOT NULL,
	`delivered_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_telegram_report_delivery_unique` ON `telegram_report_deliveries` (`customer_id`,`scheduled_for`);