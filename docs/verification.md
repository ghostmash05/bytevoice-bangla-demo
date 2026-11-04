# Verification record — 4 November 2026

## Passed

- 30 hermetic Python tests: phone/reference formats and pipeline configuration; confirmation required; invalid dates,
  doctors, hours and slots; idempotency; concurrent slot collision; cross-call
  booking/reschedule/cancel; wrong-phone lookup rejection; atomic rollback; stale
  version rejection; partial records; callback storage; crash reconciliation;
  staff session/CSRF/rate limits; room-token grants; registered agent tools through
  the actual FastAPI/SQLAlchemy path.
- Next.js 16.4.5 production build with TypeScript using Node 24.22.1.
- Browser: reviewer sign-in, phone search, selection, transcript, saved action,
  mobile back navigation, keyboard tab navigation, record/row focus transfer and
  mobile timezone label. Voice screen correctly reports unconfigured speech.
- LiveKit Inference text smoke test returned Bangla using the authorized project.
- Live LLM + real backend tools scenario in an isolated SQLite database: zero
  appointments before explicit confirmation; exactly one after confirmation.
  Inspected tool trace confirms the requested doctor dr-nadia, scaling, normalized
  phone +8801712345678 and 5 November 2026 11:00 Bangladesh time were saved correctly.
  Partial details were captured before booking. This was text only, not speech.
- Real-time speech audition generated 10.2 seconds of Bangla audio through LiveKit
  Gemini Live/Kore using existing credentials.
- Synthetic spoken booking traversed real WebRTC, native audio recognition, agent
  tools and storage. It saved +8801845678901, dr-nadia, scaling, 5 November 2026
  10:00 Bangladesh time after confirmation; two caller turns and three assistant
  turns were persisted. The caller audio was generated, not a human microphone.
  One confirmation transcription used Devanagari script despite Bangla content;
  a Bengali-script language hint has since been configured and needs rechecking.
- Separate synthetic spoken rescheduling and cancellation calls passed against the
  original appointment. Version advanced from 1 to 2 to 3, cancellation persisted,
  each call finalized as completed, and original action history remained intact.
  Rescheduling transcripts were inspected and used Bengali script. Final script
  checks must exclude shared danda punctuation U+0964 from Devanagari warnings.
- Git staging check found no local credential values, `.env.local`, reviewer login
  file, runtime directories or downloaded tools in staged source.

## Not yet proved

- Human-rated Bangladesh accent, measured latency, interruptions/corrections,
  silence recovery and microphone-denial behavior. The chained Soniox/Azure option
  still lacks credentials; the LiveKit-native realtime path is now usable.
- Hosted PostgreSQL behavior (including actual concurrent writes), public TLS,
  production cookies, provider retention and storage/compute regions.
- Container builds or hosted deployment: Docker is not available locally.
- Public GitHub/CI, reviewer-accessible URLs and final video.
- Final mobile visual sign-off: functional DOM checks show no horizontal page
  overflow at client width375, but the browser capture API intermittently cropped
  or timed out during screenshot collection. Reviewer correctly left visual approval
  pending; it must not be described as a complete visual pass.

The three local portal samples are explicitly **scripted fixtures**. They are not
actual calls and do not replace the brief's requirement for real voice-test records.
