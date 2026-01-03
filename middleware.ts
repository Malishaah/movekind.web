// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/auth",
  "/login",
  "/register",
  "/_next",
  "/favicon.ico",
  "/icons",
  "/media",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Släpp API rakt igenom (annars kan /api/auth/me låsa sig i redirect-loop)
  if (pathname.startsWith("/api")) return NextResponse.next();

  // 2) Offentliga paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // 3) Snabbt: kolla auth-cookie direkt (Umbraco Members)
  const hasIdentityCookie = req.cookies.has(".AspNetCore.Identity.Application");
  if (hasIdentityCookie) return NextResponse.next();

  // 4) Fallback: dubbelkolla session via /api/auth/me (med cookies vidarebefordrade)
  try {
    const meRes = await fetch(new URL("/api/auth/me", req.url), {
      headers: { cookie: req.headers.get("cookie") ?? "" },
      cache: "no-store",
    });
    if (meRes.ok) return NextResponse.next();
  } catch {
    // ignorera – behandla som ej inloggad
  }

  // 5) Inte inloggad → skicka till /login
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

// Matcha allt utom Nexts statiska
export const config = { matcher: ["/((?!_next|static).*)"] };
