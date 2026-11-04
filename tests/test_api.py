import tempfile
import asyncio
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
import httpx
from argon2 import PasswordHasher
from fastapi.testclient import TestClient

from backend.app import create_app
from agent.bridge import BackendBridge
from agent.main import Receptionist
from livekit.agents import ToolError


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.password_hash = PasswordHasher(time_cost=1, memory_cost=8192).hash("test-password-only")

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.settings = {"AGENT_API_SECRET": "test-agent-secret-" + "x" * 40, "REVIEWER_PASSWORD_HASH": self.password_hash,
            "REVIEWER_USERNAME": "reviewer", "WEB_ORIGINS": "http://localhost:3000", "COOKIE_SECURE": "false",
            "LIVEKIT_URL": "wss://example.livekit.cloud", "LIVEKIT_API_KEY": "test-key", "LIVEKIT_API_SECRET": "x" * 40}
        self.settings.update(SONIOX_API_KEY="test-only", AZURE_SPEECH_KEY="test-only", AZURE_SPEECH_REGION="test-region")
        self.app = create_app("sqlite:///" + (Path(self.tmp.name) / "api.db").as_posix(), self.settings,
            lambda: datetime(2026, 11, 4, 8, tzinfo=timezone.utc))
        self.context = TestClient(self.app)
        self.client = self.context.__enter__()

    def tearDown(self):
        self.context.__exit__(None, None, None)
        self.tmp.cleanup()

    def login(self):
        return self.client.post("/api/auth/login", json={"username": "reviewer", "password": "test-password-only"}, headers={"Origin": "http://localhost:3000"})

    def test_patient_data_and_internal_tools_require_auth(self):
        self.assertEqual(self.client.get("/api/calls").status_code, 401)
        self.assertEqual(self.client.post("/internal/calls/start", json={"room_name": "test"}).status_code, 401)

    def test_production_rejects_ephemeral_sqlite_storage(self):
        with self.assertRaisesRegex(RuntimeError, "persistent PostgreSQL"):
            create_app("sqlite://", self.settings | {"APP_ENV": "production", "COOKIE_SECURE": "true", "WEB_ORIGINS": "https://clinic.example"})

    def test_login_cookie_csrf_and_logout(self):
        logged_in = self.login()
        self.assertEqual(logged_in.status_code, 200)
        self.assertIn("HttpOnly", logged_in.headers["set-cookie"])
        self.assertEqual(self.client.get("/api/calls").status_code, 200)
        self.assertEqual(self.client.post("/api/auth/logout").status_code, 403)
        self.assertEqual(self.client.post("/api/auth/logout", headers={"X-CSRF-Token": logged_in.json()["csrf_token"]}).status_code, 200)
        self.assertEqual(self.client.get("/api/calls").status_code, 401)

    def test_invalid_password_and_external_origin_are_rejected(self):
        self.assertEqual(self.client.post("/api/auth/login", json={"username": "reviewer", "password": "wrong"}).status_code, 401)
        self.assertEqual(self.client.post("/api/auth/login", json={"username": "reviewer", "password": "test-password-only"},
            headers={"Origin": "https://untrusted.example"}).status_code, 403)

    def test_expired_and_forged_sessions_are_rejected(self):
        from sqlalchemy import select
        from backend.models import StaffSession
        self.login()
        with self.app.state.sessions.begin() as session:
            item = session.scalar(select(StaffSession))
            item.expires_at = datetime(2026, 11, 4, 8, tzinfo=timezone.utc) - timedelta(seconds=1)
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)
        self.assertEqual(self.client.get("/api/calls").status_code, 401)
        self.client.cookies.set("clinic_session", "forged-session")
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)

    def test_login_rate_limit(self):
        for _ in range(8):
            self.client.post("/api/auth/login", json={"username": "reviewer", "password": "wrong"})
        self.assertEqual(self.login().status_code, 429)

    def test_tokens_are_short_lived_unique_room_microphone_only(self):
        a = self.client.post("/api/connect")
        b = self.client.post("/api/connect")
        self.assertEqual(a.status_code, 200)
        first = jwt.decode(a.json()["token"], options={"verify_signature": False})
        second = jwt.decode(b.json()["token"], options={"verify_signature": False})
        self.assertNotEqual(first["video"]["room"], second["video"]["room"])
        self.assertEqual(first["video"]["canPublishSources"], ["microphone"])
        self.assertFalse(first["video"]["canPublishData"])
        self.assertEqual(first["exp"] - first["nbf"], 300)
        self.assertEqual(first["roomConfig"]["agents"][0]["agentName"], "bangla-receptionist")

    def test_api_book_then_staff_record_contains_action(self):
        agent = {"Authorization": "Bearer " + self.settings["AGENT_API_SECRET"]}
        created = self.client.post("/internal/calls/start", json={"room_name": "integration"}, headers=agent)
        self.assertEqual(created.status_code, 200)
        call_id = created.json()["call_id"]
        result = self.client.post(f"/internal/calls/{call_id}/book", headers=agent, json={"patient_name": "Test Patient",
            "phone": "01712345678", "reason": "Cleaning", "service_id": "scaling", "doctor_id": "dr-nadia",
            "slot": "2026-11-05T11:00+06:00", "confirmed": True})
        self.assertEqual(result.status_code, 200)
        self.login()
        detail = self.client.get(f"/api/calls/{call_id}")
        self.assertEqual(detail.json()["outcome"], "booked")
        self.assertEqual(detail.json()["actions"][0]["result"]["reference"], result.json()["reference"])

    def test_registered_agent_tools_reach_persistent_backend(self):
        async def scenario():
            client = httpx.AsyncClient(transport=httpx.ASGITransport(app=self.app), base_url="http://testserver",
                headers={"Authorization": "Bearer " + self.settings["AGENT_API_SECRET"]})
            bridge = BackendBridge(client)
            try:
                started = await bridge.request("POST", "/internal/calls/start", {"room_name": "tool-integration"})
                agent = Receptionist(bridge, started["call_id"])
                await agent.capture_details(patient_name="Tool Test", phone="01712345678", intent="booking")
                availability = await agent.check_availability("2026-11-05", "dr-nadia", "scaling")
                slot = availability["slots"][0]
                with self.assertRaises(ToolError):
                    await agent.book_appointment("Tool Test", "01712345678", "Cleaning", "dr-nadia", "scaling", slot)
                booked = await agent.book_appointment("Tool Test", "01712345678", "Cleaning", "dr-nadia", "scaling", slot, confirmed=True)
                found = await agent.find_appointment(booked["reference"], "01712345678")
                cancelled = await agent.cancel_appointment(found["reference"], "01712345678", found["version"], confirmed=True)
                self.assertEqual(cancelled["status"], "cancelled")
                await bridge.request("POST", f"/internal/calls/{started['call_id']}/end", {"failed": False})
                self.assertEqual(self.app.state.service.call_detail(started["call_id"])["outcome"], "cancelled")
            finally:
                await bridge.close()
        asyncio.run(scenario())


if __name__ == "__main__":
    unittest.main()
