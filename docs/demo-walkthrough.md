# Three-minute demonstration recording plan

Record the actual deployed app, using fictional patient details. Adapt the spoken
English outline to your own words. Do not describe synthetic recordings as human
tests or claim checks that are still pending. Review voice quality before recording.

| Time | Screen and action | Suggested explanation |
|---|---|---|
| 0:00–0:15 | Open the hosted `/try` page | “I built a custom Bangla receptionist for a fictional dental clinic, with persistent appointments and a staff portal.” |
| 0:15–1:15 | Make a short Bangla booking call; provide all details, hear the readback, then confirm | Let the actual audio demonstrate Bangla, digit readback and confirmation. Choose a free slot during opening hours; never silently edit records to match the narration. |
| 1:15–1:50 | Open `/portal`, select the new call, show Conversation and Details | “The staff member sees the speaker-labelled transcript, captured contact details, requested service and outcome.” |
| 1:50–2:15 | Show Activity, then the three completed synthetic booking/change/cancel records | “These separate test calls retrieved and changed the same stored appointment. The database enforces slot uniqueness, atomic changes and version checks.” |
| 2:15–2:45 | Show the README architecture and concise source locations | “The browser connects through LiveKit WebRTC. A custom Python worker calls authenticated FastAPI tools. PostgreSQL is the authority for booking state; the browser never receives database or project API secrets.” |
| 2:45–3:00 | Return to the working portal | State the checks actually completed and any remaining limitations. Keep the total under three minutes. |

## Before recording

- Use a clean browser window without personal inboxes, keys, password files or
  account settings. Never record the environment-variable import screen.
- Test microphone and system-audio capture, and listen to a short recording.
- Sign in to the portal before starting. Use the generated reviewer account;
  provide credentials separately from the video.
- Use the search field to show the relevant fake-patient calls. Scripted fixture
  rows and synthetic audio calls carry explicit labels.
- Preserve a visible real confirmation and saved action. Do not cut together a
  failed call with an unrelated success record.
- Upload only the final reviewed recording to an accessible destination, then
  verify its sharing link without relying on your signed-in session.

## Submission readiness

The portal and direct caller are deployed. The repository is currently private;
the user will make it public before submission. Keep it private until then. The landing page remains
outside the user's active implementation scope. Do not send an HR submission
until the required links and the video are actually accessible.

See docs/submission-readiness.md for the requirement/evidence checklist and unsent
email draft. It explicitly records the excluded landing page rather than claiming
that the direct voice page satisfies that item.
