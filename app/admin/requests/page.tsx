import { desc } from "drizzle-orm";
import { ArrowLeft, ClipboardList } from "lucide-react";
import Link from "next/link";
import { getDb } from "@/db";
import { energyAssessmentRequests } from "@/db/schema";
import { requireAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function EnergyAssessmentRequestsPage() {
  await requireAdminUser("/admin/requests");
  const requests = await getDb().select().from(energyAssessmentRequests)
    .orderBy(desc(energyAssessmentRequests.createdAt)).limit(200);

  return (
    <main className="customer-edit-page">
      <Link className="admin-bot-quick-link" href="/admin"><ArrowLeft size={15} /> Admin panelinə qayıt</Link>
      <header>
        <span className="admin-kicker">ENERJİ QİYMƏTLƏNDİRMƏSİ</span>
        <h1>Sorğular</h1>
        <p>Saytdakı müraciət formasından göndərilmiş son 200 sorğu.</p>
      </header>
      <section className="customer-list-card">
        <div className="customer-list-head">
          <div><h2>Yeni müraciətlər</h2><p>Ən yeni sorğular əvvəl göstərilir.</p></div>
          <span className="admin-bot-quick-link"><ClipboardList size={15} /> {requests.length} sorğu</span>
        </div>
        {requests.length === 0 ? (
          <div className="admin-empty"><ClipboardList size={26} /><b>Hələ sorğu yoxdur</b><span>Yeni müraciətlər burada görünəcək.</span></div>
        ) : (
          <div className="customer-table-wrap">
            <table>
              <thead><tr><th>Tarix</th><th>Ad / şirkət</th><th>Fəaliyyət</th><th>Əlaqə</th><th>Obyekt / xərc</th><th>Mesaj</th></tr></thead>
              <tbody>{requests.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.createdAt).toLocaleString("az-AZ", { timeZone: "Asia/Baku" })}</td>
                  <td><b>{item.fullName}</b><span>{item.companyName}</span></td>
                  <td>{item.businessType}</td>
                  <td><a href={`tel:${item.phone}`}>{item.phone}</a><span><a href={`mailto:${item.email}`}>{item.email}</a></span></td>
                  <td>{item.locationCount ?? "—"}<span>{item.monthlyElectricityCost || "—"}</span></td>
                  <td>{item.message || "—"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
