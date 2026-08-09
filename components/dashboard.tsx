"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Bell, ChartNoAxesCombined, ChevronDown, CircleGauge, LayoutDashboard, MapPin, Settings, SlidersHorizontal, Zap } from "lucide-react";
import { DemoBadge } from "./ui";

const baseData = [
  { time: "00:00", power: 5.2 }, { time: "02:00", power: 4.8 }, { time: "04:00", power: 4.4 },
  { time: "06:00", power: 5.1 }, { time: "08:00", power: 9.8 }, { time: "10:00", power: 15.6 },
  { time: "12:00", power: 18.7 }, { time: "14:00", power: 16.8 }, { time: "16:00", power: 19.4 },
  { time: "18:00", power: 21.8 }, { time: "20:00", power: 18.2 }, { time: "22:00", power: 10.1 },
];

function Gauge({ value = 17.6, large = false }: { value?: number; large?: boolean }) {
  const pct = Math.min(value / 50, 1);
  return (
    <div className={`gauge ${large ? "large" : ""}`} style={{ "--gauge": `${pct * 360}deg` } as React.CSSProperties}>
      <div className="gauge-inner"><Zap size={large ? 18 : 14} /><strong>{value.toFixed(1)}</strong><span>kW</span></div>
    </div>
  );
}

function EnergyChart({ compact = false }: { compact?: boolean }) {
  const [range, setRange] = useState("Today");
  const data = useMemo(() => baseData.map((point, i) => ({ ...point, power: +(point.power * (range === "Week" ? .92 : range === "Month" ? .84 : 1) + (i % 3) * .2).toFixed(1) })), [range]);
  return (
    <div className={`chart-wrap ${compact ? "compact-chart" : ""}`}>
      {!compact && <div className="chart-head"><div><span>Energy Consumption</span><small>Power demand throughout the day</small></div><div className="tabs">{["Today", "Week", "Month"].map(tab => <button key={tab} onClick={() => setRange(tab)} className={range === tab ? "active" : ""}>{tab}</button>)}</div></div>}
      <ResponsiveContainer width="100%" height={compact ? 170 : 250}>
        <AreaChart data={data} margin={{ top: 12, right: 8, left: -24, bottom: 0 }}>
          <defs><linearGradient id={`energy-${compact}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B82F6" stopOpacity={.34}/><stop offset="100%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient></defs>
          <CartesianGrid stroke="rgba(255,255,255,.055)" vertical={false} />
          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 10 }} interval={compact ? 1 : 0} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 10 }} unit=" kW" />
          <Tooltip contentStyle={{ background: "#111318", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => [`${v} kW · ${(v * .11).toFixed(2)} AZN`, "Power / Est. cost"]} />
          <Area type="monotone" dataKey="power" stroke="#4f8ff7" strokeWidth={2.2} fill={`url(#energy-${compact})`} animationDuration={1400} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HeroDashboard() {
  const [power, setPower] = useState(17.6);
  const [voltage, setVoltage] = useState(231);
  useEffect(() => { const t = setInterval(() => { setPower(+(15 + Math.random() * 5).toFixed(1)); setVoltage(Math.round(228 + Math.random() * 5)); }, 3200); return () => clearInterval(t); }, []);
  return (
    <div className="hero-dashboard">
      <div className="dash-top"><div><span className="mini-logo">H</span><div><b>HEAT</b><small>Energy Analytics</small></div></div><DemoBadge /></div>
      <div className="hero-dash-grid">
        <div className="power-card"><div className="metric-label"><span>Real-Time Power</span><b className="live"><i /> LIVE</b></div><Gauge value={power} /></div>
        <div className="mini-metrics"><div><span>Today&apos;s Energy</span><strong>284.7 <small>kWh</small></strong></div><div><span>Today&apos;s Cost</span><strong>31.42 <small>AZN</small></strong></div><div><span>Power Factor</span><strong>0.97</strong></div><div><span>Voltage</span><strong>{voltage} <small>V</small></strong></div></div>
      </div>
      <div className="hero-chart"><div className="chart-title"><span>Today&apos;s Consumption</span><small>Live update</small></div><EnergyChart compact /></div>
      <div className="dash-status"><span><i /> System online</span><span>Updated just now</span></div>
    </div>
  );
}

const nav = [LayoutDashboard, Activity, ChartNoAxesCombined, SlidersHorizontal, Bell, MapPin, CircleGauge, Settings];
const navNames = ["Overview", "Live Energy", "Analytics", "Reports", "Alerts", "Locations", "Devices", "Settings"];

export function MainDashboard() {
  const [power, setPower] = useState(17.6);
  useEffect(() => { const t = setInterval(() => setPower(+(15 + Math.random() * 5).toFixed(1)), 3000); return () => clearInterval(t); }, []);
  return (
    <div className="main-dashboard">
      <aside><div className="side-logo"><span>H</span><b>HEAT</b></div><nav>{nav.map((Icon, i) => <button key={navNames[i]} className={i === 0 ? "active" : ""}><Icon size={15}/><span>{navNames[i]}</span>{navNames[i] === "Alerts" && <em>2</em>}</button>)}</nav><div className="side-bottom"><span>DR</span><div><b>Demo Restaurant</b><small>Baku, AZ</small></div></div></aside>
      <div className="dash-main">
        <div className="overview-head"><div><small>MONDAY, AUGUST 9</small><h3>Energy Overview</h3></div><button><MapPin size={14}/> Demo Restaurant — Baku <ChevronDown size={14}/></button></div>
        <div className="online-row"><span><i /> System Online</span><span>Last updated: Live</span><DemoBadge /></div>
        <div className="stats-grid">
          <div className="stat-card featured"><div><span>Real-Time Power</span><b className="normal">NORMAL</b></div><Gauge value={power} large /><small>Range 0 — 50 kW</small></div>
          {[['Today','284.7','kWh','+3.2%'],["Today's Cost",'31.42','AZN','+1.8%'],['Monthly Usage','8,420','kWh','-4.3%'],['Monthly Estimate','1,124','AZN','On track'],['Power Factor','0.97','','Excellent']].map(([label,val,unit,trend]) => <div className="stat-card" key={label}><span>{label}</span><strong>{val} <small>{unit}</small></strong><em className={trend.startsWith('-') || trend === 'Excellent' ? 'good' : ''}>{trend}</em></div>)}
        </div>
        <div className="dashboard-lower"><div className="dash-chart-card"><EnergyChart /></div><div className="cost-card"><div><span>Energy Cost</span><small>Current billing cycle</small></div><dl><div><dt>Today</dt><dd>31.42 AZN</dd></div><div><dt>This Month</dt><dd>824.60 AZN</dd></div><div><dt>Projected</dt><dd>1,124 AZN</dd></div></dl><div className="cost-track"><i /></div><small>73% of projected monthly cost</small></div></div>
      </div>
    </div>
  );
}
