"""Custom Bangla voice agent with booking tools and persistent transcripts."""
import asyncio
import logging
import os
from datetime import datetime, timezone
from openai.types.realtime import AudioTranscription

from livekit import agents
from livekit.agents import Agent, AgentServer, AgentSession, TurnHandlingOptions, function_tool, inference

from agent.bridge import BackendBridge
from agent.config import require_configuration
from agent.prompt import build_instructions
from agent.validation import normalize_bd_mobile

logger = logging.getLogger("clinic-agent")


class Receptionist(Agent):
    def __init__(self, backend: BackendBridge, call_id: str) -> None:
        super().__init__(instructions=build_instructions())
        self.backend, self.call_id = backend, call_id

    async def operation(self, name, data):
        return await self.backend.request("POST", f"/internal/calls/{self.call_id}/{name}", data)

    @function_tool()
    async def validate_phone(self, phone: str) -> dict:
        """Check a caller-supplied mobile number without storing it."""
        try:
            return {"valid": True, "normalized_phone": normalize_bd_mobile(phone)}
        except ValueError:
            return {"valid": False, "message": "Ask the caller to repeat the 11 digits."}

    @function_tool()
    async def capture_details(self, patient_name: str = "", phone: str = "", reason_for_visit: str = "",
                              preferred_datetime: str = "", doctor_id: str = "", service_id: str = "", intent: str = "", notes: str = "") -> dict:
        """Save partial details and corrections, not a booking.

        intent is booking, reschedule, cancellation, enquiry or follow_up.
        Empty arguments leave previous fields unchanged.
        """
        values = {"patient_name": patient_name, "phone": phone, "reason_for_visit": reason_for_visit,
            "preferred_datetime": preferred_datetime, "doctor_id": doctor_id, "service_id": service_id, "intent": intent, "notes": notes}
        return await self.operation("capture", {k: v for k, v in values.items() if v})

    @function_tool()
    async def check_availability(self, day: str, doctor_id: str, service_id: str) -> dict:
        """Get available slots for a YYYY-MM-DD date and clinic doctor/service IDs."""
        return await self.backend.request("GET", "/internal/availability", params={"day": day, "doctor_id": doctor_id, "service_id": service_id})

    @function_tool()
    async def book_appointment(self, patient_name: str, phone: str, reason: str, doctor_id: str,
                               service_id: str, slot: str, confirmed: bool = False) -> dict:
        """Book AFTER reading back details and receiving explicit caller confirmation.

        slot must be an ISO date/time from check_availability. Never invent slots.
        confirmed stays false unless the caller actually confirmed the readback.
        """
        return await self.operation("book", {"patient_name": patient_name, "phone": phone, "reason": reason,
            "doctor_id": doctor_id, "service_id": service_id, "slot": slot, "confirmed": confirmed})

    @function_tool()
    async def find_appointment(self, reference: str, phone: str) -> dict:
        """Find a booking using BOTH reference and matching mobile."""
        return await self.backend.request("POST", "/internal/lookup", {"reference": reference, "phone": phone})

    @function_tool()
    async def reschedule_appointment(self, reference: str, phone: str, expected_version: int,
                                      new_slot: str, confirmed: bool = False) -> dict:
        """Move a booking after availability check and explicit caller confirmation.

        expected_version comes from find_appointment. On conflict, look up again.
        A failed move preserves the old booking. Do not claim a failed move succeeded.
        """
        return await self.operation("reschedule", {"reference": reference, "phone": phone, "expected_version": expected_version,
            "new_slot": new_slot, "confirmed": confirmed})

    @function_tool()
    async def cancel_appointment(self, reference: str, phone: str, expected_version: int, confirmed: bool = False) -> dict:
        """Cancel a retrieved booking only after explicit caller confirmation."""
        return await self.operation("cancel", {"reference": reference, "phone": phone,
            "expected_version": expected_version, "confirmed": confirmed})

    @function_tool()
    async def request_callback(self, patient_name: str, phone: str, reason: str, confirmed: bool = False) -> dict:
        """Record staff follow-up after confirming contact details. Do not promise a time."""
        return await self.operation("follow-up", {"patient_name": patient_name, "phone": phone, "reason": reason, "confirmed": confirmed})


server = AgentServer()


