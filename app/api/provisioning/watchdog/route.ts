import { desc, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { adminBotEvents } from "@/db/schema";
import { notifyAdminBot } from "@/lib/admin-bot";
import { globalAgentIsAuthorized } from "@/lib/provisioning";

const SOURCE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function formatBakuTime(date = new Date()) {
  return new Intl.DateTimeFormat("az-AZ", {
    timeZone: "Asia/Baku",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function buildWatchdogMessage({
  recovered,
  sourceId,
  detail,
}: {
  recovered: boolean;
  sourceId: string;
  detail: string;
}) {
  const time = formatBakuTime();
  if (recovered) {
    return `✅ HEAT Admin — Mərkəzi sistem bərpa olundu

Server: ${sourceId}
Vaxt (Bakı): ${time}
${detail ? `Yoxlama nəticəsi: ${detail}\n` : ""}
NƏ DÜZƏLDİ?
• Mərkəzi provisioner yenidən işləyir.
• Müştəri sistemlərinin avtomatik vəziyyət yoxlamaları bərpa olunub.
• Yeni qurulum tapşırıqları və planlı hesabat yoxlamaları yenidən icra olunur.

NƏ ETMƏLİ?
Əlavə müdaxilə tələb olunmur. Watchdog sistemi izləməyə davam edir.`;
  }

  return `🚨 HEAT Admin — Mərkəzi sistemdə problem aşkarlandı

Server: ${sourceId}
Vaxt (Bakı): ${time}
${detail ? `Aşkarlanan səbəb: ${detail}\n` : ""}
NƏ İŞLƏMİR?
• Mərkəzi provisioner cavab vermir.
• Müştəri Docker/collector, InfluxDB və Grafana sistemlərinin avtomatik vəziyyət yoxlamaları dayanıb.
• Yeni müştəri qurulumları və provisioner üzərindən başladılan planlı hesabatlar icra olunmaya bilər.
• Hazırda işləyən müştəri dashboardları öz konteynerləri işləkdirsə fəaliyyətini davam etdirə bilər.

NƏ ETMƏK LAZIMDIR?
1. Serverin açıq və internetə qoşulu olduğunu yoxlayın.
2. HEAT Provisioner xidmətini yenidən başladın.
3. Docker Desktop/Docker xidmətinin işlədiyini yoxlayın.
4. Problem qalarsa provisioner xəta jurnalını yoxlayın və texniki müdaxilə edin.

Watchdog nəzarətə davam edir və sistem düzələn kimi ayrıca bərpa mesajı göndərəcək.`;
}

export async function POST(request: Request) {
  if (!(await globalAgentIsAuthorized(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json() as Record<string, unknown>;
    const sourceId = typeof body.sourceId === "string" ? body.sourceId.trim().slice(0, 50) : "";
    const status = body.status === "healthy" ? "healthy" : body.status === "unhealthy" ? "unhealthy" : "";
    const detail = typeof body.message === "string" ? body.message.trim().slice(0, 300) : "";
    if (!SOURCE_ID.test(sourceId) || !status) {
      return Response.json({ error: "Invalid watchdog heartbeat" }, { status: 400 });
    }

    const problemType = `watchdog_problem_${sourceId}`;
    const recoveryType = `watchdog_recovered_${sourceId}`;
    const [latest] = await getDb().select({
      eventType: adminBotEvents.eventType,
      outcome: adminBotEvents.outcome,
    }).from(adminBotEvents)
      .where(inArray(adminBotEvents.eventType, [problemType, recoveryType]))
      .orderBy(desc(adminBotEvents.createdAt))
      .limit(1);

    const desiredType = status === "healthy" ? recoveryType : problemType;
    if ((!latest && status === "healthy") || (latest?.eventType === desiredType && latest.outcome === "delivered")) {
      return Response.json({ ok: true, adminNotified: false });
    }

    const recovered = status === "healthy";
    const result = await notifyAdminBot({
      eventType: desiredType,
      message: buildWatchdogMessage({ recovered, sourceId, detail }),
    });
    return Response.json({ ok: true, adminNotified: result.delivered });
  } catch {
    return Response.json({ error: "Invalid watchdog heartbeat" }, { status: 400 });
  }
}
