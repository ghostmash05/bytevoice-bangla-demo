export type Extraction = {
  patient_name: string | null;
  phone: string | null;
  reason_for_visit: string | null;
  preferred_datetime: string | null;
  doctor_id: string | null;
  service_id: string | null;
  intent: string | null;
  notes: string | null;
};
export type CallRecord = {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_s: number;
  status: string;
  outcome: string;
  error_code: string | null;
  source: string;
  extraction: Extraction;
};
export type CallDetail = CallRecord & {
  transcript: {
    id: string;
    speaker: "user" | "assistant";
    text: string;
    timestamp: string;
    offset_s: number;
    interrupted: boolean;
  }[];
  actions: {
    kind: string;
    created_at: string;
    result: Record<string, string | number>;
  }[];
  follow_ups: {
    id: string;
    reason: string;
    status: string;
    phone: string;
    patient_name: string;
  }[];
};
export type CallList = {
  items: CallRecord[];
  total: number;
  limit: number;
  offset: number;
};
