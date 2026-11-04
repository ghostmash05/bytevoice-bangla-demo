# Implementation workflow

Deadline: 5 November 2026, 23:59 Bangladesh time (UTC+6).

| Stage | Deliverable | Completion evidence |
|---|---|---|
| 1 | Fictional clinic and conversation rules | Shared clinic JSON and clinic specification |
| 2 | Voice prototype | Real browser call; accent, interruptions and digit capture auditioned |
| 3 | Supabase persistence and auth | Migration, protected reviewer login and real records |
| 4 | Booking tools | Conflict prevention, confirmations, validation, idempotency |
| 5 | Voice-to-booking | Confirmed real call produces the correct database appointment |
| 6 | Portal | Call list/detail, speaker/timestamp transcript and structured fields |
| 7 | Full workflows | Separate call retrieves, changes and cancels original booking |
| 8 | Landing page | Three responsive sections and live hero CTA |
| 9 | Bonuses | Bilingual content and lightweight 3D after core functionality |
| 10 | Submission | Four verified links, <=3-minute video, accessible README/repository |

## Architecture

Next.js/TypeScript browser call interface and protected portal; custom Python LiveKit
agent; FastAPI and PostgreSQL-capable storage (Supabase may host PostgreSQL).
Reviewer authentication is implemented with Argon2 and server-side cookie sessions,
so portal development does not depend on provisioning Supabase Auth. Browser audio uses LiveKit Cloud. Agent calls
server-side booking tools; the database is the authority for appointment state.
Speech-provider choices are provisional until auditioned, not quality guarantees.

Persist call/session status separately from appointment status. Start a call record
at session creation, preserve partial data and distinguish failed/incomplete calls.
Transcript turns retain speaker, text and timestamp. Appointment actions reference
their originating call. Record actual storage/provider regions in the README.

## Required acceptance scenarios

1. Colloquial Bangla booking with English service name.
2. Correct a name, phone or time and confirm corrected stored details.
3. Interrupt the agent while speaking.
4. Reject unavailable/past/out-of-hours slots without double-booking.
5. Return in another call and reschedule/cancel the original appointment.
6. Medical question produces appropriate boundary and staff follow-up.
7. Premature disconnect remains visible as incomplete.
8. Microphone denial/connection failure offers a useful retry path.
9. Failed backend write never produces a false success confirmation.
10. Reviewer sees call and transcript within one or two minutes using supplied login.

## Submission

Email hr@strategybyte.com.au, subject `AI Engineer Task Submission: Mashrafi Rahman`.
Include landing URL, portal URL/login, accessible GitHub repo and video URL. Preload
the portal with actual fake-patient test calls. Keep all services live during review.
Reserve final three hours for verification, recording and submission.

## Autonomous scope update

The user excluded landing-page work from the active implementation goal. Stage 8
and the marketing/3D elements of stage 9 remain deferred. A direct `/try` browser
caller is included so the voice workflow can be tested without the landing page.
Public deployment, actual voice calls, repository access and final video are still
required before the remaining project can be considered complete.
