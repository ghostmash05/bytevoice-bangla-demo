"""Field-by-field native voice booking with a late name correction and confirmation.

Reproduces the shape of the reported human-call stall with fictional data. It
never replays the real caller's contact details or creates a booking for them.
"""
import asyncio
import json
import os
import wave
from datetime import datetime, timedelta
from hashlib import sha256
from uuid import uuid4

import httpx

from agent.config import ROOT
from backend.service import DHaka
from scripts.audio_e2e import AudioCaller
from scripts.realtime_smoke import generate_sample


async def main():
    day = (datetime.now(DHaka) + timedelta(days=1)).date()
    if day.weekday() == 4:
        day += timedelta(days=1)
    utterances = [
        "দাঁতে ব্যথা করছে। কনসাল্টেশনের জন্য একটা অ্যাপয়েন্টমেন্ট নিতে চাই।",
        "আমার নাম ডেমো রোগী।",
        "জি, নাম ঠিক আছে। মোবাইল নম্বর শূন্য এক আট চার পাঁচ ছয় সাত আট নয় শূন্য এক।",
        "জি, নম্বর ঠিক আছে। ডা. নাদিয়া রহমানের কাছে দেখাতে চাই।",
        f"{day.isoformat()} তারিখে বিকালের কোন সময়গুলো খালি আছে?",
        "বিকাল সাড়ে চারটায় চাই। সব বিবরণ আগে পড়ে শোনান, তারপর আমি নিশ্চিত করব।",
        "আমার নাম ভুল বলা হয়েছে। সঠিক নাম ডেমো রাফি। অন্য সব বিবরণ ঠিক আছে। নামটা সংশোধন করে আবার পড়ে শোনান। এখনও বুকিং নিশ্চিত করছি না।",
        "জি জি, এখন সব ঠিক আছে। আমি নিশ্চিত করছি। কনফার্ম করুন।",
    ]
    paths = []
    for index, text in enumerate(utterances):
        path = ROOT / ".local" / f"test-booking-correction-{sha256(text.encode()).hexdigest()[:12]}.wav"
        if not path.exists():
            print(f"Generating field-by-field test turn {index + 1}...", flush=True)
            await generate_sample(text, path, voice="Puck")
        paths.append(path)
    report = {"mode": "synthetic_audio_webrtc", "human_microphone_tested": False, "passed": False,
              "backend_origin": os.environ["BACKEND_URL"], "expected_slot": f"{day.isoformat()}T16:30:00+06:00"}
    private = {"Authorization": "Bearer " + os.environ["AGENT_API_SECRET"]}
    password = (ROOT / ".local" / "reviewer-credentials.txt").read_text().split("Password: ", 1)[1].splitlines()[0]
    async with httpx.AsyncClient(base_url=os.environ["BACKEND_URL"], timeout=20) as client:
        logged_in = await client.post("/api/auth/login", json={"username": "reviewer", "password": password})
        logged_in.raise_for_status()
        available = await client.get("/internal/availability", headers=private, params={"day": day.isoformat(), "doctor_id": "dr-nadia", "service_id": "consultation"})
        available.raise_for_status()
        if report["expected_slot"] not in available.json()["slots"]:
            raise RuntimeError("The fixed afternoon test slot is occupied; choose another fake slot explicitly")
        room_name = "audio-test-name-correction-" + uuid4().hex
        started = await client.post("/internal/calls/start", headers=private, json={"room_name": room_name})
        started.raise_for_status()
        call_id = started.json()["call_id"]
        report["call_id"] = call_id
        caller = AudioCaller()
        try:
            await caller.connect(room_name)
            await caller.wait_reply(0)
            for index, path in enumerate(paths):
                print(f"Sending field-by-field turn {index + 1}...", flush=True)
                previous = caller.assistant_count()
                await caller.send(path)
                await caller.wait_reply(previous, timeout=65)
                response = await client.get(f"/api/calls/{call_id}")
                response.raise_for_status()
                detail = response.json()
                if index < len(paths) - 1 and detail["actions"]:
                    raise AssertionError("Appointment saved before the corrected readback was confirmed")
            if detail["outcome"] != "booked" or len(detail["actions"]) != 1:
                raise AssertionError("No single saved booking after final confirmation")
            saved = detail["actions"][0]["result"]
            if saved["phone"] != "+8801845678901" or saved["slot"] != report["expected_slot"] or saved["service_id"] != "consultation" or "রাফি" not in saved["patient_name"]:
                raise AssertionError("Saved details did not retain the spoken name correction and slot")
            report.update(passed=True, booking=saved)
        finally:
            report["client_transcripts"] = caller.turns
            report["response_latency_s"] = caller.response_latencies
            await caller.close()
            for _ in range(20):
                response = await client.get(f"/api/calls/{call_id}")
                response.raise_for_status()
                report["stored_call"] = response.json()
                if report["stored_call"]["status"] not in ("connecting", "live"):
                    break
                await asyncio.sleep(1)
            if report["passed"] and report["stored_call"]["status"] != "completed":
                report.update(passed=False, failure="Call did not complete")
            (ROOT / ".local" / "audio-booking-correction-e2e.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
            with wave.open(str(ROOT / ".local" / "audio-booking-correction-agent.wav"), "wb") as audio:
                audio.setnchannels(1)
                audio.setsampwidth(2)
                audio.setframerate(24000)
                audio.writeframes(b"".join(caller.audio))
        if not report["passed"]:
            raise AssertionError(report.get("failure", "Name correction booking failed"))
    print("Field-by-field call saved exactly one booking with the corrected name after confirmation.", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
