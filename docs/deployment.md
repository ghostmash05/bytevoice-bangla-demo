# Deployment state and operations

## Live services

- Portal/caller: https://bytevoice-bangla-portal.vercel.app (`web` root, Next.js,
  Node 24). Explicit web/vercel.json overrides the root FastAPI preset.
- API: https://bytevoice-bangla-api.vercel.app (root FastAPI entrypoint
  backend.server:app, Python 3.13, Mumbai/bom1).
- Database: Supabase Free bytevoice-bangla, project tnwcqjoetnttebzuyrlq,
  Mumbai. ORM schema created and RLS enabled on all nine application tables with
  no anonymous read policies. No public browser DB connection is used.
- Voice worker: CA_zNpyeqdHLhd2, LiveKit project p_62otl5m7sxf, ap-south/Mumbai,
  dispatch name bangla-receptionist. LiveKit project data region was United States,
  which is separate from agent compute and database regions.

Hosted synthetic booking/rescheduling/cancellation passed with the local worker,
API and portal processes stopped. A human Safari booking was subsequently confirmed successful; formal voice/caption
quality review remains pending.
No paid plan, telephony number, custom domain or voice clone was enabled.
Included quotas and inference credits are finite; this is not unlimited free usage.

## Configuration

The API uses DATABASE_URL, AGENT_API_SECRET, REVIEWER_USERNAME,
REVIEWER_PASSWORD_HASH, APP_ENV=production, COOKIE_SECURE=true,
WEB_ORIGINS=https://bytevoice-bangla-portal.vercel.app, LIVEKIT_URL,
LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_AGENT_NAME, and VOICE_PIPELINE.
User approved storing these project credentials in sensitive Vercel variables.
Production fails closed without PostgreSQL, secure cookies and HTTPS origins.
The transaction pool URL requires TLS; provider metadata is stripped before libpq,
and psycopg prepared statements are disabled for transaction-pool compatibility.

The portal only has the nonsecret BACKEND_URL build-time setting. Never add API
keys, database passwords or reviewer secrets to NEXT_PUBLIC_ variables.

The worker receives BACKEND_URL, AGENT_API_SECRET, APP_ENV, dispatch name and
voice/transcription model settings. Direct Google mode additionally receives
GOOGLE_API_KEY as a server secret. LiveKit supplies its project credentials.
The configuration accepts its injected HTTPS service URL as well as WSS.
The worker does not receive database credentials or the reviewer password/hash.
VOICE_PIPELINE=realtime with REALTIME_PROVIDER=google uses the Google plugin,
GOOGLE_REALTIME_MODEL=gemini-3.8-live and Kore, plus Speechmatics/linden-1 Bengali
captions. The dedicated Google project is ByteVoice Bangla, on the free tier;
no billing is enabled. REALTIME_PROVIDER=livekit is the previous connection, not
an automatic fallback when Google fails. VOICE_PIPELINE=chained remains an optional Soniox/Azure alternative
requiring separate accounts. Usage consumes provider/LiveKit inference credits.

Application audio recording is disabled with session.start(record=False).
The first historical local fake-audio test ran before that override. Test scripts
save synthetic recordings locally on purpose. Verify provider/observability
retention before handling real data; use fictional details only for this demo.

## Update the hosted worker

The LiveKit CLI expects to find livekit-agents in its root dependency manifest.
The repository root is the lightweight API, so export the worker build context:

```powershell
.\.venv\Scripts\python.exe -m scripts.prepare_agent_deploy
.\.tools\livekit\lk.exe agent deploy .local\agent-deploy --secrets-file .local\agent-production.env --yes
.\.tools\livekit\lk.exe agent status --config .local\agent-deploy\livekit.toml
```

The ignored context contains only worker source, clinic facts, Dockerfile and
requirements. A SHA-256 source manifest records exactly what was exported.
Container builds have passed remotely on LiveKit; Docker is not installed locally.
Dockerfile.backend and Dockerfile.web remain unbuilt alternatives to Vercel.
Never commit .env files, local credentials, recordings or livekit.toml.

Git pushes trigger Vercel and GitHub CI. This repository uses the authenticated
GitHub account noreply commit address so Vercel can associate commits correctly.
A transient GitHub HTTP/2 push failure was resolved using HTTP/1.1; do not rewrite
history or weaken repository access controls to fix deployment failures.

## Final verification and submission gates

### Dashboard route protection

The public entry points are `/try` and `/login`. Every `/portal` page requires a
backend-validated session on the server, including `/portal/data-model` and
`/portal/voice-test`. The route proxy only redirects missing cookies early; it is
not the authentication authority. The server session fetch uses `BACKEND_URL`
and forwards the existing HttpOnly cookie without caching. A failed session
service fails closed. Safe workspace deep links survive sign-in; external
return URLs are rejected.

After deploying, run `.venv\Scripts\python.exe -m scripts.verify_web_auth
https://bytevoice-bangla-portal.vercel.app` to check anonymous, forged, valid and
revoked sessions, public caller isolation and safe return paths. This script
uses ignored reviewer credentials, creates its own session and revokes it; it
does not modify call records.

- Confirm graceful hang-up in the human browser, and review real-speaker captions.
- Bangladesh-accent review, mixed speech, deliberate interruptions, phone/time
  corrections, silence, unavailable slots and voice-level backend failure recovery.
- Final mobile visual review and full reviewer login/logout from the final origin.
- Accessible source/reviewer credentials and <=3-minute demonstration video.
- Keep hosted services within available quotas and running during assessment.
- Do not send the HR submission automatically. Landing page remains deferred.
