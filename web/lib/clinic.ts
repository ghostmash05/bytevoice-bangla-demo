import clinic from "../../shared/clinic.json";
import { dateTime, label } from "./api";

export function doctorName(id: string | null) {
  return clinic.doctors.find((d) => d.id === id)?.name_bn || id;
}
export function serviceName(id: string | null) {
  return clinic.services.find((s) => s.id === id)?.name_bn || id;
}
export function appointmentTime(value: string | null) {
  if (!value) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : dateTime(value);
}
export function actionValue(key: string, value: string | number) {
  if (key === "doctor_id") return doctorName(String(value));
  if (key === "service_id") return serviceName(String(value));
  if (key === "slot") return appointmentTime(String(value));
  if (key === "status") return label(String(value));
  return String(value);
}
