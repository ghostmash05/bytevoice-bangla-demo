# Verification record — 4 November 2026

## Passed

- 50 hermetic Python tests: phone/reference formats and pipeline configuration; confirmation required; invalid dates,
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

## Initial limitations (later verification recorded below)

- Human-rated Bangladesh accent, measured latency, interruptions/corrections,
  silence recovery and microphone-denial behavior. The chained Soniox/Azure option
  still lacks credentials; the LiveKit-native realtime path is now usable.
- Provider retention details and a full human browser call; PostgreSQL concurrency,
  public TLS and production authentication were subsequently checked below.
- Alternative backend/web Dockerfiles are unbuilt; the agent container subsequently
  built successfully on LiveKit Cloud.
- Final demonstration video and reviewer access to the private repository.
- Final mobile visual sign-off: functional DOM checks show no horizontal page
  overflow at client width375, but the browser capture API intermittently cropped
  or timed out during screenshot collection. Reviewer correctly left visual approval
  pending; it must not be described as a complete visual pass.

The three local portal samples are explicitly **scripted fixtures**. They are not
actual calls and do not replace the brief's requirement for real voice-test records.

## Additional checks

- Private repository ghostmash05/bytevoice-bangla-demo pushed. GitHub Actions run
  41800760558 passed Linux Python checks and Node 24 portal build at commit 4ad2988.
- Supabase Free database bytevoice-bangla created in Mumbai (bom1). PostgreSQL 17.11
  connectivity verified. All 15 booking tests passed using explicit per-test schemas;
  startup search_path options are ignored by the Supabase pooler and must not be
  used for test isolation. The first attempt consequently shared fake test data.
- All nine public application tables have RLS enabled, with zero public policies.
- Callback/corrected-phone synthetic call passed with four user turns; saved phone
  +8801712345679. Reviewed response declined medication/dosage advice. Original
  confirmation transcript was rendered in Hindi despite Bengali speech/hint, so
  reliable Bengali-script transcription remains an open issue.
- Test caller now waits for agent listening state and quiet audio before the next
  turn; previous fixed delay accidentally interrupted long spoken responses.

## Hosted deployment progress

- API: https://bytevoice-bangla-api.vercel.app/api/health returns 200 and
  storage=postgresql. Unauthenticated call-list and private-tool requests return 401.
- Hosted reviewer login, Secure/HttpOnly/SameSite cookie flags, CSRF/origin rejection
  and logout verified; Supabase anonymous REST read returned no call rows.
- Agent CA_zNpyeqdHLhd2 deployed in ap-south. Container builds completed remotely;
  the local worker has been stopped. Initial cloud call failed because LiveKit
  injects an HTTPS URL; configuration now accepts both HTTPS and WSS securely,
  with two additional tests. Cloud voice scenarios are being rerun.
- Dedicated Speechmatics/linden-1 Bengali STT audited the same synthetic recording
  that native transcription had rendered in Hindi. The subsequent local full
  callback call retained Bengali caller turns and saved the corrected phone.
- Portal project created, but first build inherited the API preset. Explicit web
  Next.js configuration and Node 24 setting added. Git-triggered builds also
  identified an unrecognized old commit email; local repository author identity
  is being corrected to the authenticated GitHub account noreply address.

## Hosted end-to-end results

All local API, web and voice-worker processes are stopped. Hosted portal and API
are live, and the worker is registered on LiveKit Cloud in ap-south. Cloud agent
version after the secure-URL fix was deployed from commit 5f08fe6.

| Synthetic voice call | Call ID | Result |
|---|---|---|
| Booking | fa0cae44-4c3a-46cc-a9fa-e8f77240f528 | Completed; version 1 |
| Reschedule | 73900101-cafc-4a6f-b92f-5b1fabc31589 | Completed; version 2 |
| Cancellation | e2a8d9cb-a0e5-49ca-8fe5-191a7fbf19cb | Completed; cancelled, version 3 |

These calls changed the same appointment, reference DDC-36063772. Each retained
five speaker/timestamp transcript turns. Stored transcripts contained no Devanagari
letters in these runs. This is limited synthetic evidence, not a guarantee of
all-speaker transcription quality or human-rated Bangladeshi accent.

