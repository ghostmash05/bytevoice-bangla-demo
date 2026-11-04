import { requireStaffSession } from "@/lib/server-session";
export const dynamic = "force-dynamic";
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  await requireStaffSession("/portal");
  return children;
}
