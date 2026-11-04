import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeWorkspacePath } from "./auth-path";

// The API validates the opaque token against its expiring server-side session.
// Never treat presence of a cookie as proof of authentication.
export const getStaffSession = cache(async () => {
  const token = (await cookies()).get("clinic_session")?.value;
  if (!token) return null;
  const response = await fetch(`${process.env.BACKEND_URL || "http://127.0.0.1:8000"}/api/auth/me`, {
    headers: { Cookie: `clinic_session=${encodeURIComponent(token)}` },
    cache: "no-store", signal: AbortSignal.timeout(8000),
  });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error("Session service unavailable");
  return response.json() as Promise<{ username: string; csrf_token: string }>;
});

export async function requireStaffSession(fallback: string) {
  const next = safeWorkspacePath((await headers()).get("x-workspace-path") || fallback);
  let session;
  try { session = await getStaffSession(); }
  catch { redirect(`/login?unavailable=1&next=${encodeURIComponent(next)}`); }
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  return session;
}
