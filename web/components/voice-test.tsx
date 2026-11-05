"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Mic, MicOff, Phone, PhoneOff, CalendarCheck2, RefreshCw, MessageSquareText } from "lucide-react";
import { Brand } from "@/components/brand";
import { useLocale } from "@/components/locale";
import {
  ParticipantKind,
  Room,
  RoomEvent,
  Track,
  type Participant,
  type RemoteTrack,
} from "livekit-client";
import { api, label as formatLabel } from "@/lib/api";
import type { OrbState } from "./vendor/voiceorbs/lib/orb-state";
import "./voice-test.css";

type State = "idle" | "connecting" | "live" | "ended" | "error";
type Turn = { id: string; text: string; speaker: string };

const MercuryOrb = dynamic(() => import("./vendor/voiceorbs/orbe/mercury-orb/mercury-orb").then((module) => module.MercuryOrb), {
  ssr: false,
  loading: () => <div className="voice-orb-placeholder" />,
});

function getOrbState(state: State, agentState: string, muted: boolean): OrbState {
  if (state === "ended") return "disabled";
  if (state !== "live") return state;
  if (agentState === "listening") return muted ? "disabled" : "listening";
  if (agentState === "thinking" || agentState === "speaking") return agentState;
  return "connecting";
}

function Conversation({ turns, preview, empty }: { turns: Turn[]; preview: boolean; empty: string }) {
  const { t } = useLocale();
  const viewport = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  useEffect(() => {
    const element = viewport.current;
    if (element && !preview && follow.current) element.scrollTop = element.scrollHeight;
  }, [preview, turns]);
  const title = t(preview ? "Preview conversation" : "Call conversation");
  return (
    <div className="call-conversation" data-preview={preview}>
      <div className="conversation-title">{title}</div>
      <div
        className="conversation-messages"
        role="region"
        aria-label={title}
        tabIndex={0}
        ref={viewport}
        onScroll={(event) => {
          const element = event.currentTarget;
          follow.current = element.scrollHeight - element.clientHeight - element.scrollTop < 48;
        }}
      >
        {turns.length === 0 && <p className="conversation-empty">{empty}</p>}
        {turns.map((turn) => (
          <article key={turn.id} className={turn.speaker === "Caller" ? "conversation-caller" : "conversation-agent"}>
            <span>{t(turn.speaker === "Caller" ? "You" : "AI receptionist")}</span>
            <p lang="bn">{turn.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function VoiceTest({ hero = false, demo = false, callGate }: {
  hero?: boolean;
  demo?: boolean;
  callGate?: { claim: () => boolean; release: () => void; blocked: boolean };
}) {
  const { t } = useLocale();
  const label = (value: string) => t(formatLabel(value));
  const [state, setState] = useState<State>("idle"),
    [error, setError] = useState(""),
    [muted, setMuted] = useState(false),
    [agentState, setAgentState] = useState("Connecting to receptionist");
  const [callId, setCallId] = useState(""),
    [turns, setTurns] = useState<Turn[]>([]);
  const room = useRef<Room | null>(null),
    finalizedSegments = useRef(new Set<string>()),
    audio = useRef<HTMLDivElement>(null),
    joining = useRef(false),
    attempt = useRef(0),
    cancelled = useRef(false),
    expectedEnding = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    agentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const orbState = getOrbState(state, agentState, muted);
  const orbLevel = useMemo(() => ({
    get current() {
      const currentRoom = room.current;
      if (!currentRoom) return -1;
      if (orbState === "listening") return currentRoom.localParticipant.audioLevel;
      if (orbState === "speaking") {
        return currentRoom.activeSpeakers.find((participant) => participant.kind === ParticipantKind.AGENT)?.audioLevel ?? -1;
      }
      return -1;
    },
  }), [orbState]);
  useEffect(
    () => () => {
      cancelled.current = true;
      attempt.current++;
      joining.current = false;
      room.current?.disconnect();
      if (timer.current) clearTimeout(timer.current);
      if (agentTimer.current) clearTimeout(agentTimer.current);
    },
    [],
  );
  function cleanup() {
    if (timer.current) clearTimeout(timer.current);
    if (agentTimer.current) clearTimeout(agentTimer.current);
    audio.current?.replaceChildren();
  }
  async function end(nextState: "idle" | "ended" | "error" = "ended") {
    cancelled.current = true;
    const endingAttempt = ++attempt.current;
    cleanup();
    const current = room.current;
    room.current = null;
    if (nextState === "idle") setCallId("");
    setState(nextState);
    try {
      await current?.disconnect();
    } finally {
      if (attempt.current === endingAttempt) {
        joining.current = false;
        callGate?.release();
      }
    }
  }
  function observeAgent(participant: Participant) {
    if (participant.kind === ParticipantKind.AGENT) {
      if (agentTimer.current) clearTimeout(agentTimer.current);
      if (participant.attributes["clinic.call_ending"] === "true") {
        expectedEnding.current = true;
        setAgentState("Finishing your call");
        return;
      }
      setAgentState(participant.attributes["lk.agent.state"] || "listening");
    }
  }
  async function start() {
    if (joining.current || (callGate && !callGate.claim())) return;
    const startingAttempt = ++attempt.current;
    joining.current = true;
    cancelled.current = false;
    setState("connecting");
    setError("");
    setTurns([]);
    finalizedSegments.current.clear();
    setCallId("");
    setMuted(false);
    expectedEnding.current = false;
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
          "Microphone access needs HTTPS or localhost and a supported browser.",
        );
      const connection = await api<{
        token: string;
        server_url: string;
        call_id: string;
        max_duration_s: number;
      }>("/connect", { method: "POST" });
      if (attempt.current !== startingAttempt) return;
      setCallId(connection.call_id);
      const current = new Room({ adaptiveStream: true, dynacast: true });
      room.current = current;
      current.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Audio) {
          const element = track.attach();
          audio.current?.appendChild(element);
        }
      });
      current.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) =>
        track.detach().forEach((element) => element.remove()),
      );
      current.on(RoomEvent.ParticipantConnected, observeAgent);
      current.on(RoomEvent.ParticipantDisconnected, (participant) => {
        if (participant.kind !== ParticipantKind.AGENT || room.current !== current || cancelled.current) return;
        cancelled.current = true;
        setError(expectedEnding.current ? "" : "The receptionist disconnected. Reconnect to continue; any saved details are retained.");
        void end(expectedEnding.current ? "ended" : "error");
      });
      current.on(
        RoomEvent.ParticipantAttributesChanged,
        (_attributes, participant) => observeAgent(participant),
      );
      current.registerTextStreamHandler(
        "lk.transcription",
        async (reader, participantInfo) => {
          if (participantInfo.identity === current.localParticipant.identity &&
              [...current.remoteParticipants.values()].some((participant) =>
                participant.kind === ParticipantKind.AGENT && participant.attributes["clinic.caller_transcript"] === "dedicated")) {
            await reader.readAll();
            return;
          }
          const id =
            reader.info.attributes?.["lk.segment_id"] || reader.info.id;
          const final =
            reader.info.attributes?.["lk.transcription_final"] === "true";
          if (!final && finalizedSegments.current.has(id)) return;
          let text = "";
          try {
            for await (const chunk of reader) {
              text += chunk;
              if (!final && finalizedSegments.current.has(id)) continue;
              const speaker =
                participantInfo.identity === current.localParticipant.identity
                  ? "Caller"
                  : "AI receptionist";
              setTurns((previous) => {
                const next = [...previous],
                  item = { id, text, speaker };
                const index = next.findIndex((turn) => turn.id === id);
                if (index >= 0) next[index] = item;
                else next.push(item);
                return next;
              });
            }
            if (final) finalizedSegments.current.add(id);
          } catch {
            setError(
              "Live captions were interrupted. The saved call record may contain more details.",
            );
          }
        },
      );
      current.registerTextStreamHandler("clinic.caller_transcript", async (reader, participantInfo) => {
        const sender = current.remoteParticipants.get(participantInfo.identity);
        if (sender?.kind !== ParticipantKind.AGENT) return;
        try {
          const text = await reader.readAll();
          if (room.current !== current) return;
          const id = reader.info.attributes?.segment_id || reader.info.id;
          setTurns((previous) => previous.some((turn) => turn.id === id)
            ? previous : [...previous, { id, text, speaker: "Caller" }]);
        } catch {
          setError("Caller captions were interrupted. You can continue speaking or reconnect.");
        }
      });
      current.on(RoomEvent.Disconnected, () => {
        if (room.current !== current) return;
        attempt.current++;
        room.current = null;
        cleanup();
        joining.current = false;
        callGate?.release();
        setState((previous) => (previous === "error" ? "error" : "ended"));
      });
      await current.connect(connection.server_url, connection.token);
      if (attempt.current !== startingAttempt) {
        await current.disconnect();
        return;
      }
      await current.startAudio();
      if (attempt.current !== startingAttempt) return;
      await current.localParticipant.setMicrophoneEnabled(true);
      if (attempt.current !== startingAttempt) return;
      setState("live");
      setAgentState("Connecting to receptionist");
      agentTimer.current = setTimeout(() => {
        setError(
          "The receptionist did not join. End the call and try again shortly.",
        );
      }, 25000);
      current.remoteParticipants.forEach(observeAgent);
      timer.current = setTimeout(
        () => void end(),
        connection.max_duration_s * 1000,
      );
    } catch (err) {
      if (attempt.current !== startingAttempt || cancelled.current) return;
      const message =
        (err as Error).name === "NotAllowedError"
          ? "Microphone access was blocked. Allow it in your browser’s site settings, then try again."
          : (err as Error).name === "NotFoundError"
            ? "No microphone was found. Connect one and try again."
            : (err as Error).message ||
              "The call could not connect. Please try again.";
      const current = room.current;
      room.current = null;
      await current?.disconnect();
      if (attempt.current !== startingAttempt) return;
      cleanup();
      joining.current = false;
      callGate?.release();
      setError(message);
      setState("error");
    }
  }
  async function toggleMute() {
    try {
      const next = !muted;
      await room.current?.localParticipant.setMicrophoneEnabled(!next);
      setMuted(next);
    } catch {
      setError(
        "The microphone could not be changed. Check browser permissions.",
      );
    }
  }
  const previewTurns: Turn[] = demo && state === "idle" ? [
    { id: "welcome", speaker: "AI receptionist", text: "মাশরাফি’স ডেন্টাল থেকে বলছি। কীভাবে সাহায্য করতে পারি?" },
    { id: "request", speaker: "Caller", text: "শনিবার বিকেলে স্কেলিংয়ের জন্য সময় আছে?" },
    { id: "reply", speaker: "AI receptionist", text: "অবশ্যই, শনিবার বিকেলে খালি সময় আছে কি না দেখে বলছি" },
  ] : [];
  return (
      <div className={demo ? "hero-caller demo-caller" : hero ? "hero-caller" : "test-layout"}>
        {!hero && <header className="voice-page-heading"><div><h1>{t("Talk to your receptionist")}</h1>
        <p>
          {t("Speak naturally in Bangla. You can ask about the demo clinic, book a visit, or change an existing appointment using its reference and phone number.")}</p>
        </div></header>}
        <div className="voice-workspace">
        <div className="voice-column">
        <section className={`call-console console-${state}`} aria-label={t("Browser voice call")}>
          {(!hero || demo || state !== "idle") && <div className="call-console-head">
            <h2>{t("Mashrafi’s Dental")}</h2>
            <span className="call-state" role="status">
              <span className={`state-dot ${state === "live" ? "live" : ""}`} />
              {label(state)}
            </span>
          </div>}
          {(!hero || demo || state !== "idle") && <div className="call-stage">
            {demo ? <div className="voice-orb" aria-hidden="true"><MercuryOrb state={orbState} size={144} speed={0.85} levelRef={orbLevel} /></div> : <div className="voice-mark">
              <Brand mark />
            </div>}
            <h3>
              {state === "live"
                ? label(agentState)
                : state === "connecting"
                  ? t("Connecting your call…")
                  : state === "ended"
                    ? t("The call has ended")
                    : state === "error"
                      ? t("Let’s try that again")
              : t("How can I help?")}
            </h3>
            <p>
              {state === "live"
                ? t("Speak when you’re ready. You can interrupt the receptionist to correct a detail.")
                : state === "ended"
                  ? t("Your captured conversation and appointment actions will appear in the staff portal.")
                  : t("Use your microphone to talk to our AI receptionist.")}
            </p>
            {error && (
              <p className="error" role="alert">
                {t(error)}
              </p>
            )}
          </div>}
          <div className="call-controls">
            {state === "live" ? (
              <>
                <button className="secondary" onClick={toggleMute}>
                  {muted ? <MicOff size={17} /> : <Mic size={17} />}
                  {muted ? t("Unmute microphone") : t("Mute microphone")}
                </button>
                <button className="primary danger" onClick={() => void end()}>
                  <PhoneOff size={17} />
                  {t("End call")}</button>
              </>
            ) : state === "connecting" ? (
              <button className="secondary" onClick={() => void end("idle")}>
                {t("Cancel connection")}</button>
            ) : (
              <button className="primary" onClick={start} disabled={callGate?.blocked}>
                <Phone size={17} />
                {state === "idle" ? t(hero ? "Talk to our Bangla caller" : "Start voice call") : t("Start another call")}
              </button>
            )}
          </div>
          {(demo || turns.length > 0) && (
            <Conversation
              key={state === "idle" ? "preview" : "call"}
              turns={state === "idle" ? previewTurns : turns}
              preview={state === "idle"}
              empty={t(state === "ended" || state === "error" ? "No captions for this call." : "Captions appear here as you speak.")}
            />
          )}
        </section>
        <p className="consent-note">
          {t("This is a fictional clinic for an assessment demo. Use fake patient details only. Starting a call sends microphone audio to the configured speech providers and stores the transcript and captured details for review. Demo calls end after five minutes.")}</p>
        {callId && (
          <Link
            className="text-link"
            href={`/portal?call=${encodeURIComponent(callId)}`}
          >
            {t("View this call in the staff portal")}</Link>
        )}
        </div>
        {!hero && <aside className="call-guide" aria-label={t("Conversation guide")}>
          <h2>{t("Try a conversation")}</h2>
          <div className="guide-item"><CalendarCheck2 size={19} aria-hidden="true" /><div><h3>{t("Book an appointment")}</h3><p lang="bn">“কাল সকালে স্কেলিংয়ের জন্য সময় হবে?”</p></div></div>
          <div className="guide-item"><RefreshCw size={18} aria-hidden="true" /><div><h3>{t("Change an existing visit")}</h3><p>{t("Have your booking reference and phone number ready.")}</p></div></div>
          <div className="guide-item"><MessageSquareText size={19} aria-hidden="true" /><div><h3>{t("Ask about the clinic")}</h3><p>{t("Opening hours, services, demo fees or a staff callback.")}</p></div></div>
        </aside>}
        </div>
        <div ref={audio} aria-hidden="true" />
      </div>
  );
}
