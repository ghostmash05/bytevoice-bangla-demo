"""Exercise reschedule/cancel in NEW synthetic-audio calls, after audio_e2e."""
import argparse
import asyncio
import json
import os
import wave
from datetime import datetime
from uuid import uuid4

import httpx

from agent.config import ROOT
from scripts.audio_e2e import AudioCaller
from scripts.realtime_smoke import generate_sample

DIGITS = ["শূন্য", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়"]


async def main(action):
    original = json.loads((ROOT/".local"/"audio-e2e-report.json").read_text(encoding="utf-8"))["booking"]
    private = {"Authorization": "Bearer " + os.environ["AGENT_API_SECRET"]}
    report = {"mode": "synthetic_audio_webrtc", "action": action, "passed": False, "human_microphone_tested": False}
    async with httpx.AsyncClient(base_url=os.environ["BACKEND_URL"], timeout=20) as client:
        lookup = await client.post("/internal/lookup", headers=private, json={"reference":original["reference"], "phone":original["phone"]})
        lookup.raise_for_status()
        before = lookup.json()
        if before["status"] != "booked":
            raise RuntimeError("The test booking is no longer active. Create a new audio test booking first.")
        reference = " ".join(DIGITS[int(d)] for d in before["reference"].split("-")[-1])
        mobile = "0" + before["phone"][4:]
        spoken_mobile = " ".join(DIGITS[int(d)] for d in mobile)
        request = f"আমার অ্যাপয়েন্টমেন্টটা বাতিল করতে চাই। রেফারেন্সের আটটি অঙ্ক হলো {reference}। মোবাইল নম্বর {spoken_mobile}। আগে বিবরণ পড়ে শোনান, তারপর আমি নিশ্চিত করব।"
        confirmation = "জি, এই অ্যাপয়েন্টমেন্টটাই বাতিল করতে চাই। আমি নিশ্চিত করছি, এখন বাতিল করে দিন।"
        expected_slot = before["slot"]
        if action == "reschedule":
            day = before["slot"][:10]
            slots = (await client.get("/internal/availability", headers=private, params={"day":day,"doctor_id":before["doctor_id"],"service_id":before["service_id"]})).json()["slots"]
            expected_slot = slots[0]
            target = datetime.fromisoformat(expected_slot)
            when = f"{target.day} নভেম্বর {target.year} তারিখ সকাল {target.hour}টা {target.minute} মিনিটে"
            request = f"আমার আগের অ্যাপয়েন্টমেন্টের সময় বদলাতে চাই। রেফারেন্সের আটটি অঙ্ক হলো {reference}। মোবাইল নম্বর {spoken_mobile}। নতুন সময় {when} চাই। আগে পুরো বিবরণ পড়ে শোনান, তারপর আমি নিশ্চিত করব।"
            confirmation = "জি, নতুন তারিখ আর সময় ঠিক আছে। আমি এই পরিবর্তন নিশ্চিত করছি। এখন অ্যাপয়েন্টমেন্টের সময় বদলে দিন।"
        request_path, confirm_path = ROOT/".local"/f"test-{action}-request.wav", ROOT/".local"/f"test-{action}-confirm.wav"
        print(f"Generating synthetic {action} conversation...", flush=True)
        await generate_sample(request, request_path, voice="Puck")
        if not confirm_path.exists():
            await generate_sample(confirmation, confirm_path, voice="Puck")
        credentials = (ROOT/".local"/"reviewer-credentials.txt").read_text().split("Password: ",1)[1].splitlines()[0]
        login = await client.post("/api/auth/login", json={"username":"reviewer", "password":credentials})
        login.raise_for_status()
        room_name = "audio-test-" + action + "-" + uuid4().hex
        started = await client.post("/internal/calls/start", headers=private, json={"room_name":room_name})
        started.raise_for_status()
        call_id = started.json()["call_id"]
        report.update(call_id=call_id, reference=before["reference"], previous_version=before["version"], requested_slot=expected_slot)
        caller = AudioCaller()
        try:
            print("Connecting new call and waiting for greeting...", flush=True)
            await caller.connect(room_name)
            await caller.wait_reply(0)
            count = caller.assistant_count()
            await caller.send(request_path)
            await caller.wait_reply(count)
            current = (await client.post("/internal/lookup", headers=private, json={"reference":before["reference"], "phone":before["phone"]})).json()
            if current["version"] != before["version"]:
                raise AssertionError("Appointment changed before explicit spoken confirmation")
            for attempt in range(2):
                print(f"Sending spoken {action} confirmation {attempt+1}...", flush=True)
                count = caller.assistant_count()
                await caller.send(confirm_path)
                await caller.wait_reply(count)
                detail = (await client.get(f"/api/calls/{call_id}")).json()
                if detail["outcome"] == ("cancelled" if action == "cancel" else "rescheduled"):
                    break
            else:
                raise AssertionError("No matching saved action after spoken confirmations")
            result = detail["actions"][-1]["result"]
            if result["version"] != before["version"]+1 or result["slot"] != expected_slot:
                raise AssertionError("Appointment change did not preserve the expected version/slot")
            if action == "cancel" and result["status"] != "cancelled":
                raise AssertionError("Cancellation did not persist")
            report.update(passed=True, result=result)
        finally:
            report["client_transcripts"] = caller.turns
            await caller.close()
            for _ in range(20):
                report["stored_call"] = (await client.get(f"/api/calls/{call_id}")).json()
                if report["stored_call"].get("status") not in ("live","connecting"):
                    break
                await asyncio.sleep(1)
            transcript = report["stored_call"].get("transcript",[])
            # Bengali uses the shared danda U+0964 punctuation; do not classify
            # that punctuation as Hindi/Devanagari-language transcription.
            report["non_bengali_script_seen"] = any(any('\u0900' <= char <= '\u097f' and char.isalnum() for char in t["text"]) for t in transcript)
            if report["passed"] and (report["stored_call"].get("status") != "completed" or not any(t["speaker"] == "user" for t in transcript)):
                report.update(passed=False, failure="Call/transcript did not finalize")
            (ROOT/".local"/f"audio-{action}-e2e.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
            with wave.open(str(ROOT/".local"/f"audio-{action}-agent.wav"), "wb") as audio:
                audio.setnchannels(1); audio.setsampwidth(2); audio.setframerate(24000); audio.writeframes(b"".join(caller.audio))
        if not report["passed"]:
            raise AssertionError(report.get("failure", "Audio change failed"))
    print(f"Synthetic spoken {action} passed in a separate call.", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["reschedule", "cancel"])
    asyncio.run(main(parser.parse_args().action))
