"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, CalendarCheck2, Check, Mic, ShieldCheck } from "lucide-react";
import { Brand } from "./brand";
import { useLocale } from "./locale";
import VoiceTest from "./voice-test";
import "./landing.css";

const GlassFlower = dynamic(() => import("./landing-glass-flower"), { ssr: false });
const PointsWaves = dynamic(() => import("./landing-points-waves"), { ssr: false });

const copy = {
  bn: {
    skip: "মূল বিষয়বস্তুতে যান",
    how: "কীভাবে কাজ করে",
    scenarios: "ডেমো",
    portal: "স্টাফ পোর্টাল",
    title: ["ক্লিনিকের জন্য", "বাংলা ভয়েস এজেন্ট"],
    intro: "বাংলাদেশের ডেন্টাল ক্লিনিক ও হাসপাতালের জন্য ByteVoice বাংলায় রোগীর কল সামলায়, অ্যাপয়েন্টমেন্ট বুক করে এবং স্টাফদের জন্য কলের রেকর্ড রাখে।",
    stepsTitle: "রোগীর কল থেকে স্টাফ পোর্টাল",
    steps: [
      ["রোগীর প্রশ্নের উত্তর", "রোগীরা বাংলায় কথা বলে ক্লিনিকের সেবা, ফি ও খোলার সময় জানতে পারেন। কথার মাঝে ইংরেজি শব্দও ব্যবহার করতে পারেন।"],
      ["অ্যাপয়েন্টমেন্ট সামলানো", "ভয়েস এজেন্ট খালি সময় দেখে বুকিং করে। রোগীরা আগের অ্যাপয়েন্টমেন্ট বদলাতে বা বাতিল করতেও পারেন।"],
      ["স্টাফদের জন্য কলের রেকর্ড", "স্টাফরা পোর্টালে কথোপকথন, সংগৃহীত তথ্য, বুকিংয়ের ফলাফল ও ফলো-আপের অনুরোধ দেখতে পারেন।"],
    ],
    sample: "উদাহরণ বুকিং",
    outcome: "বুকিং নিশ্চিত",
    service: "স্কেলিং",
    time: "সকাল ১০:০০",
    recordNote: "ডেমো ক্লিনিকের একটি নমুনা রেকর্ড",
    scenariosTitle: "ডেমোতে কথা বলুন",
    scenariosIntro: "মাশরাফি’স ডেন্টাল একটি কাল্পনিক ক্লিনিক। ডেমোতে রোগীর ভূমিকায় বাংলায় কথা বলে দেখুন।",
    scenariosList: [
      ["সময় নিন", "“শনিবার বিকেলে স্কেলিংয়ের সময় আছে?”"],
      ["বুকিং বদলান", "“আমার অ্যাপয়েন্টমেন্টটা অন্য দিনে নিতে চাই”"],
      ["ক্লিনিকের তথ্য জানুন", "“স্কেলিংয়ের ফি কত? শুক্রবার খোলা থাকে?”"],
    ],
    faq: "সাধারণ প্রশ্ন",
    answers: [
      ["কল করতে কী লাগবে?", "একটি সমর্থিত ব্রাউজার ও মাইক্রোফোনের অনুমতি। ডেমো কল সর্বোচ্চ পাঁচ মিনিট চলবে।"],
      ["আমার তথ্য কোথায় যাবে?", "কলের অডিও ভয়েস সেবায় পাঠানো হয়। কথোপকথন ও সংগৃহীত তথ্য স্টাফ পোর্টালে সংরক্ষিত হয়। পরীক্ষার জন্য কেবল কাল্পনিক তথ্য দিন।"],
      ["চিকিৎসার পরামর্শ পাওয়া যাবে?", "চিকিৎসার পরামর্শের জন্য একজন দন্তচিকিৎসকের সঙ্গে কথা বলুন। ডেমো রিসেপশনিস্টের কাছে স্টাফের ফলো-আপের অনুরোধ রাখতে পারেন।"],
    ],
    footer: "ByteVoice · বাংলাদেশের স্বাস্থ্যসেবার জন্য বাংলা ভয়েস এজেন্ট",
    pricing: "মূল্য ও সেটআপ",
    pricingIntro: "ব্রাউজারে ডেমো দেখে নিন। আপনার ক্লিনিকের কল ও অ্যাপয়েন্টমেন্টের চাহিদা নিয়ে কথা বলতে আমাদের সঙ্গে যোগাযোগ করুন।",
    plans: [
      { name: "ব্রাউজার ডেমো", rate: "বিনামূল্যে", details: ["বাংলায় পাঁচ মিনিট পর্যন্ত কথা বলুন", "নমুনা অ্যাপয়েন্টমেন্ট বুকিং চেষ্টা করুন", "কল চলাকালীন কথোপকথন পড়ুন"], action: "ডেমোতে কথা বলুন", href: "#demo-call" },
      { name: "ক্লিনিক সেটআপ", rate: "আলোচনা সাপেক্ষে", details: ["কলের পরিমাণ ও সময়সূচি নিয়ে আলোচনা", "অ্যাপয়েন্টমেন্ট প্রক্রিয়া ও স্টাফ পোর্টাল পর্যালোচনা", "আপনার ক্লিনিকের জন্য মূল্য জানতে যোগাযোগ"], action: "মূল্য জানতে যোগাযোগ করুন", href: "mailto:info@bytevoice.com.au" },
    ],
    explore: "পণ্য সম্পর্কে",
    contact: "যোগাযোগ",
    official: "ByteVoice-এর মূল ওয়েবসাইট",
    demoNote: "বাংলাদেশের জন্য তৈরি পণ্য ডেমো",
    activeCall: "চলমান কলের নিয়ন্ত্রণে যান",
  },
  en: {
    skip: "Skip to content",
    how: "How it works",
    scenarios: "Demo",
    portal: "Staff portal",
    title: ["Bangla voice AI", "for healthcare"],
    intro: "ByteVoice answers patient calls in Bangla, manages appointments, and gives staff a record of every call. Built for dental clinics and hospitals in Bangladesh.",
    stepsTitle: "From patient call to staff portal",
    steps: [
      ["Answer patient questions", "Patients can ask about services, fees, and opening hours in everyday Bangla and mix in English as they normally would."],
      ["Manage appointments", "The agent checks availability and confirms the details before booking. Patients can also reschedule or cancel an existing appointment."],
      ["Give staff a call record", "Staff can review the transcript, captured details, booking outcome, and any follow-up request in the portal."],
    ],
    sample: "Example booking",
    outcome: "Booking confirmed",
    service: "Scaling",
    time: "10:00 AM",
    recordNote: "An example record for the demo clinic",
    scenariosTitle: "Try a live demo call",
    scenariosIntro: "Mashrafi’s Dental is a fictional clinic. Try one of these scenarios as a patient speaking Bangla.",
    scenariosList: [
      ["Book a visit", "“Do you have time for scaling on Saturday afternoon?”"],
      ["Change a booking", "“I’d like to move my appointment to another day.”"],
      ["Ask about the clinic", "“How much is scaling? Are you open on Fridays?”"],
    ],
    faq: "Common questions",
    answers: [
      ["What do I need for a call?", "A supported browser and microphone permission. Demo calls last up to five minutes."],
      ["Where does my information go?", "Call audio goes to the voice provider. The transcript and captured details are stored in the staff portal. Use fictional details for testing."],
      ["Can I get medical advice?", "For medical advice, speak to a dental professional. You can ask the demo receptionist to save a follow-up request for staff."],
    ],
    footer: "ByteVoice · Bangla voice AI for healthcare in Bangladesh",
    pricing: "Pricing and setup",
    pricingIntro: "Try a call in your browser. For a clinic rollout, talk to us about your call volume and appointment workflow.",
    plans: [
      { name: "Browser demo", rate: "Free", details: ["Speak Bangla for up to five minutes", "Try a fictional appointment booking", "Read captions during the call"], action: "Try the live demo", href: "#demo-call" },
      { name: "Clinic rollout", rate: "Contact for pricing", details: ["Discuss call volume and coverage hours", "Review booking workflows and staff access", "Ask about pricing for your clinic"], action: "Ask about clinic pricing", href: "mailto:info@bytevoice.com.au" },
    ],
    explore: "Explore",
    contact: "Contact",
    official: "ByteVoice website",
    demoNote: "Product demo for Bangladesh",
    activeCall: "Go to the active call",
  },
};

