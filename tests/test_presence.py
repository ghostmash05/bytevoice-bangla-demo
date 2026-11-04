import unittest

from agent.presence import CallerPresence


class PresenceTests(unittest.TestCase):
    def setUp(self):
        self.now = 0
        self.guard = CallerPresence(clock=lambda: self.now, timeout=10)

    def tick(self, **kwargs):
        return self.guard.check(listening=kwargs.get("listening", True),
                                pending_reply=kwargs.get("pending_reply", False))

    def test_check_in_then_end_once(self):
        self.now = 11
        self.assertEqual(self.tick(), "check_in")
        self.now = 22
        self.assertEqual(self.tick(), "end")
        self.now = 40
        self.assertIsNone(self.tick())

    def test_returning_caller_resets_check_in(self):
        self.now = 11
        self.assertEqual(self.tick(), "check_in")
        self.guard.caller_activity()
        self.now = 22
        self.assertEqual(self.tick(), "check_in")

    def test_continuous_audio_prevents_idle_even_without_transcripts(self):
        for self.now in range(1, 60):
            self.guard.observe_pcm([500, -500] * 160)
            self.assertIsNone(self.tick())

    def test_low_background_energy_does_not_reset_idle(self):
        self.now = 11
        self.guard.observe_pcm([10, -10] * 160)
        self.assertEqual(self.tick(), "check_in")

    def test_agent_speech_and_pending_reply_postpone_idle(self):
        self.now = 20
        self.assertIsNone(self.tick(listening=False))
        self.now = 29
        self.assertIsNone(self.tick())
        self.now = 40
        self.assertIsNone(self.tick(pending_reply=True))
        self.now = 45
        self.assertIsNone(self.tick())
