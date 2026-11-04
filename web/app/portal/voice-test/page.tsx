import { requireStaffSession } from "@/lib/server-session";
import VoiceTest from "@/components/voice-test";
import { Shell } from "@/components/shell";
export default async function StaffVoiceTest() {
  await requireStaffSession("/portal/voice-test");
  return <Shell><VoiceTest /></Shell>;
}
