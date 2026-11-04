"""Configuration with safe, names-only diagnostics."""

import os
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env.local", override=False)

REQUIRED = (
    "LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET",
    "BACKEND_URL", "AGENT_API_SECRET",
)


def required_variables():
    if os.getenv("VOICE_PIPELINE", "realtime") == "chained":
        return REQUIRED + ("SONIOX_API_KEY", "AZURE_SPEECH_KEY", "AZURE_SPEECH_REGION")
    if os.getenv("REALTIME_PROVIDER", "livekit") == "google":
        return REQUIRED + ("GOOGLE_API_KEY",)
    return REQUIRED


def configuration_errors() -> list[str]:
    errors = [f"Missing: {name}" for name in required_variables() if not os.getenv(name, "").strip()]
    if os.getenv("VOICE_PIPELINE", "realtime") not in ("realtime", "chained"):
        errors.append("VOICE_PIPELINE must be realtime or chained")
    if os.getenv("VOICE_PIPELINE", "realtime") == "realtime" and os.getenv("REALTIME_PROVIDER", "livekit") not in ("livekit", "google"):
        errors.append("REALTIME_PROVIDER must be livekit or google")
    url = os.getenv("LIVEKIT_URL", "")
    if url and (urlparse(url).scheme not in ("wss", "https") or not urlparse(url).hostname):
        errors.append("LIVEKIT_URL must be a valid secure wss:// or https:// URL")
    if not os.getenv("LIVEKIT_AGENT_NAME", "bangla-receptionist").strip():
        errors.append("LIVEKIT_AGENT_NAME cannot be empty")
    backend = os.getenv("BACKEND_URL", "")
    if backend and (urlparse(backend).scheme not in ("http", "https") or not urlparse(backend).hostname):
        errors.append("BACKEND_URL must be an http(s) URL")
    if os.getenv("APP_ENV") == "production" and not backend.startswith("https://"):
        errors.append("Production BACKEND_URL must use HTTPS")
    return errors


def require_configuration() -> None:
    errors = configuration_errors()
    if errors:
        raise RuntimeError("Configuration incomplete:\n" + "\n".join(errors))


if __name__ == "__main__":
    problems = configuration_errors()
    print("Voice pipeline:", os.getenv("VOICE_PIPELINE", "realtime"))
    for name in required_variables():
        print(f"{name}: {'SET' if os.getenv(name, '').strip() else 'MISSING'}")
    if problems:
        print("Not ready. No secrets were printed. Add missing settings to .env.local.")
        raise SystemExit(1)
    print("Local settings are present. Credentials and provider access still need a live test.")
