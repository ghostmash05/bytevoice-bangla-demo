import clinic from "../../shared/clinic.json";
import { dateTime, label } from "./api";

export function doctorName(id: string | null, language = "bn") {
  if (language === "en" && id) return ({"dr-nadia": "Dr Nadia Rahman", "dr-arif": "Dr Arif Hasan"} as Record<string, string>)[id] || id;
  return clinic.doctors.find((d) => d.id === id)?.name_bn || id;
}
export function serviceName(id: string | null, language = "bn") {
  if (language === "en" && id) return ({consultation: "Consultation & check-up", scaling: "Scaling", "follow-up": "Follow-up"} as Record<string, string>)[id] || id;
  return clinic.services.find((s) => s.id === id)?.name_bn || id;
}
export function appointmentTime(value: string | null, language = "en") {
  if (!value) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : dateTime(value, language);
}
export function actionValue(key: string, value: string | number, language = "en") {
  if (key === "doctor_id") return doctorName(String(value), language);
  if (key === "service_id") return serviceName(String(value), language);
  if (key === "slot") return appointmentTime(String(value), language);
  if (key === "status") return label(String(value));
  return String(value);
}
