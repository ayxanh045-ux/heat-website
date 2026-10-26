import { env } from "cloudflare:workers";

export interface CloudflareEnvironment {
  PROVISIONING_ENCRYPTION_KEY?: string;
  ADMIN_EMAILS?: string;
  PROVISIONER_AGENT_TOKEN?: string;
  WORKSPACE_AUTH_SECRET?: string;
  ADMIN_ACCESS_TOKEN?: string;
  DB?: unknown;
}

export function getWorkersEnv(): CloudflareEnvironment {
  return (env as unknown as CloudflareEnvironment) || {};
}

export function getProvisioningEncryptionKey(): string {
  const value = getWorkersEnv().PROVISIONING_ENCRYPTION_KEY;
  return typeof value === "string" ? value.trim() : "";
}

export function getAdminEmails(): Set<string> {
  const value = getWorkersEnv().ADMIN_EMAILS;
  return new Set(
    String(value ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function getProvisionerAgentToken(): string {
  const value = getWorkersEnv().PROVISIONER_AGENT_TOKEN;
  return typeof value === "string" ? value.trim() : "";
}

export function getWorkspaceAuthSecret(): string {
  const value = getWorkersEnv().WORKSPACE_AUTH_SECRET;
  return typeof value === "string" ? value.trim() : "";
}

export function getAdminAccessToken(): string {
  const value = getWorkersEnv().ADMIN_ACCESS_TOKEN;
  return typeof value === "string" ? value.trim() : "";
}
