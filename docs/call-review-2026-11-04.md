# Call review — 4 November 2026

Source: production call records, stored transcripts, extracted details and action
history, read without changing those records. Times below are Asia/Dhaka (UTC+6).
Names, contact details and raw conversations are intentionally omitted. Private
source material is kept only in ignored local review files.

## Findings and changes

| Start | Recorded result | Main findings | Changes |
| --- | --- | --- | --- |
| 21:55:51 | Incomplete; 52 turns; no saved action | Gendered honorific; repeated phone requests after refusal; evasive answers about its identity; an already-passed time treated as unavailable rather than past; loose interpretation of afternoon. Correctly refused diagnosis and did not book without a valid number. | Neutral address; one explanation of phone requirement; allow information-only enquiries; honest short identity response; distinguish past times; clarify time ranges and check availability tools. |
| 22:46:05 | Incomplete; three assistant turns | Greeting, silence check-in and farewell; no caller transcript was retained. | Keep silence recovery. No evidence establishes whether the caller was silent, microphone audio was absent, or transcription failed. |
| 22:46:16 | Incomplete; nine turns; no saved action | The name in the caller caption differs from the name the agent used and extracted. | Explicitly repeat a standalone name and wait for confirmation before asking for the phone. Avoid gendered guesses. |
| 22:50:54 | Completed with follow-up needed; 50 turns; one callback request, no appointment | Non-dental concern led to an unsuitable general-doctor callback offer. Repeated promises of quick staff contact exceeded what this demo does. Ambiguous phone chunks need stronger verification. Later off-topic conversation overwrote captured intent/notes. | Dental scope clarification; callback tool explicitly states that it only saves a demo request and contacts nobody; forbid invented contact deadlines/transfers; never pad or guess digits; retain clinical context during later small talk. |

The 22:46 window contains two overlapping sessions, so it must not be treated as
one continuous conversation. The 22:50 callback was saved after explicit caller
confirmation. That is a useful existing safeguard and remains in place.

## Limits of transcript evidence

- Speechmatics supplies displayed caller captions while Gemini Live independently
  interprets the audio. A mismatch does not by itself prove which recognition
  path was wrong. Audio review or a fresh human test is required for name/digit
  accuracy; do not claim that prompt changes fix speech recognition.
- Availability assertions cannot be fully audited from transcript text alone:
  read-only tool traces were not stored with these historical calls. Do not label
  the quoted slot availability fabricated without that evidence.
- The final demo-time-limit utterance is marked interrupted. This does not prove
  a server cutoff rather than a caller interruption or disconnect. The duration
  handler now marks the call as ending before recovery activity can overlap it.
- Two nearby 22:57 sessions had no turns and a voice-provider error. Fresh model
  verification also received HTTP 429 at LiveKit's realtime gateway. This is a
  service-availability issue separate from the conversation improvements.

## Validation

- Backend regression tests cover expired/forged sessions, booking protections and
  the callback result's explicit demo-only/no-contact/no-deadline fields.
- `scripts/agent_review_scenarios.py` exercises fictional text inputs against the
  configured realtime model with isolated local tools and storage. The initial
  run was blocked by HTTP 429; it is not a passed voice or prompt evaluation.
- LiveKit showed the free Build plan, peak agent concurrency of 3/5, and no
  current concurrent agent sessions when inspected. Billing listed realtime
  usage but did not expose a definitive reason for the 429. No plan change or
  payment was made.
- Next human review: short/ambiguous names; a corrected 11-digit phone; phone
  refusal; non-dental enquiry; repeated requests for immediate staff contact;
  afternoon versus noon; past-time request; and a goodbye at the time limit.

## Dashboard authentication boundary

All `/portal` routes require a live server-validated reviewer session, including
the data-model explorer and internal voice test. The proxy's cookie-presence
check is only an early redirect; the server checks the backend session before
rendering. Protected responses are not cached. Login preserves safe workspace
deep links and rejects external return URLs. Logout revokes the session.

`/try` remains the public caller with a small public header; it does not expose
dashboard navigation. `/login` is public. Call-record API access remains
authenticated independently of page protection.
