import { env } from "cloudflare:workers";
import { getDb } from "@/db";
import { adminDevices } from "@/db/schema";
import { ADMIN_DEVICE_COOKIE, ADMIN_DEVICE_MAX_AGE, getAllowlistedAdminUser } from "@/lib/admin-auth";
import { randomToken, sha256 } from "@/lib/customer-auth";
import { requestIsSameOrigin } from "@/lib/provisioning";

async function sameSecret(left: string, right: string): Promise<boolean> {
  if (!left || !right) return false;
  const [a, b] = await Promise.all([sha256(left), sha256(right)]);
  let difference = a.length ^ b.length;
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}

export async function POST(request: Request) {
  if (!requestIsSameOrigin(request)) return Response.json({ error: "Etibarsız sorğu mənbəyi." }, { status: 403 });
  const admin = await getAllowlistedAdminUser();
  if (!admin) return Response.json({ error: "İcazə yoxdur." }, { status: 403 });

  const existing = await getDb().select({ id: adminDevices.id }).from(adminDevices).limit(1);
  if (existing.length) return Response.json({ error: "Admin cihazı artıq qeydiyyatdan keçib." }, { status: 409 });

  const body = await request.json().catch(() => ({})) as { setupToken?: string };
  const configured = String((env as unknown as Record<string, unknown>).ADMIN_DEVICE_SETUP_TOKEN ?? "");
  if (!await sameSecret(String(body.setupToken ?? "").trim(), configured)) {
    return Response.json({ error: "Quraşdırma kodu düzgün deyil." }, { status: 401 });
  }

  const deviceToken = randomToken(32);
  await getDb().insert(adminDevices).values({
    id: "primary-admin-device",
    tokenHash: await sha256(deviceToken),
    enrolledByEmail: admin.email.toLowerCase(),
  });
  return Response.json({ ok: true }, {
    headers: {
      "cache-control": "no-store, private",
      "set-cookie": `${ADMIN_DEVICE_COOKIE}=${deviceToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${ADMIN_DEVICE_MAX_AGE}`,
    },
  });
}
