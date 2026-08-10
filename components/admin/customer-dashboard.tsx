"use client";

import { AlertTriangle, CheckCircle2, ExternalLink, MessageCircle, Sparkles, Zap } from "lucide-react";
import { useState } from "react";

type Customer = {
  customerName: string;
  siteName: string;
  deviceName: string;
  deviceId: string;
  status: string;
  grafanaPort: number | null;
};

const SCENARIOS = {
  normal: {
    label: "Normal", power: "6.42 kW", energy: "80 kWh", projection: "2,410 kWh", formula: "90 + (80 × 29)", status: "Normal",
    phases: [58, 44, 36], phaseValues: ["2.71 kW", "2.04 kW", "1.67 kW"],
    insight: "İstehlak normaldır", detail: "Soyuducu və çay aparatının yükü gözlənilən iş rejimindədir. Hazırda müdaxilə tələb olunmur.",
    telegramTitle: "✅ Sistem normaldır", telegram: "Hazırkı güc: 6.42 kW\nBugünkü enerji: 84.7 kWh\nProblem aşkarlanmayıb.", tone: "ok",
    paths: ["M30 154 L80 158 L130 154 L180 143 L230 126 L280 100 L330 89 L380 99 L430 82 L480 69 L530 78 L580 64", "M30 165 L80 167 L130 160 L180 156 L230 141 L280 125 L330 114 L380 116 L430 106 L480 93 L530 98 L580 85", "M30 171 L80 169 L130 167 L180 160 L230 150 L280 136 L330 130 L380 123 L430 119 L480 107 L530 111 L580 101"],
  },
  peak: {
    label: "Pik yük", power: "11.86 kW", energy: "110 kWh", projection: "3,280 kWh", formula: "90 + (110 × 29)", status: "Diqqət",
    phases: [92, 71, 58], phaseValues: ["5.32 kW", "3.81 kW", "2.73 kW"],
    insight: "Pik yük müəyyən edildi", detail: "Çay aparatı, soba və kondisioner eyni vaxtda işləyir. Sobanın işini 15 dəqiqə gecikdirmək pik yükü azalda bilər.",
    telegramTitle: "⚠️ Pik yük xəbərdarlığı", telegram: "Hazırkı güc: 11.86 kW\nFaza A: 5.32 kW\nTövsiyə: sobanı 15 dəqiqə gecikdirin.", tone: "warn",
    paths: ["M30 154 L80 158 L130 154 L180 143 L230 126 L280 100 L330 86 L380 39 L430 27 L480 34 L530 56 L580 62", "M30 165 L80 167 L130 160 L180 156 L230 141 L280 125 L330 114 L380 82 L430 66 L480 71 L530 88 L580 85", "M30 171 L80 169 L130 167 L180 160 L230 150 L280 136 L330 130 L380 110 L430 99 L480 102 L530 109 L580 101"],
  },
  anomaly: {
    label: "Anomaliya", power: "9.34 kW", energy: "130 kWh", projection: "3,860 kWh", formula: "90 + (130 × 29)", status: "Anomaliya",
    phases: [98, 39, 31], phaseValues: ["6.10 kW", "1.81 kW", "1.43 kW"],
    insight: "Faza A-da qeyri-adi yük", detail: "Bağlanış saatından sonra Faza A-da 6.10 kW davamlı istehlak görünür. Çay aparatı və sobanın söndürüldüyünü yoxlayın.",
    telegramTitle: "🚨 Anomaliya aşkarlandı", telegram: "Saat: 01:42\nFaza A: 6.10 kW\nGecə bazasından 4.8× yüksəkdir.\nObyekti yoxlayın.", tone: "danger",
    paths: ["M30 40 L80 43 L130 39 L180 45 L230 41 L280 47 L330 42 L380 46 L430 40 L480 44 L530 38 L580 40", "M30 165 L80 167 L130 160 L180 156 L230 161 L280 158 L330 162 L380 159 L430 161 L480 156 L530 160 L580 158", "M30 171 L80 169 L130 167 L180 170 L230 166 L280 168 L330 165 L380 169 L430 167 L480 170 L530 166 L580 168"],
  },
} as const;

