INSERT OR IGNORE INTO `customers` (
  `id`, `slug`, `customer_name`, `site_name`, `device_name`, `device_id`,
  `collector_mode`, `status`, `owner_user_id`, `owner_email`
) VALUES (
  'demo-caspian-coffee', 'demo-caspian-coffee', 'Caspian Coffee · DEMO',
  'Nizami filialı', 'Shelly Pro 3EM (virtual)', 'DEMO-3EM-001',
  'polling', 'demo', 'demo-only', 'demo@heat.az'
);
--> statement-breakpoint
INSERT OR IGNORE INTO `customer_access_tokens` (`customer_id`, `token_hash`)
VALUES (
  'demo-caspian-coffee',
  '0d7a49323e7590af25e95b75cc285cb723a0264cdd07ff25083da035677dfede'
);
