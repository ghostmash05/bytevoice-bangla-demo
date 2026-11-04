import unittest
from datetime import datetime

from livekit.agents import stt
from agent.transcription import CallerTranscript


class CallerTranscriptTests(unittest.TestCase):
    def setUp(self):
        self.now, self.turns = 100, []
        self.transcript = CallerTranscript(self.turns.append, clock=lambda: self.now)

    def event(self, text, kind=stt.SpeechEventType.FINAL_TRANSCRIPT, start=0):
        return stt.SpeechEvent(type=kind, alternatives=[stt.SpeechData(language="bn", text=text, start_time=start)])

    def test_only_nonempty_final_segments_are_saved(self):
        self.transcript.speech_event(self.event("বাংলা", stt.SpeechEventType.INTERIM_TRANSCRIPT))
        self.transcript.speech_event(self.event("  "))
        self.assertEqual(self.turns, [])
        self.transcript.speech_event(self.event("বাংলা scaling"))
        self.assertEqual(self.turns[0]["text"], "বাংলা scaling")
        self.assertEqual(self.turns[0]["speaker"], "user")

    def test_speech_start_uses_audio_origin_not_late_delivery(self):
        self.transcript.audio_started(.02)
        self.now = 120
        self.transcript.audio_started(.02)
        self.transcript.speech_event(self.event("hello", start=3))
        self.assertAlmostEqual(datetime.fromisoformat(self.turns[0]["timestamp"]).timestamp(), 102.98)

    def test_provider_future_offset_is_clamped_to_arrival(self):
        self.transcript.audio_started()
        self.transcript.speech_event(self.event("hello", start=999))
        self.assertEqual(datetime.fromisoformat(self.turns[0]["timestamp"]).timestamp(), self.now)
