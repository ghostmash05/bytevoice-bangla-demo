# Bangla Receptionist — StrategyByte technical assessment

A custom Bangladeshi Bangla receptionist for a fictional dental clinic, with
transactional appointment tools and an authenticated call-record portal.

## Verified state

The November 4 call review and dashboard authentication boundary are documented
in [docs/call-review-2026-11-04.md](docs/call-review-2026-11-04.md). `/portal`,
its data-model explorer and its internal voice test require server-validated
reviewer sessions; `/try` is a separate public caller. The LiveKit-billed realtime
allowance was exhausted on November 4; the agent now supports direct Google
Gemini Live using a dedicated free-tier ByteVoice project. See
[docs/google-direct.md](docs/google-direct.md) for migration evidence and limits.

- Hosted portal: https://bytevoice-bangla-portal.vercel.app/portal
- Direct browser caller: https://bytevoice-bangla-portal.vercel.app/try
- Hosted API: https://bytevoice-bangla-api.vercel.app/api/health
- Supabase Free PostgreSQL in Mumbai; all nine application tables have RLS enabled.
- Custom Python worker deployed on LiveKit Cloud in Mumbai, dispatch name
  `bangla-receptionist`. All local app services are stopped.
- Three separate synthetic audio calls booked, rescheduled and cancelled the same
  appointment through the hosted worker/API/database. All calls completed, each
  retained five transcript turns, and appointment versions advanced 1 → 2 → 3.
  Bengali caller transcripts were retained in these runs.
- Hosted browser reviewer sign-in, call list, transcript, extracted details and
  action history verified. Production Secure/HttpOnly cookies, CSRF, origin checks,
  logout and unauthenticated access rejection passed.
- 53 hermetic Python tests and 18 PostgreSQL booking tests passed, including
  concurrency protection and failed-reschedule rollback. Linux GitHub CI passed.
- A human Safari microphone booking succeeded after the stalled-turn recovery
  update; the tester reported a good overall experience.
- A longer eight-turn synthetic call saved one booking after a late name correction.
- An audible-interruption test retained the corrected phone and interrupted turn;
  the unconfirmed callback remained incomplete with no saved action.
- Spoken goodbye and automatic room closure verified with a received farewell and
  ROOM_DELETED disconnect reason. The browser treats this as a normal ending.
- A silent WebRTC caller received one check-in and a farewell before automatic
  closure; no appointment or callback was created.
- Dedicated Bengali STT now supplies caller captions and stored caller transcript
  segments. A live synthetic test confirmed matching displayed/saved text.
- An isolated audio-path test forced three booking-write failures. The agent
  explained the booking had not succeeded; no appointment was created.
- Synthetic client-observed response timing was roughly 1.3-2.4 seconds in recent
  tests; this is not a calibrated human end-of-speech benchmark.
- Scripted fixture rows and synthetic voice calls are labelled separately.

**Remaining review and handoff:** consistent real-speaker Bengali captions and
formal accent review remain unverified. The repository stays private until the
user makes it public before submission. The overview video remains a separate
submission deliverable. Detailed evidence and limits are in `docs/verification.md`.
The requirement-by-requirement cross-check against the supplied four-page brief is
in [docs/task-brief-audit.md](docs/task-brief-audit.md), including remaining
submission deliverables and the exact deadline.

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

The direct Google path uses Gemini Live speech-to-speech through Google's Gemini
API (`VOICE_PIPELINE=realtime`, `REALTIME_PROVIDER=google`), with Google-native
caller captions (`REALTIME_STT_MODEL=`) and Bengali/English transcription hints.
This avoids the exhausted LiveKit inference allowances. Google's key
stays server-side; billing is not enabled for the assessment Google project.
`REALTIME_PROVIDER=livekit` retains the previous LiveKit-billed realtime path,
whose free realtime credits were exhausted on November 4. Native transcription had
occasionally rendered Bengali speech in Hindi script; original test evidence is
retained rather than translated or overwritten. A configurable alternative,
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
It does not overwrite existing credentials. Add the LiveKit project credentials directly to `.env.local`. Separate speech keys
are only needed for the optional chained pipeline.

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
- `/` is the Bangla-first public landing page with an English switch and a live
  Bangla call action. The hero uses Paul Henschel’s
  [Glass Flower scene](https://github.com/pmndrs/examples/tree/ca032218ce77b7ad4c752ddaa63b0d1625d2b9f3/examples/glass-flower)
  and the [Three.js Points Waves example](https://github.com/mrdoob/three.js/blob/r187/examples/webgl_points_waves.html)
  as a full-width floor layer. The original model, color lookup table and studio
  lighting are served locally. The [Blue Photo Studio HDRI](https://polyhaven.com/a/blue_photo_studio)
  is from Poly Haven. Source notices are in `web/public/landing/reference`.

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
