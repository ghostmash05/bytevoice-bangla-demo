# Submission readiness — 4 November 2026

This is a checklist and an unsent email draft. It is not evidence of submission.
The user's explicit scope excludes the landing page. The original assessment
still requests one; the direct caller does not satisfy that marketing-page item.

| Requirement | Evidence | Remaining action |
|---|---|---|
| Public browser caller | https://bytevoice-bangla-portal.vercel.app/try; human Safari booking succeeded | Human retest of automatic ending and dedicated caller captions |
| Connecting/live/ended and error states | Implemented in web/app/try/page.tsx; deployed build passed; mobile voice layout inspected | Microphone-denial retry remains unverified |
| Natural Bangla conversation | Human reported good overall experience; synthetic calls exercise actual audio | Formal real-speaker accent/recognition review remains subjective and pending |
| Confirmed booking | Human Safari call and eight-turn name-correction regression saved exactly one appointment | No known functional blocker |
| Cross-call reschedule/cancel | Three hosted calls changed DDC-36063772, versions 1/2/3 | No known functional blocker |
| Interruptions and correction | Audible interruption retained interrupted assistant text and corrected phone; no unconfirmed callback | Review on human microphone if possible |
| Silence and ending | Check-in/farewell/ROOM_DELETED test; explicit goodbye test passed | Safari retest pending |
| Failed write behavior | Isolated audio call caused three 503 retries, no appointment, explicit spoken failure | No hosted fault injection performed |
| Staff portal and real call data | https://bytevoice-bangla-portal.vercel.app/portal; protected login and Conversation/Details/Activity inspected on desktop and 390px mobile layout | No visible defect in reviewed views; actual Safari rendering not separately audited |
| Schema/storage explanation | /portal/data-model, README and docs/deployment.md; Supabase PostgreSQL Mumbai | Explain why native audio and dedicated STT have separate roles |
| Validation and persistence | 50 Python tests, 18 PostgreSQL booking tests; SQL constraints, idempotency and atomic changes | Real-speaker digits may still be mistranscribed; readback remains essential |
| Repository and README | https://github.com/ghostmash05/bytevoice-bangla-demo; CI passed | User will make repository public before submission; keep private until then |
| Reviewer login | Generated account in ignored .local/reviewer-credentials.txt | Copy credentials privately into the actual submission; never commit the password |
| Video, maximum 3 minutes | docs/demo-walkthrough.md is the recording plan | Record, review, upload and verify actual accessible video link |
| Landing page/hero | Excluded by user instruction | Not implemented; do not describe /try as a completed landing page |
| Submission email | Draft below | User reviews and sends only after all supplied links work |

## Unsent email draft

To: hr@strategybyte.com.au

Subject: AI Engineer Task Submission: Mashrafi Rahman

Hi StrategyByte team,

Here is my Bangla receptionist assessment project:

- Browser voice demo: https://bytevoice-bangla-portal.vercel.app/try
- Staff portal: https://bytevoice-bangla-portal.vercel.app/portal
- Source and README: https://github.com/ghostmash05/bytevoice-bangla-demo
- Video overview: [INSERT VERIFIED VIDEO LINK]

Reviewer login: [INSERT USERNAME AND PASSWORD PRIVATELY]

The custom LiveKit agent supports confirmed bookings, enquiries, rescheduling,
cancellations and staff callbacks, with persistent call transcripts and action
history. The README explains the architecture, storage, verification and limitations.
Please use fictional patient details when testing.

[RESOLVE BEFORE SENDING: the assessment requests a landing page. The current
implementation includes a direct browser caller and portal; no landing page has
been built. Do not silently present the caller as meeting that requirement.]

Thank you for the opportunity. I look forward to walking you through the build.

Best,
Mashrafi Rahman

## Final send check

Verify every URL in a signed-out browser, including repository and video access.
Check the video duration and audio; show the actual call and its matching record.
Do not include a recording of personal inboxes, credentials, or the human tester's
private contact details. Keep services online for assessment and monitor available
free/inference quota. This file does not authorize sending email or changing
repository visibility.
