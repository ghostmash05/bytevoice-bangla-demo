import { NextResponse, type NextRequest } from "next/server";
export function proxy(request: NextRequest) {
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (!request.cookies.get("clinic_session")?.value) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", next);
    const response = NextResponse.redirect(login);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  const headers = new Headers(request.headers);
  headers.set("x-workspace-path", next);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = { matcher: ["/portal/:path*"] };