Hosted browser sign-in and the rescheduling record's Conversation, Details and
Activity tabs were directly inspected. The saved activity showed the returned
reference, doctor, scaling service and 5 November 10:30 Bangladesh appointment.
The five rows created by the first PostgreSQL test-harness attempt were explicitly
labelled scripted fixtures; real WebRTC synthetic calls are labelled separately.
Evidence screenshot: .local/hosted-portal-activity.png (ignored, fake details only).
Original local voice reports are archived in .local/local-voice-evidence; current
three operation reports reflect the cloud tests. Private GitHub CI passed fe23d6f.

## Human-call regression and graceful ending

A human tester reported a stall after the final booking confirmation. The saved
record contained that confirmation but no appointment action. Original runtime
logs did not reveal a cause; recording/observability was disabled. Do not claim a
specific provider defect was proven. The agent now has a bounded stalled-reply
retry, privacy-safe tool status logs and a failed-session exit if recovery fails.
The browser surfaces unexpected agent departures and ends immediately on manual
hang-up instead of waiting for the transport promise.

The tester retried on Safari and reported that the call did not pause and the
overall experience was good. The authoritative record contained one saved booking.
A separate eight-turn synthetic field-by-field call with a late name correction
also saved exactly one appointment after confirmation (17 transcript turns).
Its measured synthetic response intervals were 1.273-2.143 seconds. A separate
medical callback/corrected-phone call passed, with approximate intervals
1.353-2.126 seconds. These are client test-file-publication-end to received voiced
sample measurements, not calibrated human end-of-speech latency.

The interruption test observed active agent audio 0.01 seconds before the caller
interrupted, retained an interrupted assistant turn and the corrected phone. It
also exposed a sticky enquiry outcome: a subsequent unconfirmed callback was being
marked completed. That state transition was fixed and covered by regression tests;
all 18 PostgreSQL booking tests passed in isolated schemas. The full interruption
scenario then passed against the updated hosted backend: call
87e2a603-af27-47f4-ae1d-b04ff9a77b3d retained one interrupted assistant turn and the
corrected phone, with zero actions or callbacks before confirmation. The final
business outcome was incomplete. Evidence: .local/audio-interruption-e2e.json.

After the tester noted the missing automatic hang-up, finish_call was added. It
waits for current speech, queues a short farewell, drains the session and deletes
the room. The caller receives a graceful-ending attribute so the browser shows a
normal ending. Live synthetic verification received the farewell text/audio and
ROOM_DELETED, then the saved call finalized without a failure. Evidence is in
.local/audio-goodbye-e2e.json and .local/audio-goodbye-agent.wav. No appointment was
requested in this goodbye-only test, so its business outcome remains incomplete.
The production browser bundle was checked for the new ending-state handling.

Silent WebRTC call e6893ab9-b373-4cb1-8f25-64a91e869c08 passed on worker version
Q699gHYCkKkZ: greeting, one check-in after roughly 25 seconds of idle listening,
then a spoken farewell after another idle interval, followed by ROOM_DELETED.
The stored call ended as incomplete with zero appointment actions or callbacks.
Evidence: .local/audio-silence-e2e.json. The first attempt was launched during
rollout and timed out; it is retained separately as audio-silence-pre-rollout.json.
The successful call was observed in the new worker's runtime logs. The audio energy
gate postpones idle handling during incoming sound; it neither stores audio nor
replaces provider turn detection. Five deterministic tests cover continuous audio,
returning callers, background energy and pending replies. Human silence behavior
on noisy microphones still needs real-device review.

The API now supplies deterministic Bengali weekday and date labels for availability,
including closed Fridays, after a wrong weekday was observed in the human call.
The voice prompt instructs the agent to use those labels. Bengali-script consistency
still needs real-speaker review; native captions in the original human call included
Hindi script despite the configured parallel Bengali STT.

## Dedicated caller captions and failed booking writes

The SDK still processed native realtime input-transcription events even when the
model's native transcription capability was configured off. The agent now uses
final Speechmatics Bengali segments as the source for saved caller turns and the
custom clinic.caller_transcript text stream. Native input events remain available
to the model context and reply guard but are excluded from saved caller text; the
browser ignores duplicate native caller captions when dedicated captions are active.
Assistant captions continue using the standard LiveKit stream. Historical records
were not rewritten. STT segment timestamps use audio origin plus speech-start
offset, rather than the late arrival of the final transcript.

