CREATE TABLE `customer_secrets` (
	`customer_id` text PRIMARY KEY NOT NULL,
	`encrypted_payload` text NOT NULL,
	`view_count` integer DEFAULT 0 NOT NULL,
	`last_viewed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
