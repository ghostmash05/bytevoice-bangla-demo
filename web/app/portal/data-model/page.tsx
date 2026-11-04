"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, Database, Headphones, ListChecks, FileText, LockKeyhole } from "lucide-react";
import { Shell } from "@/components/shell";
import { useLocale } from "@/components/locale";
import { records, type Text } from "./records";
import "./model.css";

export default function DataModel() {
  const { language, t } = useLocale();
  const text = (value: Text) => value[language];
  const [selected, setSelected] = useState("calls");
  const record = records.find((item) => item.id === selected) || records[0];
  const heading = useRef<HTMLHeadingElement>(null);
  const focusRecord = useRef(false);
  useEffect(() => {
    if (focusRecord.current) { heading.current?.focus(); focusRecord.current = false; }
  }, [selected]);
  const flow = [
    { Icon: Headphones, title: "Voice session", body: "Browser audio reaches the LiveKit agent." },
    { Icon: ListChecks, title: "Capture & validate", body: "Transcript turns and patient details reach the API." },
    { Icon: Database, title: "Save the record", body: "PostgreSQL stores details and confirmed actions." },
    { Icon: FileText, title: "Staff review", body: "The portal brings the conversation and outcome together." },
  ];
  return (
    <Shell>
      <div className="data-model model-page">
        <header className="model-header">
          <div><h1>{t("From conversation to saved record")}</h1><p>{t("See how a call becomes structured information your team can use.")}</p></div>
          <Link className="secondary" href="/portal">{t("View call records")}<ArrowRight size={16} aria-hidden="true" /></Link>
        </header>
        <ol className="model-flow" aria-label={t("Call data flow")}>
          {flow.map(({ Icon, title, body }, index) => (
            <li key={title}><div className="model-flow-title"><Icon size={19} strokeWidth={1.6} aria-hidden="true" /><h2>{t(title)}</h2>{index < flow.length - 1 && <ArrowRight className="model-flow-arrow" size={16} aria-hidden="true" />}</div><p>{t(body)}</p></li>
          ))}
        </ol>
        <section className="model-explorer" aria-labelledby="model-explorer-title">
          <div className="model-section-heading"><h2 id="model-explorer-title">{t("Explore the records")}</h2><p>{t("Choose a record to inspect its fields and connections.")}</p></div>
          <label className="model-picker">{t("Record type")}<select value={selected} onChange={(event) => setSelected(event.target.value)}>{records.map((item) => <option key={item.id} value={item.id}>{text(item.name)}</option>)}</select></label>
          <div className="model-browser">
            <div className="model-record-nav" role="group" aria-label={t("Record types")}>
              {records.map((item) => <button key={item.id} aria-pressed={selected === item.id} aria-controls="model-record" onClick={() => setSelected(item.id)}><span>{text(item.name)}</span><ChevronRight size={15} aria-hidden="true" /></button>)}
            </div>
            <section className="model-record" id="model-record" aria-labelledby="model-record-title">
              <div className="model-record-heading"><div><h3 id="model-record-title" tabIndex={-1} ref={heading}>{text(record.name)}</h3><code>{record.id}</code></div><span>{text(record.cardinality)}</span></div>
              <p className="model-record-summary">{text(record.summary)}</p>
              <h4>{t("Key fields")}</h4>
              <dl className="model-fields">{record.fields.map((field) => <div key={field.key}><dt><code>{field.key}</code></dt><dd>{text(field.description)}</dd></div>)}</dl>
              <div className="model-connections"><h4>{t("Connected records")}</h4>{record.links.map((link) => <button key={link.target} onClick={() => { focusRecord.current = true; setSelected(link.target); }}><span><strong>{text(records.find((item) => item.id === link.target)!.name)}</strong><span>{text(link.description)}</span></span><ArrowRight size={17} aria-hidden="true" /></button>)}</div>
            </section>
          </div>
        </section>
        <div className="model-notes">
          <section aria-labelledby="model-storage-title"><h2 id="model-storage-title">{t("Where data lives")}</h2><dl className="model-storage">
            <div><dt>{t("Database")}</dt><dd>Supabase PostgreSQL<span>{t("Mumbai, India")}</span></dd></div>
            <div><dt>{t("Dates & times")}</dt><dd>{t("Stored in UTC")}<span>{t("Shown in Bangladesh time (UTC+6)")}</span></dd></div>
            <div><dt>{t("Audio recordings")}</dt><dd>{t("Not stored by this application")}<span>{t("Transcripts and captured fields are saved.")}</span></dd></div>
          </dl><p className="model-support-tables">{t("Support tables handle staff sessions and request limits:")} <code>staff_sessions</code>, <code>rate_buckets</code>.</p></section>
          <section className="model-safeguards" aria-labelledby="model-safeguards-title"><h2 id="model-safeguards-title"><LockKeyhole size={18} aria-hidden="true" />{t("Validation & access")}</h2>
            <details open><summary>{t("Names, numbers and confirmation")}</summary><p>{t("Bangla digits are normalized, mobile numbers are validated and stored in +880 format, and the caller confirms the readback before a booking or change is saved.")}</p></details>
            <details><summary>{t("Reliable booking changes")}</summary><p>{t("A database constraint prevents two active bookings for the same doctor and slot. Rescheduling runs as one transaction, so a failed change preserves the previous appointment. Version checks stop an older request from overwriting a newer change.")}</p></details>
            <details><summary>{t("Staff access and server secrets")}</summary><p>{t("Call data requires staff sign-in. Project keys stay on the server; the browser receives a short-lived call token. This demo uses fictional patient data.")}</p></details>
          </section>
        </div>
      </div>
    </Shell>
  );
}