Live hosted call bca574dd-2465-4531-ac5f-7ba745212256 on worker WV9ewqewoQBT passed:
mixed Bangla/service words and a phone correction produced Bengali caller segments,
every stored caller ID came from dedicated STT, and client caller text matched saved
caller text. No Devanagari letters were present and no business action was saved.
Evidence: .local/audio-captions-e2e.json. This proves the source routing and these
synthetic samples, not universally accurate recognition. STT split the spoken phone
across segments and omitted a digit in the separate failure-test request. The voice
model read back the complete phone correctly. Keep exact raw STT text; do not
silently replace it with an inferred number or claim perfect number transcription.

An isolated local API and uniquely named local worker exercised the real RTC/audio
path with the same agent and HTTP bridge. Test-only middleware rejected booking
writes with 503; it was never installed on the hosted API. Call
06ed3acf-dd10-4387-b241-d8cb2650964e attempted the confirmed write three times,
retained zero appointment actions and ended incomplete. Its final assistant
transcript explicitly said the appointment could not be booked and asked the caller
to retry later. Evidence: .local/audio-failure-e2e.json. The fake SQLite database and
local worker log are ignored, and both test processes stopped. This is an isolated
fault-injection result, not a production outage or a hosted PostgreSQL fault test.
The test was rerun after adding date-relative sample generation and an assertion
that no write is attempted before the confirmation clip. Latest call
93053c2d-42f9-47fb-a032-e2971780cc40 passed with three rejected requests, incomplete
status, no saved action and an explicit failure explanation. The current ignored
audio-failure-e2e.json report describes this second run.

The 50 Python checks and Node 24 portal production build passed. GitHub CI and both
Vercel deployment statuses passed commit 1ca5ef0. Human review of the new caller
caption path, microphone-denial recovery and final mobile visuals remain open.

The final mobile screenshot attempt timed out, then browser access became disabled
in Work settings. A responsive accessibility tree was observed at 390x844, but no
usable screenshot was obtained; this is not visual sign-off. The browser viewport
override could not be reset after access was disabled. Reset it on reconnection
before normal browser work. Repository access remains private by the user's latest
instruction; the user plans to make it public before submission.

## Reconnected browser mobile review

After browser access was restored, the temporary viewport override was reset and
then explicitly set to 390x844 for one bounded review. Full-page screenshots of
the hosted voice page, selected synthetic call Conversation, Details and Activity,
and the filtered call list were inspected. Bengali text, reference, doctor/service,
appointment time, fields and navigation remained readable without visible clipping.
Activity view document width equalled the 390px viewport, with no horizontal
overflow. All calls returned to the list and a fictional-phone search showed four
matching records. This is responsive Chromium evidence, not an iPhone Safari
rendering guarantee. Normal viewport sizing was restored after review.

Ignored evidence: .local/mobile-voice-final.png, mobile-portal-final.png,
mobile-details-final.png, mobile-activity-final.png and mobile-call-list-final.png.
Only fictional/synthetic record screens were saved. No visual fix was needed.

## Browser error view and recording attempt

An isolated hosted /try tab was instrumented through the browser's development
protocol to make getUserMedia reject with NotAllowedError. The real UI connection
flow reached Error, displayed the permission guidance and an enabled Start another
call button. Screenshot: .local/microphone-denial-final.png. This verifies the
browser API rejection path, not a real browser settings toggle or successful retry
after changing permissions. The page was reloaded to remove the override, visibly
returned to Idle, then the temporary tab was closed.

A separate local video attempt used a labelled synthetic-microphone stream and
browser screencast. The browser connection was lost during capture; no usable video
was produced. That call (560b2632-2828-48a8-a822-cd4acd1e1018) reached the greeting
and idle check-in, but no caller booking audio was delivered. It was manually ended
during cleanup. The capture session was stopped and all temporary page audio/media
overrides and the recording banner were removed by reload. No source or hosted
application changes were made for recording. The generated sample and partial
frames remain ignored under .local; they are not submission evidence. imageio-ffmpeg
was installed only in the local venv as an optional recording utility, not added
to production requirements. The original assessment requests a finished video.

The user then instructed that no video recording was needed from the agent.
The second attempt was stopped after the live greeting, without sending caller
booking audio. The test call 0667f33d-f1d9-4d90-995c-97698a0ea2ac was manually ended;
screen/audio capture was stopped, and reload removed the temporary microphone,
audio observer and banner before the test tab was closed. No finished video was
produced or uploaded. Recording is now excluded from autonomous work.
