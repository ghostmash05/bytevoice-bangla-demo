"""Check dedicated caller captions through actual audio, RTC and hosted storage."""
import asyncio
import json
import os
from uuid import uuid4

import httpx

from agent.config import ROOT
from scripts.audio_e2e import AudioCaller
from scripts.realtime_smoke import generate_sample


async def main():
    mixed = ROOT / ".local" / "test-captions-mixed.wav"
    if not mixed.exists():
        await generate_sample("আমি শুধু জানতে চাই, scaling সার্ভিসের ফি কত? এখন কোনো booking করব না।", mixed, voice="Puck")
    correction = ROOT / ".local" / "test-callback-2.wav"
    if not correction.exists():
        raise RuntimeError("Run audio_callback_e2e once to prepare the fictional corrected-phone clip")
    report = {"mode": "synthetic_audio_webrtc", "passed": False, "human_microphone_tested": False}
    private = {"Authorization": "Bearer " + os.environ["AGENT_API_SECRET"]}
    password = (ROOT / ".local" / "reviewer-credentials.txt").read_text().split("Password: ", 1)[1].splitlines()[0]
    async with httpx.AsyncClient(base_url=os.environ["BACKEND_URL"], timeout=20) as client:
        login = await client.post("/api/auth/login", json={"username": "reviewer", "password": password})
        login.raise_for_status()
        room = "audio-test-captions-" + uuid4().hex
        start = await client.post("/internal/calls/start", headers=private, json={"room_name": room})
        start.raise_for_status()
        report["call_id"] = call_id = start.json()["call_id"]
        caller = AudioCaller()
        try:
            await caller.connect(room)
            await caller.wait_reply(0)
            for index, path in enumerate((mixed, correction)):
                print(f"Sending dedicated-caption audio turn {index + 1}...", flush=True)
                previous = caller.assistant_count()
                await caller.send(path)
                await caller.wait_reply(previous)
            await asyncio.sleep(3)
            detail = await client.get(f"/api/calls/{call_id}")
            detail.raise_for_status()
            stored = detail.json()
            user_turns = [turn for turn in stored["transcript"] if turn["speaker"] == "user"]
            received = [turn for turn in caller.turns if turn["speaker"] == "user"]
            assert len(user_turns) >= 2, "Dedicated STT did not persist both spoken inputs"
            assert all(turn["id"].split(":")[-1].startswith("stt-") for turn in user_turns), "Native caller transcript leaked into storage"
            assert {turn["text"] for turn in user_turns} == {turn["text"] for turn in received}, "Displayed caller captions differ from saved caller text"
            assert all(any("\u0980" <= c <= "\u09ff" for c in turn["text"]) for turn in user_turns)
            assert not any("\u0900" <= c <= "\u0963" or "\u0966" <= c <= "\u097f" for turn in user_turns for c in turn["text"]), "Devanagari letters leaked into caller captions"
            assert not stored["actions"] and not stored["follow_ups"], "Unconfirmed input created a business action"
            report["passed"] = True
        finally:
            report["client_transcripts"] = caller.turns
            report["response_latency_s"] = caller.response_latencies
            await caller.close()
            for _ in range(20):
                detail = await client.get(f"/api/calls/{call_id}")
                detail.raise_for_status()
                report["stored_call"] = detail.json()
                if report["stored_call"].get("ended_at"):
                    break
                await asyncio.sleep(1)
            (ROOT / ".local" / "audio-captions-e2e.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        assert report["passed"]
    print("Dedicated Bengali caller captions match hosted storage; no premature action.", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
