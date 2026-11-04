# Bangla Receptionist — StrategyByte technical assessment

A custom Bangladeshi Bangla receptionist for a fictional dental clinic, with
transactional appointment tools and an authenticated call-record portal.

## Verified state

- LiveKit CLI authorized for ByteVoice Bangla; credentials stored only locally.
- Python backend and Next.js staff portal run locally.
- 33 automated tests pass, including concurrent booking protection, cross-call
  changes, failed-reschedule rollback, authentication and actual agent-tool/API integration.
- Portal production build and TypeScript check pass.
- Browser checks exercised sign-in, phone search, record selection, saved-action
  history, mobile navigation and the unavailable-provider error state.
- LiveKit text inference and a real-model booking-tool scenario passed; no booking
  occurred before confirmation and the correct appointment was saved afterward.
- Generated a Bangla speech sample and completed a synthetic spoken booking through
  actual LiveKit WebRTC/native speech. The requested phone, doctor, service and slot
  were persisted, with caller/assistant transcript turns. Human accent review is pending.
- Separate synthetic spoken rescheduling and cancellation calls also passed,
  updating the same appointment and preserving its history across sessions.
- HTTPS backend deployed at https://bytevoice-bangla-api.vercel.app with PostgreSQL;
  production cookie, CSRF, logout and anonymous-read checks passed.
- LiveKit worker container built and deployed in Mumbai; cloud voice validation is in progress.
- Private GitHub repository pushed; Linux CI passed backend tests and the portal build.
- Supabase Free database created in Mumbai; 15 booking tests passed in isolated
  PostgreSQL schemas, and RLS is enabled on all nine public application tables.
- Synthetic spoken callback saved a corrected phone only after confirmation.
  Native transcription sometimes used Hindi script. Dedicated Bengali STT has been
  added; one further local callback test retained Bengali caller transcripts.
- Three records are explicitly labelled **scripted test fixtures**, not voice calls.

**Not verified or complete:** human-microphone conversations, listener-rated
Bangladeshi accent/latency, audio interruption/correction scenarios, full browser-to-cloud voice workflows, portal deployment,
video and submission. Dockerfiles and PostgreSQL DDL are prepared
but have not been built/applied. The landing page is excluded by the user's instruction.
Detailed evidence and remaining verification limits are in `docs/verification.md`.

## Architecture

```text
Browser /try ── WebRTC ── LiveKit Cloud ── Python voice agent
      │                                      │
      │ short-lived token                    │ private authenticated tools
      ▼                                      ▼
Next.js /api proxy ────────────────────── FastAPI clinic API
      │                                      │
Staff portal /portal                        PostgreSQL (deployment)
                                             SQLite (local development)
```

The current audition path is Gemini Live speech-to-speech through existing LiveKit
Inference credentials (`VOICE_PIPELINE=realtime`). A configurable alternative,
`VOICE_PIPELINE=chained`, uses Soniox STT → LiveKit Inference LLM → Azure Bangladesh
Bangla TTS, with Silero VAD/STT endpointing; that alternative still needs separate
provider accounts. Voice choice remains provisional until a Bangladeshi listener
reviews the sample. The agent has tools for partial detail capture,
availability, booking, verified lookup, rescheduling, cancellation and staff callback.
It confirms success only after a successful backend response.

## Local setup

Requirements: Python 3.13 and Node 24 (tested). The installed web toolchain includes
a dependency requiring Node >=22.22. Do not use the machine's older Node 20 default
for the production build. GitHub Actions is configured with Node 24/Python 3.13.

```powershell
Set-Location 'F:\Projects\Agentic\bangla-receptionist'
# For a fresh checkout:
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-agent.txt
# Copy only if it does not exist:
Copy-Item .env.example .env.local
.\.venv\Scripts\python.exe -m backend.setup_local
```

