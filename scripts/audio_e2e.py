"""Real WebRTC/native-speech booking test with generated fake-patient audio.

Uses the running local backend and worker, existing LiveKit credits, and fictional
details. This tests the actual audio path, not a human microphone or accent quality.
"""
import asyncio
from array import array
import json
import os
import time
import wave
from datetime import datetime, timedelta
from uuid import uuid4

import httpx
from livekit import api, rtc

from agent.config import ROOT
from backend.service import DHaka
from scripts.realtime_smoke import generate_sample


class AudioCaller:
    def __init__(self):
        self.room = rtc.Room()
        self.tasks = []
        self.turns = []
        self.changed = asyncio.Event()
        self.audio = []
        self.last_agent_speech = 0.0
        self.source = rtc.AudioSource(24000, 1)

        @self.room.on("track_subscribed")
        def track_subscribed(track, publication, participant):
            if track.kind == rtc.TrackKind.KIND_AUDIO:
                async def record():
                    stream = rtc.AudioStream(track, sample_rate=24000, num_channels=1)
                    try:
                        async for event in stream:
                            self.audio.append(bytes(event.frame.data))
                            if max((abs(value) for value in array('h', bytes(event.frame.data))), default=0) > 300:
                                self.last_agent_speech = time.monotonic()
                    finally:
                        await stream.aclose()
                self.tasks.append(asyncio.create_task(record()))

        def transcription(reader, identity):
            async def receive():
                try:
                    message = await reader.read_all()
                    attrs = reader.info.attributes
                    if attrs.get("lk.transcription_final") == "false":
                        return
                    self.turns.append({"speaker": "user" if identity == self.room.local_participant.identity else "assistant", "text": message, "received_at": time.time(), "attributes": dict(attrs)})
                    self.changed.set()
                except Exception:
                    self.turns.append({"speaker": "system", "text": "transcription stream interrupted"})
            self.tasks.append(asyncio.create_task(receive()))
        self.room.register_text_stream_handler("lk.transcription", transcription)

    def assistant_count(self):
        return sum(t["speaker"] == "assistant" for t in self.turns)

    async def wait_reply(self, previous, timeout=60):
        deadline = time.monotonic() + timeout
        while self.assistant_count() <= previous:
            self.changed.clear()
            await asyncio.wait_for(self.changed.wait(), max(0.1, deadline - time.monotonic()))
            if time.monotonic() > deadline:
                raise TimeoutError("No finalized agent reply was received")
        # Transcription text can finish before voice playout. Sending the next
        # utterance then would accidentally interrupt every long response.
        text_received = time.monotonic()
        while True:
            states = [p.attributes.get('lk.agent.state') for p in self.room.remote_participants.values()]
            now = time.monotonic()
            if 'listening' in states and now - text_received >= 1 and now - self.last_agent_speech >= 0.7:
                return
            if now >= deadline:
                raise TimeoutError('Agent did not finish voice playout before the next turn')
            await asyncio.sleep(0.1)

    async def connect(self, room_name):
        token = api.AccessToken(os.environ["LIVEKIT_API_KEY"], os.environ["LIVEKIT_API_SECRET"]).with_identity("audio-test-" + uuid4().hex).with_ttl(timedelta(minutes=5))
        token.with_grants(api.VideoGrants(room_join=True, room=room_name, can_publish=True, can_subscribe=True,
            can_publish_data=False, can_publish_sources=["microphone"]))
        token.with_room_config(api.RoomConfiguration(agents=[api.RoomAgentDispatch(agent_name=os.getenv("LIVEKIT_AGENT_NAME", "bangla-receptionist"))], empty_timeout=60, max_participants=2))
        await self.room.connect(os.environ["LIVEKIT_URL"], token.to_jwt())
        track = rtc.LocalAudioTrack.create_audio_track("synthetic-patient-microphone", self.source)
        await self.room.local_participant.publish_track(track, rtc.TrackPublishOptions(source=rtc.TrackSource.SOURCE_MICROPHONE))

    async def send(self, path):
        with wave.open(str(path), "rb") as audio:
            if (audio.getframerate(), audio.getnchannels(), audio.getsampwidth()) != (24000, 1, 2):
                raise RuntimeError("Expected 24 kHz mono PCM16 test audio")
            while chunk := audio.readframes(480):
                await self.source.capture_frame(rtc.AudioFrame(data=chunk, sample_rate=24000, num_channels=1, samples_per_channel=len(chunk)//2))
        # Real silence lets server VAD finish the utterance naturally.
        for _ in range(60):
            await self.source.capture_frame(rtc.AudioFrame(data=bytes(960), sample_rate=24000, num_channels=1, samples_per_channel=480))
        await self.source.wait_for_playout()

    async def close(self):
        await self.room.disconnect()
        for task in self.tasks:
            if not task.done():
                task.cancel()
        await asyncio.gather(*self.tasks, return_exceptions=True)
        await self.source.aclose()


async def main():
    report = {"mode": "synthetic_audio_webrtc", "human_microphone_tested": False, "accent_review": "pending", "passed": False}
    backend = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")
    private = {"Authorization": "Bearer " + os.environ["AGENT_API_SECRET"]}
    patient_audio, confirm_audio = ROOT/".local"/"test-patient-request.wav", ROOT/".local"/"test-patient-confirm.wav"
    day = (datetime.now(DHaka)+timedelta(days=1)).date()
    if day.weekday() == 4:
        day += timedelta(days=1)
    async with httpx.AsyncClient(base_url=backend, timeout=20) as client:
        availability = (await client.get("/internal/availability", params={"day": day.isoformat(), "doctor_id": "dr-nadia", "service_id": "scaling"}, headers=private)).json()
        slot = availability["slots"][0]
        target = datetime.fromisoformat(slot)
        months = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"]
        bangla = lambda value: str(value).translate(str.maketrans("0123456789", "০১২৩৪৫৬৭৮৯"))
        when = f"{bangla(day.day)} {months[day.month-1]} {bangla(day.year)} তারিখ সকাল {bangla(target.hour)}টায়"
        if target.minute:
            when = f"{bangla(day.day)} {months[day.month-1]} তারিখ সকাল {bangla(target.hour)}টা {bangla(target.minute)} মিনিটে"
        print("Generating fake patient audio for the real voice path...", flush=True)
        await generate_sample(f"আমি স্কেলিংয়ের অ্যাপয়েন্টমেন্ট নিতে চাই। আমার নাম ডেমো রোগী। নম্বর শূন্য এক আট চার পাঁচ ছয় সাত আট নয় শূন্য এক। ডা. নাদিয়া রহমানের কাছে {when} চাই। আগে সব বিবরণ পড়ে শোনান, তারপর আমি নিশ্চিত করব।", patient_audio, voice="Puck")
        if not confirm_audio.exists():
            await generate_sample("জি, আপনি যে নাম, নম্বর আর তারিখ-সময় পড়ে শোনালেন সব ঠিক আছে। আমি নিশ্চিত করছি। এখন বুকিংটা করে দিন।", confirm_audio, voice="Puck")
        credentials = (ROOT/".local"/"reviewer-credentials.txt").read_text().split("Password: ",1)[1].splitlines()[0]
        response = await client.post("/api/auth/login", json={"username":"reviewer", "password":credentials})
        response.raise_for_status()
        room_name = "audio-test-" + uuid4().hex
        started = await client.post("/internal/calls/start", json={"room_name":room_name}, headers=private)
        started.raise_for_status()
        call_id = started.json()["call_id"]
        report.update(call_id=call_id, requested_slot=slot)
        caller = AudioCaller()
        try:
            print("Connecting synthetic caller to the registered LiveKit worker...", flush=True)
            await caller.connect(room_name)
            await caller.wait_reply(0)
            print("Agent greeting received; sending spoken booking request...", flush=True)
            previous = caller.assistant_count()
            await caller.send(patient_audio)
            await caller.wait_reply(previous)
            detail = (await client.get(f"/api/calls/{call_id}")).json()
            if detail["outcome"] == "booked":
                raise AssertionError("Agent booked before the confirmation audio")
            for attempt in range(2):
                print(f"Sending explicit spoken confirmation {attempt+1}...", flush=True)
                previous = caller.assistant_count()
                await caller.send(confirm_audio)
                await caller.wait_reply(previous)
                detail = (await client.get(f"/api/calls/{call_id}")).json()
                if detail["outcome"] == "booked":
                    break
            if detail["outcome"] != "booked":
                raise AssertionError("Spoken confirmations did not produce a saved booking")
            result = detail["actions"][-1]["result"]
            if result["phone"] != "+8801845678901" or result["doctor_id"] != "dr-nadia" or result["service_id"] != "scaling" or result["slot"] != slot:
                raise AssertionError("Saved booking does not match the spoken test request")
            report["booking"] = result
            report["passed"] = True
        finally:
            report["client_transcripts"] = caller.turns
            await caller.close()
            for _ in range(20):
                report["stored_call"] = (await client.get(f"/api/calls/{call_id}")).json()
                if report["stored_call"].get("status") not in ("connecting", "live"):
                    break
                await asyncio.sleep(1)
            report["stored_user_turns"] = sum(t["speaker"]=="user" for t in report["stored_call"].get("transcript",[]))
            if report["passed"] and not report["stored_user_turns"]:
                report["passed"] = False
                report["failure"] = "No caller transcription persisted"
            if report["passed"] and report["stored_call"].get("status") != "completed":
                report["passed"] = False
                report["failure"] = "Call did not finalize as completed"
            (ROOT/".local"/"audio-e2e-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
            with wave.open(str(ROOT/".local"/"audio-e2e-agent.wav"), "wb") as audio:
                audio.setnchannels(1); audio.setsampwidth(2); audio.setframerate(24000); audio.writeframes(b"".join(caller.audio))
        if not report["passed"]:
            raise AssertionError(report.get("failure", "Audio test failed"))
    print("Synthetic spoken booking passed. Real microphone, accent review and hosted independence remain unverified.", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
