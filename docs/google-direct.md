# Direct Google Gemini Live — November 4–5 migration

The free LiveKit realtime gateway credits were exhausted. Transport, managed
worker hosting and speech recognition use separate allowances, so moving the
worker to another server would not solve that particular rejection.

## Configuration

- Google AI Studio project: **ByteVoice Bangla**, `gen-lang-client-0396568055`.
- Project billing tier: **Free**. Billing was not enabled.
- Dedicated key: **ByteVoice Bangla Agent**, stored only in ignored local files
  and the existing LiveKit worker's server secrets, with explicit user approval.
- `VOICE_PIPELINE=realtime`, `REALTIME_PROVIDER=google`,
  `GOOGLE_REALTIME_MODEL=gemini-3.8-live`, `REALTIME_VOICE=Sulafat`.
- `GOOGLE_API_KEY` is required in Google mode. Explicit `vertexai=False` ensures
  the plugin uses the Gemini API rather than ambient Vertex credentials.
- LiveKit remains responsible for WebRTC transport and worker hosting.
  `REALTIME_STT_MODEL=native` (or empty) selects Google-native captions with Bengali/English
  language hints. The first hosted migration test retained Speechmatics, but
  that LiveKit STT connection also returned HTTP 429 and closed the call. A
  gateway diagnostic confirmed STT credits were exhausted with remaining limit
  zero. It was
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
requirements. GitHub backend and portal checks passed for source commit
`3ccb870`. The final native-caption worker deployed as `sM7Bu8rhP2vp`.
Provider keys are absent from Git and the browser bundle.

At 00:03 Bangladesh time on November 5, the hosted synthetic WebRTC call completed
with one confirmed callback, the exact corrected phone and no appointment
actions. The request was not saved before confirmation. Caller captions were
retained in Bengali script; assistant transcript included the correction readback,
explicit demo/no-actual-call disclosure and farewell. The database call finalized
as completed. Ignored evidence: `.local/audio-callback-e2e.json`,
`.local/call-review/google-native-callback.log` and synthetic received audio.
This establishes the tested audio/tools/storage path. The user later tested the
direct route successfully and, after the Sulafat/calmer-delivery update, reported
that the voice was much better. Recognition and accent remain dependent on the
speaker and call conditions.

## November 5 voice tuning

The deployed voice changed from Kore to Sulafat, with instructions for a calmer,
steady register. Google automatic activity detection uses low end-of-speech
sensitivity and 1,400 ms of silence before committing a turn. A hosted synthetic
call confirmed that a one-second gap between digit groups did not trigger agent
speech. The full eleven-digit mobile was captured exactly, and no appointment was
saved without confirmation.

## References

- [LiveKit Google realtime plugin](https://docs.livekit.io/agents/models/realtime/gemini/)
- [Google API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Google account rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)

Free-tier Google content may be used for product improvement. Continue using
fictional patient details only for this assessment.
