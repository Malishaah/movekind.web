"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { absoluteMedia } from "@/app/lib/site";
import { Menu, X } from "lucide-react";
import { apiGet } from "@/app/lib/api";

type UmbracoLink = {
  url: string | null;
  title?: string | null;
  target?: string | null;
  route?: { path?: string | null } | null;
  linkType?: "External" | string | null;
  queryString?: string | null;
};

function resolveLink(l: UmbracoLink) {
  let href = l.route?.path ?? l.url ?? "#";

  if (href && l.queryString) {
    href = `${href}${l.queryString}`;
  }

  const looksExternal = /^https?:\/\//i.test(href);

  if (!looksExternal && (l.linkType === "External" || !href.startsWith("/"))) {
    href = `/${href.replace(/^\/?/, "").toLowerCase()}`;
  }

  return {
    href,
    external: /^https?:\/\//i.test(href),
    target: l.target ?? (l.linkType === "External" ? "_blank" : undefined),
    labelFallback: l.title || l.url || "Link",
  };
}

type Resolved = ReturnType<typeof resolveLink>;

export default function Header({
  logoUrl,
  siteName = "MoveKind",
  menu,
}: {
  logoUrl?: string;
  siteName?: string;
  menu?: UmbracoLink[] | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // auth status
  const [auth, setAuth] = useState<"loading" | "in" | "out">("loading");

  useEffect(() => {
    let alive = true;

    const checkAuth = async () => {
      try {
        await apiGet("/api/members/me");
        if (alive) setAuth("in");
      } catch {
        if (alive) setAuth("out");
      }
    };

    checkAuth();

    const onAuthChanged = () => checkAuth();
    window.addEventListener("auth-changed", onAuthChanged);

    return () => {
      alive = false;
      window.removeEventListener("auth-changed", onAuthChanged);
    };
  }, []);

  const items = useMemo<Resolved[]>(() => {
    const base = (menu ?? []).map(resolveLink);

    const loggedInLinks: Resolved[] = [
      ...base,
      { href: "/profile", external: false, target: undefined, labelFallback: "Profile" },
    ];

    const loggedOutLinks: Resolved[] = [
      { href: "/login", external: false, target: undefined, labelFallback: "Login" },
      { href: "/register", external: false, target: undefined, labelFallback: "Register" },
    ];

    if (auth === "in") return loggedInLinks;
    if (auth === "out") return loggedOutLinks;

    return [];
  }, [menu, auth]);

  const isActive = (href: string) => {
    if (!href || href === "#") return false;
    const path = href.split(/[?#]/)[0];
    return path === pathname;
  };

  // ✅ Stäng menyn när man byter route
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // ✅ Esc för att stänga + (valfritt) lås scroll när drawer är öppen
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    if (open) {
      window.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  const mobileNavId = "mobile-nav";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/70 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-zinc-800 dark:bg-zinc-950/70">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-800" />

      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:h-20 sm:px-6 lg:px-8">
        {/* brand */}
        <Link
          href=""
          className="group inline-flex items-center gap-3 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
          aria-label={`${siteName} home`}
        >
          {logoUrl ? (
            <Image
              src={absoluteMedia(logoUrl)}
              alt={`${siteName} logo`}
              width={40}
              height={40}
              className="h-10 w-10 rounded-md border border-zinc-200 object-cover shadow-sm transition group-hover:scale-[1.02] dark:border-zinc-800"
              priority
            />
          ) : (
            <div className="h-10 w-10 rounded-md border border-zinc-200 bg-zinc-100 shadow-sm dark:border-zinc-800 dark:bg-zinc-900" />
          )}
          <span className="text-base font-semibold tracking-tight text-zinc-900 transition group-hover:opacity-90 dark:text-zinc-100">
            {siteName}
          </span>
        </Link>

        {/* desktop nav */}
        <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Primary">
          {items.map(({ href, external, target, labelFallback }, i) => {
            const active = isActive(href);
            const base =
              "px-3 py-2 rounded-md text-sm font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50";
            const state = active
              ? "text-zinc-900 bg-zinc-100 dark:text-zinc-100 dark:bg-zinc-900"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-zinc-100 dark:hover:bg-zinc-900";

            return external ? (
              <a
                key={i}
                href={href}
                target={target ?? "_blank"}
                rel="noopener noreferrer"
                className={`${base} ${state}`}
              >
                {labelFallback}
              </a>
            ) : (
              <Link key={i} href={href} className={`${base} ${state}`}>
                {labelFallback}
              </Link>
            );
          })}
        </nav>

        {/* mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto inline-flex items-center justify-center rounded-md p-2 text-zinc-700 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 md:hidden dark:text-zinc-300 dark:hover:bg-zinc-900"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls={mobileNavId}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* mobile drawer */}
      <div
        id={mobileNavId}
        className={`md:hidden transition-[max-height,opacity] duration-300 ease-out ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden border-t border-zinc-200/70 dark:border-zinc-800`}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6 lg:px-8" aria-label="Mobile">
          {items.map(({ href, external, target, labelFallback }, i) => {
            const active = isActive(href);
            const base =
              "w-full px-3 py-2 rounded-md text-sm font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50";
            const state = active
              ? "text-zinc-900 bg-zinc-100 dark:text-zinc-100 dark:bg-zinc-900"
              : "text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-zinc-100 dark:hover:bg-zinc-900";

            return external ? (
              <a
                key={i}
                href={href}
                target={target ?? "_blank"}
                rel="noopener noreferrer"
                className={`${base} ${state}`}
                onClick={() => setOpen(false)}
              >
                {labelFallback}
              </a>
            ) : (
              <Link
                key={i}
                href={href}
                className={`${base} ${state}`}
                onClick={() => setOpen(false)}
              >
                {labelFallback}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
