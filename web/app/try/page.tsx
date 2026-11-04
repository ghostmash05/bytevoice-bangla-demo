"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AudioLines, Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import {
  ParticipantKind,
  Room,
  RoomEvent,
  Track,
  type Participant,
  type RemoteTrack,
} from "livekit-client";
import { Shell } from "@/components/shell";
import { api, label } from "@/lib/api";

type State = "idle" | "connecting" | "live" | "ended" | "error";
type Turn = { id: string; text: string; speaker: string };

export default function VoiceTest() {
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
    cancelled = useRef(false),
    expectedEnding = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    agentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      cancelled.current = true;
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
  async function end() {
    cancelled.current = true;
    joining.current = false;
    cleanup();
    const current = room.current;
    room.current = null;
    setState("ended");
    await current?.disconnect();
  }
  function observeAgent(participant: Participant) {
    if (participant.kind === ParticipantKind.AGENT) {
      if (agentTimer.current) clearTimeout(agentTimer.current);
      if (participant.attributes["clinic.call_ending"] === "true") {
        expectedEnding.current = true;
        setAgentState("Finishing your call");
        return;
      }
      setAgentState(
        label(participant.attributes["lk.agent.state"] || "listening"),
      );
    }
  }
  async function start() {
    if (joining.current) return;
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
      if (!joining.current) return;
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
        joining.current = false;
        room.current = null;
        cleanup();
        setError(expectedEnding.current ? "" : "The receptionist disconnected. Reconnect to continue; any saved details are retained.");
        setState(expectedEnding.current ? "ended" : "error");
        void current.disconnect();
      });
      current.on(
        RoomEvent.ParticipantAttributesChanged,
        (_attributes, participant) => observeAgent(participant),
      );
      current.registerTextStreamHandler(
        "lk.transcription",
        async (reader, participantInfo) => {
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
      current.on(RoomEvent.Disconnected, () => {
        if (room.current !== current) return;
        room.current = null;
        cleanup();
        joining.current = false;
        setState((previous) => (previous === "error" ? "error" : "ended"));
      });
      await current.connect(connection.server_url, connection.token);
      if (!joining.current) {
        await current.disconnect();
        return;
      }
      await current.startAudio();
      await current.localParticipant.setMicrophoneEnabled(true);
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
      if (cancelled.current) return;
      const message =
        (err as Error).name === "NotAllowedError"
          ? "Microphone access was blocked. Allow it in your browser’s site settings, then try again."
          : (err as Error).name === "NotFoundError"
            ? "No microphone was found. Connect one and try again."
            : (err as Error).message ||
              "The call could not connect. Please try again.";
      await room.current?.disconnect();
      room.current = null;
      cleanup();
      joining.current = false;
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
  return (
    <Shell>
      <div className="test-layout">
        <h1>Test the Bangla receptionist</h1>
        <p>
          Speak naturally in Bangla. You can ask about the demo clinic, book a
          visit, or change an existing appointment using its reference and phone
          number.
        </p>
        <section className="call-console" aria-label="Browser voice call">
          <div className="call-console-head">
            <h2>Dhaka Dental Care</h2>
            <span className="call-state" role="status">
              <span className={`state-dot ${state === "live" ? "live" : ""}`} />
              {label(state)}
            </span>
          </div>
          <div className="call-stage">
            <div className="voice-mark">
              <AudioLines size={37} />
            </div>
            <h3>
              {state === "live"
                ? agentState
                : state === "connecting"
                  ? "Connecting your call…"
                  : state === "ended"
                    ? "The call has ended"
                    : state === "error"
                      ? "Let’s try that again"
                      : "কীভাবে সাহায্য করতে পারি?"}
            </h3>
            <p>
              {state === "live"
                ? "Speak when you’re ready. You can interrupt the receptionist to correct a detail."
                : state === "ended"
                  ? "Your captured conversation and appointment actions will appear in the staff portal."
                  : "Use your microphone to talk to our AI receptionist."}
            </p>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </div>
          <div className="call-controls">
            {state === "live" ? (
              <>
                <button className="secondary" onClick={toggleMute}>
                  {muted ? <MicOff size={17} /> : <Mic size={17} />}
                  {muted ? "Unmute microphone" : "Mute microphone"}
                </button>
                <button className="primary danger" onClick={end}>
                  <PhoneOff size={17} />
                  End call
                </button>
              </>
            ) : state === "connecting" ? (
              <button className="secondary" onClick={end}>
                Cancel connection
              </button>
            ) : (
              <button className="primary" onClick={start}>
                <Phone size={17} />
                {state === "idle" ? "Start voice call" : "Start another call"}
              </button>
            )}
          </div>
          {turns.length > 0 && (
            <div className="test-transcript" aria-label="Live transcript">
              {turns.map((t) => (
                <article key={t.id}>
                  <h3>{t.speaker}</h3>
                  <p lang="bn">{t.text}</p>
                </article>
              ))}
            </div>
          )}
        </section>
        <p className="consent-note">
          This is a fictional clinic for an assessment demo. Use fake patient
          details only. Starting a call sends microphone audio to the configured
          speech providers and stores the transcript and captured details for
          review. Demo calls end after five minutes.
        </p>
        {callId && (
          <Link
            className="text-link"
            href={`/portal?call=${encodeURIComponent(callId)}`}
          >
            View this call in the staff portal
          </Link>
        )}
        <div ref={audio} aria-hidden="true" />
      </div>
    </Shell>
  );
}
