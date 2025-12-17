// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/auth",
  "/login",
  "/register",
  "/profile",
  "/workouts",
  "/favorites",
  "/api/auth/login",
  "/api/auth/register",
  "/_next",
  "/favicon.ico",
  "/icons",
  "/media",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // tillåt public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // kolla session via Next API (proxy till Umbraco)
  try {
    const me = await fetch(new URL("/api/auth/me", req.url), {
      headers: { cookie: req.headers.get("cookie") ?? "" },
    });

    if (me.status === 200) {
      return NextResponse.next(); // inloggad
    }
  } catch {
    // fallthrough = behandla som inte inloggad
  }

  const url = req.nextUrl.clone();
  url.pathname = "/auth";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|static).*)"], // allt utom Next statiska
};
