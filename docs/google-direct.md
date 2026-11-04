# Direct Google Gemini Live — November 4 migration

The free LiveKit realtime gateway credits were exhausted. Transport, managed
worker hosting and speech recognition use separate allowances, so moving the
worker to another server would not solve that particular rejection.

## Configuration

- Google AI Studio project: **ByteVoice Bangla**, `gen-lang-client-0396568055`.
- Project billing tier: **Free**. Billing was not enabled.
- Dedicated key: **ByteVoice Bangla Agent**, stored only in ignored local files
  and the existing LiveKit worker's server secrets, with explicit user approval.
- `VOICE_PIPELINE=realtime`, `REALTIME_PROVIDER=google`,
  `GOOGLE_REALTIME_MODEL=gemini-3.8-live`, `REALTIME_VOICE=Kore`.
- `GOOGLE_API_KEY` is required in Google mode. Explicit `vertexai=False` ensures
  the plugin uses the Gemini API rather than ambient Vertex credentials.
- LiveKit remains responsible for WebRTC transport and worker hosting.
  `REALTIME_STT_MODEL=` selects Google-native captions with Bengali/English
  language hints. The first hosted migration test retained Speechmatics, but
  that LiveKit STT connection also returned HTTP 429 and closed the call. It was
  removed from this configuration; the failed run is not a passed audio test.
- `REALTIME_PROVIDER=livekit` preserves the old integration for explicit use.
  There is no automatic fallback that could hide quota failures or change billing.

The earlier ByteVoice-named key created in the existing scholarly project is
unused. It was not copied into this deployment and has not been deleted.

## Observed limits and validation

AI Studio's model table for the dedicated project showed Gemini 3.8 Live at
65,000 input tokens/minute, with Unlimited in the RPM and RPD columns. This is
not proof of unlimited concurrency, guaranteed capacity or permanent entitlement.
Check the account's current limits before an assessment or further testing.

The direct provider connected and completed three fictional text-input scenarios
with isolated local tools/storage: phone refusal, an unrelated medical enquiry,
and a confirmed dental callback. No appointments were created; the callback
was saved only after confirmation. The final callback response explicitly denied
automatic contact, immediate transfer and a promised contact time. These checks
establish connectivity and stored actions, not speech recognition or accent.

All 53 Python regression tests passed, and `pip check` found no broken package
requirements. Worker source commit `a777af8` deployed as `Tk393h52g2S9` and
reached Running. Provider keys are absent from Git and the browser bundle.

## References

- [LiveKit Google realtime plugin](https://docs.livekit.io/agents/models/realtime/gemini/)
- [Google API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Google account rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)

Free-tier Google content may be used for product improvement. Continue using
fictional patient details only for this assessment.
