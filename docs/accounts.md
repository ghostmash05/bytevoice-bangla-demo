# Account and credential setup

## LiveKit (existing)

- Project: ByteVoice Bangla, `p_62otl5m7sxf`.
- URL: `wss://bytevoice-bangla-yjvpjhfv.livekit.cloud`.
- Dashboard-observed plan: Build; 1 cloud-deployed agent, 5 concurrent agent sessions.
- Dashboard-observed project data region: United States. This is not a claim about
  database or agent compute regions: both deployed services now run in Mumbai.
- CLI access was explicitly approved and authorized for this project. Its generated
  key is stored in the user-level LiveKit CLI configuration and local `.env.local`.
- Keep the development token server off. The hosted backend issues short-lived browser tokens.
- Do not create telephony numbers: the brief requires browser calls.
- Do not change subscriptions, add payment methods or enable paid extras.

Custom-code deployment uses the official LiveKit CLI. A browser-built prompt agent
is not a substitute for our custom booking tools and persistence.

The original manually created key was left untouched. Credentials
belong only in local ignored files and server deployment secrets, never in chat,
screenshots, client bundles, public READMEs or Git history.

## Soniox (not set up)

Optional for the alternative chained pipeline. The current realtime path
uses LiveKit Inference/Gemini Live with dedicated Speechmatics Bengali captions and does not require Soniox or Azure accounts.

Create an API account at https://console.soniox.com/ and inspect API credits/billing.
The Soniox consumer app free plan is not evidence of free API usage. Do not purchase
credits automatically. Place the API key in SONIOX_API_KEY in `.env.local`.

## Azure Speech (not set up)

Optional for VOICE_PIPELINE=chained; retain this route for a voice comparison if
the native realtime voice does not meet the Bangladeshi accent requirement.

Create an Azure Speech resource using the Free F0 tier if the account/region permits.
Keep its key and region in AZURE_SPEECH_KEY and AZURE_SPEECH_REGION. Do not silently
choose paid S0 if F0 is unavailable. First audition `bn-BD-NabanitaNeural` and
`bn-BD-PradeepNeural`; the selected initial voice is configurable, not final.

## Supabase and Vercel (connected)

Supabase Free database bytevoice-bangla is provisioned in Mumbai. The user approved
its Vercel integration terms. All nine application tables use RLS without public
read policies. Staff authentication is implemented by the backend with Argon2 and
server-side sessions; it does not depend on Supabase Auth.

The API and portal are deployed on the existing Vercel Hobby account. The user
approved uploading the project database connection string, LiveKit credentials,
agent secret and reviewer password hash as sensitive server environment variables.
The plaintext reviewer password remains in ignored local credentials. The portal
only receives the nonsecret backend URL as a build setting.

No new paid subscription, payment method or paid add-on was enabled. LiveKit
inference and hosting still have finite included allowances. Check their dashboards
before prolonged demonstrations; do not imply unlimited free usage.

Official references:
- https://docs.livekit.io/agents/start/voice-ai/
- https://docs.livekit.io/agents/models/stt/soniox/
- https://docs.livekit.io/agents/models/tts/azure/
- https://livekit.com/pricing
- https://soniox.com/pricing
- https://azure.microsoft.com/en-us/pricing/details/speech/
