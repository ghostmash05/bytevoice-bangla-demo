"use client";

import Link from "next/link";
import { ArrowDown, ArrowUpRight, CalendarCheck2, Mic, Phone, ShieldCheck } from "lucide-react";
import { Brand } from "./brand";
import { LandingMascot } from "./landing-mascot";
import { useLocale } from "./locale";
import VoiceTest from "./voice-test";
import "./landing.css";

const copy = {
  bn: {
    skip: "মূল বিষয়বস্তুতে যান",
    how: "কীভাবে কাজ করে",
    scenarios: "কী বলে শুরু করবেন",
    portal: "স্টাফ পোর্টাল",
    title: ["বাংলায় বলুন।", "সময় বুক করুন।"],
    intro: "মাশরাফি’স ডেন্টালের ডেমো রিসেপশনিস্টের সঙ্গে বাংলায় কথা বলুন। সময় জেনে নিন, অ্যাপয়েন্টমেন্ট বুক করুন, অথবা আগের বুকিং বদলান।",
    stepsTitle: "কথা থেকে বুকিং",
    steps: [
      ["কথা বলুন", "মাইক্রোফোন চালু করে কী দরকার বলুন। বাংলার সঙ্গে ইংরেজি শব্দও বলতে পারেন।"],
      ["সময় নিশ্চিত করুন", "খালি সময় দেখে রিসেপশনিস্ট নাম, ফোন নম্বর ও সময় পড়ে শোনাবে। আপনি নিশ্চিত করলে বুকিং হবে।"],
      ["কলের রেকর্ড দেখুন", "স্টাফ পোর্টালে কথোপকথন, সংগৃহীত তথ্য ও বুকিংয়ের ফলাফল দেখা যায়।"],
    ],
    sample: "উদাহরণ বুকিং",
    outcome: "বুকিং নিশ্চিত",
    service: "স্কেলিং",
    time: "সকাল ১০:০০",
    recordNote: "ডেমো ক্লিনিকের একটি নমুনা রেকর্ড",
    scenariosTitle: "একটি প্রশ্ন দিয়ে শুরু করুন",
    scenariosList: [
      ["সময় নিন", "“শনিবার বিকেলে স্কেলিংয়ের সময় আছে?”"],
      ["বুকিং বদলান", "“আমার অ্যাপয়েন্টমেন্টটা অন্য দিনে নিতে চাই।”"],
      ["ক্লিনিকের তথ্য জানুন", "“স্কেলিংয়ের ফি কত? শুক্রবার খোলা থাকে?”"],
    ],
    faq: "সাধারণ প্রশ্ন",
    answers: [
      ["কল করতে কী লাগবে?", "একটি সমর্থিত ব্রাউজার ও মাইক্রোফোনের অনুমতি। ডেমো কল সর্বোচ্চ পাঁচ মিনিট চলবে।"],
      ["আমার তথ্য কোথায় যাবে?", "কলের অডিও ভয়েস সেবায় পাঠানো হয়। কথোপকথন ও সংগৃহীত তথ্য স্টাফ পোর্টালে সংরক্ষিত হয়। পরীক্ষার জন্য কেবল কাল্পনিক তথ্য দিন।"],
      ["চিকিৎসার পরামর্শ পাওয়া যাবে?", "চিকিৎসার পরামর্শের জন্য একজন দন্তচিকিৎসকের সঙ্গে কথা বলুন। ডেমো রিসেপশনিস্টের কাছে স্টাফের ফলো-আপের অনুরোধ রাখতে পারেন।"],
    ],
    footer: "মাশরাফি’স ডেন্টাল · কাল্পনিক ক্লিনিকের ডেমো",
    call: "ডেমো কল করুন",
  },
  en: {
    skip: "Skip to content",
    how: "How it works",
    scenarios: "What to ask",
    portal: "Staff portal",
    title: ["Call in Bangla.", "Book a visit."],
    intro: "Talk to the demo receptionist at Mashrafi’s Dental. Ask about availability, book a visit, or change an existing appointment in Bangla.",
    stepsTitle: "From conversation to booking",
    steps: [
      ["Start speaking", "Allow microphone access and say what you need. You can mix Bangla and English as you normally would."],
      ["Confirm a time", "The receptionist checks openings and reads back your name, number and chosen time. Confirm to book."],
      ["Review the call", "Clinic staff can find the transcript, captured details and booking outcome in the staff portal."],
    ],
    sample: "Example booking",
    outcome: "Booking confirmed",
    service: "Scaling",
    time: "10:00 AM",
    recordNote: "An example record for the demo clinic",
    scenariosTitle: "Start with a question",
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
    footer: "Mashrafi’s Dental · Fictional clinic demo",
    call: "Try a demo call",
  },
};

export default function Landing() {
  const { language, toggleLanguage } = useLocale();
  const text = copy[language];
  const stepIcons = [Mic, CalendarCheck2, ShieldCheck];
  return (
    <div className="landing">
      <a className="skip-link" href="#main">{text.skip}</a>
      <header className="landing-nav landing-width">
        <Link href="/" className="landing-brand" aria-label="ByteVoice"><Brand /></Link>
        <nav aria-label={language === "bn" ? "প্রধান নেভিগেশন" : "Main navigation"}>
          <a href="#how">{text.how}</a>
          <a href="#scenarios">{text.scenarios}</a>
        </nav>
        <div className="landing-nav-actions">
          <button className="landing-language" onClick={toggleLanguage} lang={language === "bn" ? "en" : "bn"}>
            {language === "bn" ? "English" : "বাংলা"}
          </button>
          <Link className="landing-portal" href="/portal">{text.portal}<ArrowUpRight size={15} aria-hidden="true" /></Link>
        </div>
      </header>
      <main id="main">
        <section className="landing-hero landing-width" aria-labelledby="landing-title">
          <div className="landing-hero-copy">
            <h1 id="landing-title">{text.title[0]}<br /><span>{text.title[1]}</span></h1>
            <p className="landing-lede">{text.intro}</p>
            <VoiceTest hero />
          </div>
          <div className="landing-hero-art">
            <LandingMascot />
            <svg className="landing-signal" viewBox="0 0 440 80" fill="none" aria-hidden="true">
              <path d="M0 40h125l9-7 8 14 9-24 11 34 9-44 12 57 11-54 12 36 11-23 10 17 10-6h205"
                stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <a href="#how" className="landing-scroll"><ArrowDown size={16} aria-hidden="true" />{text.how}</a>
        </section>

        <section id="how" className="landing-how landing-width" aria-labelledby="how-title">
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
        </section>

        <section id="scenarios" className="landing-scenarios" aria-labelledby="scenarios-title">
          <div className="landing-width">
            <h2 id="scenarios-title">{text.scenariosTitle}</h2>
            <div className="landing-example-list">
              {text.scenariosList.map(([title, example]) => (
                <article key={title}><h3>{title}</h3><p>{example}</p></article>
              ))}
            </div>
            <a className="landing-return" href="#landing-title"><Phone size={16} aria-hidden="true" />{text.call}<ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>
        </section>

        <section className="landing-faq landing-width" aria-labelledby="faq-title">
          <h2 id="faq-title">{text.faq}</h2>
          <div>{text.answers.map(([question, answer]) => (
            <details key={question}><summary>{question}</summary><p>{answer}</p></details>
          ))}</div>
        </section>
      </main>
      <footer className="landing-footer landing-width"><Brand /><span>{text.footer}</span><Link href="/portal">{text.portal}<ArrowUpRight size={15} aria-hidden="true" /></Link></footer>
    </div>
  );
}
