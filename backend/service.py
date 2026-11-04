"""Deterministic booking rules. Each write is committed with its audit action."""

import hashlib
import json
import secrets
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError

from agent.config import ROOT
from agent.validation import normalize_bd_mobile, normalize_reference
from backend.models import Appointment, AppointmentAction, Call, Extraction, FollowUp, Patient, TranscriptTurn, uid
from backend.schemas import BookingInput, ChangeInput, ExtractionInput, FollowUpInput, TurnInput

CLINIC = json.loads((ROOT / "shared" / "clinic.json").read_text(encoding="utf-8"))
DHaka = ZoneInfo("Asia/Dhaka")


class RuleError(Exception):
    def __init__(self, message: str, code: str = "invalid_request", status: int = 400):
        self.message, self.code, self.status = message, code, status
        super().__init__(message)


def utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def iso(value: datetime | None):
    return utc(value).isoformat() if value else None


def phone(value: str):
    try:
        return normalize_bd_mobile(value)
    except ValueError as exc:
        raise RuleError(str(exc), "invalid_phone") from exc


def fingerprint(*parts) -> str:
    return hashlib.sha256(json.dumps(parts, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


class ClinicService:
    def __init__(self, sessions, clock=None):
        self.sessions = sessions
        self.clock = clock or (lambda: datetime.now(timezone.utc))

    def call(self, session, call_id):
        item = session.get(Call, call_id)
        if not item:
            raise RuleError("Call not found", "not_found", 404)
        return item

    def start_call(self, room_name: str, visitor_hash=None):
        with self.sessions.begin() as session:
            existing = session.scalar(select(Call).where(Call.room_name == room_name))
            if existing:
                return existing.id
            record = Call(id=uid(), room_name=room_name, started_at=self.clock(), last_activity_at=self.clock(), visitor_hash=visitor_hash)
            session.add(record)
            session.flush()
            session.add(Extraction(call_id=record.id))
            return record.id

    def activate_call(self, call_id):
        with self.sessions.begin() as session:
            record = self.call(session, call_id)
            if record.status in ("connecting", "live"):
                record.status = "live"
                record.last_activity_at = self.clock()
        return {"call_id": call_id}

    def capture(self, call_id: str, data: ExtractionInput):
        with self.sessions.begin() as session:
            record = self.call(session, call_id)
            extraction = session.get(Extraction, call_id)
            values = data.model_dump(exclude_unset=True)
            if values.get("phone"):
                values["phone"] = phone(values["phone"])
            for key, value in values.items():
                setattr(extraction, key, value)
            record.last_activity_at = self.clock()
            if values.get("intent") == "enquiry" and record.outcome == "incomplete":
                record.outcome = "enquiry"
        return {"saved": True}

    def add_turn(self, call_id, data: TurnInput):
        try:
            timestamp = utc(datetime.fromisoformat(data.timestamp))
        except ValueError as exc:
            raise RuleError("Invalid transcript timestamp") from exc
        with self.sessions.begin() as session:
            record = self.call(session, call_id)
            turn_id = f"{call_id}:{data.id}"
            turn = session.get(TranscriptTurn, turn_id)
            if turn is None:
                session.add(TranscriptTurn(id=turn_id, call_id=call_id, speaker=data.speaker, text=data.text,
                    timestamp=timestamp, offset_s=max(0, (timestamp - utc(record.started_at)).total_seconds()), interrupted=data.interrupted))
            else:
                turn.text, turn.interrupted = data.text, data.interrupted
            record.last_activity_at = self.clock()
        return {"saved": True}

    def end_call(self, call_id, failed=False, error_code=None):
        with self.sessions.begin() as session:
            record = self.call(session, call_id)
            if not record.ended_at:
                record.ended_at = self.clock()
                record.duration_s = max(0, (record.ended_at - utc(record.started_at)).total_seconds())
                record.status = "failed" if failed else "completed" if record.outcome != "incomplete" else "incomplete"
                record.error_code = error_code
        return {"saved": True}

    def validate_slot(self, value: str, doctor_id: str, service_id: str):
        doctor = next((d for d in CLINIC["doctors"] if d["id"] == doctor_id), None)
        if not doctor or service_id not in doctor["service_ids"]:
            raise RuleError("Doctor/service combination is not available", "invalid_service")
        try:
            parsed = datetime.fromisoformat(value.translate(str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")))
        except ValueError as exc:
            raise RuleError("Provide an explicit ISO calendar date and time", "invalid_date") from exc
        local = parsed.replace(tzinfo=DHaka) if parsed.tzinfo is None else parsed.astimezone(DHaka)
        now_local = self.clock().astimezone(DHaka)
        if local <= now_local or local.date() > now_local.date() + timedelta(days=14):
            raise RuleError("Choose a future time within the next 14 days", "invalid_date")
        hours = CLINIC["opening_hours"][local.strftime("%A").lower()]
        if not hours:
            raise RuleError("The clinic is closed on Friday", "closed")
        start = datetime.combine(local.date(), datetime.strptime(hours["opens"], "%H:%M").time(), DHaka)
        end = datetime.combine(local.date(), datetime.strptime(hours["closes"], "%H:%M").time(), DHaka)
        if local < start or local + timedelta(minutes=30) > end or local.minute % 30 or local.second or local.microsecond:
            raise RuleError("Appointments start on half-hour boundaries between 10:00 and 19:30", "invalid_slot")
        return local.astimezone(timezone.utc)

    def availability(self, day: str, doctor_id: str, service_id: str):
        try:
            target = date.fromisoformat(day)
        except ValueError as exc:
            raise RuleError("Provide a YYYY-MM-DD date", "invalid_date") from exc
        local_now = self.clock().astimezone(DHaka)
        if not local_now.date() <= target <= local_now.date() + timedelta(days=14):
            raise RuleError("Date outside the booking horizon", "invalid_date")
        doctor = next((d for d in CLINIC["doctors"] if d["id"] == doctor_id), None)
        if not doctor or service_id not in doctor["service_ids"]:
            raise RuleError("Doctor/service combination is not available", "invalid_service")
        hours = CLINIC["opening_hours"][target.strftime("%A").lower()]
        if not hours:
            return {"date": day, "timezone": "Asia/Dhaka", "slots": [], "closed": True}
        starts = datetime.combine(target, datetime.strptime(hours["opens"], "%H:%M").time(), DHaka)
        closes = datetime.combine(target, datetime.strptime(hours["closes"], "%H:%M").time(), DHaka)
        with self.sessions() as session:
            busy = {iso(s) for s in session.scalars(select(Appointment.slot).where(Appointment.doctor_id == doctor_id,
                Appointment.status == "booked", Appointment.slot >= starts.astimezone(timezone.utc), Appointment.slot < closes.astimezone(timezone.utc)))}
        slots = []
        while starts + timedelta(minutes=30) <= closes:
            if starts > local_now and iso(starts) not in busy:
                slots.append(starts.isoformat())
            starts += timedelta(minutes=30)
        return {"date": day, "timezone": "Asia/Dhaka", "slots": slots, "closed": False}

    def serialize_appointment(self, item, patient):
        return {"id": item.id, "reference": item.reference, "patient_name": patient.full_name,
            "phone": patient.phone, "doctor_id": item.doctor_id, "service_id": item.service_id,
            "reason": item.reason, "slot": utc(item.slot).astimezone(DHaka).isoformat(),
            "status": item.status, "version": item.version}

    def find_appointment(self, session, reference, mobile):
        try:
            reference = normalize_reference(reference)
        except ValueError as exc:
            raise RuleError("Please repeat the booking reference", "invalid_reference") from exc
        item = session.scalar(select(Appointment).join(Patient).where(Appointment.reference == reference, Patient.phone == phone(mobile)))
        if not item:
            raise RuleError("No matching appointment. Check the reference and mobile number.", "not_found", 404)
        return item, session.get(Patient, item.patient_id)

    def lookup(self, reference, mobile):
        with self.sessions() as session:
            item, patient = self.find_appointment(session, reference, mobile)
            return self.serialize_appointment(item, patient)

    def book(self, call_id: str, data: BookingInput):
        if not data.confirmed:
            raise RuleError("Read back the details and obtain explicit caller confirmation first", "confirmation_required")
        mobile = phone(data.phone)
        slot = self.validate_slot(data.slot, data.doctor_id, data.service_id)
        key = fingerprint(call_id, "book", {**data.model_dump(), "phone": mobile, "slot": iso(slot)})
        try:
            with self.sessions.begin() as session:
                record = self.call(session, call_id)
                existing = session.scalar(select(AppointmentAction).where(AppointmentAction.idempotency_key == key))
                if existing:
                    return existing.result
                patient = session.scalar(select(Patient).where(Patient.phone == mobile))
                if patient is None:
                    patient = Patient(id=uid(), full_name=data.patient_name, phone=mobile)
                    session.add(patient)
                    session.flush()
                else:
                    patient.full_name = data.patient_name
                item = Appointment(id=uid(), reference="DDC-" + f"{secrets.randbelow(100_000_000):08d}", patient_id=patient.id,
                    call_id=call_id, doctor_id=data.doctor_id, service_id=data.service_id, reason=data.reason, slot=slot, status="booked", version=1)
                session.add(item)
                session.flush()
                result = self.serialize_appointment(item, patient)
                session.add(AppointmentAction(appointment_id=item.id, call_id=call_id, kind="booked", idempotency_key=key, result=result))
                record.outcome = "booked"
                extraction = session.get(Extraction, call_id)
                extraction.patient_name, extraction.phone, extraction.reason_for_visit = data.patient_name, mobile, data.reason
                extraction.preferred_datetime, extraction.doctor_id, extraction.service_id, extraction.intent = result["slot"], data.doctor_id, data.service_id, "booking"
                return result
        except IntegrityError as exc:
            with self.sessions() as session:
                existing = session.scalar(select(AppointmentAction).where(AppointmentAction.idempotency_key == key))
                if existing:
                    return existing.result
            raise RuleError("The slot was taken or the request conflicted. Refresh availability and try again.", "conflict", 409) from exc

    def change(self, call_id: str, data: ChangeInput, cancel=False):
        if not data.confirmed:
            raise RuleError("Confirm the action with the caller first", "confirmation_required")
        kind = "cancelled" if cancel else "rescheduled"
        if not cancel and not data.new_slot:
            raise RuleError("A new slot is required")
        key = fingerprint(call_id, kind, data.model_dump())
        try:
            with self.sessions.begin() as session:
                record = self.call(session, call_id)
                previous = session.scalar(select(AppointmentAction).where(AppointmentAction.idempotency_key == key))
                if previous:
                    return previous.result
                item, patient = self.find_appointment(session, data.reference, data.phone)
                if item.status != "booked" or utc(item.slot) <= self.clock():
                    raise RuleError("Only future active appointments can be changed", "not_changeable", 409)
                new_slot = item.slot if cancel else self.validate_slot(data.new_slot, item.doctor_id, item.service_id)
                changed = session.execute(update(Appointment).where(Appointment.id == item.id, Appointment.version == data.expected_version,
                    Appointment.status == "booked").values(slot=new_slot, status="cancelled" if cancel else "booked", version=data.expected_version + 1))
                if changed.rowcount != 1:
                    raise RuleError("Appointment changed since lookup. Retrieve it again and reconfirm.", "stale_version", 409)
                session.flush()
                session.refresh(item)
                result = self.serialize_appointment(item, patient)
                session.add(AppointmentAction(appointment_id=item.id, call_id=call_id, kind=kind, idempotency_key=key, result=result))
                record.outcome = kind
                extraction = session.get(Extraction, call_id)
                extraction.patient_name, extraction.phone = patient.full_name, patient.phone
                extraction.preferred_datetime, extraction.reason_for_visit = result["slot"], item.reason
                extraction.doctor_id, extraction.service_id = item.doctor_id, item.service_id
                extraction.intent = "cancellation" if cancel else "reschedule"
                return result
        except IntegrityError as exc:
            with self.sessions() as session:
                previous = session.scalar(select(AppointmentAction).where(AppointmentAction.idempotency_key == key))
                if previous:
                    return previous.result
            raise RuleError("That slot is no longer available. The existing appointment was preserved.", "conflict", 409) from exc

    def follow_up(self, call_id: str, data: FollowUpInput):
        if not data.confirmed:
            raise RuleError("Confirm callback details with the caller first", "confirmation_required")
        mobile = phone(data.phone)
        key = fingerprint(call_id, "callback", data.patient_name, mobile, data.reason)
        with self.sessions.begin() as session:
            record = self.call(session, call_id)
            item = session.scalar(select(FollowUp).where(FollowUp.idempotency_key == key))
            if not item:
                item = FollowUp(id=uid(), call_id=call_id, patient_name=data.patient_name, phone=mobile, reason=data.reason, idempotency_key=key)
                session.add(item)
            extraction = session.get(Extraction, call_id)
            extraction.patient_name, extraction.phone, extraction.notes, extraction.intent = data.patient_name, mobile, data.reason, "follow_up"
            record.outcome = "follow_up_needed"
            return {"id": item.id, "status": "pending", "saved": True}

    def list_calls(self, q="", status=None, outcome=None, limit=30, offset=0):
        self.reconcile_stale_calls()
        query = select(Call, Extraction).join(Extraction)
        if q:
            pattern = "%" + q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"
            query = query.where(Extraction.patient_name.ilike(pattern, escape="\\") | Extraction.phone.ilike(pattern, escape="\\") | Call.id.ilike(pattern, escape="\\"))
        if status:
            query = query.where(Call.status == status)
        if outcome:
            query = query.where(Call.outcome == outcome)
        with self.sessions() as session:
            total = session.scalar(select(func.count()).select_from(query.subquery()))
            rows = session.execute(query.order_by(Call.started_at.desc()).limit(limit).offset(offset)).all()
            return {"items": [self.serialize_call(call, extraction) for call, extraction in rows], "total": total, "limit": limit, "offset": offset}

    def serialize_call(self, item, extraction):
        return {"id": item.id, "started_at": iso(item.started_at), "ended_at": iso(item.ended_at), "duration_s": item.duration_s,
            "status": item.status, "outcome": item.outcome, "error_code": item.error_code,
            "source": "scripted_test" if item.room_name.startswith("fixture-") else "synthetic_audio_test" if item.room_name.startswith("audio-test-") else "browser" if item.room_name.startswith("clinic-") else "agent_console",
            "extraction": {c.name: getattr(extraction, c.name) for c in Extraction.__table__.columns if c.name != "call_id"}}

    def call_detail(self, call_id):
        self.reconcile_stale_calls()
        with self.sessions() as session:
            call = self.call(session, call_id)
            result = self.serialize_call(call, session.get(Extraction, call_id))
            result["transcript"] = [{"id": t.id, "speaker": t.speaker, "text": t.text, "timestamp": iso(t.timestamp),
                "offset_s": t.offset_s, "interrupted": t.interrupted} for t in session.scalars(select(TranscriptTurn).where(TranscriptTurn.call_id == call_id).order_by(TranscriptTurn.timestamp, TranscriptTurn.id))]
            actions = session.scalars(select(AppointmentAction).where(AppointmentAction.call_id == call_id).order_by(AppointmentAction.created_at))
            result["actions"] = [{"kind": a.kind, "created_at": iso(a.created_at), "result": a.result} for a in actions]
            result["follow_ups"] = [{"id": f.id, "reason": f.reason, "status": f.status, "phone": f.phone,
                "patient_name": f.patient_name} for f in session.scalars(select(FollowUp).where(FollowUp.call_id == call_id))]
            return result

    def reconcile_stale_calls(self):
        """Preserve records after a worker crash or a never-completed connection."""
        cutoff = self.clock() - timedelta(minutes=6)
        with self.sessions.begin() as session:
            stale = session.scalars(select(Call).where(Call.status.in_(["connecting", "live"]), Call.last_activity_at < cutoff))
            for record in stale:
                record.ended_at = max(utc(record.started_at), utc(record.last_activity_at))
                record.duration_s = max(0, (record.ended_at - utc(record.started_at)).total_seconds())
                record.error_code = "connection_timeout" if record.status == "connecting" else "session_interrupted"
                record.status = "failed" if record.status == "connecting" else "completed" if record.outcome != "incomplete" else "incomplete"