export function CustomerDashboard({ customer }: { customer: Customer }) {
  const [scenario, setScenario] = useState<keyof typeof SCENARIOS>("normal");
  const current = SCENARIOS[scenario];
  return <div className={`customer-dashboard tone-${current.tone}`}>
    <div className="customer-demo-note"><Sparkles size={15} /><span>Demo görünüşü</span><p>Real enerji məlumatları sistem aktiv olduqda Grafana-da görünəcək.</p></div>
    <div className="customer-dash-head"><div><span className="admin-kicker">ENERGY MONITORING</span><h1>{customer.customerName}</h1><p>{customer.siteName} · {customer.deviceName} · <code>{customer.deviceId}</code></p></div><div className="dash-scenarios">{Object.entries(SCENARIOS).map(([key, value]) => <button key={key} className={scenario === key ? "active" : ""} type="button" onClick={() => setScenario(key as keyof typeof SCENARIOS)}>{value.label}</button>)}</div></div>
    <div className="customer-pipeline"><span><i />Shelly qoşulub</span><span><i />InfluxDB yazır</span><span><i />Grafana hazırdır</span><span><i />Telegram aktivdir</span></div>
    <div className="customer-metrics"><div><span>Hazırkı güc</span><strong>{current.power}</strong><small>Canlı ölçü</small></div><div><span>Son tamamlanmış gün</span><strong>{current.energy}</strong><small>Ayın 2-ci günü</small></div><div><span>Aylıq proqnoz</span><strong>{current.projection}</strong><small>{current.formula}</small></div><div><span>Sistem statusu</span><strong>{current.status}</strong><small>{current.tone === "ok" ? "Problem yoxdur" : "Yoxlama lazımdır"}</small></div></div>
    <div className="customer-dash-grid"><section className="customer-chart"><header><div><b>24 saatlıq güc</b><small>A, B və C fazaları</small></div><div><i />A <i />B <i />C</div></header><svg viewBox="0 0 610 200" role="img" aria-label="Üç fazanın 24 saatlıq güc qrafiki"><line x1="30" y1="25" x2="590" y2="25"/><line x1="30" y1="80" x2="590" y2="80"/><line x1="30" y1="135" x2="590" y2="135"/><line x1="30" y1="180" x2="590" y2="180"/><path d={current.paths[0]}/><path d={current.paths[1]}/><path d={current.paths[2]}/><text x="30" y="197">00:00</text><text x="170" y="197">06:00</text><text x="310" y="197">12:00</text><text x="450" y="197">18:00</text><text x="555" y="197">24:00</text></svg></section><section className="customer-phases"><h2>Fazalar</h2>{["A", "B", "C"].map((phase, index) => <div className="customer-phase" key={phase}><div><span>Faza {phase}</span><b>{current.phaseValues[index]}</b></div><i><b style={{ width: `${current.phases[index]}%` }} /></i></div>)}</section></div>
    <div className="customer-dash-lower"><section className="customer-insight"><span>{current.tone === "ok" ? <CheckCircle2 /> : <AlertTriangle />}</span><div><small>HEAT ANALYTICS</small><h2>{current.insight}</h2><p>{current.detail}</p></div></section><section className="customer-telegram"><header><MessageCircle size={16} /><b>Telegram · HEAT Bot</b><i>online</i></header><div><b>{current.telegramTitle}</b><p>{current.telegram}</p><small>indi</small></div></section></div>
    {customer.status === "active" && customer.grafanaPort ? <a className="open-real-grafana" href={`http://localhost:${customer.grafanaPort}`}><Zap size={16} /> Real Grafana dashboardunu aç <ExternalLink size={14} /></a> : <div className="grafana-wait"><Zap size={16} /> Real Grafana keçidi qurulum tamamlandıqdan sonra aktiv olacaq.</div>}
  </div>;
}
