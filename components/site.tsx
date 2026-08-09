"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ChevronDown, Globe2, Menu, X } from "lucide-react";
import { HeroDashboard } from "./dashboard";
import { Button, Logo, Reveal } from "./ui";
import { BenefitsSection, ComparisonAbout, ContactSection, HowItWorks, IndustriesSection, IntelligenceSection, MultiLocationSection, PlatformSection, PricingSection, ProblemSection, ReportSection } from "./sections";
import { LanguageProvider, useLanguage, type Language } from "./i18n";

const links=[["Platform","#platform"],["Solutions","#solutions"],["How It Works","#how"],["Pricing","#pricing"],["About","#about"],["Contact","#contact"]];

function LanguageSelect(){const {language,setLanguage}=useLanguage();return <label className="language-select" aria-label="Select language"><Globe2 size={14}/><select value={language} onChange={e=>setLanguage(e.target.value as Language)}><option value="en">EN</option><option value="az">AZ</option><option value="ru">RU</option></select><ChevronDown size={12}/></label>}

function Navbar(){const [open,setOpen]=useState(false);const [scrolled,setScrolled]=useState(false);useEffect(()=>{const f=()=>setScrolled(scrollY>20);addEventListener('scroll',f);return()=>removeEventListener('scroll',f)},[]);return <header className={`navbar ${scrolled?'scrolled':''}`}><div className="nav-inner"><Logo/>
  <nav>{links.map(([x,h])=><a key={x} href={h}>{x}</a>)}</nav><div className="nav-actions"><LanguageSelect/><Button href="#contact">Request Demo</Button></div><div className="mobile-nav-tools"><LanguageSelect/><button className="menu-btn" onClick={()=>setOpen(!open)} aria-label="Toggle navigation">{open?<X/>:<Menu/>}</button></div>
  <AnimatePresence>{open&&<motion.div className="mobile-menu" initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}>{links.map(([x,h])=><a key={x} href={h} onClick={()=>setOpen(false)}>{x}</a>)}<Button href="#contact">Request Demo</Button></motion.div>}</AnimatePresence></div></header>}

function Hero(){return <main className="hero" id="top"><div className="hero-grid-bg"/><div className="hero-glow"/><div className="container hero-layout"><Reveal className="hero-copy"><span className="hero-badge"><i/>Intelligent Energy Analytics for Businesses</span><h1>Stop Paying for Invisible <span>Energy Waste.</span></h1><p>HEAT gives businesses real-time visibility into electricity consumption, costs and hidden energy waste — all from one intelligent platform.</p><div className="hero-actions"><Button href="#contact">Request a Demo</Button><Button href="#platform" kind="secondary">Explore Platform <ArrowDown size={15}/></Button></div><div className="hero-notes"><span><i/>Real-time monitoring</span><span><i/>Cost intelligence</span><span><i/>Actionable alerts</span></div></Reveal><Reveal className="hero-visual" delay={.12}><span className="visual-label">LIVE PRODUCT PREVIEW</span><HeroDashboard/><div className="floating-chip chip-one"><span>↓ 12%</span><small>vs. yesterday</small></div><div className="floating-chip chip-two"><i/><span>System online</span></div></Reveal></div></main>}

function SocialProof(){return <section className="proof"><div className="container"><p>Built for businesses where every kilowatt matters.</p><div>{['Restaurants','Hotels','Retail','Offices','Business Centers','Factories','Coffee Shops'].map(x=><span key={x}>{x}</span>)}</div></div></section>}

function Footer(){return <footer><div className="container"><div className="footer-top"><div><Logo/><p>See Energy. Stop Waste.</p></div><div className="footer-links"><div><b>Product</b><a href="#platform">Platform</a><a href="#platform">Analytics</a><a href="#solutions">Alerts</a><a href="#platform">Reports</a></div><div><b>Company</b><a href="#about">About</a><a href="#contact">Contact</a><a href="#">Privacy</a><a href="#">Legal</a></div></div></div><div className="footer-bottom"><span>© 2026 HEAT — Hasanov Energy &amp; Technology. All rights reserved.</span><span>Baku, Azerbaijan</span></div></div></footer>}

export default function Site(){return <LanguageProvider><div id="heat-site"><Navbar/><Hero/><SocialProof/><ProblemSection/><PlatformSection/><IntelligenceSection/><HowItWorks/><BenefitsSection/><IndustriesSection/><MultiLocationSection/><ReportSection/><PricingSection/><ComparisonAbout/><ContactSection/><Footer/></div></LanguageProvider>}
