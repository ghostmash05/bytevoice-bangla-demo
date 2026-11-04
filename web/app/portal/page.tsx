"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { CopyValue } from "@/components/copy-value";
import { api, ApiError, dateTime as formatDateTime, duration, label as formatLabel } from "@/lib/api";
import { useLocale } from "@/components/locale";
import {
  actionValue as formatActionValue,
  appointmentTime as formatAppointmentTime,
  doctorName as formatDoctorName,
  serviceName as formatServiceName,
} from "@/lib/clinic";
import type { CallDetail, CallList } from "@/lib/types";

type Session = { username: string; csrf_token: string };
const emptyList: CallList = { items: [], total: 0, limit: 30, offset: 0 };

export default function Portal() {
  const { t, language } = useLocale();
  const label = (value: string) => t(formatLabel(value));
  const dateTime = (value: string) => formatDateTime(value, language);
  const number = (value: number) => new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-GB").format(value);
  const appointmentTime = (value: string | null) => formatAppointmentTime(value, language);
  const doctorName = (id: string | null) => formatDoctorName(id, language);
  const serviceName = (id: string | null) => formatServiceName(id, language);
  const actionValue = (key: string, value: string | number) => t(formatActionValue(key, value, language) || "");
  const [session, setSession] = useState<Session | null>(null),
    [checking, setChecking] = useState(true);
  const [username, setUsername] = useState("reviewer"),
    [password, setPassword] = useState(""),
    [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState(""),
    [list, setList] = useState<CallList>(emptyList),
    [loading, setLoading] = useState(false);
  const [q, setQ] = useState(""),
    [search, setSearch] = useState(""),
    [outcome, setOutcome] = useState(""),
    [status, setStatus] = useState(""),
    [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<string | null>(null),
    [detail, setDetail] = useState<CallDetail | null>(null),
    [detailError, setDetailError] = useState(""),
    [detailLoading, setDetailLoading] = useState(false);
  const [tab, setTab] = useState("conversation"),
    [refresh, setRefresh] = useState(0),
    [updated, setUpdated] = useState("");
  const pendingFocus = useRef<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => {
    if (
      !pendingFocus.current ||
      !window.matchMedia("(max-width: 760px)").matches
    )
      return;
    const target = document.getElementById(pendingFocus.current);
    if (target) {
      target.focus();
      pendingFocus.current = null;
    }
  }, [selected, detail, detailError]);
  useEffect(() => {
    api<Session>("/auth/me")
      .then(setSession)
      .catch((e) => {
        if (!(e instanceof ApiError && e.status === 401)) setError(e.message);
      })
      .finally(() => setChecking(false));
    const initial = new URLSearchParams(window.location.search).get("call");
    if (initial) setSelected(initial);
  }, []);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(q);
      setOffset(0);
    }, 300);
    return () => clearTimeout(timeout);
  }, [q]);
  useEffect(() => {
    if (!session) return;
    let current = true;
    setLoading(true);
    api<CallList>(
      `/calls?${new URLSearchParams({ q: search, outcome, status, limit: "30", offset: String(offset) })}`,
    )
      .then((data) => {
        if (current) {
          setList(data);
          setError("");
          setUpdated(
            new Date().toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              timeZone: "Asia/Dhaka",
            }),
          );
        }
      })
      .catch((e) => {
        if (current) {
          if (e.status === 401) setSession(null);
          else setError(e.message);
        }
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [session, search, status, outcome, offset, refresh]);
  useEffect(() => {
    if (!session || !selected) {
      setDetail(null);
      return;
    }
    let current = true;
    setDetailLoading(true);
    setDetailError("");
    api<CallDetail>(`/calls/${encodeURIComponent(selected)}`)
      .then((data) => {
        if (current) setDetail(data);
      })
      .catch((e) => {
        if (current) {
          setDetail(null);
          setDetailError(e.message);
        }
      })
      .finally(() => {
        if (current) setDetailLoading(false);
      });
    return () => {
      current = false;
    };
  }, [session, selected, refresh]);
  useEffect(() => {
    if (!session) return;
    const timer = setInterval(() => {
      if (!document.hidden) setRefresh((r) => r + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, [session]);
  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setError("");
    try {
      setSession(
        await api<Session>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ username, password }),
        }),
      );
      setPassword("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoggingIn(false);
    }
  }
  async function logout() {
    try {
      await api("/auth/logout", {
        method: "POST",
        headers: { "X-CSRF-Token": session!.csrf_token },
      });
      setSession(null);
      setList(emptyList);
      setDetail(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function select(id: string | null) {
    pendingFocus.current = id ? "record-title" : `call-${selected}`;
    setSelected(id);
    setDetail(null);
    setTab("conversation");
    window.history.replaceState(
      null,
      "",
      id ? `/portal?call=${encodeURIComponent(id)}` : "/portal",
    );
  }

  if (checking)
    return (
      <Shell>
        <div className="loading-page" role="status">
          <div className="skeleton wide" />
          <div className="skeleton" />
          <p>{t("Opening clinic workspace…")}</p>
        </div>
      </Shell>
    );
  if (!session)
    return (
      <Shell>
        <div className="login-layout">
          <div className="login-intro">
            <ShieldCheck size={30} />
            <h1>
              {t("Your clinic’s calls,")}<br />
              {t("clearly recorded.")}</h1>
            <p>
              {t("Review conversations, patient requests and appointment outcomes in one place.")}</p>
            <p className="quiet">
              {t("Assessment demo. Use fictional patient details only.")}</p>
          </div>
          <form className="login-form" onSubmit={login}>
            <h2>{t("Sign in to the workspace")}</h2>
            <p>{t("Use the reviewer credentials provided with the demo.")}</p>
            <label htmlFor="username">{t("Username")}</label>
            <input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <label htmlFor="password">{t("Password")}</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="primary" disabled={loggingIn}>
              {loggingIn ? t("Signing in…") : t("Sign in")}
              <ArrowRight size={17} />
            </button>
            <Link href="/try" className="text-link">
              {t("Try the Bangla voice demo")}</Link>
          </form>
        </div>
      </Shell>
    );

  return (
    <Shell onLogout={logout}>
      <header className="page-header">
        <div>
          <h1>{t("Call records")}</h1>
          <p className="mobile-timezone">{t("Bangladesh time · UTC+6")}</p>
        </div>
        <div className="header-actions">
          <span className="subtle">
            {updated ? `${t("Updated")} ${updated}` : t("Waiting for records" )}
          </span>
          <button
            className="secondary"
            onClick={() => setRefresh((r) => r + 1)}
            disabled={loading}
          >
            <RefreshCw size={16} />
            {t("Refresh")}</button>
          <Link className="primary header-call" href="/try"><Phone size={16} aria-hidden="true" />{t("Test a call")}</Link>
        </div>
      </header>
      <div className={`filters ${filtersOpen ? "filters-open" : ""}`}>
        <label className="search-field">
          <Search size={17} />
          <span className="sr-only">{t("Search by name, phone or call ID")}</span>
          <input
            type="search"
            placeholder={t("Search name, phone or call ID")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <button className="secondary mobile-filters" aria-expanded={filtersOpen} aria-controls="outcome-filter status-filter" onClick={() => setFiltersOpen(!filtersOpen)}>
          <SlidersHorizontal size={17} aria-hidden="true" />
          {t("Filters")}{outcome || status ? t(" · On") : ""}
        </button>
        <label className="filter-select" id="outcome-filter">
          <span className="sr-only">{t("Filter by outcome")}</span>
          <select
            value={outcome}
            onChange={(e) => {
              setOutcome(e.target.value);
              setOffset(0);
            }}
          >
            <option value="">{t("All outcomes")}</option>
            {[
              "booked",
              "rescheduled",
              "cancelled",
              "enquiry",
              "follow_up_needed",
              "incomplete",
            ].map((v) => (
              <option key={v} value={v}>
                {label(v)}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-select" id="status-filter">
          <span className="sr-only">{t("Filter by call status")}</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setOffset(0);
            }}
          >
            <option value="">{t("All statuses")}</option>
            {["connecting", "live", "completed", "incomplete", "failed"].map(
              (v) => (
                <option key={v} value={v}>
                  {label(v)}
                </option>
              ),
            )}
          </select>
        </label>
        {(q || outcome || status) && <button className="text-link clear-filters" onClick={() => { setQ(""); setOutcome(""); setStatus(""); setOffset(0); }}>{t("Clear filters")}</button>}
      </div>
      {error && (
        <div className="page-error error" role="alert">
          {error}
          <button
            className="text-link"
            onClick={() => setRefresh((r) => r + 1)}
          >
            {t("Try again")}</button>
        </div>
      )}
      <div className={`records-layout ${selected ? "has-selection" : ""}`}>
        <section className="call-index" aria-label={t("Call list")}>
          <div className="index-heading">
            <span>
              {number(list.total)} {list.total === 1 ? t("record") : t("records")}
            </span>
            <span className="subtle">{t("Newest first")}</span>
          </div>
          {loading && list.items.length === 0 ? (
            <div
              className="list-loading"
              role="status"
              aria-label={t("Loading calls")}
            >
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton" />
              ))}
            </div>
          ) : list.items.length === 0 ? (
            <div className="empty-state">
              <AudioLines size={30} />
              <h2>
                {search || outcome || status
                  ? t("No matching calls")
                  : t("No calls yet")}
              </h2>
              <p>
                {search || outcome || status
                  ? t("Try another search or clear the filters.")
                  : t("Start a voice test. The call and its captured details will appear here.")}
              </p>
              <Link className="text-link" href="/try">
                {t("Open voice test")}<ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="call-rows">
              {list.items.map((call) => (
                <button
                  key={call.id}
                  id={`call-${call.id}`}
                  className={`call-row ${selected === call.id ? "selected" : ""}`}
                  onClick={() => select(call.id)}
                  aria-pressed={selected === call.id}
                >
                  <div className="row-top">
                    <strong>
                      {call.extraction.patient_name || t("Unidentified caller")}
                    </strong>
                    <span className={`badge ${call.outcome}`}>
                      {label(call.outcome)}
                    </span>
                  </div>
                  <span className="row-phone">
                    {["scripted_test", "synthetic_audio_test"].includes(
                      call.source,
                    ) && (
                      <span className="fixture-label">
                        {call.source === "scripted_test"
                          ? t("Scripted test")
                          : t("Synthetic voice test")}{" "}
                        ·{" "}
                      </span>
                    )}
                    {call.extraction.phone || t("Phone not captured")}
                  </span>
                  <div className="row-meta">
                    <span>{dateTime(call.started_at)}</span>
                    <span>
                      {call.ended_at
                        ? duration(call.duration_s)
                        : label(call.status)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="pagination">
            <span>
              {list.total
                ? `${number(offset + 1)}–${number(Math.min(offset + 30, list.total))} ${language === "bn" ? "/" : "of"} ${number(list.total)}`
                : t("0 records")}
            </span>
            <div>
              <button
                className="icon-button"
                aria-label={t("Previous page")}
                disabled={offset === 0 || loading}
                onClick={() => setOffset(Math.max(0, offset - 30))}
              >
                <ChevronLeft size={17} />
              </button>
              <button
                className="icon-button"
                aria-label={t("Next page")}
                disabled={offset + 30 >= list.total || loading}
                onClick={() => setOffset(offset + 30)}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </section>
        <section className="record-detail" aria-label={t("Selected call")}>
          {!selected ? (
            <div className="detail-placeholder">
              <AudioLines size={38} />
              <h2>{t("Take a closer look.")}</h2>
              <p>
                {t("Select a call to see the conversation,")}<br />
                {t("captured details and saved actions.")}</p>
            </div>
          ) : (
            <>
              <button className="back-to-list" onClick={() => select(null)}>
                <ArrowLeft size={16} />
                {t("All calls")}</button>
              {detailLoading && !detail ? (
                <div className="detail-loading" role="status">
                  <div className="skeleton wide" />
                  <div className="skeleton" />
                  <p>{t("Loading call record…")}</p>
                </div>
              ) : detailError ? (
                <div className="empty-state">
                  <h2>{t("Couldn’t open this call")}</h2>
                  <p className="error" role="alert">
                    {detailError}
                  </p>
                  <button
                    className="secondary"
                    onClick={() => setRefresh((r) => r + 1)}
                  >
                    {t("Try again")}</button>
                </div>
              ) : (
                detail && (
                  <>
                    <div className="record-heading">
                      <div>
                        <h2 id="record-title" tabIndex={-1}>
                          {detail.extraction.patient_name ||
                            t("Unidentified caller")}
                        </h2>
                        <p>{detail.extraction.phone || t("Phone not captured")}</p>
                      </div>
                      <span className={`badge ${detail.outcome}`}>
                        {label(detail.outcome)}
                      </span>
                    </div>
                    <div className="record-meta">
                      <span>
                        {detail.source === "scripted_test"
                          ? t("Scripted test fixture")
                          : label(detail.source)}
                      </span>
                      <span>
                        <Clock3 size={14} />
                        {dateTime(detail.started_at)}
                      </span>
                      <span>
                        {detail.ended_at
                          ? duration(detail.duration_s)
                          : t("Call in progress")}
                      </span>
                      <span>{label(detail.status)}</span>
                    </div>
                    {detail.error_code && (
                      <p className="error record-error">
                        {t("The call encountered an issue:")}{" "}
                        {label(detail.error_code)}{t(". Captured records are preserved.")}</p>
                    )}
                    <div
                      className="tabs"
                      role="tablist"
                      aria-label={t("Call record views")}
                    >
                      {["conversation", "details", "activity"].map((t) => (
                        <button
                          key={t}
                          role="tab"
                          aria-selected={tab === t}
                          aria-controls={`panel-${t}`}
                          id={`tab-${t}`}
                          onClick={() => setTab(t)}
                          onKeyDown={(e) => {
                            if (
                              [
                                "ArrowLeft",
                                "ArrowRight",
                                "Home",
                                "End",
                              ].includes(e.key)
                            ) {
                              e.preventDefault();
                              const tabs = [
                                "conversation",
                                "details",
                                "activity",
                              ];
                              const index =
                                e.key === "Home"
                                  ? 0
                                  : e.key === "End"
                                    ? 2
                                    : (tabs.indexOf(t) +
                                        (e.key === "ArrowRight" ? 1 : 2)) %
                                      3;
                              setTab(tabs[index]);
                              document
                                .getElementById(`tab-${tabs[index]}`)
                                ?.focus();
                            }
                          }}
                          tabIndex={tab === t ? 0 : -1}
                        >
                          {label(t)}
                          {t === "conversation" && (
                            <span>{number(detail.transcript.length)}</span>
                          )}
                        </button>
                      ))}
                    </div>
                    <div
                      role="tabpanel"
                      id={`panel-${tab}`}
                      aria-labelledby={`tab-${tab}`}
                      className="tab-content"
                    >
                      {tab === "conversation" ? (
                        detail.transcript.length ? (
                          <div className="transcript">
                            {detail.transcript.map((turn) => (
                              <article
                                className={`turn ${turn.speaker}`}
                                key={turn.id}
                              >
                                <div className="turn-heading">
                                  <strong>
                                    {turn.speaker === "assistant"
                                      ? t("AI receptionist")
                                      : t("Caller")}
                                  </strong>
                                  <time>{duration(turn.offset_s)}</time>
                                  {turn.interrupted && <span>{t("Interrupted")}</span>}
                                </div>
                                <p lang="bn">{turn.text}</p>
                              </article>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-state compact">
                            <h3>{t("No transcript captured")}</h3>
                            <p>
                              {detail.ended_at
                                ? t("This call ended before a transcript was captured.")
                                : t("Conversation turns will appear as the call progresses.")}
                            </p>
                          </div>
                        )
                      ) : tab === "details" ? (
                        <dl className="fields">
                          {Object.entries({
                            "Patient name": detail.extraction.patient_name,
                            "Phone number": detail.extraction.phone,
                            "Reason for visit":
                              detail.extraction.reason_for_visit,
                            "Preferred date & time": appointmentTime(
                              detail.extraction.preferred_datetime,
                            ),
                            Doctor: doctorName(detail.extraction.doctor_id),
                            Service: serviceName(detail.extraction.service_id),
                            Intent: detail.extraction.intent
                              ? label(detail.extraction.intent)
                              : null,
                            Notes: detail.extraction.notes,
                            "Call ID": detail.id,
                          }).map(([key, value]) => (
                            <div key={key}>
                              <dt>{t(key)}</dt>
                              <dd>
                                {value || (
                                  <span className="subtle">{t("Not captured")}</span>
                                )}
                                {value && key === "Phone number" && <CopyValue value={String(value)} label="Copy phone number" />}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <div className="activity">
                          {detail.actions.length === 0 &&
                          detail.follow_ups.length === 0 ? (
                            <div className="empty-state compact">
                              <h3>{t("No saved actions")}</h3>
                              <p>
                                {t("Booking changes and staff follow-ups will appear here when saved.")}</p>
                            </div>
                          ) : (
                            <>
                              {detail.actions.map((action, i) => (
                                <article className="action-entry" key={i}>
                                  <Check size={18} />
                                  <div>
                                    <h3>{label(action.kind)}</h3>
                                    <p>{dateTime(action.created_at)}</p>
                                    <dl className="action-fields">
                                      {Object.entries(action.result)
                                        .filter(([key]) =>
                                          [
                                            "reference",
                                            "slot",
                                            "status",
                                            "doctor_id",
                                            "service_id",
                                          ].includes(key),
                                        )
                                        .map(([key, value]) => (
                                          <div key={key}>
                                            <dt>
                                              {key === "doctor_id"
                                                ? t("Doctor")
                                                : key === "service_id"
                                                  ? t("Service")
                                                  : key === "slot"
                                                    ? t("Appointment")
                                                    : label(key)}
                                            </dt>
                                            <dd>{actionValue(key, value)}{key === "reference" && <CopyValue value={String(value)} label="Copy booking reference" />}</dd>
                                          </div>
                                        ))}
                                    </dl>
                                  </div>
                                </article>
                              ))}
                              {detail.follow_ups.map((f) => (
                                <article className="action-entry" key={f.id}>
                                  <Clock3 size={18} />
                                  <div>
                                    <h3>{t("Staff follow-up ·")}{label(f.status)}</h3>
                                    <p>{f.reason}</p>
                                    <p>
                                      {f.patient_name} · {f.phone}
                                    </p>
                                  </div>
                                </article>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )
              )}
            </>
          )}
        </section>
      </div>
    </Shell>
  );
}
