-- Initial schema. Generated from backend/models.py. Review before applying.

BEGIN;

CREATE TABLE patients (
	id VARCHAR(36) NOT NULL,
	full_name VARCHAR(180) NOT NULL,
	phone VARCHAR(20) NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL,
	PRIMARY KEY (id)
);

CREATE UNIQUE INDEX ix_patients_phone ON patients (phone);

CREATE TABLE calls (
	id VARCHAR(36) NOT NULL,
	room_name VARCHAR(100) NOT NULL,
	started_at TIMESTAMP WITH TIME ZONE NOT NULL,
	ended_at TIMESTAMP WITH TIME ZONE,
	duration_s FLOAT NOT NULL,
	status VARCHAR(30) NOT NULL,
	outcome VARCHAR(40) NOT NULL,
	error_code VARCHAR(80),
	visitor_hash VARCHAR(64),
	last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL,
	PRIMARY KEY (id),
	UNIQUE (room_name)
);

CREATE INDEX ix_calls_started_at ON calls (started_at);

CREATE INDEX ix_calls_outcome ON calls (outcome);

CREATE INDEX ix_calls_visitor_hash ON calls (visitor_hash);

CREATE INDEX ix_calls_status ON calls (status);

CREATE TABLE staff_sessions (
	token_hash VARCHAR(64) NOT NULL,
	csrf_token VARCHAR(80) NOT NULL,
	expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
	PRIMARY KEY (token_hash)
);

CREATE INDEX ix_staff_sessions_expires_at ON staff_sessions (expires_at);

CREATE TABLE rate_buckets (
	key VARCHAR(160) NOT NULL,
	window_start TIMESTAMP WITH TIME ZONE NOT NULL,
	count INTEGER NOT NULL,
	PRIMARY KEY (key)
);

CREATE TABLE call_extractions (
	call_id VARCHAR(36) NOT NULL,
	patient_name VARCHAR(180),
	phone VARCHAR(20),
	reason_for_visit TEXT,
	preferred_datetime VARCHAR(80),
	doctor_id VARCHAR(80),
	service_id VARCHAR(80),
	intent VARCHAR(40),
	notes TEXT,
	PRIMARY KEY (call_id),
	FOREIGN KEY(call_id) REFERENCES calls (id)
);

CREATE TABLE transcript_turns (
	id VARCHAR(150) NOT NULL,
	call_id VARCHAR(36) NOT NULL,
	speaker VARCHAR(20) NOT NULL,
	text TEXT NOT NULL,
	timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
	offset_s FLOAT NOT NULL,
	interrupted BOOLEAN NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(call_id) REFERENCES calls (id)
);

CREATE INDEX ix_transcript_turns_call_id ON transcript_turns (call_id);

CREATE TABLE appointments (
	id VARCHAR(36) NOT NULL,
	reference VARCHAR(24) NOT NULL,
	patient_id VARCHAR(36) NOT NULL,
	call_id VARCHAR(36) NOT NULL,
	doctor_id VARCHAR(80) NOT NULL,
	service_id VARCHAR(80) NOT NULL,
	reason TEXT NOT NULL,
	slot TIMESTAMP WITH TIME ZONE NOT NULL,
	status VARCHAR(20) NOT NULL,
	version INTEGER NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(patient_id) REFERENCES patients (id),
	FOREIGN KEY(call_id) REFERENCES calls (id)
);

CREATE UNIQUE INDEX ix_appointments_reference ON appointments (reference);

CREATE INDEX ix_appointments_slot ON appointments (slot);

CREATE INDEX ix_appointments_patient_id ON appointments (patient_id);

CREATE INDEX ix_appointments_call_id ON appointments (call_id);

CREATE UNIQUE INDEX uq_active_doctor_slot ON appointments (doctor_id, slot) WHERE status = 'booked';

CREATE TABLE follow_ups (
	id VARCHAR(36) NOT NULL,
	call_id VARCHAR(36) NOT NULL,
	patient_name VARCHAR(180) NOT NULL,
	phone VARCHAR(20) NOT NULL,
	reason TEXT NOT NULL,
	status VARCHAR(20) NOT NULL,
	idempotency_key VARCHAR(64) NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(call_id) REFERENCES calls (id),
	UNIQUE (idempotency_key)
);

CREATE INDEX ix_follow_ups_call_id ON follow_ups (call_id);

CREATE TABLE appointment_actions (
	id VARCHAR(36) NOT NULL,
	appointment_id VARCHAR(36) NOT NULL,
	call_id VARCHAR(36) NOT NULL,
	kind VARCHAR(30) NOT NULL,
	idempotency_key VARCHAR(64) NOT NULL,
	result JSON NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(appointment_id) REFERENCES appointments (id),
	FOREIGN KEY(call_id) REFERENCES calls (id),
	UNIQUE (idempotency_key)
);

CREATE INDEX ix_appointment_actions_call_id ON appointment_actions (call_id);

CREATE INDEX ix_appointment_actions_appointment_id ON appointment_actions (appointment_id);

-- When hosted in Supabase, deny direct browser access. The trusted backend

-- must use a database role that can perform the required operations.

ALTER TABLE "calls" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "patients" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "rate_buckets" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "staff_sessions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "appointments" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "call_extractions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "follow_ups" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "transcript_turns" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "appointment_actions" ENABLE ROW LEVEL SECURITY;

COMMIT;
