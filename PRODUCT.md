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
The user explicitly requested autonomous implementation of everything except the
landing page while away. Do not build or redesign a marketing/landing page.
The staff portal and a direct browser call test route are in scope. The user has
delegated routine implementation and design decisions; no further interview is
needed for facts already established in the task brief and accepted workflow.

## Success
Persistent booking, changing and cancellation across calls, confirmed readbacks,
Bangla names/digits/date capture, interruption recovery, a protected portal with
timestamped speaker transcripts, and accessible deployed assessment artifacts.
Do not claim deployment, voice quality or real conversations before verifying them.

## Content and constraints
Use fictional clinic/patient data. No medical advice or invented success claims.
Three-dimensional marketing design is outside the current scope. Portal copy must
help staff act, with no invented business metrics. All actions need clear loading,
error, empty and permission-denied states; support mobile and desktop and keyboard.

## Appearance and language
The user requested a modern, restrained silver-glass workspace inspired by
ByteVoice's actual product identity, using its original wordmark and waveform.
Light is the default, with an explicit dark-mode toggle. Bangla is the default
interface language; an explicit saved English choice is respected. Language is
selectable and persists locally; original patient names,
phone numbers, booking references and transcript text retain their source values.
The staff portal, sign-in, data-model view and browser voice test share the system.
Keep the direct working routes; a marketing landing page remains outside scope.

## Open items
Speech-provider credentials and account access, final voice audition, database and
web hosting deployment access. LiveKit project/CLI authorization already exists.
