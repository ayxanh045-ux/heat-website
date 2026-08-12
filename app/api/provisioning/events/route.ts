import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customers } from "@/db/schema";
import { notifyAdminBot } from "@/lib/admin-bot";
import { agentIsAuthorized } from "@/lib/provisioning";

export async function POST(request: Request) {
  if (!(await agentIsAuthorized(request))) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const customerSlug = typeof body.customerSlug === "string" ? body.customerSlug.trim().slice(0, 50) : "";
    const outcome = body.outcome === "delivered" || body.outcome === "used" ? String(body.outcome) : body.outcome === "failed" ? "failed" : "";
    const detail = typeof body.message === "string" ? body.message.trim().slice(0, 180) : "";
    const kind = body.kind === "command" ? "command" : "report";
    const command = typeof body.command === "string" && /^\/[a-z0-9_]{1,30}$/.test(body.command)
      ? body.command
      : "";
    if (!customerSlug || !outcome) return Response.json({ error: "Invalid event" }, { status: 400 });
    const [customer] = await getDb().select().from(customers).where(eq(customers.slug, customerSlug)).limit(1);
    if (!customer) return Response.json({ error: "Customer not found" }, { status: 404 });
    if (kind === "command" && !command) return Response.json({ error: "Invalid command" }, { status: 400 });
    const delivered = outcome === "delivered";
    const commandUsed = kind === "command" && outcome === "used";
    const result = await notifyAdminBot({
      customerId: customer.id,
      eventType: kind === "command"
        ? commandUsed ? "customer_command_used" : "customer_command_failed"
        : delivered ? "customer_report_delivered" : "customer_report_failed",
      message: kind === "command"
        ? `${commandUsed ? "📲" : "❌"} HEAT Admin — Müştəri Telegram komandası ${commandUsed ? "işlətdi" : "xətası"}\n\nMüştəri: ${customer.customerName}\nObyekt: ${customer.siteName}\nKomanda: ${command}\nNəticə: ${commandUsed ? "Cavab uğurla göndərildi." : detail || "Cavab göndərilmədi."}\nVaxt: ${new Date().toISOString()}`
        : `${delivered ? "✅" : "❌"} HEAT Admin — Avtomatik report ${delivered ? "göndərildi" : "xətası"}\n\nMüştəri: ${customer.customerName}\nObyekt: ${customer.siteName}\nNəticə: ${delivered ? "Müştəri Telegram reportunu qəbul etdi." : detail || "Telegram reportu göndərilmədi."}\nVaxt: ${new Date().toISOString()}`,
    });
    return Response.json({ ok: true, adminNotified: result.delivered });
  } catch {
    return Response.json({ error: "Invalid event" }, { status: 400 });
  }
}
