"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Settings, Search, Heart } from "lucide-react";

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
    duration?: number; // sekunder
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
    .map((x) => x?.toLowerCase?.().trim?.() ?? "")
    .filter(Boolean);

  const tags = new Set<Tag>();

  // Om du har "knee/back/shoulder" i dina focus/position
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/workouts", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: DeliveryResponse = await res.json();

        const umbracoOrigin =
          process.env.NEXT_PUBLIC_UMBRACO_ORIGIN ?? "https://localhost:44367";

        const mapped: Session[] = (data.items ?? [])
          .filter((x) => x.contentType === "workout")
          .map((x) => {
            const p = x.properties ?? {};
            const img = p.image?.[0]?.url ?? "";

            const imageUrl = img ? new URL(img, umbracoOrigin).toString() : "";
            const slug =  x.id;

            return {
              id: x.id,
              slug,
              title: (p.title ?? x.properties?.title ?? x.id).replaceAll("\\n", "\n"),
              minutes: Math.max(1, Math.round((p.duration ?? 0) / 60)),
              level: toLevel(p.levelEasyMediumAdvanced),
              imageUrl,
              tags: toTags(p),
            };
          });

        if (alive) setSessions(mapped);
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

  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<Tag | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || s.title.toLowerCase().includes(q);
      const matchesTag = !activeTag || s.tags.includes(activeTag);
      return matchesQuery && matchesTag;
    });
  }, [sessions, query, activeTag]);

  const todays = filtered[0];

  return (
    <div className="min-h-screen bg-[#fbf7f2] text-[#1f1b16]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mx-auto max-w-4xl">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div className="font-serif text-4xl tracking-tight">MoveKind</div>
          </div>

          {/* Search */}
          <div className="mt-7">
            <div className="flex items-center gap-3 rounded-full bg-[#efe7de] px-5 py-4">
              <Search className="h-6 w-6 text-[#6e655c]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for sessions (e.g., knees, seated)"
                className="w-full bg-transparent text-lg text-[#3a332c] placeholder:text-[#7a7066] focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-8 h-px w-full bg-[#d8cbbf]" />

          {/* Quick links */}
          <section className="mt-10">
            <h2 className="font-serif text-4xl">Quick links</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {quickLinks.map((t) => {
                const active = activeTag === t;
                return (
                  <button
                    key={t}
                    onClick={() => setActiveTag(active ? null : t)}
                    className={[
                      "rounded-2xl border px-6 py-3 font-serif text-2xl",
                      active
                        ? "border-[#6b5648] bg-[#6b5648] text-white"
                        : "border-[#6b5648] bg-white/60 hover:bg-white",
                    ].join(" ")}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Recommended */}
          <section className="mt-14">
            <h2 className="font-serif text-4xl">Recommended sessions</h2>

            {loading && <p className="mt-4 text-[#6e655c]">Loading workouts…</p>}
            {error && <p className="mt-4 text-red-700">Error: {error}</p>}

            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => {
                const fav = !!favorites[s.id];

                return (
                  <article
                    key={s.id}
                    className="relative overflow-hidden rounded-2xl bg-[#d9d1c8]/70"
                  >
                    {/* Klickbart kort */}
                    <Link href={`/workouts/${s.slug}`} className="block">
                      <div className="aspect-[4/3] w-full bg-black/5">
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

                      <div className="p-5">
                        <h3 className="whitespace-pre-line font-serif text-3xl leading-snug">
                          {s.title}
                        </h3>
                        <p className="mt-2 text-lg text-[#6e655c]">
                          {s.minutes} min · {s.level}
                        </p>
                      </div>
                    </Link>

                    {/* Favorit-knapp (stoppar navigation) */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFavorites((p) => ({ ...p, [s.id]: !p[s.id] }));
                      }}
                      className="absolute right-4 top-4 rounded-full bg-white/40 p-2 hover:bg-white/60"
                      aria-label={fav ? "Remove favorite" : "Add favorite"}
                      title={fav ? "Remove favorite" : "Add favorite"}
                    >
                      <Heart className="h-7 w-7" fill={fav ? "currentColor" : "none"} />
                    </button>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Quick start */}
          {todays && (
            <section className="mt-14">
              <div className="rounded-2xl bg-[#e0d6cc] p-8">
                <h2 className="font-serif text-4xl">Quick start</h2>
                <p className="mt-4 text-2xl text-[#6e655c]">
                  Start with today’s recommended session:
                </p>
                <p className="mt-2 text-2xl font-semibold text-[#6e655c]">
                  {todays.title.replace("\n", " ")} ({todays.minutes} min)
                </p>


                <Link
  href={`/workouts/${todays.id}/play`}
  className="flex w-full items-center justify-center gap-3 rounded-full bg-[#2a2521] px-8 py-5 font-serif text-xl text-white hover:opacity-95"
>
  Start now
</Link>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
