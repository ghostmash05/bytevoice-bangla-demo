"""API for authenticated staff, browser call tokens and private agent tools."""

import hashlib
import hmac
import os
import secrets
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import Depends, FastAPI, Header, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from livekit import api
from pydantic import Field
from sqlalchemy import select

from agent.config import ROOT
from backend.database import Base, make_engine, make_sessions
from backend.models import Call, StaffSession
from backend.schemas import BookingInput, ChangeInput, EndCallInput, ExtractionInput, FollowUpInput, Input, LookupInput, TurnInput
from backend.security import digest, matches, rate_limit, valid_session
from backend.service import CLINIC, ClinicService, RuleError, utc


class LoginInput(Input):
    username: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=1, max_length=300)


class StartCallInput(Input):
    room_name: str = Field(min_length=1, max_length=100, pattern=r"^[a-zA-Z0-9_-]+$")


def create_app(database_url=None, settings=None, clock=None):
    settings = settings or dict(os.environ)
    clock = clock or (lambda: datetime.now(timezone.utc))
    engine = make_engine(database_url or settings.get("DATABASE_URL"))
    sessions = make_sessions(engine)
    service = ClinicService(sessions, clock)
    origins = [s.strip() for s in settings.get("WEB_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",") if s.strip()]
    secret = settings.get("AGENT_API_SECRET", "")
    password_hash = settings.get("REVIEWER_PASSWORD_HASH", "")
    if len(secret) < 32 or not password_hash:
        raise RuntimeError("Run python -m backend.setup_local before starting the API")
    if settings.get("APP_ENV") == "production" and (not settings.get("COOKIE_SECURE") == "true" or not origins or any(not x.startswith("https://") for x in origins)):
        raise RuntimeError("Production requires COOKIE_SECURE=true and HTTPS WEB_ORIGINS")
    hasher = PasswordHasher()

    @asynccontextmanager
    async def lifespan(app):
        Base.metadata.create_all(engine)
        yield
        engine.dispose()

    app = FastAPI(title="Bangla Receptionist Clinic API", lifespan=lifespan, docs_url="/api/docs" if settings.get("APP_ENV") != "production" else None)
    app.state.service, app.state.sessions = service, sessions
    app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True,
        allow_methods=["GET", "POST"], allow_headers=["Content-Type", "X-CSRF-Token", "Authorization"])

    @app.exception_handler(RuleError)
    async def rule_error(request, exc):
        return JSONResponse({"error": exc.code, "message": exc.message}, status_code=exc.status)

    @app.middleware("http")
    async def headers(request, call_next):
        response = await call_next(request)
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "same-origin"
        return response

    def visitor(request):
        # Do not trust a caller-controlled X-Forwarded-For header. Reverse-proxy trust
        # must be configured on the deployed ASGI server, not inferred here.
        address = request.client.host if request.client else "unknown"
        return hmac.new(secret.encode(), address.encode(), hashlib.sha256).hexdigest()

    def allowed_origin(request):
        origin = request.headers.get("origin")
        if origin and origin not in origins:
            raise RuleError("Request origin is not allowed", "forbidden", 403)

    def agent_auth(authorization: str | None = Header(default=None)):
        supplied = (authorization or "").removeprefix("Bearer ")
        if not supplied or not matches(supplied, secret):
            raise RuleError("Agent authentication required", "unauthorized", 401)

    def staff_auth(request: Request):
        item = valid_session(sessions, request.cookies.get("clinic_session"), clock)
        if item is None:
            raise RuleError("Please sign in", "unauthorized", 401)
        if request.method != "GET":
            allowed_origin(request)
            if not matches(request.headers.get("x-csrf-token", ""), item.csrf_token):
                raise RuleError("CSRF token required", "forbidden", 403)
        return item

    @app.get("/api/health")
    def health():
        with sessions() as session:
            session.execute(select(1))
        return {"status": "ok", "clinic": CLINIC["id"], "storage": engine.dialect.name}

    @app.get("/api/clinic")
    def clinic():
        return CLINIC

    @app.post("/api/auth/login")
    def login(data: LoginInput, request: Request, response: Response):
        allowed_origin(request)
        rate_limit(sessions, "login:" + visitor(request), 8, 900, clock)
        try:
            correct = hasher.verify(password_hash, data.password)
        except (VerificationError, InvalidHashError):
            correct = False
        if not correct or not matches(data.username, settings.get("REVIEWER_USERNAME", "reviewer")):
            raise RuleError("Incorrect username or password", "unauthorized", 401)
        token, csrf = secrets.token_urlsafe(32), secrets.token_urlsafe(32)
        with sessions.begin() as session:
            session.add(StaffSession(token_hash=digest(token), csrf_token=csrf, expires_at=clock() + timedelta(hours=12)))
        response.set_cookie("clinic_session", token, httponly=True, secure=settings.get("COOKIE_SECURE") == "true", samesite="lax", max_age=43200, path="/")
        return {"username": settings.get("REVIEWER_USERNAME", "reviewer"), "csrf_token": csrf}

    @app.get("/api/auth/me")
    def me(item=Depends(staff_auth)):
        return {"username": settings.get("REVIEWER_USERNAME", "reviewer"), "csrf_token": item.csrf_token}

    @app.post("/api/auth/logout")
    def logout(response: Response, item=Depends(staff_auth)):
        with sessions.begin() as session:
            session.delete(session.get(StaffSession, item.token_hash))
        response.delete_cookie("clinic_session", path="/")
        return {"signed_out": True}

    @app.get("/api/calls", dependencies=[Depends(staff_auth)])
    def calls(q: str = Query("", max_length=180), status: str | None = None, outcome: str | None = None,
              limit: int = Query(30, ge=1, le=100), offset: int = Query(0, ge=0)):
        return service.list_calls(q, status, outcome, limit, offset)

    @app.get("/api/calls/{call_id}", dependencies=[Depends(staff_auth)])
    def call_detail(call_id: str):
        return service.call_detail(call_id)

    @app.post("/api/connect")
    async def connect(request: Request):
        allowed_origin(request)
        rate_limit(sessions, "connect:" + visitor(request), 5, 600, clock)
        with sessions() as session:
            active = list(session.scalars(select(Call).where(Call.status.in_(["connecting", "live"]), Call.started_at > clock() - timedelta(minutes=6))))
            if len(active) >= 5:
                raise RuleError("All demo lines are busy. Please try again shortly.", "busy", 429)
        key, api_secret, url = (settings.get(k) for k in ("LIVEKIT_API_KEY", "LIVEKIT_API_SECRET", "LIVEKIT_URL"))
        if not all((key, api_secret, url)):
            raise RuleError("Voice connection is not configured yet", "not_configured", 503)
        pipeline = settings.get("VOICE_PIPELINE", "realtime")
        if pipeline not in ("realtime", "chained"):
            raise RuleError("The voice demo is not available yet. Please try again later.", "not_configured", 503)
        if pipeline == "chained" and not all(settings.get(k) for k in ("SONIOX_API_KEY", "AZURE_SPEECH_KEY", "AZURE_SPEECH_REGION")):
            raise RuleError("The voice demo is not available yet. Please try again later.", "not_configured", 503)
        room = "clinic-" + uuid4().hex
        call_id = service.start_call(room, visitor(request))
        token = api.AccessToken(key, api_secret).with_identity("visitor-" + uuid4().hex).with_ttl(timedelta(minutes=5))
        token.with_grants(api.VideoGrants(room_join=True, room=room, can_publish=True, can_subscribe=True,
            can_publish_data=False, can_publish_sources=["microphone"]))
        token.with_room_config(api.RoomConfiguration(agents=[api.RoomAgentDispatch(agent_name=settings.get("LIVEKIT_AGENT_NAME", "bangla-receptionist"))], empty_timeout=60, max_participants=2))
        return {"token": token.to_jwt(), "server_url": url, "call_id": call_id, "max_duration_s": 300}

    @app.post("/internal/calls/start", dependencies=[Depends(agent_auth)])
    def start(data: StartCallInput):
        call_id = service.start_call(data.room_name)
        return service.activate_call(call_id)

    @app.post("/internal/calls/{call_id}/capture", dependencies=[Depends(agent_auth)])
    def capture(call_id: str, data: ExtractionInput):
        return service.capture(call_id, data)

    @app.post("/internal/calls/{call_id}/turn", dependencies=[Depends(agent_auth)])
    def turn(call_id: str, data: TurnInput):
        return service.add_turn(call_id, data)

    @app.post("/internal/calls/{call_id}/end", dependencies=[Depends(agent_auth)])
    def end(call_id: str, data: EndCallInput):
        return service.end_call(call_id, data.failed, data.error_code)

    @app.get("/internal/availability", dependencies=[Depends(agent_auth)])
    def availability(day: str, doctor_id: str, service_id: str):
        return service.availability(day, doctor_id, service_id)

    @app.post("/internal/calls/{call_id}/book", dependencies=[Depends(agent_auth)])
    def book(call_id: str, data: BookingInput):
        return service.book(call_id, data)

    @app.post("/internal/lookup", dependencies=[Depends(agent_auth)])
    def lookup(data: LookupInput):
        return service.lookup(data.reference, data.phone)

    @app.post("/internal/calls/{call_id}/reschedule", dependencies=[Depends(agent_auth)])
    def reschedule(call_id: str, data: ChangeInput):
        return service.change(call_id, data)

    @app.post("/internal/calls/{call_id}/cancel", dependencies=[Depends(agent_auth)])
    def cancel(call_id: str, data: ChangeInput):
        return service.change(call_id, data, cancel=True)

    @app.post("/internal/calls/{call_id}/follow-up", dependencies=[Depends(agent_auth)])
    def follow_up(call_id: str, data: FollowUpInput):
        return service.follow_up(call_id, data)

    return app
