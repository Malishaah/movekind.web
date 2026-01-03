"use client";

import Link from "next/link";
import { useEffect, useMemo, useId, useState } from "react";
import { apiGet, apiPost, apiDelete } from "@/app/lib/api";
import { ArrowLeft, Search, ChevronDown, Heart, Play } from "lucide-react";

type LevelUI = "Any Level" | "Easy" | "Medium" | "Advanced";
type PositionUI = "Any Position" | "Seated" | "Standing" | "Lying";

const ANY_BODY = "Any body part";
const ANY_LEVEL: LevelUI = "Any Level";
const ANY_POS: PositionUI = "Any Position";

type Workout = {
  id: string;
  slug: string;
  title: string;
  minutes: number;
  levelText: "Easy" | "Medium" | "Advanced";
  tagsText: string;
  imageUrl?: string | null;
  floorFriendly?: boolean;
  chairFriendly?: boolean;
  focus?: string[];
  position?: string[];
};

type DeliveryItem = {
  id: string;
  contentType: string;
  name: string;
  route?: { path?: string };
  properties?: {
    title?: string;
    duration?: number;
    levelEasyMediumAdvanced?: "Easy" | "Medium" | "Advanced";
    focus?: string[];
    position?: string[];
    floorFriendly?: boolean;
    chairFriendly?: boolean;
    image?: Array<{ url: string }>;
  };
};

type DeliveryResponse = { total: number; items: DeliveryItem[] };

function chipTags(focus?: string[], position?: string[]) {
  const a = [...(focus ?? []), ...(position ?? [])]
    .map((x) => x?.trim())
    .filter(Boolean);
  return a.slice(0, 2).join(", ");
}

