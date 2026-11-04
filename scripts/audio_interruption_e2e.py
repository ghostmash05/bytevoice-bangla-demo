"""Interrupt a real cloud voice reply, correct a phone, then leave a partial call.

Uses existing synthetic recordings. No booking or callback may be created.
"""
import asyncio
import json
import os
import time
from uuid import uuid4

import httpx

from agent.config import ROOT
from scripts.audio_e2e import AudioCaller


async def main():
    paths = [ROOT / ".local" / f"test-callback-{i}.wav" for i in range(3)]
    if not all(p.exists() for p in paths):
        raise RuntimeError("Generate the fake recordings with audio_callback_e2e first")
    report = {"mode": "synthetic_audio_webrtc", "passed": False, "human_microphone_tested": False}
    private = {"Authorization": "Bearer " + os.environ["AGENT_API_SECRET"]}
    password = (ROOT / ".local" / "reviewer-credentials.txt").read_text().split("Password: ", 1)[1].splitlines()[0]
    async with httpx.AsyncClient(base_url=os.environ["BACKEND_URL"], timeout=20) as client:
        logged_in = await client.post("/api/auth/login", json={"username": "reviewer", "password": password})
        logged_in.raise_for_status()
        room_name = "audio-test-interruption-" + uuid4().hex
        started = await client.post("/internal/calls/start", headers=private, json={"room_name": room_name})
        started.raise_for_status()
        call_id = started.json()["call_id"]
        report.update(call_id=call_id, backend_origin=os.environ["BACKEND_URL"])
        caller = AudioCaller()
        try:
            await caller.connect(room_name)
            await caller.wait_reply(0)
            before = caller.assistant_count()
            await caller.send(paths[0])
            await caller.wait_reply(before)
            caller.agent_voice_started.clear()
            request = asyncio.create_task(caller.send(paths[1]))
            await asyncio.wait_for(caller.agent_voice_started.wait(), timeout=60)
            await request
            # This test intentionally speaks before the agent finishes. Verify
            # live voiced frames, rather than assuming a transcript means audio.
            await asyncio.sleep(0.4)
            report["agent_audio_age_at_interruption_s"] = round(time.monotonic() - caller.last_agent_speech, 3)
            if report["agent_audio_age_at_interruption_s"] > 0.25:
                raise AssertionError("Agent was not audibly speaking at the interruption point")
            before = caller.assistant_count()
            print("Interrupting an audible agent reply with the corrected phone...", flush=True)
            await caller.send(paths[2])
            await caller.wait_reply(before)
            response = await client.get(f"/api/calls/{call_id}")
            response.raise_for_status()
            detail = response.json()
            if detail["extraction"].get("phone") != "+8801712345679":
                raise AssertionError("Corrected phone was not captured after interruption")
            if detail["actions"] or detail["follow_ups"]:
                raise AssertionError("Unconfirmed interrupted call created a business action")
            report["passed"] = True
        finally:
            await caller.close()
            for _ in range(20):
                response = await client.get(f"/api/calls/{call_id}")
                response.raise_for_status()
                report["stored_call"] = response.json()
                if report["stored_call"]["status"] not in ("live", "connecting"):
                    break
                await asyncio.sleep(1)
            report["sdk_interrupted_turns"] = sum(bool(t.get("interrupted")) for t in report["stored_call"]["transcript"])
            report["response_latency_s"] = caller.response_latencies
            report["latency_definition"] = "Synthetic recording publication end to received voiced sample; approximate."
            if report["passed"] and (report["stored_call"]["status"] != "incomplete" or not report["sdk_interrupted_turns"]):
                report.update(passed=False, failure="Interruption or incomplete-call persistence not verified")
            (ROOT / ".local" / "audio-interruption-e2e.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        if not report["passed"]:
            raise AssertionError(report.get("failure", "Interruption test failed"))
    print("Audible interruption, corrected phone and persistent partial call verified.", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
