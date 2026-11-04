"""Live LLM + real tools test with isolated fake data; no microphone or speech."""
import asyncio
import json
import os
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx
from fastapi.testclient import TestClient
from livekit.agents import AgentSession, inference
from sqlalchemy import func, select

from agent.bridge import BackendBridge
from agent.config import ROOT
from agent.main import Receptionist
from backend.app import create_app
from backend.models import Appointment
from backend.service import DHaka


async def scenario():
    report = {"mode": "live_llm_text_only", "speech_tested": False, "passed": False, "turns": []}
    with tempfile.TemporaryDirectory() as directory:
        app = create_app("sqlite:///" + (Path(directory) / "test.db").as_posix())
        with TestClient(app):
            client = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver",
                headers={"Authorization": "Bearer " + os.environ["AGENT_API_SECRET"]})
            bridge = BackendBridge(client)
            day = (datetime.now(DHaka) + timedelta(days=1)).date()
            if day.weekday() == 4:
                day += timedelta(days=1)
            call_id = (await bridge.request("POST", "/internal/calls/start", {"room_name": "text-scenario"}))["call_id"]
            try:
                async with inference.LLM(model=os.getenv("LLM_MODEL", "google/gemma-4-31b-it")) as model, AgentSession(llm=model, max_tool_steps=6) as session:
                    await session.start(Receptionist(bridge, call_id))
                    first = f"আমি স্কেলিংয়ের অ্যাপয়েন্টমেন্ট নিতে চাই। নাম ডেমো রোগী। মোবাইল ০১৭১২৩৪৫৬৭৮। ডা. নাদিয়া রহমানের কাছে {day.isoformat()} তারিখ সকাল ১১টায় চাই। আগে পুরো বিবরণটা পড়ে শোনাবেন, তারপর আমি নিশ্চিত করব।"
                    await asyncio.wait_for(session.run(user_input=first), timeout=75)
                    with app.state.sessions() as database:
                        before = database.scalar(select(func.count()).select_from(Appointment))
                    report["bookings_before_confirmation"] = before
                    if before != 0:
                        raise AssertionError("The model booked before confirmation")
                    await asyncio.wait_for(session.run(user_input="জি, নাম, নম্বর, স্কেলিং আর তারিখ-সময় ঠিক আছে। বুকিংটা নিশ্চিত করুন।"), timeout=75)
                    with app.state.sessions() as database:
                        appointments = list(database.scalars(select(Appointment)))
                    # If the agent used its first reply only to confirm the name,
                    # its second reply may be the required complete readback. Give
                    # explicit confirmation AFTER that readback, never force an
                    # early write just to satisfy a fixed two-turn test.
                    if not appointments:
                        await asyncio.wait_for(session.run(user_input="জি, আপনি যে সম্পূর্ণ বিবরণ পড়ে শোনালেন তা ঠিক আছে। আমি এই বুকিং নিশ্চিত করছি, এখন সেভ করুন।"), timeout=75)
                        with app.state.sessions() as database:
                            appointments = list(database.scalars(select(Appointment)))
                    report["bookings_after_confirmation"] = len(appointments)
                    for item in session.history.items:
                        report["turns"].append(item.model_dump(mode="json", exclude={"hash"}))
                    if len(appointments) != 1:
                        raise AssertionError("The model did not create exactly one confirmed booking")
                    report["passed"] = True
            finally:
                (ROOT / ".local" / "agent-text-scenario.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
                await bridge.close()
    print("Live LLM text scenario passed: no booking before confirmation; one booking after confirmation.")
    print("This is not an audio, accent, interruption or speech-provider test.")


if __name__ == "__main__":
    asyncio.run(scenario())