export default function Landing() {
  const { language, toggleLanguage } = useLocale();
  const hero = useRef<HTMLElement>(null);
  const walkthrough = useRef<HTMLElement>(null);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [waveActive, setWaveActive] = useState(false);
  const [introActive, setIntroActive] = useState(false);
  const [flowerReady, setFlowerReady] = useState(false);
  type CallSlot = "hero-call" | "demo-call";
  const occupiedBy = useRef<CallSlot | null>(null);
  const [callOwner, setCallOwner] = useState<CallSlot | null>(null);
  const active = visible && introActive;
  const text = copy[language];
  const stepIcons = [Mic, CalendarCheck2, ShieldCheck];
  function gateFor(slot: CallSlot) {
    return {
      claim: () => {
        if (occupiedBy.current) return false;
        occupiedBy.current = slot;
        setCallOwner(slot);
        return true;
      },
      release: () => {
        if (occupiedBy.current !== slot) return;
        occupiedBy.current = null;
        setCallOwner(null);
      },
      blocked: callOwner !== null && callOwner !== slot,
    };
  }

  useEffect(() => {
    const section = hero.current;
    if (!section) return;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    const updateVisibility = () => setVisible(inView && !document.hidden);
    const updateMotion = () => setMotionAllowed(!reducedMotion.matches);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updateVisibility();
    });
    observer.observe(section);
    updateMotion();
    reducedMotion.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (!motionAllowed || !visible || !flowerReady) {
      setIntroActive(false);
      return;
    }
    setIntroActive(true);
    const timer = window.setTimeout(() => setIntroActive(false), 4600);
    return () => window.clearTimeout(timer);
  }, [flowerReady, motionAllowed, visible]);

  useEffect(() => {
    const section = walkthrough.current;
    if (!section || !motionAllowed) return;
    let inView = false;
    let timer = 0;
    const update = () => {
      window.clearTimeout(timer);
      const playing = inView && !document.hidden;
      setWaveActive(playing);
      if (playing) timer = window.setTimeout(() => setWaveActive(false), 4600);
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.intersectionRatio >= 0.22;
      update();
    }, { threshold: 0.22 });
    observer.observe(section);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [motionAllowed]);

  return (
    <div className="landing">
      <a className="skip-link" href="#main">{text.skip}</a>
      <header className="landing-nav landing-width">
        <Link href="/" className="landing-brand" aria-label="ByteVoice"><Brand /></Link>
        <nav aria-label={language === "bn" ? "প্রধান নেভিগেশন" : "Main navigation"}>
          <a href="#how">{text.how}</a>
          <a href="#scenarios">{text.scenarios}</a>
          <a href="#pricing">{text.pricing}</a>
        </nav>
        <div className="landing-nav-actions">
          <button className="landing-language" onClick={toggleLanguage} lang={language === "bn" ? "en" : "bn"}>
            {language === "bn" ? "English" : "বাংলা"}
          </button>
          <Link className="landing-portal" href="/portal">{text.portal}<ArrowUpRight size={15} aria-hidden="true" /></Link>
        </div>
      </header>
      <main id="main">
        <section className="landing-hero" aria-labelledby="landing-title" ref={hero}>
          <div className="landing-hero-light" aria-hidden="true" />
          <div className="landing-hero-inner landing-width">
            <div className="landing-hero-copy">
              <h1 id="landing-title">{text.title[0]}<br /><span>{text.title[1]}</span></h1>
              <p className="landing-lede">{text.intro}</p>
              <div id="hero-call">
                <VoiceTest hero callGate={gateFor("hero-call")} />
                {callOwner === "demo-call" && <a className="landing-return" href="#demo-call">{text.activeCall}</a>}
              </div>
            </div>
            <div className="landing-hero-art">
              <div className="landing-flower" aria-hidden="true" data-ready={motionAllowed && flowerReady}>
                <img className="flower-still" src="/landing/reference/glass-flower.webp" alt="" />
                {motionAllowed && <GlassFlower active={active} onReady={setFlowerReady} />}
              </div>
            </div>
          </div>
          <div className="landing-hero-foot landing-width">
            <a href="#how" className="landing-scroll"><ArrowDown size={16} aria-hidden="true" />{text.how}</a>
          </div>
        </section>

        <section id="how" className="landing-how" aria-labelledby="how-title" ref={walkthrough}>
          {motionAllowed && <div className="landing-walkthrough-floor" aria-hidden="true"><PointsWaves active={waveActive} color={0x6e614c} /></div>}
          <div className="landing-how-inner landing-width">
            <div>
              <h2 id="how-title">{text.stepsTitle}</h2>
              <ol className="landing-steps">
                {text.steps.map(([title, body], index) => {
                  const Icon = stepIcons[index];
                  return <li key={title}><Icon size={22} aria-hidden="true" /><div><h3>{title}</h3><p>{body}</p></div></li>;
                })}
              </ol>
            </div>
            <figure className="landing-record">
              <div className="landing-record-top">
                <CalendarCheck2 size={26} aria-hidden="true" />
                <span>{text.sample}</span>
              </div>
              <p className="landing-record-outcome">{text.outcome}</p>
              <div className="landing-record-details"><span>{text.service}</span><span>{text.time}</span></div>
              <figcaption>{text.recordNote}</figcaption>
            </figure>
          </div>
        </section>

        <section id="scenarios" className="landing-scenarios" aria-labelledby="scenarios-title">
          <div className="landing-scenarios-inner landing-width">
            <div className="landing-demo-intro">
              <h2 id="scenarios-title">{text.scenariosTitle}</h2>
              <p className="landing-scenarios-intro">{text.scenariosIntro}</p>
            </div>
            <div id="demo-call">
              <VoiceTest hero demo callGate={gateFor("demo-call")} />
              {callOwner === "hero-call" && <a className="landing-return" href="#hero-call">{text.activeCall}</a>}
            </div>
            <div className="landing-example-list">
              {text.scenariosList.map(([title, example]) => (
                <article key={title}><h3>{title}</h3><p>{example}</p></article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="landing-pricing" aria-labelledby="pricing-title">
          <div className="landing-width landing-pricing-inner">
            <h2 id="pricing-title">{text.pricing}</h2>
            <p>{text.pricingIntro}</p>
            <div className="landing-plans">
              {text.plans.map((plan) => (
                <article key={plan.href}>
                  <h3>{plan.name}</h3>
                  <p className="landing-plan-rate">{plan.rate}</p>
                  <ul>{plan.details.map((item) => <li key={item}><Check size={17} aria-hidden="true" />{item}</li>)}</ul>
                  <a href={plan.href}>{plan.action}<ArrowUpRight size={16} aria-hidden="true" /></a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="landing-faq landing-width" aria-labelledby="faq-title">
          <h2 id="faq-title">{text.faq}</h2>
          <div>{text.answers.map(([question, answer]) => (
            <details key={question}><summary>{question}</summary><p>{answer}</p></details>
          ))}</div>
        </section>
      </main>
      <footer className="landing-footer landing-width">
        <div className="landing-footer-brand"><Link href="/" aria-label="ByteVoice"><Brand /></Link><p>{text.footer}</p></div>
        <nav aria-label={text.explore}>
          <h2>{text.explore}</h2>
          <a href="#how">{text.how}</a><a href="#scenarios">{text.scenarios}</a>
          <a href="#pricing">{text.pricing}</a><a href="#faq">{text.faq}</a>
        </nav>
        <div className="landing-footer-contact">
          <h2>{text.contact}</h2>
          <a href="mailto:info@bytevoice.com.au">info@bytevoice.com.au</a>
          <a href="https://bytevoice.com.au/">{text.official}<ArrowUpRight size={15} aria-hidden="true" /></a>
          <Link href="/portal">{text.portal}<ArrowUpRight size={15} aria-hidden="true" /></Link>
        </div>
        <p className="landing-footer-note">{text.demoNote}</p>
      </footer>
    </div>
  );
}
