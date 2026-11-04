"""Explicit realtime provider selection; never fall back to a billable provider."""
import os
from livekit.agents import inference
from openai.types.realtime import AudioTranscription


def create_realtime_model(*, dedicated_transcript=True, conn_options=None, voice=None):
    options = {"conn_options": conn_options} if conn_options is not None else {}
    voice = voice or os.getenv("REALTIME_VOICE", "Kore")
    provider = os.getenv("REALTIME_PROVIDER", "livekit")
    if provider == "google":
        from google.genai import types
        from livekit.plugins import google
        return google.realtime.RealtimeModel(
            model=os.getenv("GOOGLE_REALTIME_MODEL", "gemini-3.8-live"),
            api_key=os.environ["GOOGLE_API_KEY"], vertexai=False, voice=voice,
            language="bn",
            input_audio_transcription=None if dedicated_transcript else types.AudioTranscriptionConfig(language_codes=["bn-BD", "en"]),
            output_audio_transcription=types.AudioTranscriptionConfig(),
            **options,
        )
    if provider != "livekit":
        raise ValueError("REALTIME_PROVIDER must be livekit or google")
    return inference.RealtimeModel(
        model=os.getenv("REALTIME_MODEL", "google/gemini-3.8-live"), voice=voice,
        max_session_duration=310,
        input_audio_transcription=None if dedicated_transcript else AudioTranscription(
            language="bn", prompt="The caller speaks Bangladeshi Bangla. Transcribe Bangla in Bengali script, preserving English code-switching."),
        **options,
    )
