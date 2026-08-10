import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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
  (table) => [uniqueIndex("idx_provisioning_jobs_customer_unique").on(table.customerId)],
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
