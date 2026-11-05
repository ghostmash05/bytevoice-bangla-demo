# Technical brief cross-check — 4 November 2026

Source: the supplied four-page `StrategyByte_AI_Engineer_Task_Brief.pdf`, read
directly and rendered for verification. Section and page references below refer
to that PDF. The brief is a requirements source; it does not override the user's
later exclusions or authorize submission, outreach, or repository visibility changes.

## Portal and sidebar

The brief specifies a simple login and useful call data, not a particular sidebar.
Logout, collapse/expand, the redundant clinic selector and edge styling are product
usability decisions. Removing the clinic selector loses no required portal field;
the fictional clinic identity remains on the voice console.

| Requirement | Current evidence | Assessment |
|---|---|---|
| Each call, transcript or summary, captured details and outcome (§1.7, p2) | `web/app/portal/page.tsx`: searchable call list and Conversation, Details, Activity views | Implemented; full transcript is provided, so an additional AI summary is not required |
| Call date/time, caller, duration and status; search/filter desirable (§6, p3) | List shows caller, Bangladesh date/time, duration and outcome badge; search, outcome and lifecycle-status filters; selected record also shows lifecycle status | Implemented; business outcome and technical call status deliberately remain separate |
| Patient name, phone, reason, preferred date/time, outcome (§6, p3) | Details fields, selected-record outcome, captured doctor/service/intent/notes | Implemented |
| Full transcript, speaker labels and timestamps (§6, p3) | Conversation view with speaker and elapsed-time labels | Implemented; original text retained across interface language changes |
| Booked, enquiry, follow-up, incomplete, failed states (§6, p3) | Outcome labels, separate call status, filters and empty/error views | Implemented; actual result determines the label |
| Simple login; reviewer details supplied privately (§6–7, p3–4) | Existing server sessions, protected call endpoints and reviewer account; login URL `/portal` | Implemented; credentials must still be included privately in the actual submission |
| Explain schema and relationships (§6, p3) | `/portal/data-model`, ORM models and README | Implemented |
| Explain database, region, recordings, ingestion and validation (§6, p3) | Public data-model explorer and flow; README; `docs/deployment.md`; PostgreSQL Mumbai; no application audio recording; digit/phone validation and transactional writes | Covered in the public explanation and repository; the explorer shows key actual fields and relationships rather than a live database console |
| Portal preloaded with own test calls (§7, p4) | Existing verification records distinguish actual synthetic audio calls, human tests and scripted fixtures | Recorded evidence exists; scripted fixtures alone must never be presented as voice-test evidence |
| Find a new call within a minute or two (§2, p2) | Immediate/partial persistence and portal refresh every ten seconds while visible | Implemented mechanism; this sidebar pass did not run a new timed voice-to-portal benchmark |

Sidebar update: shared session lookup exposes Sign out on all working routes while
signed in, with Sign in otherwise. Authenticated logout retains server session
invalidation and CSRF protection. The desktop sidebar has a persistent compact
icon mode, accessible link names and tooltips; mobile keeps the labelled top nav.

This pass verified local logout from Data Model and the phone portal, return to
sign-in, persisted collapsed mode after reload, shared authenticated controls,
390px phone and 768px tablet layouts, light/dark desktop views, and logout fitting
inside a 600px-high desktop window. The Next.js production build and TypeScript
check passed. These UI checks use the local fictional fixture database; they do
not constitute a new audio or production-database test.

## Caller and browser entry

| Requirement | Evidence | Assessment |
|---|---|---|
| Browser microphone conversation; connecting/live/ended and graceful errors (§4, p2) | `/`, `/try`, shared `web/components/voice-test.tsx`, prior human Safari verification on `/try` | The landing hero and direct caller use the same call controls and connection flow |
| Natural polite Bangla, mixed English/Bangla, Bangladeshi names and accurate numbers/dates (§1.6/§5, p2–3) | Agent prompt, dedicated Bengali STT, validation, confirmation/readback, existing audio tests | Implemented and previously exercised; formal real-speaker accent/recognition quality remains partly unverified |
| Greeting, name/phone confirmation, reason and preferred date/time (§5, p3) | `agent/prompt.py`, tools/validation, booking service and existing booking evidence | Implemented; no new audio call performed in this UI pass |
| Book, reschedule, cancel; check doctor/service/availability (§1.5, p1) | Transactional booking/change tools, lookup constraints, prior cross-call audio verification | Implemented; existing verification includes collision/rollback tests |
| Hours, fictional location/directions, services, fees and visit preparation (§1.5/§5, p1/3) | `shared/clinic.json`, including `visit_preparation_bn` and demo-address disclosure | Implemented facts; the agent must not invent a real clinic address |
| Decline medical advice, capture human callback (§1.5/§5, p1/3) | Prompt safety rules, follow-up tool and existing callback/audio evidence | Implemented |
| Interruptions, corrections, silence/mishearing recovery, ending summary (§5, p3) | Recovery/presence/transcription code and existing verification logs | Implemented and exercised synthetically; final real-device review remains useful, especially automatic ending |
| Free choice of providers; explain decisions (§5/§9, p3/4) | README and deployment documentation | Documented; no paid feature is required by the brief |

## Submission completeness and scoring

| Deliverable or criterion | Brief | Current status |
|---|---|---|
| Public responsive landing page, at least three sections | Required, §3/§7, p2/4; design is 20% of assessment | Implemented at `/` for clinic and hospital teams in Bangladesh, with a product hero, feature walkthrough, fictional dental demo and FAQ |
| Prominent live-call action in the hero | Required, §4/§7, p2/4 | The hero action starts the browser call in place |
| Bangla caller | Required, §5; caller quality is 30% | Implemented; subjective and final human-quality limits above remain |
| Portal live URL and login | Required, §6/§7; data structure/portal is 25% | Deployed at `/portal`; reviewer credentials still need private handoff |
| GitHub repository and README, with reviewer access | Required, §7, p4 | Repository and README exist; repository remains **private** per user. Reviewer access/publication is pending |
| Video overview, maximum three minutes, showing landing/call/record | Required, §7, p4; documentation/presentation is 10% | **Not produced.** User explicitly excluded recording from agent work; original requirement still stands |
| Code quality, architecture and secrets | 15%, §8, p4 | Source, configuration separation and CI exist; this audit does not replace an independent security audit |
| Bilingual landing page and 3D hero | Bonuses, §3/§8, p2/4 | Bangla by default with an English switch, the pmndrs Glass Flower scene in the hero and Three.js Points Waves in the walkthrough |
| Fake patient data; keep secrets out; keep services live | §9, p4 | Demo labels and secret separation are implemented. User-controlled hosting must remain online until assessment ends |

The deadline printed in §10 (p4) is **Thursday 5 November 2026, 11:59 PM
Bangladesh Standard Time (UTC+6)**. Submission is to `hr@strategybyte.com.au`, with
subject `AI Engineer Task Submission: your full name` and four links: landing,
portal (with private login), accessible GitHub repository and video (≤3 minutes).
No email was sent and no visibility setting was changed by this audit.

## Practical priorities

1. Provide the short overview video.
2. Grant repository access or make it public before submission, as already planned.
3. Include reviewer credentials privately and perform the final human call-through.

The landing page and portal are implemented. Submission handoff still requires
the overview video, reviewer credentials and repository access.
