# Redundancy and usability pass — 4 November 2026

The focus is the working portal and voice demo. The silver theme, authenticated
records, original transcripts, booking logic and existing submission boundaries
remain the context for this pass.

| Item | Change | Reason |
|---|---|---|
| “Bangla · Bangladesh” beside the voice heading | Removed | Repeats context without changing an action |
| “Bangla workspace” below the brand | Removed | There is one workspace; the language control already identifies the available language |
| “A real conversation. A useful outcome.” | Replaced with “Try a conversation” | Makes the guide's purpose concrete |
| Guide's second fictional-data notice | Removed | The full fictional-data, audio/transcript and five-minute-call notice remains once directly below the console, ahead of the guide on phones |
| Generic call-record subtitle | Removed | It restates the heading; refresh time and timezone remain useful |
| Generic record link in the voice guide | Removed | Sidebar already provides it; the specific link to the completed/current call remains |
| Failed search/filter combinations | Added one Clear filters action | Resets search, both filters and page offset together |
| Phone and booking references | Added copy controls with success/failure feedback | Helps reviewers reuse real saved values without retyping them |
| Wide schema table and paragraph wall | Replaced with flow and record explorer | Gives an overview first, then only the selected entity's detail |
| Hidden schema relationships | Added relationship navigation | Moves to the connected record and focuses its heading |
| Narrow phone/tablet reading area | Uses a native record picker at ≤980px | Keeps the record content readable without horizontal scrolling |
| First-visit interface language | Bangla by default | Requested by user; explicit saved English preference still wins |

## Information deliberately retained

- Clinic identity in the voice console, to identify who the caller is speaking to.
- The full call data/fictional-patient notice, which informs the decision to start.
- Timezone where relevant to appointments, outcome labels, refresh state and
  fixture labels. These communicate meaning rather than decorate the interface.
- Literal table and field names in the data explorer, because explaining the
  actual schema is part of the assessment. Explanations and controls are bilingual.
- Original transcript wording, patient details and booking references.

## Data-page content

The record definitions are checked against `backend/models.py`. Seven core record
types expose key fields and actual relationships; support tables for sessions and
rate limits are identified separately. The page also explains the call-to-API-to-
PostgreSQL-to-portal path, Mumbai database location, UTC/Bangladesh display times,
application recording policy, phone normalization, caller confirmation, transaction
and collision handling, and staff access. This is an explanation of the deployed
architecture, not a live database administration console or a database health check.

## Verification

Browser checks cover fresh-origin Bangla defaults, saved English after reload,
record selection and relationship focus, 390px phone and 768px tablet reflow, and
light/dark appearance. Local fictional records were used for search reset and
clipboard accuracy checks. Clipboard contents matched the selected phone and
booking reference. No patient-data export or new call recording was introduced.

The voice workflow was checked for removal of redundant chrome; its audio provider
and booking logic were not changed. This pass does not add a new voice-quality claim.

Next.js production compilation and TypeScript checks pass. Taste lint reports zero
failures; remaining glass/shadow warnings reflect the existing user-selected material.
