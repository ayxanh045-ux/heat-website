"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AirVent,
  ArrowRight,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Coffee,
  Factory,
  Gauge,
  Hotel,
  Lightbulb,
  Mail,
  MapPin,
  MonitorCheck,
  Phone,
  Radar,
  Refrigerator,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
  X,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button, Card, Reveal, SectionHeader } from "./ui";
import { MainDashboard } from "./dashboard";

const problems = [
  [
    Clock3,
    "After-Hours Consumption",
    "Equipment continues consuming electricity when your business is closed.",
  ],
  [
    TrendingUp,
    "Unexpected Peaks",
    "Sudden energy spikes can increase operating costs without being noticed.",
  ],
  [
    Radar,
    "No Real-Time Visibility",
    "Traditional electricity bills show what happened — not what is happening now.",
  ],
  [
    Lightbulb,
    "Hidden Operational Waste",
    "Small inefficiencies across many hours can accumulate into meaningful costs.",
  ],
];

export function ProblemSection() {
  return (
    <section className="problem section" id="solutions">
      <div className="container">
        <Reveal>
          <SectionHeader
            eyebrow="THE INVISIBLE PROBLEM"
            title={
              <>
                <span>Your business closes.</span>
                <br />
                Your electricity bill doesn&apos;t.
              </>
            }
            body="Air conditioning, lighting, kitchen equipment and refrigeration can keep consuming after working hours. Without continuous monitoring, that usage remains invisible."
          />
        </Reveal>
        <div className="problem-grid">
          {problems.map(([Icon, title, text], i) => (
            <Reveal key={String(title)} delay={i * 0.07}>
              <Card>
                <span className="icon-box">
                  <Icon size={20} />
                </span>
                <h3>{String(title)}</h3>
                <p>{String(text)}</p>
                <span className="card-index">0{i + 1}</span>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PlatformSection() {
  return (
    <section className="platform section" id="platform">
      <div className="container">
        <Reveal>
          <SectionHeader
            align="center"
            eyebrow="THE HEAT PLATFORM"
            title="One clear view of your energy."
            body="Monitor, analyze and understand your business’s electricity consumption from a single intelligent workspace."
          />
        </Reveal>
        <Reveal className="dashboard-stage">
          <div className="stage-glow" />
          <MainDashboard />
        </Reveal>
      </div>
    </section>
  );
}

const features = [
  [
    Radar,
    "Waste Detection",
    "Identify unusual electricity usage and unnecessary consumption.",
  ],
  [
    TrendingUp,
    "Peak Analysis",
    "Understand when your business consumes the most energy.",
  ],
  [
    CircleDollarSign,
    "Cost Intelligence",
    "Translate electricity usage into understandable financial impact.",
  ],
  [
    Clock3,
    "After-Hours Monitoring",
    "Detect electricity consumption outside working hours.",
  ],
  [
    Bell,
    "Smart Alerts",
    "Receive notifications when unusual activity is detected.",
  ],
  [
    Sparkles,
    "Energy Recommendations",
    "Turn consumption data into actionable operational insights.",
  ],
];

export function IntelligenceSection() {
  return (
    <section className="intelligence section">
      <div className="container">
        <Reveal>
          <SectionHeader
            eyebrow="HEAT INTELLIGENCE"
            title="See what others don’t."
            body="HEAT continuously analyzes energy patterns and highlights unusual or unnecessary consumption."
          />
        </Reveal>
        <div className="feature-grid">
          {features.map(([Icon, title, text], i) => (
            <Reveal key={String(title)} delay={(i % 3) * 0.06}>
              <Card>
                <Icon size={21} />
                <h3>{String(title)}</h3>
                <p>{String(text)}</p>
              </Card>
            </Reveal>
          ))}
        </div>
        <div className="insight-layout">
          <Reveal className="ai-insight">
            <div className="insight-top">
              <div>
                <span className="ai-dot">
                  <Sparkles size={15} />
                </span>
                <div>
                  <b>HEAT Intelligence</b>
                  <small>Analysis Complete</small>
                </div>
              </div>
              <span className="analysis-state">
                <i /> ANALYZED
              </span>
            </div>
            <div className="warning-title">
              <span>
                <Zap size={17} />
              </span>
              <div>
                <small>POSSIBLE ENERGY WASTE DETECTED</small>
                <h3>After-hours baseline exceeded</h3>
              </div>
            </div>
            <p>
              Power consumption remained <b>8.4 kW above expected baseline</b>{" "}
              between 00:20 and 03:45.
            </p>
            <div className="cause-list">
              <span>Possible causes</span>
              {[
                [AirVent, "HVAC running after closing"],
                [Refrigerator, "Kitchen equipment left active"],
                [Lightbulb, "Lighting load"],
              ].map(([Icon, t]) => (
                <div key={String(t)}>
                  <Icon size={15} />
                  {String(t)}
                </div>
              ))}
            </div>
            <div className="impact-row">
              <div>
                <span>Unnecessary consumption</span>
                <strong>
                  27.3 <small>kWh</small>
                </strong>
              </div>
              <div>
                <span>Estimated cost impact</span>
                <strong>
                  3.01 <small>AZN</small>
                </strong>
              </div>
            </div>
            <button className="view-analysis">
              View Analysis <ArrowRight size={15} />
            </button>
            <small className="disclaimer">
              Illustrative demo insight. Actual results depend on site data and
              operating conditions.
            </small>
          </Reveal>
          <Reveal className="phone-wrap" delay={0.12}>
            <div className="phone">
              <div className="phone-island" />
              <div className="phone-screen">
                <div className="phone-status">
                  <span>02:14</span>
                  <span>•••</span>
                </div>
                <div className="phone-lock">
                  <Bell size={18} />
                  <span>HEAT Alert</span>
                  <small>now</small>
                </div>
                <div className="notification">
                  <span className="notif-icon">
                    <Zap size={18} />
                  </span>
                  <small>HEAT ALERT</small>
                  <h3>Energy Waste Detected</h3>
                  <p>
                    Your location is consuming <b>8.4 kW</b> above its normal
                    after-hours baseline.
                  </p>
                  <div>
                    <span>Estimated extra usage</span>
                    <strong>27.3 kWh</strong>
                  </div>
                  <div className="notif-actions">
                    <button>View Details</button>
                    <button>Dismiss</button>
                  </div>
                </div>
                <span className="home-bar" />
              </div>
            </div>
            <p>
              Know when it matters,
              <br />
              <b>wherever you are.</b>
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const steps = [
  [Gauge, "Measure", "Monitoring hardware collects electricity data."],
  [Send, "Connect", "Information is securely sent to HEAT."],
  [Activity, "Analyze", "Patterns, costs and anomalies are evaluated."],
  [Bell, "Alert", "Important notifications reach the owner."],
  [TrendingUp, "Optimize", "Data supports better energy decisions."],
];
export function HowItWorks() {
  return (
    <section className="how section" id="how">
      <div className="container">
        <Reveal>
          <SectionHeader
            align="center"
            eyebrow="HOW HEAT WORKS"
            title="From electricity panel to actionable insight."
          />
        </Reveal>
        <div className="steps">
          {steps.map(([Icon, title, text], i) => (
            <Reveal className="step" key={String(title)} delay={i * 0.07}>
              <span className="step-no">0{i + 1}</span>
              <div className="step-icon">
                <Icon size={22} />
              </div>
              <h3>{String(title)}</h3>
              <p>{String(text)}</p>
              {i < steps.length - 1 && (
                <span className="connector">
                  <i />
                </span>
              )}
            </Reveal>
          ))}
        </div>
        <Reveal className="architecture">
          <div>
            <Zap size={17} />
            <span>Electrical Panel</span>
          </div>
          <ArrowRight />
          <div>
            <Gauge size={17} />
            <span>Energy Meter</span>
          </div>
          <ArrowRight />
          <div>
            <ShieldCheck size={17} />
            <span>Secure Connection</span>
          </div>
          <ArrowRight />
          <div>
            <Building2 size={17} />
            <span>HEAT Cloud</span>
          </div>
          <ArrowRight />
          <div>
            <Sparkles size={17} />
            <span>Analytics</span>
          </div>
          <ArrowRight />
          <div>
            <MonitorCheck size={17} />
            <span>Dashboard + Alerts</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const benefits = [
  [Clock3, "24/7 Monitoring", "Understand consumption beyond monthly bills."],
  [
    Activity,
    "Real-Time Visibility",
    "See what your business is consuming right now.",
  ],
  [MapPin, "Multi-Location Management", "Manage branches from one platform."],
  [
    Sparkles,
    "Actionable Analytics",
    "Convert energy data into clear operational insights.",
  ],
];
const afterHours = Array.from({ length: 24 }, (_, h) => ({
  hour: `${String(h).padStart(2, "0")}:00`,
  power:
    h < 7
      ? 5 + (h % 2) * 0.4
      : h < 9
        ? 8 + h / 5
        : h < 18
          ? 16 + (h % 4) * 1.5
          : h < 23
            ? 19 - (h - 18) * 1.2
            : 6,
}));
export function BenefitsSection() {
  return (
    <section className="benefits section">
      <div className="container">
        <Reveal>
          <SectionHeader
            eyebrow="BETTER DECISIONS"
            title="Energy visibility that changes the conversation."
          />
        </Reveal>
        <div className="benefit-grid">
          {benefits.map(([Icon, title, text]) => (
            <Reveal key={String(title)}>
              <Card>
                <Icon size={24} />
                <h3>{String(title)}</h3>
                <p>{String(text)}</p>
              </Card>
            </Reveal>
          ))}
        </div>
        <Reveal className="hours-card">
          <div className="hours-copy">
            <span className="eyebrow">24-HOUR VIEW</span>
            <h3>Where does your electricity go after closing?</h3>
            <p>
              Business hours end at 23:00. Your baseline consumption should fall
              with them. HEAT makes the remaining load easy to see.
            </p>
            <div className="legend">
              <span>
                <i className="blue" />
                Business hours
              </span>
              <span>
                <i className="orange" />
                Potential waste zone
              </span>
            </div>
          </div>
          <div className="hours-chart">
            <span className="waste-label">Potential Waste Zone</span>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={afterHours}
                margin={{ left: -24, right: 8, top: 20 }}
              >
                <defs>
                  <linearGradient id="hours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#3b82f6" stopOpacity=".32" />
                    <stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="rgba(255,255,255,.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: "#71717a", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  interval={3}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#111318",
                    border: "1px solid rgba(255,255,255,.1)",
                    borderRadius: 10,
                  }}
                />
                <ReferenceArea
                  x1="23:00"
                  x2="23:00"
                  fill="#f59e0b"
                  fillOpacity={0.15}
                />
                <ReferenceArea
                  x1="00:00"
                  x2="08:00"
                  fill="#f59e0b"
                  fillOpacity={0.08}
                />
                <Area
                  type="monotone"
                  dataKey="power"
                  stroke="#4f8ff7"
                  strokeWidth={2}
                  fill="url(#hours)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const industries = [
  [
    UtensilsCrossed,
    "Restaurants",
    "Kitchens, HVAC, refrigeration and lighting.",
  ],
  [Coffee, "Coffee Shops", "Daily patterns and after-hours usage."],
  [Hotel, "Hotels", "Continuous consumption and operating demand."],
  [ShoppingBag, "Retail", "Compare stores and locations."],
  [Building2, "Offices", "HVAC, lighting and equipment usage."],
  [Factory, "Business Centers", "Visibility across complex environments."],
];
export function IndustriesSection() {
  return (
    <section className="industries section">
      <div className="container">
        <Reveal>
          <SectionHeader
            align="center"
            eyebrow="INDUSTRIES"
            title="Built for energy-intensive businesses."
          />
        </Reveal>
        <div className="industries-grid">
          {industries.map(([Icon, title, text], i) => (
            <Reveal key={String(title)} delay={(i % 3) * 0.06}>
              <Card>
                <div className="industry-icon">
                  <Icon size={22} />
                </div>
                <h3>{String(title)}</h3>
                <p>{String(text)}</p>
                <ArrowRight size={17} />
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MultiLocationSection() {
  const locations = [
    ["Nizami Restaurant", "12.7 kW", "Normal"],
    ["White City Café", "8.4 kW", "Warning"],
    ["Port Baku Office", "23.1 kW", "Normal"],
    ["Baku Mall Store", "5.8 kW", "Normal"],
  ];
  return (
    <section className="locations section">
      <div className="container split">
        <Reveal>
          <SectionHeader
            eyebrow="MULTI-LOCATION"
            title="Every location. One live view."
            body="Monitor total demand, compare branches and spot the location that needs attention—without switching tools."
          />
          <div className="check-list">
            {[
              "Centralized operational overview",
              "Location-level alerts",
              "Portfolio-wide consumption trends",
            ].map((x) => (
              <span key={x}>
                <CheckCircle2 size={17} />
                {x}
              </span>
            ))}
          </div>
          <Button href="#contact">Discuss your portfolio</Button>
        </Reveal>
        <Reveal className="location-ui">
          <div className="location-ui-head">
            <div>
              <span>Location Overview</span>
              <small>All facilities · Live</small>
            </div>
            <span className="online">
              <i />4 online
            </span>
          </div>
          <div className="total">
            <span>Total Live Consumption</span>
            <strong>
              50.0 <small>kW</small>
            </strong>
            <em>Across 4 locations</em>
          </div>
          {locations.map(([name, power, status], i) => (
            <div className="location-row" key={name}>
              <span className="pin">
                <MapPin size={15} />
              </span>
              <div>
                <b>{name}</b>
                <small>{i % 2 ? "Baku, Azerbaijan" : "Baku city center"}</small>
              </div>
              <strong>{power}</strong>
              <em className={status === "Warning" ? "warning" : ""}>
                <i />
                {status}
              </em>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

export function ReportSection() {
  return (
    <section className="report section">
      <div className="container split report-split">
        <Reveal>
          <div className="report-card">
            <div className="report-head">
              <div>
                <span className="mini-logo">H</span>
                <div>
                  <b>HEAT Daily Energy Report</b>
                  <small>Demo Restaurant · 09 August 2026</small>
                </div>
              </div>
              <span>DAILY</span>
            </div>
            <div className="report-metrics">
              {[
                ["Today’s Usage", "284.7 kWh"],
                ["Estimated Cost", "31.42 AZN"],
                ["Peak Power", "22.4 kW"],
                ["Peak Time", "19:40"],
              ].map((x) => (
                <div key={x[0]}>
                  <span>{x[0]}</span>
                  <strong>{x[1]}</strong>
                </div>
              ))}
            </div>
            <div className="report-highlight">
              <div>
                <Clock3 size={18} />
                <span>After-Hours Usage</span>
                <strong>41.8 kWh</strong>
              </div>
              <p>
                <b>14.7%</b> of today&apos;s electricity use happened after
                hours.
              </p>
            </div>
            <div className="recommendation">
              <Lightbulb size={18} />
              <div>
                <span>RECOMMENDATION</span>
                <p>
                  Review HVAC and kitchen equipment shutdown procedures after
                  closing.
                </p>
              </div>
            </div>
            <button>
              View Full Report <ArrowRight size={15} />
            </button>
          </div>
        </Reveal>
        <Reveal>
          <SectionHeader
            eyebrow="REPORTS THAT MAKE SENSE"
            title="From a day of energy data to one clear next step."
            body="HEAT turns consumption, costs and peaks into a concise report your team can use—without needing an energy analyst."
          />
          <Button href="#contact" kind="secondary">
            Request a sample report
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

const subscriptionServices = [
  "Smart monitoring device and professional installation",
  "Live energy dashboard and mobile access",
  "Total and phase-by-phase consumption in kWh and AZN",
  "Peak power and possible anomaly alerts",
  "After-hours consumption monitoring",
  "Automatic Telegram reports and notifications",
  "Consumption history and cost comparisons",
  "Monthly energy review and practical recommendations",
  "Remote technical support and secure data storage",
];
export function PricingSection() {
  return (
    <section className="pricing section" id="pricing">
      <div className="container">
        <Reveal>
          <SectionHeader
            align="center"
            eyebrow="HEAT SUBSCRIPTION"
            title="Clear pricing. Complete energy visibility."
            body="Everything required to monitor one facility, understand electricity costs and receive useful alerts is included in one service package."
          />
        </Reveal>
        <Reveal className="subscription-card" delay={0.08}>
          <Card className="recommended">
            <div className="subscription-summary">
              <span className="recommended-label">COMPLETE PACKAGE</span>
              <div>
                <small>FIRST MONTH — TOTAL PAYMENT</small>
                <strong>220 <em>AZN</em></strong>
                <p>Installation, system activation and the first month of service are included.</p>
              </div>
              <i aria-hidden="true" />
              <div>
                <small>FROM THE SECOND MONTH</small>
                <strong>120 <em>AZN / month</em></strong>
                <p>Continuous monitoring, analytics, reports and remote support.</p>
              </div>
              <Button href="#contact">Request a Demo</Button>
              <p className="subscription-note">
                You do not pay 220 + 120 AZN in the first month. Your first-month total is 220 AZN; every following month is 120 AZN. Pricing covers one facility. Monitoring equipment remains HEAT property during the subscription.
              </p>
            </div>
            <div className="subscription-services">
              <small>EVERYTHING INCLUDED</small>
              <h3>HEAT energy monitoring service</h3>
              <div className="plan-list">
                {subscriptionServices.map((service) => (
                  <span key={service}>
                    <Check size={15} />
                    {service}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}

export function ComparisonAbout() {
  const old = [
    "Monthly information",
    "Historical data",
    "Limited visibility",
    "No immediate alerts",
  ];
  const heat = [
    "Real-time monitoring",
    "Visual analytics",
    "Cost tracking",
    "Anomaly detection",
    "Alerts",
    "Historical comparisons",
    "Multi-location overview",
  ];
  return (
    <>
      <section className="comparison section">
        <div className="container">
          <Reveal>
            <SectionHeader
              align="center"
              eyebrow="THE HEAT DIFFERENCE"
              title="Electricity data is only useful when you can understand it."
            />
          </Reveal>
          <div className="compare-grid">
            <Reveal className="compare-card muted">
              <span>Traditional Electricity Bill</span>
              {old.map((x) => (
                <div key={x}>
                  <X size={15} />
                  {x}
                </div>
              ))}
            </Reveal>
            <Reveal className="compare-card heat">
              <span>
                <i className="mini-logo">H</i> With HEAT
              </span>
              {heat.map((x) => (
                <div key={x}>
                  <Check size={15} />
                  {x}
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </section>
      <section className="about section" id="about">
        <div className="container split">
          <Reveal>
            <SectionHeader
              eyebrow="ABOUT HEAT"
              title="Building smarter energy management for businesses."
              body="HEAT — Hasanov Energy & Technology is an EnergyTech initiative focused on helping businesses better understand and manage electricity consumption through monitoring, analytics and intelligent automation."
            />
          </Reveal>
          <Reveal className="about-panel">
            <p>
              Our goal is to transform complex energy data into simple, useful
              information that business owners can act on.
            </p>
            <div>
              {[
                ["01", "Visibility"],
                ["02", "Efficiency"],
                ["03", "Technology"],
              ].map((x) => (
                <span key={x[0]}>
                  <small>{x[0]}</small>
                  <b>{x[1]}</b>
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

export function ContactSection() {
  const [sent, setSent] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("submitted") === "1") {
      setSent(true);
      window.history.replaceState({}, "", `${window.location.pathname}#contact`);
    }
  }, []);
  return (
    <>
      <section className="final-cta section">
        <div className="container">
          <Reveal>
            <div className="cta-card">
              <span className="eyebrow">START SEEING ENERGY DIFFERENTLY</span>
              <h2>
                You can’t optimize
                <br />
                what you can’t see.
              </h2>
              <p>
                Discover how HEAT can give your business better visibility into
                electricity consumption.
              </p>
              <div>
                <Button href="#contact">Request a Free Demo</Button>
                <Button href="mailto:heat.co2026@gmail.com" kind="secondary">
                  Contact HEAT
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      <section className="contact section" id="contact">
        <div className="container split contact-split">
          <Reveal>
            <SectionHeader
              eyebrow="CONTACT"
              title="Let’s talk about your energy usage."
              body="Tell us a little about your operation. We’ll explore where better energy visibility could make a difference."
            />
            <div className="contact-details">
              <a href="mailto:heat.co2026@gmail.com">
                <Mail size={17} />
                <span>
                  <small>Email</small>heat.co2026@gmail.com
                </span>
              </a>
              <a href="tel:+994103314945">
                <Phone size={17} />
                <span>
                  <small>Phone</small>+994 10 331 49 45
                </span>
              </a>
              <span>
                <MapPin size={17} />
                <span>
                  <small>Location</small>Baku, Azerbaijan
                </span>
              </span>
            </div>
          </Reveal>
          <Reveal>
            {sent ? (
              <div className="success">
                <span>
                  <Check size={28} />
                </span>
                <h3>Request received.</h3>
                <p>
                  Thank you. The HEAT team will contact you to discuss your
                  energy assessment.
                </p>
                <button onClick={() => setSent(false)}>
                  Send another request
                </button>
              </div>
            ) : (
              <form
                action="https://formsubmit.co/heat.co2026@gmail.com"
                method="POST"
              >
                <input
                  type="hidden"
                  name="_next"
                  value="https://heat-energy-analytics-az.hasanov-ayxan.chatgpt.site/?submitted=1#contact"
                />
                <input
                  type="hidden"
                  name="_subject"
                  value="New HEAT Energy Assessment Request"
                />
                <input type="hidden" name="_template" value="table" />
                <input
                  type="hidden"
                  name="_url"
                  value="https://heat-energy-analytics-az.hasanov-ayxan.chatgpt.site/"
                />
                <input type="text" name="_honey" className="honey-field" />
                <div className="form-grid">
                  <label>
                    Full Name
                    <input required name="name" placeholder="Your name" />
                  </label>
                  <label>
                    Company Name
                    <input required name="company" placeholder="Company name" />
                  </label>
                  <label>
                    Business Type
                    <select required defaultValue="">
                      <option value="" disabled>
                        Select type
                      </option>
                      <option>Restaurant / Café</option>
                      <option>Hotel</option>
                      <option>Retail</option>
                      <option>Office</option>
                      <option>Business Center</option>
                      <option>Other</option>
                    </select>
                  </label>
                  <label>
                    Phone Number
                    <input
                      required
                      name="phone"
                      type="tel"
                      placeholder="+994"
                    />
                  </label>
                  <label>
                    Email
                    <input
                      required
                      name="email"
                      type="email"
                      placeholder="you@company.com"
                    />
                  </label>
                  <label>
                    Number of Locations
                    <input
                      name="locations"
                      type="number"
                      min="1"
                      placeholder="1"
                    />
                  </label>
                  <label className="full">
                    Average Monthly Electricity Cost
                    <input name="cost" placeholder="e.g. 1,500 AZN" />
                  </label>
                  <label className="full">
                    Message
                    <textarea
                      name="message"
                      rows={4}
                      placeholder="Tell us about your facility and energy goals."
                    />
                  </label>
                </div>
                <button className="submit" type="submit">
                  Request Energy Assessment <Send size={16} />
                </button>
                <small>
                  By submitting, you agree to be contacted by the HEAT team.
                </small>
              </form>
            )}
          </Reveal>
        </div>
      </section>
    </>
  );
}
