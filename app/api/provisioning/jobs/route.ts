import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customers, deprovisioningJobs, provisioningJobs } from "@/db/schema";
import { globalAgentIsAuthorized } from "@/lib/provisioning";

export async function GET(request: Request) {
  if (!(await globalAgentIsAuthorized(request))) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const [deletion] = await db.select().from(deprovisioningJobs)
    .where(eq(deprovisioningJobs.status, "pending"))
    .orderBy(asc(deprovisioningJobs.createdAt)).limit(1);
  if (deletion) {
    const [claimed] = await db.update(deprovisioningJobs).set({
      status: "running",
      lockedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attempts: deletion.attempts + 1,
    }).where(and(eq(deprovisioningJobs.id, deletion.id), eq(deprovisioningJobs.status, "pending"))).returning();
    if (claimed) return Response.json({ job: {
      id: deletion.id,
      customerId: deletion.customerId,
      customerSlug: deletion.customerSlug,
      kind: "delete",
    } });
  }
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const [job] = await db.select().from(provisioningJobs).where(eq(provisioningJobs.status, "pending")).orderBy(asc(provisioningJobs.createdAt)).limit(1);
    if (!job) return Response.json({ job: null });
    const [claimed] = await db
      .update(provisioningJobs)
      .set({ status: "running", lockedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), attempts: job.attempts + 1 })
      .where(and(eq(provisioningJobs.id, job.id), eq(provisioningJobs.status, "pending")))
      .returning();
    if (claimed) {
      await db.update(customers).set({ status: "provisioning", updatedAt: new Date().toISOString() }).where(eq(customers.id, job.customerId));
      return Response.json({ job: { id: job.id, customerId: job.customerId, encryptedPayload: job.encryptedPayload, kind: "provision" } });
    }
  }
  return Response.json({ job: null });
}

export async function POST(request: Request) {
  if (!(await globalAgentIsAuthorized(request))) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  const jobId = typeof body.jobId === "string" ? body.jobId : "";
  const status = body.status === "complete" ? "complete" : body.status === "failed" ? "failed" : "";
  const kind = body.kind === "delete" ? "delete" : "provision";
  if (!jobId || !status) return Response.json({ error: "Invalid update" }, { status: 400 });
  const db = getDb();
  if (kind === "delete") {
    const [job] = await db.select().from(deprovisioningJobs).where(eq(deprovisioningJobs.id, jobId)).limit(1);
    if (!job) return Response.json({ error: "Job not found" }, { status: 404 });
    const message = typeof body.message === "string" ? body.message.slice(0, 500) : null;
    const now = new Date().toISOString();
    if (status === "complete") {
      await db.delete(customers).where(eq(customers.id, job.customerId));
    } else {
      await db.batch([
        db.update(deprovisioningJobs).set({ status, statusMessage: message, completedAt: now, updatedAt: now }).where(eq(deprovisioningJobs.id, jobId)),
        db.update(customers).set({ status: "delete_failed", updatedAt: now }).where(eq(customers.id, job.customerId)),
      ]);
    }
    return Response.json({ ok: true });
  }
  const [job] = await db.select().from(provisioningJobs).where(eq(provisioningJobs.id, jobId)).limit(1);
  if (!job) return Response.json({ error: "Job not found" }, { status: 404 });
  const message = typeof body.message === "string" ? body.message.slice(0, 500) : null;
  const grafanaPort = Number.isInteger(body.grafanaPort) ? Number(body.grafanaPort) : null;
  const influxPort = Number.isInteger(body.influxPort) ? Number(body.influxPort) : null;
  const now = new Date().toISOString();
  await db.batch([
    db.update(provisioningJobs).set({ status, statusMessage: message, completedAt: now, updatedAt: now }).where(eq(provisioningJobs.id, jobId)),
    db.update(customers).set({ status: status === "complete" ? "active" : "failed", grafanaPort, influxPort, updatedAt: now }).where(eq(customers.id, job.customerId)),
  ]);
  return Response.json({ ok: true });
}
