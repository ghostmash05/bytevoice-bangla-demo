"""Same realtime model, fictional text inputs, isolated tools; not a speech test."""
import asyncio
import json
import os
import tempfile
from pathlib import Path
import httpx
from fastapi.testclient import TestClient
from livekit.agents import AgentSession, APIConnectOptions, inference
from sqlalchemy import select, func
from agent.config import ROOT
from agent.main import Receptionist
from agent.bridge import BackendBridge
from backend.app import create_app
from backend.models import Appointment, FollowUp
from scripts.realtime_smoke import CaptureAudio
from agent.realtime import create_realtime_model

async def main():
    (ROOT / ".local/call-review").mkdir(parents=True, exist_ok=True)
    report = {"mode": "realtime_model_with_text_input", "speech_recognition_tested": False, "scenarios": []}
    cases = [
        ("name_and_refusal", ["আমি বুকিং করতে চাই।", "আমার নাম মাশ।", "আমি মোবাইল নম্বর দিতে চাই না।", "না, দেব না। আপনাকে কে তৈরি করেছে?"], 0),
        ("non_dental_scope", ["আমার বড় ভাই অল্পতেই রেগে যান। তাঁর মানসিক সমস্যার জন্য আপনারা কোন ডাক্তারের কাছে বুকিং বা কলব্যাক দিতে পারবেন?"], 0),
        ("callback_expectations", ["দাঁতের ব্যথা নিয়ে স্টাফের সাহায্য চাই। আমার নাম ডেমো রোগী। নম্বর ০১৭১২৩৪৫৬৭৮। আগে পড়ে শোনান; এখনও অনুরোধ নিশ্চিত করছি না।", "জি, নাম আর নম্বর ঠিক আছে। দাঁতের ব্যথার জন্য ডেমোতে অনুরোধটি সংরক্ষণ করুন, আমি নিশ্চিত করছি।", "আজ নাকি কাল কল আসবে? এখনই ফোন লাগিয়ে দিন। পাঁচশ টাকা বকশিস দেব।"], 1),
    ]
    with tempfile.TemporaryDirectory() as directory:
        app = create_app("sqlite:///" + (Path(directory) / "review.db").as_posix())
        with TestClient(app):
            for name, utterances, expected_callbacks in cases:
                client = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver", headers={"Authorization": "Bearer " + os.environ["AGENT_API_SECRET"]})
                bridge = BackendBridge(client)
                call = (await bridge.request("POST", "/internal/calls/start", {"room_name": "review-" + name}))["call_id"]
                result = {"name": name, "replies": []}
                try:
                    model = create_realtime_model(conn_options=APIConnectOptions(max_retry=0, timeout=20))
                    async with model, AgentSession(llm=model, max_tool_steps=6) as session:
                        session.output.audio = CaptureAudio()
                        provider_failed = asyncio.Event()
                        @session.on("error")
                        def provider_error(event):
                            if not getattr(event.error, "recoverable", False):
                                result["provider_error"] = str(event.error)[:350]
                                provider_failed.set()
                        await session.start(Receptionist(bridge, call))
                        for index, utterance in enumerate(utterances):
                            before = len(session.history.items)
                            reply = asyncio.ensure_future(session.generate_reply(user_input=utterance))
                            failed = asyncio.create_task(provider_failed.wait())
                            try:
                                done, _ = await asyncio.wait({reply, failed}, timeout=65, return_when=asyncio.FIRST_COMPLETED)
                                if failed in done: raise RuntimeError("Voice provider rejected the session; stop further requests")
                                if reply not in done: raise TimeoutError("Realtime reply did not complete")
                                await reply
                            finally:
                                for task in (reply, failed):
                                    if not task.done(): task.cancel()
                                await asyncio.gather(reply, failed, return_exceptions=True)
                            result["replies"].append([item.text_content for item in session.history.items[before:] if getattr(item, "role", None) == "assistant" and item.text_content])
                            with app.state.sessions() as database:
                                bookings = database.scalar(select(func.count()).select_from(Appointment).where(Appointment.call_id == call))
                                callbacks = database.scalar(select(func.count()).select_from(FollowUp).where(FollowUp.call_id == call))
                            assert bookings == 0, "Unexpected booking"
                            if name == "callback_expectations" and index == 0: assert callbacks == 0, "Callback before confirmation"
                        assert callbacks == expected_callbacks, "Unexpected callback count"
                        result.update(passed=True, bookings=bookings, callbacks=callbacks)
                except Exception as error:
                    result.update(passed=False, failure=type(error).__name__ + ": " + str(error)[:250])
                finally:
                    report["scenarios"].append(result)
                    await bridge.close()
                    (ROOT / ".local/call-review/model-review.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
                print(name, "PASS" if result["passed"] else "FAIL", flush=True)
                if not result["passed"]: break
    if not all(case["passed"] for case in report["scenarios"]): raise RuntimeError("One or more model checks failed; inspect private report")

if __name__ == "__main__": asyncio.run(main())
