"""Timestamp final dedicated-STT segments independently of native model captions."""
import time
from datetime import datetime, timezone
from uuid import uuid4

from livekit.agents import stt


class CallerTranscript:
    def __init__(self, emit, *, clock=time.time):
        self.emit, self.clock = emit, clock
        self.audio_origin = None

    def audio_started(self, duration=0):
        if self.audio_origin is None:
            self.audio_origin = self.clock() - duration

    def speech_event(self, event):
        if event.type != stt.SpeechEventType.FINAL_TRANSCRIPT or not event.alternatives:
            return
        alternative = event.alternatives[0]
        if not alternative.text.strip():
            return
        now = self.clock()
        at = min(now, (self.audio_origin if self.audio_origin is not None else now) + max(0, alternative.start_time))
        self.emit({"id": "stt-" + uuid4().hex, "speaker": "user", "text": alternative.text,
                   "timestamp": datetime.fromtimestamp(at, timezone.utc).isoformat(), "interrupted": False})
