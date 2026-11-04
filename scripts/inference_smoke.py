"""Small text-only LiveKit Inference check. Uses credits, not speech providers."""
import asyncio
import os
from livekit.agents import APIConnectOptions, inference, llm
from agent.config import ROOT


async def main():
    model = inference.LLM(model=os.getenv("LLM_MODEL", "google/gemma-4-31b-it"))
    context = llm.ChatContext()
    context.add_message(role="system", content="You are a fictional clinic receptionist. Respond in exactly one short sentence in everyday Bangladeshi Bangla. Do not invent bookings or clinic facts.")
    context.add_message(role="user", content="আমি একটা অ্যাপয়েন্টমেন্ট নিতে চাই।")
    parts = []
    try:
        async with model.chat(chat_ctx=context, conn_options=APIConnectOptions(max_retry=0, timeout=20)) as stream:
            async for chunk in stream:
                if chunk.delta and chunk.delta.content:
                    parts.append(chunk.delta.content)
        output = "".join(parts)
        if not output.strip():
            raise RuntimeError("Inference returned no text")
        target = ROOT / ".local" / "inference-smoke.txt"
        target.write_text(output, encoding="utf-8")
        print("LiveKit text inference succeeded. Output saved to .local/inference-smoke.txt.")
        print("This does not verify speech, tools, accent or voice latency.")
    finally:
        await model.aclose()


if __name__ == "__main__":
    asyncio.run(main())
