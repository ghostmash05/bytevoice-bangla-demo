# Deployment plan and current evidence

## Current state

Local backend/portal and LiveKit authorization are verified. A Supabase Free
PostgreSQL database is provisioned in Mumbai, with 15 booking tests and RLS checks
passed. No public website, backend or hosted agent has been deployed. Docker is
not installed on this development machine, so Dockerfiles are unbuilt starting points.
Do not claim container verification based on passing local Python/Next.js checks.

## Services

1. PostgreSQL, optionally Supabase. Apply the initial SQL in
   `supabase/migrations/202611040001_initial.sql`. It enables RLS without browser
   policies: direct anonymous/authenticated browser access must stay denied. The
   backend connects with a trusted server-side role. Record the actual database
   region. Local SQLite is not a substitute for persistent cloud storage.
2. Backend container from `Dockerfile.backend`, HTTPS public endpoint. Configure
   DATABASE_URL, AGENT_API_SECRET, REVIEWER_USERNAME, REVIEWER_PASSWORD_HASH,
   APP_ENV=production, COOKIE_SECURE=true, WEB_ORIGINS=<exact HTTPS frontend origin>,
   LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_AGENT_NAME and the three
   speech settings used by readiness checking. No secrets belong in image build args.
3. Next.js portal/browser caller from `web`, Node 24. Its backend proxy destination
   is a **nonsecret** BACKEND_URL build-time setting. Root repository/shared must be
   available during build; the web app imports shared/clinic.json. A container option
   is `Dockerfile.web` built from the repository root. Browser calls need HTTPS.
4. Python agent via the authenticated project-local LiveKit CLI. Configure
   BACKEND_URL, AGENT_API_SECRET and speech/model settings as deployment secrets.
   `lk agent create` uses `Dockerfile`. Keep the dispatch name bangla-receptionist.
   Choose an available nearby compute region after checking the free plan supports it;
   do not claim or enable paid region pinning. LiveKit project data region observed
   in the dashboard is United States, separate from compute/database regions.

The same AGENT_API_SECRET must be set on the backend and worker. Backend DATABASE_URL
and reviewer password hash are not needed by the worker or browser. HTTPS backend
origins/cookie checks fail closed in production. ASGI forwarded-header trust must be
configured for the actual hosting proxy; do not trust arbitrary client forwarding headers.

## Credential and account gates

LiveKit access is authorized and its Gemini Live realtime path has produced audio
and a synthetic spoken booking locally. Soniox/Azure Speech are optional for the
alternative chained path and are not connected. Trial/credit
balances must be verified before testing; the consumer Soniox app free plan is not
the API plan. Do not buy credits or upgrade plans without specific approval.
New account agreements or expanded persistent access may require action-time
approval even while routine work has been delegated. Continue independent local
work when a provider signup cannot be completed.

The current Vercel CLI authentication is invalid (`vercel whoami` failed). Routine
re-authentication or browser deployment is still needed; no deployment is claimed.

For VOICE_PIPELINE=realtime, the worker needs REALTIME_MODEL and REALTIME_VOICE
instead of external speech keys. Model usage consumes LiveKit inference credits.
The current agent explicitly sets `record=False` on its session. The first fake
audio test ran before that override and LiveKit's default observability recording
was enabled; do not claim that historical test was unrecorded.

## Hosted verification gate

- Health check must confirm persistent PostgreSQL, then rerun booking/concurrency
  scenarios against a dedicated fake-data test environment.
- Login through the final frontend origin; verify Secure/HttpOnly cookies, CSRF,
  logout and that unauthenticated API requests cannot read patient details.
- Complete actual Bangla browser calls for booking, rescheduling and cancellation,
  including a new session between operations. Check the real stored records.
- Audition Bangladesh accent, mixed speech, interruptions, wrong numbers, dates,
  silence, unavailable slots, provider failures and medical-question boundaries.
- Turn the local machine off or disconnect local workers and confirm the hosted
  agent and portal remain usable. Keep them up through assessment.
- Preload actual fake-patient voice-call records; scripted fixtures alone do not
  fulfil the brief's test-call evidence.
- Prepare accessible repository/README, <=3-minute demonstration video and the four
  final submission links. Do not send the HR submission automatically.
