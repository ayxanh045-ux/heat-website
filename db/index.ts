import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb(options: { readFromPrimary?: boolean } = {}) {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  const client = options.readFromPrimary && typeof env.DB.withSession === "function"
    ? env.DB.withSession("first-primary")
    : env.DB;
  return drizzle(client as typeof env.DB, { schema });
}
