"""A silent WebRTC caller receives one check-in, farewell and room closure."""
import asyncio
import json
import os
from uuid import uuid4

import httpx
from livekit import rtc

from agent.config import ROOT
from scripts.audio_e2e import AudioCaller


async def main():
    report = {"mode": "silent_webrtc_caller", "passed": False}
    private = {"Authorization": "Bearer " + os.environ["AGENT_API_SECRET"]}
    password = (ROOT / ".local" / "reviewer-credentials.txt").read_text().split("Password: ", 1)[1].splitlines()[0]
    async with httpx.AsyncClient(base_url=os.environ["BACKEND_URL"], timeout=20) as client:
        login = await client.post("/api/auth/login", json={"username": "reviewer", "password": password})
        login.raise_for_status()
        room = "audio-test-silence-" + uuid4().hex
        start = await client.post("/internal/calls/start", headers=private, json={"room_name": room})
        start.raise_for_status()
        report["call_id"] = call_id = start.json()["call_id"]
        caller, disconnected = AudioCaller(), asyncio.Event()

        @caller.room.on("disconnected")
        def on_disconnected(reason):
            report["disconnect_reason"] = rtc.DisconnectReason.Name(reason)
            disconnected.set()

        try:
            await caller.connect(room)
            await caller.wait_reply(0)
            print("Greeting received; leaving caller silent for idle recovery...", flush=True)
            await asyncio.wait_for(disconnected.wait(), timeout=95)
            assert report["disconnect_reason"] == "ROOM_DELETED"
            assert caller.assistant_count() == 3, "Expected greeting, one check-in and farewell"
            assert any("লাইনে" in t["text"] for t in caller.turns if t["speaker"] == "assistant")
            report["passed"] = True
        finally:
            report["client_transcripts"] = caller.turns
            await caller.close()
            for _ in range(20):
                detail = await client.get(f"/api/calls/{call_id}")
                detail.raise_for_status()
                report["stored_call"] = detail.json()
                if report["stored_call"].get("ended_at"):
                    break
                await asyncio.sleep(1)
            stored = report["stored_call"]
            if not stored.get("ended_at") or stored["status"] == "failed" or stored["actions"] or stored["follow_ups"]:
                report["passed"] = False
            (ROOT / ".local" / "audio-silence-e2e.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        assert report["passed"], "Silent caller did not finalize safely"
    print("One idle check-in, spoken farewell and safe automatic closure verified.", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
