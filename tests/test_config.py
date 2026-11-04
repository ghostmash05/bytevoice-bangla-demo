import os
import unittest
from unittest.mock import patch
from agent.config import configuration_errors


class ConfigurationTests(unittest.TestCase):
    def base(self):
        return {"LIVEKIT_URL": "wss://example.livekit.cloud", "LIVEKIT_API_KEY": "test", "LIVEKIT_API_SECRET": "test",
            "BACKEND_URL": "http://localhost:8000", "AGENT_API_SECRET": "test"}

    def test_realtime_does_not_require_separate_speech_credentials(self):
        with patch.dict(os.environ, self.base(), clear=True):
            self.assertEqual(configuration_errors(), [])

    def test_cloud_injected_https_livekit_url_is_supported(self):
        with patch.dict(os.environ, self.base() | {"LIVEKIT_URL": "https://example.livekit.cloud"}, clear=True):
            self.assertEqual(configuration_errors(), [])

    def test_insecure_livekit_url_is_rejected(self):
        with patch.dict(os.environ, self.base() | {"LIVEKIT_URL": "http://example.livekit.cloud"}, clear=True):
            self.assertTrue(any("LIVEKIT_URL" in value for value in configuration_errors()))

    def test_chained_pipeline_requires_external_provider_credentials(self):
        with patch.dict(os.environ, self.base() | {"VOICE_PIPELINE": "chained"}, clear=True):
            errors = configuration_errors()
            self.assertIn("Missing: SONIOX_API_KEY", errors)
            self.assertIn("Missing: AZURE_SPEECH_KEY", errors)

    def test_unknown_pipeline_is_rejected(self):
        with patch.dict(os.environ, self.base() | {"VOICE_PIPELINE": "typo"}, clear=True):
            self.assertIn("VOICE_PIPELINE must be realtime or chained", configuration_errors())

    def test_direct_google_requires_its_own_key(self):
        with patch.dict(os.environ, self.base() | {"REALTIME_PROVIDER": "google"}, clear=True):
            self.assertIn("Missing: GOOGLE_API_KEY", configuration_errors())
        with patch.dict(os.environ, self.base() | {"REALTIME_PROVIDER": "google", "GOOGLE_API_KEY": "test"}, clear=True):
            self.assertEqual(configuration_errors(), [])

    def test_unknown_realtime_provider_is_rejected(self):
        with patch.dict(os.environ, self.base() | {"REALTIME_PROVIDER": "typo"}, clear=True):
            self.assertIn("REALTIME_PROVIDER must be livekit or google", configuration_errors())
