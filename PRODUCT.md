# Bangla Receptionist

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Delegated implementation under the accepted workflow: Next.js/TypeScript staff
portal and browser voice client, Python LiveKit agent, persistent PostgreSQL-capable
backend. Local SQLite is a development environment, not a deployed storage claim.

## Users and purpose
Patients speak colloquial Bangladeshi Bangla to a fictional dental receptionist.
Clinic staff review calls, transcripts, patient details, bookings and follow-ups.
Assessment reviewers must be able to use the browser caller and then find its record.

## Scope and authorization
The assessment includes a public Bangla-first landing page, its live browser
caller and the authenticated staff portal. The landing hero uses ByteVoice as a
visual reference and presents the Glass Flower scene in the hero and a full-width Points Waves layer in the walkthrough. The user has
delegated routine implementation and design decisions.

## Success
Persistent booking, changing and cancellation across calls, confirmed readbacks,
Bangla names/digits/date capture, interruption recovery, a protected portal with
timestamped speaker transcripts, and accessible deployed assessment artifacts.
Do not claim deployment, voice quality or real conversations before verifying them.

## Content and constraints
Use fictional clinic/patient data. No medical advice or invented success claims.
The landing hero uses 3D depth and motion to introduce the live caller. Portal copy
helps staff act. All actions need clear loading,
error, empty and permission-denied states; support mobile and desktop and keyboard.

## Appearance and language
The workspace shares the landing page's navy, cream and gold identity, using
ByteVoice's original wordmark and waveform. Light mode uses warm paper and
gold actions. Dark mode uses navy surfaces and gold accents.
Light is the default, with an explicit dark-mode toggle. Bangla is the default
interface language; an explicit saved English choice is respected. Language is
selectable and persists locally; original patient names,
phone numbers, booking references and transcript text retain their source values.
The staff portal, sign-in, data-model view and browser voice test share the system.
The public landing page introduces the demo. Its hero button starts the embedded caller and moves focus to the demo controls.

## Open items
Reviewer repository access, private credential handoff and a finished video link remain submission items. Services are deployed. Continued speech-quality assessment depends on real speakers and current provider quotas.
