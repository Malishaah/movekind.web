"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, apiDelete } from "@/app/lib/api";
import { ArrowLeft, Search, ChevronDown, Heart, Play } from "lucide-react";

type LevelUI = "Any" | "Easy" | "Medium" | "Advanced";
type PositionUI = "Any" | "Seated" | "Standing" | "Lying";

type Workout = {
  id: string;              // GUID från Umbraco
  slug: string;            // från route.path
  title: string;
  minutes: number;
  levelText: string;       // "Easy" etc
  tagsText: string;        // "Knee, Balance"
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

function slugFromPath(path?: string, fallback = "") {
  const parts = (path ?? "").split("/").filter(Boolean);
  return parts[parts.length - 1] || fallback;
}

function chipTags(focus?: string[], position?: string[]) {
  const a = [...(focus ?? []), ...(position ?? [])].map((x) => x?.trim()).filter(Boolean);
  // i bilden står typ "Knee, Balance" — vi tar max 2 för snygg meta
  return a.slice(0, 2).join(", ");
}

export default function WorkoutsPage() {
  const [items, setItems] = useState<Workout[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  // UI state
  const [query, setQuery] = useState("");
  const [bodyPart, setBodyPart] = useState<string>("Any");
  const [level, setLevel] = useState<LevelUI>("Any");
  const [position, setPosition] = useState<PositionUI>("Any");
  const [floorFriendlyOnly, setFloorFriendlyOnly] = useState(false);

  async function loadWorkouts() {
    setMsg(null);
    try {
      const res = await fetch("/api/workouts", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: DeliveryResponse = await res.json();

      const umbracoOrigin =
        process.env.NEXT_PUBLIC_UMBRACO_ORIGIN ?? "https://localhost:44367";

      const mapped: Workout[] = (data.items ?? [])
        .filter((x) => x.contentType === "workout")
        .map((x) => {
          const p = x.properties ?? {};
          const img = p.image?.[0]?.url;
          const imageUrl = img ? new URL(img, umbracoOrigin).toString() : null;

          const slug =  x.id;
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
      const ids = await apiGet("/api/favorites/ids"); // bör returnera string[] (GUID)
      setFavoriteIds(ids);
    } catch (err: any) {
      setMsg(err?.message || "Could not load favorites");
    }
  }

  useEffect(() => {
    loadWorkouts();
    loadFavorites();
  }, []);

  const bodyPartOptions = useMemo(() => {
    // samla unika från focus
    const set = new Set<string>();
    items.forEach((w) => (w.focus ?? []).forEach((f) => set.add(f)));
    return ["Any", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
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
        bodyPart === "Any" || (w.focus ?? []).some((x) => x === bodyPart);

      const matchesLevel =
        level === "Any" || w.levelText === level;

      const matchesPos =
        position === "Any" ||
        (w.position ?? []).some((x) => x.toLowerCase().includes(position.toLowerCase()));

      const matchesFloor =
        !floorFriendlyOnly || w.floorFriendly === true;

      return matchesQuery && matchesBody && matchesLevel && matchesPos && matchesFloor;
    });
  }, [items, query, bodyPart, level, position, floorFriendlyOnly]);

  function isFav(id: string) {
    return favoriteIds.includes(id);
  }

  async function toggle(id: string) {
    try {
      if (isFav(id)) {
        await apiDelete(`/api/favorites/${id}`);
        setFavoriteIds((prev) => prev.filter((x) => x !== id));
      } else {
        await apiPost(`/api/favorites/${id}`);
        setFavoriteIds((prev) => [...prev, id]);
        // valfri toast-liknande msg
        setMsg("Saved to Favorites");
        setTimeout(() => setMsg(null), 1500);
      }
    } catch (err: any) {
      setMsg(err?.message || "Toggle failed");
    }
  }

  return (
    <div className="min-h-screen bg-[#fbf7f2] text-[#1f1b16]">
      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/" className="rounded-full p-2 hover:bg-black/5" aria-label="Back">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="font-serif text-4xl">Search sessions</h1>
        </div>

        {/* Search input */}
        <div className="mt-6 flex items-center gap-3 rounded-full bg-[#efe7de] px-5 py-4">
          <Search className="h-6 w-6 text-[#6e655c]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for sessions (e.g., knees, seated)"
            className="w-full bg-transparent text-lg text-[#3a332c] placeholder:text-[#7a7066] focus:outline-none"
          />
        </div>

        {/* Filters card */}
        <div className="mt-7 rounded-2xl bg-[#e0d6cc] p-6">
          <div className="font-serif text-4xl">Filters</div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <SelectLike
              label="Body part"
              value={bodyPart}
              options={bodyPartOptions}
              onChange={setBodyPart}
            />
            <SelectLike
              label="Level"
              value={level}
              options={["Any", "Easy", "Medium", "Advanced"]}
              onChange={(v) => setLevel(v as LevelUI)}
            />
            <SelectLike
              label="Position"
              value={position}
              options={["Any", "Seated", "Standing", "Lying"]}
              onChange={(v) => setPosition(v as PositionUI)}
            />
          </div>

          <div className="mt-5 flex items-center justify-between rounded-2xl border border-[#6b5648] bg-white/30 px-5 py-4">
            <div className="font-serif text-3xl">Floor-friendly</div>
            <Toggle
              checked={floorFriendlyOnly}
              onChange={setFloorFriendlyOnly}
            />
          </div>
        </div>

        {/* Results */}
        <div className="mt-10 flex items-baseline justify-between">
          <div className="font-serif text-4xl">Results ({filtered.length})</div>
        </div>

        {msg && (
          <div className="mt-4 rounded-xl bg-lime-300/70 px-5 py-3 font-serif text-2xl">
            {msg}
          </div>
        )}

        <div className="mt-6 space-y-5">
          {filtered.map((w) => (
            <div
              key={w.id}
              className="rounded-2xl border border-[#6b5648] bg-white/40 p-5"
            >
              <div className="flex items-center gap-5">
                {/* thumb */}
                <Link href={`/workouts/${w.slug}`} className="block">
                  <div className="relative h-28 w-28 overflow-hidden rounded-xl bg-black/5">
                    {w.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={w.imageUrl}
                        alt={w.title}
                        className="h-full w-full object-cover"
                      />
                    ) : null}

                    {/* play overlay */}
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-black/40">
                        <Play className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                </Link>

                {/* text */}
                <Link href={`/workouts/${w.slug}`} className="flex-1">
                  <div className="font-serif text-3xl leading-tight">
                    {w.title}
                  </div>
                  <div className="mt-2 text-2xl text-[#6e655c]">
                    {w.minutes} min · {w.levelText}
                    {w.tagsText ? ` · ${w.tagsText}` : ""}
                  </div>
                </Link>

                {/* heart */}
                <button
                  onClick={() => toggle(w.id)}
                  className="rounded-full p-2 hover:bg-black/5"
                  aria-label={isFav(w.id) ? "Unfavorite" : "Favorite"}
                >
                  <Heart
                    className="h-9 w-9"
                    fill={isFav(w.id) ? "currentColor" : "none"}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom spacing */}
        <div className="h-10" />
      </div>
    </div>
  );
}

/** Ser ut som dropdown-knapparna i bilden (enkel UI, ej native select-look) */
function SelectLike({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-2xl border border-[#6b5648] bg-white/30 px-5 py-4 pr-12 font-serif text-3xl focus:outline-none focus:ring-2 focus:ring-[#6b5648]/20"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-7 w-7 -translate-y-1/2 text-[#1f1b16]" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        "relative h-12 w-20 rounded-full border border-[#6b5648] transition",
        checked ? "bg-[#6b5648]" : "bg-white/40",
      ].join(" ")}
      aria-pressed={checked}
    >
      <span
        className={[
          "absolute top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-white transition",
          checked ? "left-9" : "left-1",
        ].join(" ")}
      />
    </button>
  );
}
