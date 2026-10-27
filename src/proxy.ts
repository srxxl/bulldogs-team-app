import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Optimistic gate only: bounces requests without a session cookie to /login.
 * Real checks (valid session, approved role) happen in the DAL on every page and action.
 */
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    const url = new URL("/login", request.url);
    const next = request.nextUrl.pathname + request.nextUrl.search;
    if (next !== "/") url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|login|_next/static|_next/image|brand|mascot|uploads|favicon.ico|icon|apple-icon|manifest.webmanifest).*)",
  ],
};
