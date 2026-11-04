import { PublicFrame } from "@/components/public-frame";
import { LoginForm } from "@/components/login-form";
import { getStaffSession } from "@/lib/server-session";
import { safeWorkspacePath } from "@/lib/auth-path";
import { redirect } from "next/navigation";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; unavailable?: string }> }) {
  const params = await searchParams;
  const next = safeWorkspacePath(params.next);
  let session = null;
  try { session = await getStaffSession(); } catch { /* Login remains reachable during an API outage. */ }
  if (session) redirect(next);
  return <PublicFrame><LoginForm next={next} unavailable={params.unavailable === "1"} /></PublicFrame>;
}
