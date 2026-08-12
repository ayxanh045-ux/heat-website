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
    const outcome = body.outcome === "delivered" ? "delivered" : body.outcome === "failed" ? "failed" : "";
    const detail = typeof body.message === "string" ? body.message.trim().slice(0, 180) : "";
    if (!customerSlug || !outcome) return Response.json({ error: "Invalid event" }, { status: 400 });
    const [customer] = await getDb().select().from(customers).where(eq(customers.slug, customerSlug)).limit(1);
    if (!customer) return Response.json({ error: "Customer not found" }, { status: 404 });
    const delivered = outcome === "delivered";
    const result = await notifyAdminBot({
      customerId: customer.id,
      eventType: delivered ? "customer_report_delivered" : "customer_report_failed",
      message: `${delivered ? "✅" : "❌"} HEAT Admin — Avtomatik report ${delivered ? "göndərildi" : "xətası"}\n\nMüştəri: ${customer.customerName}\nObyekt: ${customer.siteName}\nNəticə: ${delivered ? "Müştəri Telegram reportunu qəbul etdi." : detail || "Telegram reportu göndərilmədi."}\nVaxt: ${new Date().toISOString()}`,
    });
    return Response.json({ ok: true, adminNotified: result.delivered });
  } catch {
    return Response.json({ error: "Invalid event" }, { status: 400 });
  }
}
