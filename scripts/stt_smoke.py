"""Audition dedicated Bengali STT on the existing fake caller recordings."""
import asyncio
import json
import wave

from livekit import rtc
from livekit.agents import inference, stt
from livekit.agents.utils import http_context

from agent.config import ROOT


async def main():
    model = inference.STT(model="speechmatics/linden-1", language="bn")
    results = []
    try:
        for index in (2, 3):
            path = ROOT / ".local" / f"test-callback-{index}.wav"
            stream = model.stream()

            async def consume():
                texts = []
                async for event in stream:
                    if event.type == stt.SpeechEventType.FINAL_TRANSCRIPT:
                        texts.extend(item.text for item in event.alternatives[:1])
                return texts

            reader = asyncio.create_task(consume())
            with wave.open(str(path), "rb") as audio:
                while chunk := audio.readframes(480):
                    stream.push_frame(rtc.AudioFrame(data=chunk, sample_rate=24000, num_channels=1, samples_per_channel=len(chunk)//2))
            stream.end_input()
            transcripts = await asyncio.wait_for(reader, timeout=45)
            await stream.aclose()
            if not transcripts:
                raise AssertionError("No dedicated STT transcript")
            results.append({"file": path.name, "transcripts": transcripts})
            print(f"Dedicated STT returned {len(transcripts)} segments for fake caller turn {index + 1}.", flush=True)
    finally:
        await model.aclose()
        (ROOT / ".local" / "stt-audition.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")


async def run():
    async with http_context.open():
        await main()


if __name__ == "__main__":
    asyncio.run(run())