@server.rtc_session(agent_name=os.getenv("LIVEKIT_AGENT_NAME", "bangla-receptionist"))
async def entrypoint(ctx: agents.JobContext):
    require_configuration()
    backend = BackendBridge()
    try:
        started = await backend.request("POST", "/internal/calls/start", {"room_name": ctx.room.name})
    except Exception:
        await backend.close()
        raise
    call_id = started["call_id"]
    queue = asyncio.Queue(maxsize=512)
    state = {"failed": False, "error_code": None}
    realtime = os.getenv("VOICE_PIPELINE", "realtime") == "realtime"
    if realtime:
        transcript_model = os.getenv("REALTIME_STT_MODEL", "speechmatics/linden-1").strip()
        session = AgentSession(llm=inference.RealtimeModel(
            model=os.getenv("REALTIME_MODEL", "google/gemini-3.8-live"),
            voice=os.getenv("REALTIME_VOICE", "Kore"), max_session_duration=310,
            input_audio_transcription=None if transcript_model else AudioTranscription(language="bn", prompt="The caller speaks Bangladeshi Bangla. Transcribe Bangla in Bengali script, preserving English code-switching."),
        ), stt=inference.STT(model=transcript_model, language="bn") if transcript_model else None,
            max_tool_steps=6)
    else:
        from livekit.plugins import azure, silero, soniox
        session = AgentSession(
        stt=soniox.STT(params=soniox.STTOptions(model=os.getenv("SONIOX_MODEL", "stt-rt-v5"),
            language_hints=["bn", "en"], max_endpoint_delay_ms=1000)),
        llm=inference.LLM(model=os.getenv("LLM_MODEL", "google/gemma-4-31b-it")),
        tts=azure.TTS(voice=os.getenv("AZURE_TTS_VOICE", "bn-BD-NabanitaNeural"), language="bn-BD"),
        vad=silero.VAD.load(), turn_handling=TurnHandlingOptions(turn_detection="stt"),
            max_tool_steps=6,
        )

    async def persist_turns():
        while True:
            data = await queue.get()
            try:
                await backend.request("POST", f"/internal/calls/{call_id}/turn", data)
            except Exception:
                state.update(failed=True, error_code="transcript_write_failed")
                logger.error("Transcript persistence failed for call %s", call_id)
            finally:
                queue.task_done()

    writer = asyncio.create_task(persist_turns())

    @session.on("conversation_item_added")
    def on_item(event):
        item = event.item
        if getattr(item, "role", None) not in ("user", "assistant") or not item.text_content:
            return
        try:
            queue.put_nowait({"id": item.id, "speaker": item.role, "text": item.text_content,
                "timestamp": datetime.fromtimestamp(item.created_at, timezone.utc).isoformat(), "interrupted": item.interrupted})
        except asyncio.QueueFull:
            state.update(failed=True, error_code="transcript_queue_full")

    @session.on("error")
    def on_error(event):
        if not getattr(event.error, "recoverable", False):
            state.update(failed=True, error_code="voice_provider_error")

    @session.on("close")
    def on_close(event):
        if event.error:
            state.update(failed=True, error_code="voice_provider_error")
        ctx.shutdown(reason="voice session closed")

    async def limit_duration():
        await asyncio.sleep(300)
        try:
            if realtime:
                await session.generate_reply(instructions="Say briefly in Bangla that the five-minute demo limit has been reached and thank the caller. Do not use tools.")
            else:
                await session.say("ডেমো কলের সময় শেষ হয়েছে। ধন্যবাদ।", allow_interruptions=False)
        finally:
            ctx.shutdown(reason="demo duration limit")

    timer = asyncio.create_task(limit_duration())

    async def shutdown():
        timer.cancel()
        try:
            await session.aclose()
            await asyncio.wait_for(queue.join(), timeout=20)
        except asyncio.TimeoutError:
            state.update(failed=True, error_code="transcript_flush_timeout")
        finally:
            writer.cancel()
            await asyncio.gather(writer, timer, return_exceptions=True)
            try:
                await backend.request("POST", f"/internal/calls/{call_id}/end", state)
            finally:
                await backend.close()

    ctx.add_shutdown_callback(shutdown)
    try:
        await session.start(room=ctx.room, agent=Receptionist(backend, call_id), record=False)
        if realtime:
            await session.generate_reply(instructions="Greet once in natural Bangladeshi Bangla: আসসালামু আলাইকুম। ঢাকা ডেন্টাল কেয়ারের ডেমোতে স্বাগতম। আমি এআই সহকারী। কীভাবে সাহায্য করতে পারি? Do not call any tools before the caller speaks.")
        else:
            await session.say("আসসালামু আলাইকুম। ঢাকা ডেন্টাল কেয়ারের ডেমোতে স্বাগতম। আমি এআই সহকারী। কীভাবে সাহায্য করতে পারি?", allow_interruptions=True)
    except Exception:
        state.update(failed=True, error_code="voice_start_failed")
        ctx.shutdown(reason="voice startup failed")
        raise


if __name__ == "__main__":
    agents.cli.run_app(server)
