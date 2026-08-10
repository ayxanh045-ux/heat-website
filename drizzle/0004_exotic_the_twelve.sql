DROP INDEX `idx_provisioning_jobs_customer_unique`;--> statement-breakpoint
CREATE INDEX `idx_provisioning_jobs_customer` ON `provisioning_jobs` (`customer_id`);