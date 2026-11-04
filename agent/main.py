"""Custom Bangla voice agent with booking tools and persistent transcripts."""
import asyncio
import logging
import os
import time
from datetime import datetime, timezone

from livekit import agents
from livekit.agents import Agent, AgentServer, AgentSession, RunContext, StopResponse, ToolError, TurnHandlingOptions, function_tool, inference, room_io

from agent.bridge import BackendBridge
from agent.config import require_configuration
from agent.prompt import build_instructions
from agent.validation import normalize_bd_mobile
from agent.recovery import TurnRecovery
from agent.presence import CallerPresence
from agent.transcription import CallerTranscript
from agent.realtime import create_realtime_model

logger = logging.getLogger("clinic-agent")


class Receptionist(Agent):
    def __init__(self, backend: BackendBridge, call_id: str, finish=None, presence=None, transcript=None) -> None:
        super().__init__(instructions=build_instructions())
        self.backend, self.call_id = backend, call_id
        self.finish = finish
        self.presence = presence
        self.transcript = transcript

    async def stt_node(self, audio, model_settings):
        async def observed_audio():
            async for frame in audio:
                if self.transcript:
                    self.transcript.audio_started(frame.duration)
                if self.presence:
                    self.presence.observe_pcm(frame.data)
                yield frame

        async for event in Agent.default.stt_node(self, observed_audio(), model_settings):
            if self.transcript:
                self.transcript.speech_event(event)
            yield event

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
        """Save a demo request after confirming details. No staff are contacted.

        No calls, messages, notification or transfer are performed. No callback
        time or actual future contact is promised. Use the returned facts.
        """
        return await self.operation("follow-up", {"patient_name": patient_name, "phone": phone, "reason": reason, "confirmed": confirmed})

    @function_tool()
    async def finish_call(self, context: RunContext, caller_done: bool = False):
        """End the voice call when the caller says goodbye or needs nothing else.

        Do not use for a booking confirmation, a pause, or an unresolved question.
        A brief spoken farewell is drained before disconnecting.
        """
        if not caller_done or self.finish is None:
            raise ToolError("Only finish a live call after the caller signals they are done.")
        await context.wait_for_playout()
        await self.finish()
        raise StopResponse()


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
    dedicated_transcript = False
    if realtime:
        default_stt = "" if os.getenv("REALTIME_PROVIDER", "livekit") == "google" else "speechmatics/linden-1"
        transcript_model = os.getenv("REALTIME_STT_MODEL", default_stt).strip()
        dedicated_transcript = bool(transcript_model)
        session = AgentSession(llm=create_realtime_model(dedicated_transcript=dedicated_transcript),
            stt=inference.STT(model=transcript_model, language="bn") if transcript_model else None,
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
            caller_caption = data.pop("_caller_caption", False)
            try:
                await backend.request("POST", f"/internal/calls/{call_id}/turn", data)
            except Exception:
                state.update(failed=True, error_code="transcript_write_failed")
                logger.error("Transcript persistence failed for call %s", call_id)
            finally:
                if caller_caption:
                    try:
                        await asyncio.wait_for(ctx.room.local_participant.send_text(data["text"],
                            topic="clinic.caller_transcript", attributes={"segment_id": data["id"], "timestamp": data["timestamp"]}), timeout=3)
                    except Exception:
                        logger.warning("Caller caption delivery failed call_id=%s", call_id)
                queue.task_done()

    writer = asyncio.create_task(persist_turns())

    def queue_caller_caption(data):
        try:
            queue.put_nowait({**data, "_caller_caption": True})
        except asyncio.QueueFull:
            state.update(failed=True, error_code="transcript_queue_full")

    caller_transcript = CallerTranscript(queue_caller_caption) if dedicated_transcript else None
    last_reply_started = {"at": 0.0}

    async def recover_reply():
        logger.warning("Recovering stalled reply call_id=%s", call_id)
        generation = recovery.generation
        await asyncio.wait_for(session.interrupt(force=True), timeout=3)
        if not recovery.pending or recovery.generation != generation:
            return
        session.generate_reply(instructions=(
            "The previous response stalled. Respond to the latest caller turn using the existing conversation. "
            "If the caller confirmed a readback, finish the requested tool operation. Verify actual tool results; "
            "never claim an unverified booking or callback succeeded. Do not repeat a successful write. "
            "If a required detail is missing, ask one short clarifying question in Bangla."
        ))

    async def failed_reply():
        state.update(failed=True, error_code="reply_timeout")
        logger.error("Reply recovery failed call_id=%s", call_id)
        ctx.shutdown(reason="voice reply timeout")

    recovery = TurnRecovery(recover_reply, failed_reply)
    presence = CallerPresence()
    lifecycle = {"agent_state": "initializing", "ending": False}

    async def finish_session(idle=False):
        if lifecycle["ending"]:
            return
        lifecycle["ending"] = True
        recovery.activity()
        await ctx.room.local_participant.set_attributes({"clinic.call_ending": "true"})
        if realtime:
            # Queue, then drain. Awaiting the owning SpeechHandle inside a tool
            # would create a circular wait.
            session.generate_reply(instructions=((
                "The caller has not responded after a check-in. Briefly say in Bangla that you cannot hear them "
                "and they can call again, then say goodbye. Do not use tools or claim any new booking."
            ) if idle else (
                "The caller is finished. Say one short warm farewell in Bangladeshi Bangla, "
                "such as ধন্যবাদ, ভালো থাকবেন। আল্লাহ হাফেজ। Do not ask questions or use tools. "
                "Do not claim an appointment or callback that was not saved."
            )), tool_choice="none", allow_interruptions=False)
        else:
            session.say("ধন্যবাদ, ভালো থাকবেন। আল্লাহ হাফেজ।", allow_interruptions=False)
        session.shutdown(drain=True)

    @session.on("agent_state_changed")
    def on_agent_state(event):
        lifecycle["agent_state"] = event.new_state
        logger.info("Agent state call_id=%s state=%s", call_id, event.new_state)
        if event.new_state == "speaking":
            last_reply_started["at"] = time.time()
            recovery.activity()

    @session.on("user_state_changed")
    def on_user_state(event):
        if event.new_state == "speaking":
            recovery.activity()
            presence.caller_activity()

    @session.on("function_tools_executed")
    def on_tools(event):
        # Names and error flags only. Never log tool arguments, results or PII.
        for call, output in event.zipped():
            logger.info("Tool completed call_id=%s tool=%s error=%s", call_id, call.name, output.is_error)

    async def watch_replies():
        while True:
            await asyncio.sleep(1)
            await recovery.check()
            action = presence.check(listening=lifecycle["agent_state"] == "listening",
                                    pending_reply=recovery.pending or lifecycle["ending"])
            if action == "check_in":
                logger.info("Idle caller check-in call_id=%s", call_id)
                session.generate_reply(instructions="The caller has been silent. Ask briefly in Bangla: আপনি কি লাইনে আছেন? Take no actions and use no tools.", tool_choice="none")
            elif action == "end":
                logger.info("Idle caller ending call_id=%s", call_id)
                await finish_session(idle=True)

    reply_watcher = asyncio.create_task(watch_replies())

    @session.on("conversation_item_added")
    def on_item(event):
        item = event.item
        if getattr(item, "role", None) not in ("user", "assistant") or not item.text_content:
            return
        if item.role == "user" and item.created_at > last_reply_started["at"]:
            recovery.user_turn()
            presence.caller_activity()
        if item.role == "user" and dedicated_transcript:
            # Native transcripts still serve model context/reply recovery. Only
            # the dedicated STT segments are displayed and persisted as caller text.
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
        await asyncio.sleep(285)
        if lifecycle["ending"]:
            return
        lifecycle["ending"] = True
        recovery.activity()
        try:
            await ctx.room.local_participant.set_attributes({"clinic.call_ending": "true"})
            if realtime:
                session.generate_reply(instructions="Say briefly in Bangla that the demo time limit has been reached and thank the caller. Do not use tools.", tool_choice="none", allow_interruptions=False)
            else:
                session.say("ডেমো কলের সময় শেষ হয়েছে। ধন্যবাদ।", allow_interruptions=False)
        finally:
            session.shutdown(drain=True)

    timer = asyncio.create_task(limit_duration())

    async def shutdown():
        timer.cancel()
        reply_watcher.cancel()
        try:
            await session.aclose()
            await asyncio.wait_for(queue.join(), timeout=20)
        except asyncio.TimeoutError:
            state.update(failed=True, error_code="transcript_flush_timeout")
        finally:
            writer.cancel()
            await asyncio.gather(writer, timer, reply_watcher, return_exceptions=True)
            try:
                await backend.request("POST", f"/internal/calls/{call_id}/end", state)
            finally:
                await backend.close()

    ctx.add_shutdown_callback(shutdown)
    try:
        await session.start(room=ctx.room, agent=Receptionist(backend, call_id, finish_session, presence, caller_transcript),
                            room_options=room_io.RoomOptions(delete_room_on_close=True), record=False)
        if dedicated_transcript:
            await ctx.room.local_participant.set_attributes({"clinic.caller_transcript": "dedicated"})
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
