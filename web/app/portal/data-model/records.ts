export type Text = { en: string; bn: string };
const text = (en: string, bn: string): Text => ({ en, bn });
const field = (key: string, en: string, bn: string) => ({ key, description: text(en, bn) });
const link = (target: string, en: string, bn: string) => ({ target, description: text(en, bn) });

// Key application fields and actual relationships; keep aligned with backend/models.py.
export const records = [
  {
    id: "calls", name: text("Call record", "কলের রেকর্ড"),
    summary: text("The starting point for every conversation. Call status and business outcome are separate: a completed call may be an enquiry, a booking or a callback request.", "প্রতিটি কথোপকথনের মূল রেকর্ড। কলের অবস্থা ও কাজের ফলাফল আলাদা থাকে—সম্পন্ন কল থেকে জিজ্ঞাসার উত্তর, বুকিং বা কলব্যাকের অনুরোধ আসতে পারে।"),
    cardinality: text("One record per call", "প্রতি কলে একটি রেকর্ড"),
    fields: [field("id · room_name", "Call identifier and unique LiveKit room", "কলের পরিচয় ও আলাদা LiveKit রুম"), field("started_at · ended_at · duration_s", "Start, finish and duration", "শুরু, শেষ ও কলের দৈর্ঘ্য"), field("status · outcome", "Connection state and conversation result", "সংযোগের অবস্থা ও কথোপকথনের ফলাফল"), field("error_code · last_activity_at", "Failure context and latest activity", "ব্যর্থতার কারণ ও সর্বশেষ কার্যক্রম")],
    links: [link("call_extractions", "One set of captured details", "এক সেট সংগৃহীত তথ্য"), link("transcript_turns", "Many speaker turns", "বক্তাদের একাধিক বক্তব্য"), link("appointments", "Bookings originating in this call", "এই কল থেকে তৈরি বুকিং"), link("follow_ups", "Staff callback requests", "কর্মীদের কলব্যাকের অনুরোধ")],
  },
  {
    id: "call_extractions", name: text("Captured details", "সংগৃহীত তথ্য"),
    summary: text("Details are updated as the conversation progresses, including corrections. Saving these fields does not reserve an appointment.", "কথোপকথনের সঙ্গে তথ্য ও সংশোধন সংরক্ষিত হয়। শুধু এই তথ্য সংরক্ষণ করলেই অ্যাপয়েন্টমেন্ট বুক হয় না।"),
    cardinality: text("One set per call", "প্রতি কলে এক সেট তথ্য"),
    fields: [field("call_id", "Primary key; points to the call", "মূল চাবি; কলের রেকর্ডের সঙ্গে যুক্ত"), field("patient_name · phone", "Captured name and normalized mobile", "সংগৃহীত নাম ও নির্ধারিত বিন্যাসের মোবাইল নম্বর"), field("reason_for_visit · preferred_datetime", "Reason and requested appointment time", "আসার কারণ ও পছন্দের সময়"), field("doctor_id · service_id · intent · notes", "Doctor, service, intent and additional context", "চিকিৎসক, সেবা, উদ্দেশ্য ও অতিরিক্ত তথ্য")],
    links: [link("calls", "Belongs to one call", "একটি কলের অংশ")],
  },
  {
    id: "transcript_turns", name: text("Conversation turns", "কথোপকথনের বক্তব্য"),
    summary: text("Finalized text is stored with speaker and timing. Changing interface language preserves the original transcript. Interrupted turns remain identifiable.", "চূড়ান্ত লেখা বক্তা ও সময়সহ সংরক্ষিত হয়। ইন্টারফেসের ভাষা বদলালেও মূল কথোপকথন বদলায় না। বাধাপ্রাপ্ত বক্তব্য আলাদা করে বোঝা যায়।"),
    cardinality: text("Many turns per call", "প্রতি কলে একাধিক বক্তব্য"),
    fields: [field("id · call_id", "Segment identifier and parent call", "বক্তব্যের পরিচয় ও সংশ্লিষ্ট কল"), field("speaker · text", "Caller or assistant, with original text", "কলার বা সহকারী এবং মূল লেখা"), field("timestamp · offset_s", "Timestamp and elapsed call time", "সময় ও কল শুরুর পর কেটে যাওয়া সময়"), field("interrupted", "Whether the assistant turn was interrupted", "সহকারীর বক্তব্যে বাধা দেওয়া হয়েছিল কি না")],
    links: [link("calls", "Belongs to one call", "একটি কলের অংশ")],
  },
  {
    id: "patients", name: text("Patients", "রোগী"),
    summary: text("A patient is linked to appointments. The demo identifies patients by a unique normalized phone number; shared family numbers are a known limitation.", "রোগীর রেকর্ড অ্যাপয়েন্টমেন্টের সঙ্গে যুক্ত। ডেমোতে আলাদা ফোন নম্বরকে পরিচয় ধরা হয়; পরিবারের এক নম্বর ভাগ করে ব্যবহার করা একটি সীমাবদ্ধতা।"),
    cardinality: text("One patient, many appointments", "এক রোগীর একাধিক অ্যাপয়েন্টমেন্ট"),
    fields: [field("id · full_name", "Patient identifier and stored name", "রোগীর পরিচয় ও সংরক্ষিত নাম"), field("phone", "Unique mobile in +880 format", "+৮৮০ বিন্যাসে আলাদা মোবাইল নম্বর"), field("created_at", "When the record was created", "রেকর্ড তৈরির সময়")],
    links: [link("appointments", "Connected through patient_id", "patient_id দিয়ে যুক্ত")],
  },
  {
    id: "appointments", name: text("Appointments", "অ্যাপয়েন্টমেন্ট"),
    summary: text("A confirmed booking links the patient and originating call. Rescheduling updates this record while preserving a separate action history.", "নিশ্চিত বুকিং রোগী ও মূল কলকে যুক্ত করে। সময় পরিবর্তনে এই রেকর্ড বদলায় এবং কার্যক্রমের আলাদা ইতিহাস থাকে।"),
    cardinality: text("Linked to a patient and a call", "রোগী ও কলের সঙ্গে যুক্ত"),
    fields: [field("id · reference", "Internal identifier and booking reference", "অভ্যন্তরীণ পরিচয় ও বুকিং রেফারেন্স"), field("patient_id · call_id", "Patient and originating call", "রোগী ও মূল কল"), field("doctor_id · service_id · reason", "Doctor, service and reason for visit", "চিকিৎসক, সেবা ও আসার কারণ"), field("slot · status · version", "Time, current state and change version", "সময়, বর্তমান অবস্থা ও পরিবর্তনের সংস্করণ")],
    links: [link("patients", "Booked for this patient", "যে রোগীর জন্য বুকিং"), link("calls", "Created by this call", "যে কল থেকে তৈরি"), link("appointment_actions", "Full change history", "পরিবর্তনের সম্পূর্ণ ইতিহাস")],
  },
  {
    id: "appointment_actions", name: text("Booking history", "বুকিংয়ের ইতিহাস"),
    summary: text("Every saved booking, reschedule or cancellation has an action record linking the appointment to the call where the action happened.", "প্রতিটি সংরক্ষিত বুকিং, সময় পরিবর্তন বা বাতিলের কার্যক্রম থাকে। এটি অ্যাপয়েন্টমেন্টকে সেই কাজের কলের সঙ্গে যুক্ত করে।"),
    cardinality: text("Many actions per appointment", "প্রতি অ্যাপয়েন্টমেন্টে একাধিক কার্যক্রম"),
    fields: [field("appointment_id · call_id", "Appointment and the call performing the action", "অ্যাপয়েন্টমেন্ট ও কার্যক্রমের কল"), field("kind · result", "Action type and saved result", "কার্যক্রমের ধরন ও সংরক্ষিত ফলাফল"), field("idempotency_key", "Prevents repeated writes for one request", "একই অনুরোধ বারবার সংরক্ষণ হওয়া রোধ করে"), field("created_at", "When the action was saved", "কার্যক্রম সংরক্ষণের সময়")],
    links: [link("appointments", "Changes this appointment", "যে অ্যাপয়েন্টমেন্ট পরিবর্তিত হয়েছে"), link("calls", "Performed during this call", "যে কলে কাজটি হয়েছে")],
  },
  {
    id: "follow_ups", name: text("Staff follow-ups", "কর্মীদের ফলো-আপ"),
    summary: text("Requests needing a human stay separate from appointments. Confirmed contact details, the reason and a pending status are kept for staff.", "মানুষের সহায়তা দরকার এমন অনুরোধ অ্যাপয়েন্টমেন্ট থেকে আলাদা থাকে। কর্মীদের জন্য নিশ্চিত যোগাযোগের তথ্য, কারণ ও অপেক্ষমাণ অবস্থা সংরক্ষিত হয়।"),
    cardinality: text("Linked to the requesting call", "অনুরোধের কলের সঙ্গে যুক্ত"),
    fields: [field("id · call_id", "Request identifier and originating call", "অনুরোধের পরিচয় ও মূল কল"), field("patient_name · phone · reason", "Confirmed contact details and callback reason", "নিশ্চিত যোগাযোগের তথ্য ও কলব্যাকের কারণ"), field("status · created_at", "Follow-up state and creation time", "ফলো-আপের অবস্থা ও তৈরির সময়"), field("idempotency_key", "Prevents a duplicate callback request", "একই কলব্যাক অনুরোধ একাধিকবার হওয়া রোধ করে")],
    links: [link("calls", "Requested during this call", "যে কলে অনুরোধ এসেছে")],
  },
];
