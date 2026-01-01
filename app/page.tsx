"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, apiDelete } from "@/app/lib/api";
import { Search, Heart } from "lucide-react";

type Tag = "Knee" | "Back" | "Shoulder" | "Seated" | "No floor";

type Session = {
  id: string;
  slug: string;
  title: string;
  minutes: number;
  level: "E" | "M" | "A";
  imageUrl: string;
  tags: Tag[];
};

type DeliveryItem = {
  id: string;
  contentType: string;
  route?: { path?: string };
  properties?: {
    title?: string;
    duration?: number;
    levelEasyMediumAdvanced?: "Easy" | "Medium" | "Advanced";
    focus?: string[];
    position?: string[];
    chairFriendly?: boolean;
    floorFriendly?: boolean;
    image?: Array<{ url: string }>;
  };
};

type DeliveryResponse = {
  total: number;
  items: DeliveryItem[];
};

const toLevel = (lvl?: string): Session["level"] => {
  if (lvl === "Medium") return "M";
  if (lvl === "Advanced") return "A";
  return "E";
};

const toTags = (p?: DeliveryItem["properties"]): Tag[] => {
  const raw = [...(p?.focus ?? []), ...(p?.position ?? [])]
    .map((x) => (x ?? "").toLowerCase().trim())
    .filter(Boolean);

  const tags = new Set<Tag>();

  if (raw.some((x) => x.includes("knee"))) tags.add("Knee");
  if (raw.some((x) => x.includes("back"))) tags.add("Back");
  if (raw.some((x) => x.includes("shoulder"))) tags.add("Shoulder");

  if (p?.chairFriendly) tags.add("Seated");
  if (p?.floorFriendly === false) tags.add("No floor");

  return Array.from(tags);
};

