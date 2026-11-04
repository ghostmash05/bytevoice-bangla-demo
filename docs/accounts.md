# Account and credential setup

## LiveKit (existing)

- Project: ByteVoice Bangla, `p_62otl5m7sxf`.
- URL: `wss://bytevoice-bangla-yjvpjhfv.livekit.cloud`.
- Dashboard-observed plan: Build; 1 cloud-deployed agent, 5 concurrent agent sessions.
- Dashboard-observed project data region: United States. This is not a claim about
  the future Supabase database region or the eventual agent compute region.
- CLI access was explicitly approved and authorized for this project. Its generated
  key is stored in the user-level LiveKit CLI configuration and local `.env.local`.
- Keep the development token server off. Backend-issued tokens will be used.
- Do not create telephony numbers: the brief requires browser calls.
- Do not change subscriptions, add payment methods or enable paid extras.

Custom-code deployment uses the official LiveKit CLI. A browser-built prompt agent
is not a substitute for our custom booking tools and persistence.

The original manually created key was left untouched. Credentials
belong only in local ignored files and server deployment secrets, never in chat,
screenshots, client bundles, public READMEs or Git history.

## Soniox (not set up)

Optional for the alternative chained pipeline. The current realtime audition path
uses LiveKit Inference/Gemini Live and does not require Soniox or Azure accounts.

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

## Later

Supabase: database and reviewer authentication. Web hosting: deploy Next.js frontend.
Choose these after the speech prototype works; document all limits and regions.

Official references:
- https://docs.livekit.io/agents/start/voice-ai/
- https://docs.livekit.io/agents/models/stt/soniox/
- https://docs.livekit.io/agents/models/tts/azure/
- https://livekit.com/pricing
- https://soniox.com/pricing
- https://azure.microsoft.com/en-us/pricing/details/speech/
