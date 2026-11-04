from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from backend.database import Base


def uid():
    return str(uuid4())


def now():
    return datetime.now(timezone.utc)


class Patient(Base):
    __tablename__ = "patients"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    full_name: Mapped[str] = mapped_column(String(180))
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Call(Base):
    __tablename__ = "calls"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    room_name: Mapped[str] = mapped_column(String(100), unique=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, index=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    duration_s: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String(30), default="connecting", index=True)
    outcome: Mapped[str] = mapped_column(String(40), default="incomplete", index=True)
    error_code: Mapped[str | None] = mapped_column(String(80))
    visitor_hash: Mapped[str | None] = mapped_column(String(64), index=True)
    last_activity_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Extraction(Base):
    __tablename__ = "call_extractions"
    call_id: Mapped[str] = mapped_column(ForeignKey("calls.id"), primary_key=True)
    patient_name: Mapped[str | None] = mapped_column(String(180))
    phone: Mapped[str | None] = mapped_column(String(20))
    reason_for_visit: Mapped[str | None] = mapped_column(Text)
    preferred_datetime: Mapped[str | None] = mapped_column(String(80))
    doctor_id: Mapped[str | None] = mapped_column(String(80))
    service_id: Mapped[str | None] = mapped_column(String(80))
    intent: Mapped[str | None] = mapped_column(String(40))
    notes: Mapped[str | None] = mapped_column(Text)


class TranscriptTurn(Base):
    __tablename__ = "transcript_turns"
    id: Mapped[str] = mapped_column(String(150), primary_key=True)
    call_id: Mapped[str] = mapped_column(ForeignKey("calls.id"), index=True)
    speaker: Mapped[str] = mapped_column(String(20))
    text: Mapped[str] = mapped_column(Text)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    offset_s: Mapped[float] = mapped_column(Float, default=0)
    interrupted: Mapped[bool] = mapped_column(default=False)


class Appointment(Base):
    __tablename__ = "appointments"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    reference: Mapped[str] = mapped_column(String(24), unique=True, index=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), index=True)
    call_id: Mapped[str] = mapped_column(ForeignKey("calls.id"), index=True)
    doctor_id: Mapped[str] = mapped_column(String(80))
    service_id: Mapped[str] = mapped_column(String(80))
    reason: Mapped[str] = mapped_column(Text)
    slot: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    status: Mapped[str] = mapped_column(String(20), default="booked")
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    __table_args__ = (
        Index("uq_active_doctor_slot", "doctor_id", "slot", unique=True,
              sqlite_where=text("status = 'booked'"), postgresql_where=text("status = 'booked'")),
    )


class AppointmentAction(Base):
    __tablename__ = "appointment_actions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    appointment_id: Mapped[str] = mapped_column(ForeignKey("appointments.id"), index=True)
    call_id: Mapped[str] = mapped_column(ForeignKey("calls.id"), index=True)
    kind: Mapped[str] = mapped_column(String(30))
    idempotency_key: Mapped[str] = mapped_column(String(64), unique=True)
    result: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class FollowUp(Base):
    __tablename__ = "follow_ups"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    call_id: Mapped[str] = mapped_column(ForeignKey("calls.id"), index=True)
    patient_name: Mapped[str] = mapped_column(String(180))
    phone: Mapped[str] = mapped_column(String(20))
    reason: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    idempotency_key: Mapped[str] = mapped_column(String(64), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class StaffSession(Base):
    __tablename__ = "staff_sessions"
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    csrf_token: Mapped[str] = mapped_column(String(80))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)


class RateBucket(Base):
    __tablename__ = "rate_buckets"
    key: Mapped[str] = mapped_column(String(160), primary_key=True)
    window_start: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    count: Mapped[int] = mapped_column(Integer, default=0)
