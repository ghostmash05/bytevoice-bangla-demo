"""Isolated audio-path booking failure: local API/worker, cloud RTC/inference.

The fault middleware exists only in this test process. No hosted clinic database
or production API is used. The local worker has a unique dispatch name.
"""
import asyncio
import json
import os
import socket
import subprocess
import sys
from datetime import datetime, timedelta
from uuid import uuid4

import uvicorn
from fastapi.responses import JSONResponse

from agent.config import ROOT
from backend.app import create_app
from backend.service import DHaka
from scripts.audio_e2e import AudioCaller
from scripts.realtime_smoke import generate_sample


async def main():
    day = (datetime.now(DHaka) + timedelta(days=1)).date()
    if day.weekday() == 4:
        day += timedelta(days=1)
    months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"]
    request_audio = ROOT / ".local" / f"test-failure-request-{day.isoformat()}.wav"
    confirmation_audio = ROOT / ".local" / "test-patient-confirm.wav"
    if not request_audio.exists():
        await generate_sample(f"আমি স্কেলিংয়ের অ্যাপয়েন্টমেন্ট নিতে চাই। আমার নাম ডেমো রোগী। নম্বর শূন্য এক আট চার পাঁচ ছয় সাত আট নয় শূন্য এক। ডা. নাদিয়া রহমানের কাছে {day.day} {months[day.month-1]} {day.year} তারিখ সকাল দশটায় চাই। আগে সব বিবরণ পড়ে শোনান, তারপর আমি নিশ্চিত করব।", request_audio, voice="Puck")
    if not confirmation_audio.exists():
        await generate_sample("জি, আপনি যে নাম, নম্বর আর তারিখ-সময় পড়ে শোনালেন সব ঠিক আছে। আমি নিশ্চিত করছি। এখন বুকিংটা করে দিন।", confirmation_audio, voice="Puck")
    run_id = uuid4().hex
    database = ROOT / ".local" / f"failure-{run_id}.db"
    app = create_app(database_url="sqlite:///" + database.as_posix(), settings={
        **os.environ, "APP_ENV": "development", "COOKIE_SECURE": "false"})
    faults = []

    @app.middleware("http")
    async def fail_booking(request, call_next):
        if request.method == "POST" and request.url.path.endswith("/book"):
            faults.append(request.url.path)
            return JSONResponse({"message": "Injected test-only unavailable booking store"}, status_code=503)
        return await call_next(request)

    with socket.socket() as port_probe:
        port_probe.bind(("127.0.0.1", 0))
        port = port_probe.getsockname()[1]
    server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=port, access_log=False, log_level="warning"))
    api_task = asyncio.create_task(server.serve())
    worker = None
    caller = AudioCaller()
    report = {"mode": "synthetic_audio_local_fault_isolation", "passed": False,
              "speech_review": "pending", "production_database_used": False}
    old_dispatch = os.environ.get("LIVEKIT_AGENT_NAME")
    dispatch = "bangla-fault-" + run_id[:8]
    worker_log = ROOT / ".local" / f"failure-worker-{run_id}.log"
    call_id = None
    with worker_log.open("w", encoding="utf-8") as log:
        try:
            for _ in range(100):
                if server.started:
                    break
                await asyncio.sleep(.1)
            if not server.started:
                raise RuntimeError("Isolated API did not start")
            env = {**os.environ, "APP_ENV": "development", "BACKEND_URL": f"http://127.0.0.1:{port}",
                   "LIVEKIT_AGENT_NAME": dispatch, "PYTHONIOENCODING": "utf-8"}
            worker = subprocess.Popen([sys.executable, "-m", "agent.main", "start", "--drain-timeout", "5"],
                                      cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT)
            for _ in range(120):
                if worker.poll() is not None:
                    raise RuntimeError("Isolated worker exited; inspect its ignored log")
                if "registered worker" in worker_log.read_text(encoding="utf-8", errors="replace"):
                    break
                await asyncio.sleep(.5)
            else:
                raise TimeoutError("Isolated worker did not register")
            os.environ["LIVEKIT_AGENT_NAME"] = dispatch
            room = "audio-test-failure-" + run_id
            call_id = app.state.service.start_call(room)
            report["call_id"] = call_id
            await caller.connect(room)
            await caller.wait_reply(0)
            for index, path in enumerate((request_audio, confirmation_audio)):
                previous = caller.assistant_count()
                print("Sending booking audio into the isolated failure scenario...", flush=True)
                await caller.send(path)
                await caller.wait_reply(previous)
                if index == 0:
                    assert not faults, "Agent attempted a booking write before explicit confirmation"
            detail = app.state.service.call_detail(call_id)
            assert len(faults) >= 3, "Did not exercise the real tool retry/failure path"
            assert not detail["actions"] and not detail["follow_ups"], "Failed write caused a business action"
            assert detail["outcome"] != "booked", "Failed write marked call booked"
            report.update(passed=True, failed_book_requests=len(faults))
        finally:
            report["client_transcripts"] = caller.turns
            await caller.close()
            if call_id:
                for _ in range(20):
                    report["stored_call"] = app.state.service.call_detail(call_id)
                    if report["stored_call"].get("ended_at"):
                        break
                    await asyncio.sleep(.5)
            if worker and worker.poll() is None:
                if os.name == "nt":
                    subprocess.run(["taskkill", "/PID", str(worker.pid), "/T", "/F"], capture_output=True)
                else:
                    worker.terminate()
                await asyncio.to_thread(worker.wait, timeout=15)
            server.should_exit = True
            await api_task
            if old_dispatch is None:
                os.environ.pop("LIVEKIT_AGENT_NAME", None)
            else:
                os.environ["LIVEKIT_AGENT_NAME"] = old_dispatch
            (ROOT / ".local" / "audio-failure-e2e.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    assert report["passed"]
    print("Real audio reached failed booking retries; no appointment saved. Review the spoken reply separately.", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
