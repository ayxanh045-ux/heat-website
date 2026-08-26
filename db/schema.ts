import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const customers = sqliteTable(
  "customers",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    customerName: text("customer_name").notNull(),
    siteName: text("site_name").notNull(),
    deviceName: text("device_name").notNull(),
    deviceId: text("device_id").notNull(),
    collectorMode: text("collector_mode").notNull().default("polling"),
    status: text("status").notNull().default("queued"),
    grafanaPort: integer("grafana_port"),
    influxPort: integer("influx_port"),
    ownerUserId: text("owner_user_id").notNull(),
    ownerEmail: text("owner_email").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_customers_slug_unique").on(table.slug),
    uniqueIndex("idx_customers_device_id_unique").on(table.deviceId),
  ],
);

export const provisioningJobs = sqliteTable(
  "provisioning_jobs",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    encryptedPayload: text("encrypted_payload").notNull(),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    statusMessage: text("status_message"),
    lockedAt: text("locked_at"),
    completedAt: text("completed_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_provisioning_jobs_customer").on(table.customerId)],
);

export const customerSecrets = sqliteTable("customer_secrets", {
  customerId: text("customer_id").primaryKey().references(() => customers.id, { onDelete: "cascade" }),
  encryptedPayload: text("encrypted_payload").notNull(),
  viewCount: integer("view_count").notNull().default(0),
  lastViewedAt: text("last_viewed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const customerAccessTokens = sqliteTable("customer_access_tokens", {
  customerId: text("customer_id").primaryKey().references(() => customers.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const customerAgentTokens = sqliteTable("customer_agent_tokens", {
  customerId: text("customer_id").primaryKey().references(() => customers.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const deprovisioningJobs = sqliteTable(
  "deprovisioning_jobs",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    customerSlug: text("customer_slug").notNull(),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    statusMessage: text("status_message"),
    lockedAt: text("locked_at"),
    completedAt: text("completed_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_deprovisioning_jobs_customer").on(table.customerId),
    index("idx_deprovisioning_jobs_status_created").on(table.status, table.createdAt),
  ],
);

export const customerSessions = sqliteTable(
  "customer_sessions",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    sessionHash: text("session_hash").notNull(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("idx_customer_sessions_hash_unique").on(table.sessionHash)],
);

export const telegramReportDeliveries = sqliteTable(
  "telegram_report_deliveries",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    scheduledFor: text("scheduled_for").notNull(),
    deliveredAt: text("delivered_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("idx_telegram_report_delivery_unique").on(table.customerId, table.scheduledFor)],
);

export const adminBotSettings = sqliteTable("admin_bot_settings", {
  id: text("id").primaryKey(),
  encryptedPayload: text("encrypted_payload").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const customerSystemHealth = sqliteTable("customer_system_health", {
  customerId: text("customer_id").primaryKey().references(() => customers.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("unknown"),
  statusMessage: text("status_message"),
  servicesJson: text("services_json").notNull().default("{}"),
  lastHeartbeatAt: text("last_heartbeat_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastStatusChangeAt: text("last_status_change_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const customerDailyEnergy = sqliteTable(
  "customer_daily_energy",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    deviceId: text("device_id").notNull(),
    localDate: text("local_date").notNull(),
    energyKwh: real("energy_kwh").notNull(),
    costAzn: real("cost_azn").notNull(),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_customer_daily_energy_unique").on(table.customerId, table.deviceId, table.localDate),
    index("idx_customer_daily_energy_lookup").on(table.customerId, table.localDate),
  ],
);

export const customerEnergySettings = sqliteTable("customer_energy_settings", {
  customerId: text("customer_id").primaryKey().references(() => customers.id, { onDelete: "cascade" }),
  monthlyBudgetAzn: real("monthly_budget_azn").notNull().default(500),
  workingHoursStart: text("working_hours_start").notNull().default("08:00"),
  workingHoursEnd: text("working_hours_end").notNull().default("22:00"),
  peakThresholdKw: real("peak_threshold_kw").notNull().default(10),
  budgetWarningPercent: integer("budget_warning_percent").notNull().default(80),
  alertBudget: integer("alert_budget", { mode: "boolean" }).notNull().default(true),
  alertAfterHours: integer("alert_after_hours", { mode: "boolean" }).notNull().default(true),
  alertPeak: integer("alert_peak", { mode: "boolean" }).notNull().default(true),
  alertAnomaly: integer("alert_anomaly", { mode: "boolean" }).notNull().default(true),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const customerEnergySnapshots = sqliteTable(
  "customer_energy_snapshots",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    deviceId: text("device_id").notNull(),
    measuredAt: text("measured_at").notNull(),
    totalPowerKw: real("total_power_kw").notNull(),
    phaseAKw: real("phase_a_kw"),
    phaseBKw: real("phase_b_kw"),
    phaseCKw: real("phase_c_kw"),
    totalEnergyKwh: real("total_energy_kwh"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_customer_energy_snapshots_unique").on(table.customerId, table.deviceId, table.measuredAt),
    index("idx_customer_energy_snapshots_lookup").on(table.customerId, table.measuredAt),
  ],
);

export const adminBotEvents = sqliteTable(
  "admin_bot_events",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
    eventType: text("event_type").notNull(),
    outcome: text("outcome").notNull(),
    message: text("message").notNull(),
    deliveredAt: text("delivered_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_admin_bot_events_created").on(table.createdAt)],
);

export const adminStatusDigestDeliveries = sqliteTable(
  "admin_status_digest_deliveries",
  {
    id: text("id").primaryKey(),
    scheduledFor: text("scheduled_for").notNull(),
    deliveredAt: text("delivered_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("idx_admin_status_digest_scheduled_unique").on(table.scheduledFor)],
);

export const aiAnalysisSettings = sqliteTable("ai_analysis_settings", {
  id: text("id").primaryKey(),
  encryptedApiKey: text("encrypted_api_key").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  weeklyEnabled: integer("weekly_enabled", { mode: "boolean" }).notNull().default(false),
  monthlyEnabled: integer("monthly_enabled", { mode: "boolean" }).notNull().default(false),
  reportTime: text("report_time").notNull().default("09:00"),
  model: text("model").notNull().default("gemini-2.5-flash"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const aiDailyAnalyses = sqliteTable(
  "ai_daily_analyses",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    localDate: text("local_date").notNull(),
    status: text("status").notNull(),
    analysisText: text("analysis_text"),
    errorMessage: text("error_message"),
    model: text("model").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_ai_daily_analyses_customer_date").on(table.customerId, table.localDate),
  ],
);

export const adminDevices = sqliteTable("admin_devices", {
  id: text("id").primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  setupTokenHash: text("setup_token_hash"),
  enrolledByEmail: text("enrolled_by_email").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastSeenAt: text("last_seen_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const customerLoginAttempts = sqliteTable("customer_login_attempts", {
  fingerprint: text("fingerprint").primaryKey(),
  failureCount: integer("failure_count").notNull().default(0),
  windowStartedAt: text("window_started_at").notNull(),
  blockedUntil: text("blocked_until"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