export default function HomePage() {
  const quickLinks: Tag[] = ["Knee", "Back", "Shoulder", "Seated", "No floor"];

  const [sessions, setSessions] = useState<Session[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<Tag | null>(null);

  function isFav(id: string) {
    return favoriteIds.includes(id);
  }

  async function loadFavorites() {
    const data = await apiGet("/api/favorites/ids");
    const ids = Array.isArray(data) ? (data as string[]) : [];
    setFavoriteIds(ids);
  }

  async function toggleFavorite(id: string) {
    try {
      if (isFav(id)) {
        await apiDelete(`/api/favorites/${id}`);
        setFavoriteIds((prev) => prev.filter((x) => x !== id));
      } else {
        await apiPost(`/api/favorites/${id}`);
        setFavoriteIds((prev) => [...prev, id]);
        setMsg("Saved to Favorites");
        window.setTimeout(() => setMsg(null), 1500);
      }
    } catch (e: any) {
      setMsg(e?.message ?? "Toggle failed");
      window.setTimeout(() => setMsg(null), 1800);
    }
  }

  async function loadWorkouts() {
    const res = await fetch("/api/workouts", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: DeliveryResponse = await res.json();

    const umbracoOrigin =
      process.env.NEXT_PUBLIC_UMBRACO_ORIGIN ??
      process.env.NEXT_PUBLIC_UMBRACO_URL ??
      "https://localhost:44367";

    const mapped: Session[] = (data.items ?? [])
      .filter((x) => x.contentType === "workout")
      .map((x) => {
        const p = x.properties ?? {};
        const img = p.image?.[0]?.url ?? "";
        const imageUrl = img ? new URL(img, umbracoOrigin).toString() : "";

        return {
          id: x.id,
          slug: x.id,
          title: (p.title ?? x.id).replaceAll("\\n", "\n"),
          minutes: Math.max(1, Math.round((p.duration ?? 0) / 60)),
          level: toLevel(p.levelEasyMediumAdvanced),
          imageUrl,
          tags: toTags(p),
        };
      });

    setSessions(mapped);
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        await loadWorkouts();

        try {
          await loadFavorites();
        } catch {
          // ok (not logged in etc)
        }
      } catch (e: any) {
        if (alive) setError(e?.message ?? "Fetch failed");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return sessions.filter((s) => {
      const matchesQuery = !q || s.title.toLowerCase().includes(q);
      const matchesTag = !activeTag || s.tags.includes(activeTag);
      return matchesQuery && matchesTag;
    });
  }, [sessions, query, activeTag]);

  const todays = filtered[0];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-4xl">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div className="font-serif text-3xl tracking-tight sm:text-4xl">MoveKind</div>
          </div>

          {/* Search */}
          <div className="mt-6 sm:mt-7">
            <div className="flex items-center gap-3 rounded-full bg-[color:rgba(255,255,255,0.45)] dark:bg-[color:rgba(255,255,255,0.06)] px-5 py-4">
              <Search className="h-5 w-5 text-[var(--muted)] sm:h-6 sm:w-6" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for sessions (e.g., knees, seated)"
                className="w-full bg-transparent text-base text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none sm:text-lg"
              />
            </div>
          </div>

          <div className="mt-8 h-px w-full bg-[var(--line)]" />

          {/* Quick links */}
          <section className="mt-8 sm:mt-10">
            <h2 className="font-serif text-3xl sm:text-4xl">Quick links</h2>

            <div className="mt-5 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
              {quickLinks.map((t) => {
                const active = activeTag === t;

                return (
                  <button
                    key={t}
                    onClick={() => setActiveTag(active ? null : t)}
                    className={[
                      "rounded-2xl border px-4 py-2 font-serif text-xl sm:px-6 sm:py-3 sm:text-2xl transition",
                      active
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                        : "border-[var(--accent)] bg-[color:rgba(255,255,255,0.55)] dark:bg-[color:rgba(255,255,255,0.06)] hover:bg-[color:rgba(255,255,255,0.75)] dark:hover:bg-[color:rgba(255,255,255,0.10)]",
                    ].join(" ")}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Recommended */}
          <section className="mt-10 sm:mt-14">
            <h2 className="font-serif text-3xl sm:text-4xl">Recommended sessions</h2>

            {loading && <p className="mt-4 text-[var(--muted)]">Loading workouts…</p>}
            {error && <p className="mt-4 text-red-700">Error: {error}</p>}

            {msg && (
              <div className="mt-4 rounded-xl bg-[color:rgba(156,255,122,0.75)] dark:bg-[color:rgba(156,255,122,0.22)] px-5 py-3 font-serif text-xl sm:text-2xl">
                {msg}
              </div>
            )}

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => {
                const fav = isFav(s.id);

                return (
                  <article
                    key={s.id}
                    className="overflow-hidden rounded-2xl border border-[var(--accent)] bg-[color:rgba(255,255,255,0.45)] dark:bg-[color:rgba(255,255,255,0.06)]"
                  >
                    {/* Image */}
                    <div className="relative">
                      <Link href={`/workouts/${s.slug}`} className="block">
                        <div className="aspect-[4/3] w-full bg-black/5 dark:bg-white/5">
                          {s.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={s.imageUrl}
                              alt={s.title.replace("\n", " ")}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : null}
                        </div>
                      </Link>

                      {/* ❤️ Favorite overlay */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(s.id);
                        }}
                        className="absolute right-3 top-3 rounded-full bg-[color:rgba(255,255,255,0.80)] dark:bg-[color:rgba(0,0,0,0.35)] p-3 shadow-sm backdrop-blur hover:bg-white dark:hover:bg-[color:rgba(0,0,0,0.45)]"
                        aria-label={fav ? "Remove favorite" : "Add favorite"}
                        title={fav ? "Remove favorite" : "Add favorite"}
                      >
                        <Heart className="h-6 w-6" fill={fav ? "currentColor" : "none"} />
                      </button>
                    </div>

                    {/* Text */}
                    <Link href={`/workouts/${s.slug}`} className="block p-5">
                      <h3
                        className={[
                          "font-serif text-2xl leading-snug sm:text-3xl",
                          "[display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical] overflow-hidden",
                        ].join(" ")}
                      >
                        {s.title}
                      </h3>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-base text-[var(--muted)] sm:text-lg">
                        <span>{s.minutes} min</span>
                        <span>·</span>
                        <span>{s.level}</span>

                        {/* chips */}
                        {s.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="ml-2 rounded-full border border-[var(--accent)]/40 bg-[color:rgba(255,255,255,0.55)] dark:bg-[color:rgba(255,255,255,0.06)] px-3 py-1 text-sm text-[var(--ink)]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Quick start */}
          {todays && (
            <section className="mt-10 sm:mt-14">
              <div className="rounded-2xl bg-[var(--card)] p-6 sm:p-8">
                <h2 className="font-serif text-3xl sm:text-4xl">Quick start</h2>

                <p className="mt-3 text-xl text-[var(--muted)] sm:mt-4 sm:text-2xl">
                  Start with today’s recommended session:
                </p>

                <p className="mt-2 text-xl font-semibold text-[var(--muted)] sm:text-2xl">
                  {todays.title.replace("\n", " ")} ({todays.minutes} min)
                </p>

                <Link
                  href={`/workouts/${todays.id}/play`}
                  className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-[var(--btn)] px-8 py-5 font-serif text-lg text-[var(--btnText)] hover:opacity-95 sm:text-xl"
                >
                  Start now
                </Link>
              </div>
            </section>
          )}

          <div className="h-10" />
        </div>
      </div>
    </div>
  );
}
