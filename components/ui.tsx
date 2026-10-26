"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <a className="brand" href="#top" aria-label="HEAT home">
      <span className="brand-mark"><i /></span>
      <span><b>HEAT</b>{!compact && <small>Hasanov Energy &amp; Technology</small>}</span>
    </a>
  );
}

export function Button({ href, children, kind = "primary", className = "" }: { href: string; children: ReactNode; kind?: "primary" | "secondary" | "ghost"; className?: string }) {
  return <a className={`btn btn-${kind} ${className}`} href={href}>{children}{kind === "primary" && <ArrowUpRight size={16} />}</a>;
}

export function SectionHeader({ eyebrow, title, body, align = "left" }: { eyebrow?: string; title: ReactNode; body?: string; align?: "left" | "center" }) {
  return (
    <div className={`section-head ${align === "center" ? "center" : ""}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {body && <p>{body}</p>}
    </div>
  );
}

export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: .65, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}

export function Card({ children, className = "", ...props }: { children: ReactNode; className?: string } & HTMLAttributes<HTMLDivElement>) {
  return <div className={`card ${className}`} {...props}>{children}</div>;
}

export function DemoBadge() {
  return <span className="demo-badge"><i /> Demo Data</span>;
}