`backend.setup_local` creates a strong agent API secret and hashes a generated
reviewer password. The local login is in ignored `.local/reviewer-credentials.txt`.
It does not overwrite existing credentials. Add speech keys directly to `.env.local`.

In one terminal:

```powershell
.\.venv\Scripts\python.exe -m backend
```

In another terminal, using Node 24:

```powershell
Set-Location web
npm ci
npm run build
npm start
```

On this computer, the bundled Node 24 executable is:
`C:\Users\mjs80\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`.
It can run `web\node_modules\next\dist\bin\next` directly with `build` or `start`.

- Portal: http://127.0.0.1:3000/portal
- Browser voice test: http://127.0.0.1:3000/try
- API health: http://127.0.0.1:8000/api/health
- Development API documentation: http://127.0.0.1:8000/api/docs
- `/` redirects to the staff portal; no landing page has been created.

For optional **local-only scripted fixtures**, run:
`.\.venv\Scripts\python.exe -m backend.fixtures --confirm-test-data`.
These exercise storage and UI; do not present them as successful voice tests.

## Start the voice worker

```powershell
.\.venv\Scripts\python.exe -m agent.config
.\.venv\Scripts\python.exe -m livekit.agents download-files
.\.venv\Scripts\python.exe -m agent.main dev
```

The settings check prints only names and SET/MISSING, not secret values. Once
providers are connected and the backend is running, use `/try` or the LiveKit Agent
Console with dispatch name `bangla-receptionist`. No call is marked successful just
because a WebRTC room connected. Microphone permission and live audio still need testing.

## Data and booking correctness

`shared/clinic.json` is the single source for fictional clinic facts. See
`docs/clinic-spec.md` for conversation and booking rules. Appointments use UTC
storage and Asia/Dhaka presentation; local date/time inputs are interpreted in
Bangladesh. Only half-hour slots within opening hours and the 14-day horizon are valid.

A partial unique index enforces one active booking per doctor/slot. Booking and
its action history commit together. Rescheduling is atomic; a collision rolls
back the move and retains the old booking. Expected-version checks prevent stale
changes. Deterministic retry keys prevent duplicate writes. Patient lookup requires
both booking reference and matching normalized phone. This demo treats a normalized
mobile number as one patient identity; shared family numbers are a documented limitation.

Call status and business outcome are separate. Each finalized transcript turn has
speaker, timestamp and text. Partial details are saved during calls. Worker shutdown
flushes queued transcript writes; failures are flagged. Stale connections are
reconciled after six minutes so interrupted sessions do not remain live forever.

## Authentication and privacy

Staff authentication uses Argon2 password hashing, expiring server-side sessions,
HttpOnly/SameSite cookies and CSRF protection for authenticated writes. This is
server-managed reviewer authentication, not Supabase Auth. PostgreSQL can be hosted
on Supabase; the exported schema enables RLS to prevent direct browser table access.
The trusted backend needs an appropriate database role. No public database key is used.

Agent workers authenticate to the backend using a separate server-only secret.
The frontend receives only short-lived microphone-only room tokens. Tokens use
opaque identities and unique rooms; project API secrets never enter client bundles.
Connection/login rates are limited with persistent atomic counters. No automatic
paid upgrades, development token server, telephony numbers or voice cloning are enabled.

Use fake patient data only. The application stores transcripts, extracted fields
and actions, not audio recordings. Review provider/LiveKit observability retention
before real use. This is an assessment demo, not a production healthcare system.

## Tests and deployment

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
.\.venv\Scripts\python.exe -m pip check
Set-Location web
npm run typecheck
npm run build
```

Windows development package versions are recorded in `requirements-lock.txt`; Linux
containers resolve from pinned direct dependencies separately. Deployment steps,
secret names, storage regions and remaining gates are in `docs/deployment.md`.
Account instructions are in `docs/accounts.md`; acceptance scenarios and the full
assessment submission checklist are in `docs/workflow.md`.
