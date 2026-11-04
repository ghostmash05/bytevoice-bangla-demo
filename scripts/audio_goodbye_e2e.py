"""Verify a spoken goodbye drains and disconnects the caller automatically."""
import asyncio
import json
import os
import time
import wave
from uuid import uuid4

import httpx
from livekit import rtc

from agent.config import ROOT
from scripts.audio_e2e import AudioCaller
from scripts.realtime_smoke import generate_sample


async def main():
    path = ROOT / ".local" / "test-caller-goodbye.wav"
    if not path.exists():
        await generate_sample("ধন্যবাদ। আর কিছু লাগবে না। এবার কলটা শেষ করে দিন। আল্লাহ হাফেজ।", path, voice="Puck")
    report = {"mode": "synthetic_audio_webrtc", "passed": False, "human_microphone_tested": False}
    private = {"Authorization": "Bearer " + os.environ["AGENT_API_SECRET"]}
    password = (ROOT / ".local" / "reviewer-credentials.txt").read_text().split("Password: ", 1)[1].splitlines()[0]
    async with httpx.AsyncClient(base_url=os.environ["BACKEND_URL"], timeout=20) as client:
        logged_in = await client.post("/api/auth/login", json={"username": "reviewer", "password": password})
        logged_in.raise_for_status()
        room = "audio-test-goodbye-" + uuid4().hex
        started = await client.post("/internal/calls/start", headers=private, json={"room_name": room})
        started.raise_for_status()
        call_id = started.json()["call_id"]
        report.update(call_id=call_id, backend_origin=os.environ["BACKEND_URL"])
        caller = AudioCaller()
        disconnected = asyncio.Event()

        @caller.room.on("disconnected")
        def on_disconnected(reason):
            report["disconnect_reason_code"] = int(reason)
            report["disconnect_reason"] = rtc.DisconnectReason.Name(reason)
            report["disconnect_at"] = time.monotonic()
            disconnected.set()

        @caller.room.on("participant_attributes_changed")
        def on_attributes(changed, participant):
            if participant.attributes.get("clinic.call_ending") == "true":
                report["graceful_ending_announced"] = True

        try:
            await caller.connect(room)
            await caller.wait_reply(0)
            previous = caller.assistant_count()
            before_audio = sum(len(chunk) for chunk in caller.audio)
            await caller.send(path)
            await asyncio.wait_for(disconnected.wait(), timeout=45)
            report["automatic_disconnect"] = True
            report["assistant_turns_after_goodbye"] = caller.assistant_count() - previous
            report["received_audio_after_goodbye_s"] = (sum(len(chunk) for chunk in caller.audio) - before_audio) / 48000
            if not report.get("graceful_ending_announced"):
                raise AssertionError("Caller did not receive the graceful-ending signal")
            if report["disconnect_reason"] != "ROOM_DELETED":
                raise AssertionError("The room did not close through the intended hang-up flow")
            if report["assistant_turns_after_goodbye"] < 1 or report["received_audio_after_goodbye_s"] < 1:
                raise AssertionError("No delivered spoken farewell before disconnect")
            report["passed"] = True
        finally:
            report["client_transcripts"] = caller.turns
            await caller.close()
            for _ in range(20):
                response = await client.get(f"/api/calls/{call_id}")
                response.raise_for_status()
                report["stored_call"] = response.json()
                if report["stored_call"]["status"] not in ("connecting", "live"):
                    break
                await asyncio.sleep(1)
            if report["passed"] and (not report["stored_call"].get("ended_at") or report["stored_call"]["status"] == "failed"):
                report.update(passed=False, failure="Call did not finalize normally")
            (ROOT / ".local" / "audio-goodbye-e2e.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
            with wave.open(str(ROOT / ".local" / "audio-goodbye-agent.wav"), "wb") as audio:
                audio.setnchannels(1)
                audio.setsampwidth(2)
                audio.setframerate(24000)
                audio.writeframes(b"".join(caller.audio))
        if not report["passed"]:
            raise AssertionError(report.get("failure", "Goodbye test failed"))
    print("Spoken farewell and automatic caller disconnect verified.", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
