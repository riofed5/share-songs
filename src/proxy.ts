import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/session";

/**
 * In Next.js 16 this file replaces middleware.ts and the export is named
 * `proxy`. It runs on the Node.js runtime.
 *
 * This is only the quick check that keeps signed-out people off /admin. The
 * admin page verifies the session again before it reads any data.
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (verifyToken(token)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Everything under /admin except the login page itself.
  matcher: ["/admin", "/admin/((?!login).*)"],
};
