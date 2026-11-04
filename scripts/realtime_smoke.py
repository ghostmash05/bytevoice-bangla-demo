"""Generate a short Bangla voice audition through existing LiveKit credentials."""
import asyncio
import json
import os
import wave

from livekit.agents import Agent, AgentSession, APIConnectOptions, inference
from livekit.agents.voice import io
from agent.config import ROOT


class CaptureAudio(io.AudioOutput):
    def __init__(self):
        super().__init__(label="audition-wav", capabilities=io.AudioOutputCapabilities(pause=False))
        self.frames = []
        self.rate, self.channels, self.segment_duration = 24000, 1, 0.0

    async def capture_frame(self, frame):
        await super().capture_frame(frame)
        self.rate, self.channels = frame.sample_rate, frame.num_channels
        self.frames.append(bytes(frame.data))
        self.segment_duration += frame.samples_per_channel / frame.sample_rate

    def flush(self):
        super().flush()
        self.on_playback_finished(playback_position=self.segment_duration, interrupted=False)
        self.segment_duration = 0.0

    def clear_buffer(self):
        super().flush()
        self.on_playback_finished(playback_position=self.segment_duration, interrupted=True)
        self.segment_duration = 0.0

    def save(self, path):
        with wave.open(str(path), "wb") as output:
            output.setnchannels(self.channels)
            output.setsampwidth(2)
            output.setframerate(self.rate)
            output.writeframes(b"".join(self.frames))


async def generate_sample(text, output_path, voice="Kore"):
    sink = CaptureAudio()
    model = inference.RealtimeModel(model="google/gemini-3.8-live", voice=voice,
        conn_options=APIConnectOptions(max_retry=0, timeout=20))
    async with model, AgentSession(llm=model) as session:
        session.output.audio = sink
        await session.start(Agent(instructions="Read supplied audition text verbatim in everyday Bangladeshi Bangla with natural Dhaka/Bangladesh pronunciation. Do not add an introduction, answer the text or make a booking. This is a fictional voice test. Keep numbers and names accurate."))
        await asyncio.wait_for(session.generate_reply(instructions="Read exactly in natural Bangladeshi Bangla: " + text), timeout=60)
        if not sink.frames:
            raise RuntimeError("No audio frames were returned")
        sink.save(output_path)
        transcript = [item.text_content for item in session.history.items if getattr(item, "role", None) == "assistant"]
        report = {"model": "google/gemini-3.8-live", "voice": voice, "transcript": transcript,
            "audio_seconds": sum(len(b) for b in sink.frames) / (2 * sink.channels * sink.rate), "human_accent_review": "pending"}
        output_path.with_suffix(".json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        return report


async def main():
    await generate_sample("আসসালামু আলাইকুম। ঢাকা ডেন্টাল কেয়ারের ডেমোতে স্বাগতম। আগামীকাল বিকেল পাঁচটায় অ্যাপয়েন্টমেন্ট নিতে চান? আপনার নাম আর মোবাইল নম্বরটা বলবেন?", ROOT / ".local" / "gemini-bangla-audition.wav")
    print("Bangla audition audio generated: .local/gemini-bangla-audition.wav")
    print("Accent quality and microphone recognition still need listening/live-call verification.")


if __name__ == "__main__":
    asyncio.run(main())
