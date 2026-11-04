import { requireStaffSession } from "@/lib/server-session";
import CallRecords from "@/components/call-records";
export default async function PortalPage() {
  await requireStaffSession("/portal");
  return <CallRecords />;
}
