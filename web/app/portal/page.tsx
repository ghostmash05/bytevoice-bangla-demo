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
} from "lucide-react";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { api, ApiError, dateTime, duration, label } from "@/lib/api";
import {
  actionValue,
  appointmentTime,
  doctorName,
  serviceName,
} from "@/lib/clinic";
import type { CallDetail, CallList } from "@/lib/types";

type Session = { username: string; csrf_token: string };
const emptyList: CallList = { items: [], total: 0, limit: 30, offset: 0 };

export default function Portal() {
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
          <p>Opening clinic workspace…</p>
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
              Your clinic’s calls,
              <br />
              clearly recorded.
            </h1>
            <p>
              Review conversations, patient requests and appointment outcomes in
              one place.
            </p>
            <p className="quiet">
              Assessment demo. Use fictional patient details only.
            </p>
          </div>
          <form className="login-form" onSubmit={login}>
            <h2>Sign in to the workspace</h2>
            <p>Use the reviewer credentials provided with the demo.</p>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <label htmlFor="password">Password</label>
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
              {loggingIn ? "Signing in…" : "Sign in"}
              <ArrowRight size={17} />
            </button>
            <Link href="/try" className="text-link">
              Try the Bangla voice demo
            </Link>
          </form>
        </div>
      </Shell>
    );

  return (
    <Shell onLogout={logout}>
      <header className="page-header">
        <div>
          <h1>Call records</h1>
          <p>
            Every conversation, with the details your team needs.
            <span className="mobile-timezone">Bangladesh time · UTC+6</span>
          </p>
        </div>
        <div className="header-actions">
          <span className="subtle">
            {updated ? `Updated ${updated}` : "Waiting for records"}
          </span>
          <button
            className="secondary"
            onClick={() => setRefresh((r) => r + 1)}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </header>
      <div className="filters">
        <label className="search-field">
          <Search size={17} />
          <span className="sr-only">Search by name, phone or call ID</span>
          <input
            type="search"
            placeholder="Search name, phone or call ID"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <label>
          <span className="sr-only">Filter by outcome</span>
          <select
            value={outcome}
            onChange={(e) => {
              setOutcome(e.target.value);
              setOffset(0);
            }}
          >
            <option value="">All outcomes</option>
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
        <label>
          <span className="sr-only">Filter by call status</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setOffset(0);
            }}
          >
            <option value="">All statuses</option>
            {["connecting", "live", "completed", "incomplete", "failed"].map(
              (v) => (
                <option key={v} value={v}>
                  {label(v)}
                </option>
              ),
            )}
          </select>
        </label>
      </div>
      {error && (
        <div className="page-error error" role="alert">
          {error}
          <button
            className="text-link"
            onClick={() => setRefresh((r) => r + 1)}
          >
            Try again
          </button>
        </div>
      )}
      <div className={`records-layout ${selected ? "has-selection" : ""}`}>
        <section className="call-index" aria-label="Call list">
          <div className="index-heading">
            <span>
              {list.total} {list.total === 1 ? "record" : "records"}
            </span>
            <span className="subtle">Newest first</span>
          </div>
          {loading && list.items.length === 0 ? (
            <div
              className="list-loading"
              role="status"
              aria-label="Loading calls"
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
                  ? "No matching calls"
                  : "No calls yet"}
              </h2>
              <p>
                {search || outcome || status
                  ? "Try another search or clear the filters."
                  : "Start a voice test. The call and its captured details will appear here."}
              </p>
              <Link className="text-link" href="/try">
                Open voice test
                <ArrowRight size={16} />
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
                      {call.extraction.patient_name || "Unidentified caller"}
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
                          ? "Scripted test"
                          : "Synthetic voice test"}{" "}
                        ·{" "}
                      </span>
                    )}
                    {call.extraction.phone || "Phone not captured"}
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
                ? `${offset + 1}–${Math.min(offset + 30, list.total)} of ${list.total}`
                : "0 records"}
            </span>
            <div>
              <button
                className="icon-button"
                aria-label="Previous page"
                disabled={offset === 0 || loading}
                onClick={() => setOffset(Math.max(0, offset - 30))}
              >
                <ChevronLeft size={17} />
              </button>
              <button
                className="icon-button"
                aria-label="Next page"
                disabled={offset + 30 >= list.total || loading}
                onClick={() => setOffset(offset + 30)}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </section>
        <section className="record-detail" aria-label="Selected call">
          {!selected ? (
            <div className="detail-placeholder">
              <AudioLines size={38} />
              <h2>Take a closer look.</h2>
              <p>
                Select a call to see the conversation,
                <br />
                captured details and saved actions.
              </p>
            </div>
          ) : (
            <>
              <button className="back-to-list" onClick={() => select(null)}>
                <ArrowLeft size={16} />
                All calls
              </button>
              {detailLoading && !detail ? (
                <div className="detail-loading" role="status">
                  <div className="skeleton wide" />
                  <div className="skeleton" />
                  <p>Loading call record…</p>
                </div>
              ) : detailError ? (
                <div className="empty-state">
                  <h2>Couldn’t open this call</h2>
                  <p className="error" role="alert">
                    {detailError}
                  </p>
                  <button
                    className="secondary"
                    onClick={() => setRefresh((r) => r + 1)}
                  >
                    Try again
                  </button>
                </div>
              ) : (
                detail && (
                  <>
                    <div className="record-heading">
                      <div>
                        <h2 id="record-title" tabIndex={-1}>
                          {detail.extraction.patient_name ||
                            "Unidentified caller"}
                        </h2>
                        <p>{detail.extraction.phone || "Phone not captured"}</p>
                      </div>
                      <span className={`badge ${detail.outcome}`}>
                        {label(detail.outcome)}
                      </span>
                    </div>
                    <div className="record-meta">
                      <span>
                        {detail.source === "scripted_test"
                          ? "Scripted test fixture"
                          : label(detail.source)}
                      </span>
                      <span>
                        <Clock3 size={14} />
                        {dateTime(detail.started_at)}
                      </span>
                      <span>
                        {detail.ended_at
                          ? duration(detail.duration_s)
                          : "Call in progress"}
                      </span>
                      <span>{label(detail.status)}</span>
                    </div>
                    {detail.error_code && (
                      <p className="error record-error">
                        The call encountered an issue:{" "}
                        {label(detail.error_code)}. Captured records are
                        preserved.
                      </p>
                    )}
                    <div
                      className="tabs"
                      role="tablist"
                      aria-label="Call record views"
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
                            <span>{detail.transcript.length}</span>
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
                                      ? "AI receptionist"
                                      : "Caller"}
                                  </strong>
                                  <time>{duration(turn.offset_s)}</time>
                                  {turn.interrupted && <span>Interrupted</span>}
                                </div>
                                <p lang="bn">{turn.text}</p>
                              </article>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-state compact">
                            <h3>No transcript captured</h3>
                            <p>
                              {detail.ended_at
                                ? "This call ended before a transcript was captured."
                                : "Conversation turns will appear as the call progresses."}
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
                              <dt>{key}</dt>
                              <dd>
                                {value || (
                                  <span className="subtle">Not captured</span>
                                )}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <div className="activity">
                          {detail.actions.length === 0 &&
                          detail.follow_ups.length === 0 ? (
                            <div className="empty-state compact">
                              <h3>No saved actions</h3>
                              <p>
                                Booking changes and staff follow-ups will appear
                                here when saved.
                              </p>
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
                                                ? "Doctor"
                                                : key === "service_id"
                                                  ? "Service"
                                                  : key === "slot"
                                                    ? "Appointment"
                                                    : label(key)}
                                            </dt>
                                            <dd>{actionValue(key, value)}</dd>
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
                                    <h3>Staff follow-up · {label(f.status)}</h3>
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