export default function WorkoutsPage() {
  const [items, setItems] = useState<Workout[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [bodyPart, setBodyPart] = useState<string>(ANY_BODY);
  const [level, setLevel] = useState<LevelUI>(ANY_LEVEL);
  const [position, setPosition] = useState<PositionUI>(ANY_POS);
  const [floorFriendlyOnly, setFloorFriendlyOnly] = useState(false);

  const searchId = useId();
  const statusId = useId();

  // UI tokens (kräver att du har --panel och --field i CSS)
  const panel = "bg-[var(--panel)] border border-[var(--line)]";
  const field = "bg-[var(--field)] border border-[var(--line)]";

  const focusRing =
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/25";

  async function loadWorkouts() {
    setMsg(null);
    try {
      const res = await fetch("/api/workouts", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: DeliveryResponse = await res.json();

      const mapped: Workout[] = (data.items ?? [])
        .filter((x) => x.contentType === "workout")
        .map((x) => {
          const p = x.properties ?? {};
          const imageUrl = p.image?.[0]?.url ?? "";

          const slug = x.id;
          const title = p.title ?? x.name;
          const levelText = p.levelEasyMediumAdvanced ?? "Easy";
          const minutes = Math.max(1, Math.round((p.duration ?? 0) / 60));
          const tagsText = chipTags(p.focus, p.position);

          return {
            id: x.id,
            slug,
            title,
            minutes,
            levelText,
            tagsText,
            imageUrl,
            floorFriendly: p.floorFriendly,
            chairFriendly: p.chairFriendly,
            focus: p.focus ?? [],
            position: p.position ?? [],
          };
        });

      setItems(mapped);
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to load workouts");
    }
  }

  async function loadFavorites() {
    try {
      const ids = await apiGet("/api/favorites/ids");
      setFavoriteIds(Array.isArray(ids) ? ids : []);
    } catch {
      setFavoriteIds([]);
    }
  }

  useEffect(() => {
    loadWorkouts();
    loadFavorites();
  }, []);

  const bodyPartOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((w) => (w.focus ?? []).forEach((f) => set.add(f)));
    return [ANY_BODY, ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((w) => {
      const matchesQuery =
        !q ||
        w.title.toLowerCase().includes(q) ||
        (w.focus ?? []).some((x) => x.toLowerCase().includes(q)) ||
        (w.position ?? []).some((x) => x.toLowerCase().includes(q));

      const matchesBody =
        bodyPart === ANY_BODY || (w.focus ?? []).some((x) => x === bodyPart);

      const matchesLevel = level === "Any Level" || w.levelText === level;

      const matchesPos =
        position === "Any Position" ||
        (w.position ?? []).some((x) =>
          x.toLowerCase().includes(position.toLowerCase())
        );

      const matchesFloor = !floorFriendlyOnly || w.floorFriendly === true;

      return matchesQuery && matchesBody && matchesLevel && matchesPos && matchesFloor;
    });
  }, [items, query, bodyPart, level, position, floorFriendlyOnly]);

  function isFav(id: string) {
    return favoriteIds.includes(id);
  }

  async function toggle(id: string) {
    try {
      if (isFav(id)) {
        await apiDelete(`/api/favorites/${encodeURIComponent(id)}`);
        setFavoriteIds((prev) => prev.filter((x) => x !== id));
      } else {
        await apiPost(`/api/favorites/${encodeURIComponent(id)}`);
        setFavoriteIds((prev) => [...prev, id]);
        setMsg("Saved to Favorites");
        window.setTimeout(() => setMsg(null), 1500);
      }
    } catch (err: any) {
      setMsg(err?.message || "Toggle failed");
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="flex items-center gap-3">
          <Link
            href="/"
            className={["rounded-full p-2 hover:opacity-90", focusRing].join(" ")}
            aria-label="Back"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl">Search sessions</h1>
        </header>

        {/* Search input */}
        <section className="mt-5 sm:mt-6" aria-label="Search">
          <div className={["flex items-center gap-3 rounded-full px-5 py-4", field].join(" ")}>
            <Search className="h-6 w-6 text-[var(--muted)]" aria-hidden="true" />
            <label htmlFor={searchId} className="sr-only">
              Search for sessions
            </label>
            <input
              id={searchId}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for sessions (e.g., knees, seated)"
              className={[
                "w-full bg-transparent text-base text-[var(--ink)] placeholder:text-[var(--muted)] sm:text-lg",
                "focus:outline-none",
                "border-0 ring-0 outline-none focus:ring-0 focus:border-0",
              ].join(" ")}
            />
          </div>
        </section>

        {/* Filters card */}
        <section
          className={["mt-6 rounded-2xl p-4 sm:mt-7 sm:p-6", panel].join(" ")}
          aria-label="Filters"
        >
          <h2 className="font-serif text-xl sm:text-2xl">Filters</h2>

          <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4 md:grid-cols-3">
            <SelectLike
              label="Body part"
              value={bodyPart}
              options={bodyPartOptions}
              onChange={setBodyPart}
              fieldClass={field}
            />
            <SelectLike
              label="Level"
              value={level}
              options={["Any Level", "Easy", "Medium", "Advanced"]}
              onChange={(v) => setLevel(v as LevelUI)}
              fieldClass={field}
            />
            <SelectLike
              label="Position"
              value={position}
              options={["Any Position", "Seated", "Standing", "Lying"]}
              onChange={(v) => setPosition(v as PositionUI)}
              fieldClass={field}
            />
          </div>

          {/* ✅ floor-friendly row with darker border */}
          <div
            className={[
              "mt-4 flex items-center justify-between gap-4 rounded-2xl px-4 py-4 sm:mt-5 sm:px-5",
              "bg-[var(--panel)] border border-black/15 dark:border-white/15",
            ].join(" ")}
          >
            <div className="font-serif text-lg sm:text-xl">Floor-friendly</div>
            <Toggle checked={floorFriendlyOnly} onChange={setFloorFriendlyOnly} />
          </div>
        </section>

        {/* Results */}
        <section className="mt-8 sm:mt-10" aria-label="Results">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-3xl sm:text-4xl">Results ({filtered.length})</h2>
          </div>

          <p id={statusId} className="sr-only" aria-live="polite">
            {msg ? msg : `Showing ${filtered.length} results`}
          </p>

          {msg && (
            <div className="mt-4 rounded-xl bg-[var(--panel)] px-5 py-3 font-serif text-lg sm:text-xl">
              {msg}
            </div>
          )}

          <div className="mt-6 space-y-6">
            {filtered.map((w) => {
              const href = `/workouts/${w.slug}`;
              const fav = isFav(w.id);

              return (
                <article key={w.id} className={["overflow-hidden rounded-3xl", panel].join(" ")}>
                  <div className="relative">
                    <Link
                      href={href}
                      className={["block group", focusRing].join(" ")}
                      aria-label={`Open ${w.title}`}
                    >
                      <div className="relative aspect-[16/10] w-full bg-black/5 sm:aspect-auto sm:h-28">
                        {w.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={w.imageUrl}
                            alt={w.title}
                            className="h-full w-full object-cover transition group-hover:scale-[1.01]"
                            loading="lazy"
                          />
                        ) : null}

                        <div
                          className="pointer-events-none absolute inset-0 grid place-items-center"
                          aria-hidden="true"
                        >
                          <div className="grid h-12 w-12 place-items-center rounded-full bg-black/40 backdrop-blur-sm">
                            <Play className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </div>

                      <div className="p-5 sm:p-6">
                        <h3 className="font-serif text-2xl leading-tight sm:text-3xl group-hover:underline">
                          {w.title}
                        </h3>
                        <div className="mt-2 text-lg text-[var(--muted)] sm:text-xl">
                          {w.minutes} min · {w.levelText}
                          {w.tagsText ? ` · ${w.tagsText}` : ""}
                        </div>
                      </div>
                    </Link>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggle(w.id);
                      }}
                      className={[
                        "absolute right-3 top-3 rounded-full p-2 backdrop-blur-sm hover:opacity-90",
                        field,
                        focusRing,
                      ].join(" ")}
                      aria-label={
                        fav
                          ? `Remove ${w.title} from favorites`
                          : `Add ${w.title} to favorites`
                      }
                      aria-pressed={fav}
                      title={fav ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart
                        className="h-6 w-6 sm:h-7 sm:w-7"
                        fill={fav ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <div className="h-10" />
      </div>
    </main>
  );
}

function SelectLike({
  label,
  value,
  options,
  onChange,
  fieldClass,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  fieldClass: string;
}) {
  const selectId = useId();

  return (
    <div className="relative">
      <label htmlFor={selectId} className="sr-only">
        {label}
      </label>

      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "w-full appearance-none rounded-xl",
          fieldClass,
          "px-4 py-2.5 pr-10 font-serif text-lg sm:text-xl",
          "text-[var(--ink)]",
          "focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25",
          // skyddar mot @tailwindcss/forms default
          "ring-0 outline-none focus:ring-2",
          "[background-image:none]",
        ].join(" ")}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted)]"
        aria-hidden="true"
      />
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        "relative h-10 w-[68px] rounded-full border transition-colors",
        // ✅ lite mer "svart" runt i light mode, mjuk i dark
        "border-black/25 dark:border-white/20",
        checked ? "bg-[var(--accent)]" : "bg-[var(--field)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/25",
        "shadow-sm",
      ].join(" ")}
      aria-label="Filter: floor-friendly only"
    >
      <span
        className={[
          "absolute top-1/2 h-8 w-8 -translate-y-1/2 rounded-full transition",
          "bg-white dark:bg-[color:rgba(255,255,255,0.92)]",
          "border border-black/10 dark:border-white/15 shadow-sm",
          checked ? "left-[34px]" : "left-1",
        ].join(" ")}
      />
    </button>
  );
}
