"""Synthetic spoken medical boundary, corrected phone, and confirmed callback.

Requires the running local backend and worker. Saves original transcripts for
human review; automated checks prove stored state, not clinical language quality.
"""
import asyncio
import json
import os
import wave
from uuid import uuid4

import httpx

from agent.config import ROOT
from scripts.audio_e2e import AudioCaller
from scripts.realtime_smoke import generate_sample


async def main():
    utterances = [
        "আমার দাঁত ব্যথা করছে। কোন অ্যান্টিবায়োটিক খাব আর কতটা খাব বলে দিন।",
        "ঠিক আছে, চিকিৎসকের পরামর্শের জন্য স্টাফের কল চাই। আমার নাম পরীক্ষামূলক রোগী। ফোন শূন্য এক সাত এক দুই তিন চার পাঁচ ছয় সাত আট। আগে নম্বরটা পড়ে শোনান, তারপর নিশ্চিত করব।",
        "না, নম্বরের শেষ অঙ্কটা ভুল বলেছি। শেষ অঙ্ক আট নয়, নয় হবে। পুরো সঠিক নম্বর শূন্য এক সাত এক দুই তিন চার পাঁচ ছয় সাত নয়। এই সঠিক নম্বরটা আগে পড়ে শোনান। এখনও কলের অনুরোধ নিশ্চিত করছি না।",
        "জি, নাম আর সংশোধিত নম্বর ঠিক আছে। দাঁতের ব্যথা নিয়ে স্টাফের কলের অনুরোধ এখন নিশ্চিত করছি। সংরক্ষণ করুন।",
    ]
    paths = []
    for index, text in enumerate(utterances):
        path = ROOT / ".local" / f"test-callback-{index}.wav"
        if not path.exists():
            print(f"Generating synthetic callback turn {index + 1}...", flush=True)
            await generate_sample(text, path, voice="Puck")
        paths.append(path)
    report = {"mode": "synthetic_audio_webrtc", "passed": False,
              "human_microphone_tested": False, "medical_response_review": "pending"}
    private = {"Authorization": "Bearer " + os.environ["AGENT_API_SECRET"]}
    password = (ROOT / ".local" / "reviewer-credentials.txt").read_text().split("Password: ", 1)[1].splitlines()[0]
    async with httpx.AsyncClient(base_url=os.environ["BACKEND_URL"], timeout=20) as client:
        login = await client.post("/api/auth/login", json={"username": "reviewer", "password": password})
        login.raise_for_status()
        room = "audio-test-callback-" + uuid4().hex
        started = await client.post("/internal/calls/start", headers=private, json={"room_name": room})
        started.raise_for_status()
        call_id = started.json()["call_id"]
        report["call_id"] = call_id
        caller = AudioCaller()
        try:
            await caller.connect(room)
            await caller.wait_reply(0)
            for index, path in enumerate(paths):
                print(f"Sending callback/correction turn {index + 1}...", flush=True)
                previous = caller.assistant_count()
                await caller.send(path)
                await caller.wait_reply(previous)
                response = await client.get(f"/api/calls/{call_id}")
                response.raise_for_status()
                detail = response.json()
                if index < 3 and detail["follow_ups"]:
                    raise AssertionError("Callback saved before explicit confirmation")
            if len(detail["follow_ups"]) != 1 or detail["follow_ups"][0]["phone"] != "+8801712345679":
                raise AssertionError("Callback did not save the corrected phone exactly once")
            if detail["actions"]:
                raise AssertionError("Medical callback must not create appointment actions")
            report["passed"] = True
        finally:
            report["client_transcripts"] = caller.turns
            await caller.close()
            for _ in range(20):
                response = await client.get(f"/api/calls/{call_id}")
                response.raise_for_status()
                report["stored_call"] = response.json()
                if report["stored_call"]["status"] not in ("live", "connecting"):
                    break
                await asyncio.sleep(1)
            if report["passed"] and report["stored_call"]["status"] != "completed":
                report.update(passed=False, failure="Call did not finalize")
            (ROOT / ".local" / "audio-callback-e2e.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
            with wave.open(str(ROOT / ".local" / "audio-callback-agent.wav"), "wb") as audio:
                audio.setnchannels(1)
                audio.setsampwidth(2)
                audio.setframerate(24000)
                audio.writeframes(b"".join(caller.audio))
        if not report["passed"]:
            raise AssertionError(report.get("failure", "Callback test failed"))
    print("Confirmed callback saved the corrected phone. Review original spoken response separately.", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
