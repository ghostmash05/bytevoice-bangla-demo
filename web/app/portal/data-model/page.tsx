import { Shell } from "@/components/shell";

const tables = [
  [
    "calls",
    "One row per browser or agent-console session",
    "Start/end, duration, call status and business outcome",
  ],
  [
    "call_extractions",
    "One-to-one with a call",
    "Confirmed name, phone, reason, preferred time, intent and notes",
  ],
  [
    "transcript_turns",
    "Many turns belong to one call",
    "Speaker, original text, timestamp and interruption flag",
  ],
  ["patients", "Linked to appointments", "Name and normalized +880 mobile"],
  [
    "appointments",
    "Links patient and originating call",
    "Doctor, service, slot, reference, status and version",
  ],
  [
    "appointment_actions",
    "Links appointment and action’s call",
    "Booking, reschedule and cancellation history; retry key",
  ],
  [
    "follow_ups",
    "Links callback request to call",
    "Confirmed contact details, reason and pending status",
  ],
];
export default function DataModel() {
  return (
    <Shell>
      <div className="data-model">
        <h1>How call data is connected</h1>
        <p>
          The conversation and its structured fields belong to the same call
          record. Appointment changes preserve the original booking and add an
          action to its history.
        </p>
        <div className="schema-wrap">
          <table className="schema-table">
            <thead>
              <tr>
                <th scope="col">Record</th>
                <th scope="col">Relationship</th>
                <th scope="col">Stored information</th>
              </tr>
            </thead>
            <tbody>
              {tables.map(([name, relationship, fields]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{relationship}</td>
                  <td>{fields}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <section className="storage-note">
          <h2>Reliable booking changes</h2>
          <p>
            A database constraint prevents two active bookings for the same
            doctor and slot. Rescheduling runs as one transaction, so a failed
            change preserves the previous appointment. Version checks stop an
            older request from overwriting a newer change.
          </p>
          <h2>Separate conversation and appointment states</h2>
          <p>
            A successfully completed call can result in a cancellation, an
            enquiry or a staff callback. Call status and business outcome are
            recorded separately so staff can tell what actually happened.
          </p>
          <h2>Demo data and access</h2>
          <p>
            Patient records require staff sign-in. The browser receives a
            short-lived call token; project API secrets stay on the server. This
            assessment uses fictional patient data. Audio recordings are not
            stored by this application.
          </p>
        </section>
      </div>
    </Shell>
  );
}
