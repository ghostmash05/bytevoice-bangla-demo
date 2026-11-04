# Demo clinic and conversation contract

All names, addresses, prices and patient records in this project are fictional.
`shared/clinic.json` is the authoritative clinic configuration. This is an
assessment demonstration, not a real healthcare service.

## Clinic

- Dhaka Dental Care / ঢাকা ডেন্টাল কেয়ার, demo clinic in Dhanmondi, Dhaka.
- No real street address, phone contact or clinical credentials are invented.
- Asia/Dhaka; Saturday–Thursday 10:00–20:00, closed Friday.
- 30-minute appointments; last start 19:30; maximum 14-day booking horizon.
- Dr Nadia Rahman and Dr Arif Hasan, fictional practitioners.
- Consultation BDT 500, scaling BDT 1,500, follow-up BDT 300, all demo fees.
- Both doctors support those services. Actual available slots must come from the backend.

## Booking contract for the next implementation stage

Collect patient name, mobile, reason, service/doctor preference and preferred time.
Normalize Bangla/English digits to canonical +880 mobile format. Read phone digits
individually. Clarify uncertain names and dates rather than guessing. Resolve dates
using the current Bangladesh clock and read back a specific calendar date/time.
Offer only available slots returned by the backend. Read back the complete booking,
obtain explicit confirmation and then save. Announce success only after a committed
backend result; otherwise explain failure and preserve a follow-up/incomplete outcome.

For changes, require booking reference and matching mobile number. Do not enumerate
other patients' appointments. Confirm the requested action; rescheduling must be
atomic so failure does not lose the existing appointment. Retain appointment history.
Use idempotent writes so tool retries do not duplicate appointments.

## Enquiries and handover

Answer known opening hours, fictional location, services, fees and visit preparation.
Do not infer diagnoses or prescribe treatment. Record a staff callback when a
request requires a person, with the caller's confirmed details and reason. A callback
request is not a promise that staff have already contacted them.

## Current implementation boundary

Booking, rescheduling, cancellation, callback, call and transcript storage are
implemented in the backend. Registered agent tools use those APIs; automated tests
verify the integration without speech generation. The browser portal reads real
backend records. A synthetic spoken booking also passed through LiveKit's native
Gemini Live path. Human microphone, interruption and accent verification remain
open. The alternative Soniox/Azure path is not connected.
