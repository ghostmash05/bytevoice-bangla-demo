import concurrent.futures
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import func, select

from backend.database import Base, make_engine, make_sessions
from backend.models import Appointment, AppointmentAction
from backend.schemas import BookingInput, ChangeInput, ExtractionInput, FollowUpInput, TurnInput
from backend.service import ClinicService, RuleError


class BookingTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.engine = make_engine("sqlite:///" + (Path(self.tmp.name) / "test.db").as_posix())
        Base.metadata.create_all(self.engine)
        self.sessions = make_sessions(self.engine)
        self.now = datetime(2026, 11, 4, 8, tzinfo=timezone.utc)
        self.service = ClinicService(self.sessions, lambda: self.now)
        self.call = self.service.start_call("first-call")

    def tearDown(self):
        self.engine.dispose()
        self.tmp.cleanup()

    def booking(self, **overrides):
        return BookingInput(**({"patient_name": "মাশরাফি রহমান", "phone": "০১৭১২৩৪৫৬৭৮", "reason": "স্কেলিং",
            "doctor_id": "dr-nadia", "service_id": "scaling", "slot": "2026-11-05T11:00:00+06:00", "confirmed": True} | overrides))

    def test_confirmed_booking_normalizes_phone_and_captures_details(self):
        result = self.service.book(self.call, self.booking())
        self.assertEqual(result["phone"], "+8801712345678")
        self.assertEqual(result["slot"], "2026-11-05T11:00:00+06:00")
        detail = self.service.call_detail(self.call)
        self.assertEqual(detail["outcome"], "booked")
        self.assertEqual(detail["extraction"]["patient_name"], "মাশরাফি রহমান")
        self.assertEqual(len(detail["actions"]), 1)

    def test_requires_confirmation(self):
        with self.assertRaises(RuleError) as raised:
            self.service.book(self.call, self.booking(confirmed=False))
        self.assertEqual(raised.exception.code, "confirmation_required")

    def test_enquiry_then_unconfirmed_callback_stays_incomplete(self):
        self.service.capture(self.call, ExtractionInput(intent="enquiry"))
        self.service.capture(self.call, ExtractionInput(intent="follow_up", patient_name="Demo patient", phone="01712345679"))
        self.service.end_call(self.call)
        detail = self.service.call_detail(self.call)
        self.assertEqual(detail["status"], "incomplete")
        self.assertEqual(detail["outcome"], "incomplete")
        self.assertEqual(detail["extraction"]["phone"], "+8801712345679")
        self.assertEqual(detail["follow_ups"], [])

    def test_partial_intent_does_not_erase_a_saved_action(self):
        self.service.book(self.call, self.booking())
        self.service.capture(self.call, ExtractionInput(intent="follow_up"))
        self.service.end_call(self.call)
        detail = self.service.call_detail(self.call)
        self.assertEqual(detail["outcome"], "booked")
        self.assertEqual(len(detail["actions"]), 1)

    def test_retry_is_idempotent(self):
        first = self.service.book(self.call, self.booking())
        second = self.service.book(self.call, self.booking())
        self.assertEqual(first["reference"], second["reference"])
        with self.sessions() as s:
            self.assertEqual(s.scalar(select(func.count()).select_from(Appointment)), 1)
            self.assertEqual(s.scalar(select(func.count()).select_from(AppointmentAction)), 1)

    def test_rejects_past_closed_out_of_hours_unaligned_and_outside_horizon(self):
        for slot in ("2026-11-04T10:00+06:00", "2026-11-06T11:00+06:00", "2026-11-05T20:00+06:00",
                     "2026-11-05T11:15+06:00", "2026-11-19T11:00+06:00", "next Sunday evening"):
            with self.subTest(slot=slot), self.assertRaises(RuleError):
                self.service.book(self.call, self.booking(slot=slot))

    def test_does_not_allow_unknown_service_or_doctor(self):
        for overrides in ({"doctor_id": "unknown"}, {"service_id": "root-canal"}):
            with self.subTest(overrides=overrides), self.assertRaises(RuleError):
                self.service.book(self.call, self.booking(**overrides))

    def test_availability_excludes_booked_slot(self):
        self.service.book(self.call, self.booking())
        result = self.service.availability("2026-11-05", "dr-nadia", "scaling")
        self.assertNotIn("2026-11-05T11:00:00+06:00", result["slots"])
        self.assertIn("2026-11-05T11:30:00+06:00", result["slots"])

    def test_calendar_labels_match_the_actual_day_including_closed_friday(self):
        thursday = self.service.availability("2026-11-05", "dr-nadia", "scaling")
        self.assertEqual(thursday["weekday_bn"], "বৃহস্পতিবার")
        self.assertEqual(thursday["date_label_bn"], "৫ নভেম্বর ২০২৬")
        friday = self.service.availability("2026-11-06", "dr-nadia", "scaling")
        self.assertEqual(friday["weekday_bn"], "শুক্রবার")
        self.assertTrue(friday["closed"])

    def test_booking_reschedule_cancel_across_calls(self):
        booked = self.service.book(self.call, self.booking())
        second = self.service.start_call("second-call")
        found = self.service.lookup(booked["reference"], "01712345678")
        changed = self.service.change(second, ChangeInput(reference=booked["reference"], phone="01712345678",
            expected_version=found["version"], confirmed=True, new_slot="2026-11-05T12:00+06:00"))
        self.assertEqual(changed["version"], 2)
        third = self.service.start_call("third-call")
        cancelled = self.service.change(third, ChangeInput(reference=booked["reference"], phone="01712345678",
            expected_version=2, confirmed=True), cancel=True)
        self.assertEqual(cancelled["status"], "cancelled")
        self.assertEqual(self.service.call_detail(second)["outcome"], "rescheduled")
        self.assertEqual(self.service.call_detail(third)["outcome"], "cancelled")
        self.assertIn("2026-11-05T12:00:00+06:00", self.service.availability("2026-11-05", "dr-nadia", "scaling")["slots"])

    def test_lookup_requires_matching_phone(self):
        result = self.service.book(self.call, self.booking())
        with self.assertRaises(RuleError) as raised:
            self.service.lookup(result["reference"], "01912345678")
        self.assertEqual(raised.exception.code, "not_found")

    def test_failed_reschedule_preserves_original_booking(self):
        first = self.service.book(self.call, self.booking())
        other_call = self.service.start_call("other-call")
        self.service.book(other_call, self.booking(phone="01912345678", slot="2026-11-05T12:00+06:00"))
        with self.assertRaises(RuleError):
            self.service.change(other_call, ChangeInput(reference=first["reference"], phone="01712345678",
                expected_version=1, confirmed=True, new_slot="2026-11-05T12:00+06:00"))
        preserved = self.service.lookup(first["reference"], "01712345678")
        self.assertEqual(preserved["slot"], first["slot"])
        self.assertEqual(preserved["version"], 1)

    def test_stale_version_cannot_overwrite_change(self):
        first = self.service.book(self.call, self.booking())
        second = self.service.start_call("second-call")
        self.service.change(second, ChangeInput(reference=first["reference"], phone="01712345678", expected_version=1,
            confirmed=True, new_slot="2026-11-05T12:00+06:00"))
        with self.assertRaises(RuleError) as raised:
            self.service.change(second, ChangeInput(reference=first["reference"], phone="01712345678", expected_version=1,
                confirmed=True, new_slot="2026-11-05T13:00+06:00"))
        self.assertEqual(raised.exception.code, "stale_version")

    def test_concurrent_bookings_cannot_double_book(self):
        second = self.service.start_call("race-call")
        def attempt(args):
            call, mobile = args
            try:
                return self.service.book(call, self.booking(phone=mobile))["status"]
            except RuleError as exc:
                return exc.code
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            outcomes = list(pool.map(attempt, [(self.call, "01712345678"), (second, "01912345678")]))
        self.assertCountEqual(outcomes, ["booked", "conflict"])

    def test_partial_call_transcript_correction_and_end_are_persistent(self):
        self.service.capture(self.call, ExtractionInput(patient_name="মাশরাফি", phone="01712345678"))
        self.service.capture(self.call, ExtractionInput(patient_name="মাশরাফি রহমান", phone="01912345678"))
        turn = TurnInput(id="turn1", speaker="user", text="আমার নাম মাশরাফি রহমান", timestamp=self.now.isoformat())
        self.service.add_turn(self.call, turn)
        self.service.add_turn(self.call, turn)
        self.service.end_call(self.call)
        detail = self.service.call_detail(self.call)
        self.assertEqual(detail["status"], "incomplete")
        self.assertEqual(detail["extraction"]["phone"], "+8801912345678")
        self.assertEqual(len(detail["transcript"]), 1)
        self.assertEqual(detail["transcript"][0]["speaker"], "user")

    def test_callback_is_saved_and_idempotent(self):
        data = FollowUpInput(patient_name="Test Patient", phone="01712345678", reason="Speak with a clinician", confirmed=True)
        first = self.service.follow_up(self.call, data)
        second = self.service.follow_up(self.call, data)
        self.assertEqual(first["id"], second["id"])
        self.service.end_call(self.call)
        detail = self.service.call_detail(self.call)
        self.assertEqual(detail["outcome"], "follow_up_needed")
        self.assertEqual(detail["status"], "completed")

    def test_worker_crash_preserves_partial_call_and_marks_it_incomplete(self):
        self.service.activate_call(self.call)
        self.service.capture(self.call, ExtractionInput(patient_name="Partial caller"))
        later = ClinicService(self.sessions, lambda: self.now.replace(minute=7))
        result = later.call_detail(self.call)
        self.assertEqual(result["status"], "incomplete")
        self.assertEqual(result["error_code"], "session_interrupted")
        self.assertEqual(result["extraction"]["patient_name"], "Partial caller")

    def test_never_joined_call_eventually_becomes_failed(self):
        later = ClinicService(self.sessions, lambda: self.now.replace(minute=7))
        result = later.call_detail(self.call)
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["error_code"], "connection_timeout")


if __name__ == "__main__":
    unittest.main()
