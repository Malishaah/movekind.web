"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiDelete } from "@/app/lib/api";
import { ArrowLeft, Search, Heart, Plus, Play, Home, Clock } from "lucide-react";

type FavNode = {
  id: number;
  key?: string;
  name: string;
  url?: string; // kan vara workout url eller route
  imageUrl?: string | null;
  title?: string | null;
  duration?: number | null; // sekunder
  level?: string | null;    // om du har detta senare
  tags?: string[] | null;   // om du har detta senare
};

function minutesText(seconds?: number | null) {
  if (!seconds || seconds <= 0) return "";
  return `${Math.max(1, Math.round(seconds / 60))} min`;
}

export default function FavoritesPage() {
  const [items, setItems] = useState<FavNode[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function load() {
    setMsg(null);
    try {
      const list = await apiGet("/api/favorites");
      setItems(list);
    } catch (err: any) {
      setMsg(err?.message || "Not logged in?");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: number) {
    try {
      await apiDelete(`/api/favorites/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      setMsg(err?.message || "Remove failed");
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((n) => {
      const t = (n.title ?? n.name ?? "").toLowerCase();
      return t.includes(q);
    });
  }, [items, query]);

  return (
    <div className="min-h-screen bg-[#fbf7f2] text-[#1f1b16]">
      <div className="mx-auto max-w-3xl px-6 py-8 pb-28">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/" className="rounded-full p-2 hover:bg-black/5" aria-label="Back">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="font-serif text-4xl">Favorites</h1>
        </div>

        <div className="mt-6 h-px w-full bg-[#d8cbbf]" />

        {/* Search */}
        <div className="mt-6 flex items-center gap-3 rounded-full bg-[#efe7de] px-5 py-4">
          <Search className="h-6 w-6 text-[#6e655c]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for sessions (e.g., knees, seated)"
            className="w-full bg-transparent text-lg text-[#3a332c] placeholder:text-[#7a7066] focus:outline-none"
          />
        </div>

        {/* Messages */}
        {msg && (
          <div className="mt-5 rounded-xl bg-black/5 px-5 py-4 text-lg text-[#3a332c]">
            {msg}
          </div>
        )}

        {/* List */}
        <div className="mt-8 space-y-5">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-[#6b5648] bg-white/30 p-6">
              <div className="font-serif text-3xl">No favorites yet.</div>
              <div className="mt-2 text-lg text-[#6e655c]">
                Save a session and it will appear here.
              </div>
            </div>
          ) : (
            filtered.map((n) => {
              const title = n.title ?? n.name;
              const mins = minutesText(n.duration);
              const meta = [
                mins,
                n.level ?? null,
                n.tags?.length ? n.tags.slice(0, 2).join(", ") : null,
              ]
                .filter(Boolean)
                .join(" · ");

              return (
                <div
                  key={n.id}
                  className="rounded-2xl border border-[#6b5648] bg-white/40 p-5"
                >
                  <div className="flex items-center gap-5">
                    {/* Thumb + play overlay */}
                    <Link href={n.url ?? "#"} className="block">
                      <div className="relative h-28 w-28 overflow-hidden rounded-xl bg-black/5">
                        {n.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={n.imageUrl}
                            alt={title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : null}

                        <div className="absolute inset-0 grid place-items-center">
                          <div className="grid h-12 w-12 place-items-center rounded-full bg-black/40">
                            <Play className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </div>
                    </Link>

                    {/* Text */}
                    <Link href={n.url ?? "#"} className="flex-1">
                      <div className="font-serif text-3xl leading-tight">{title}</div>
                      <div className="mt-2 text-2xl text-[#6e655c]">
                        {meta || (mins ? `${mins}` : "")}
                      </div>
                    </Link>

                    {/* Right actions (heart + plus) */}
                    <div className="flex flex-col items-center gap-4">
                      <button
                        onClick={() => remove(n.id)}
                        className="rounded-full p-2 hover:bg-black/5"
                        aria-label="Remove favorite"
                        title="Remove favorite"
                      >
                        <Heart className="h-9 w-9" fill="currentColor" />
                      </button>

                      <button
                        onClick={() => console.log("add to schedule", n.id)}
                        className="rounded-full p-2 hover:bg-black/5"
                        aria-label="Add to schedule"
                        title="Add to schedule"
                      >
                        <Plus className="h-9 w-9" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}

function BottomTab({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "flex items-center justify-center gap-3 rounded-t-3xl border border-[#d8cbbf] px-6 py-4",
        active ? "bg-[#2a2521] text-white" : "bg-[#d9d1c8]/60 hover:bg-[#d9d1c8]/80",
      ].join(" ")}
    >
      {icon}
      <span className="font-serif text-2xl">{label}</span>
    </Link>
  );
}
