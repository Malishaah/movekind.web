"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Info, AlertCircle, Play, Plus } from "lucide-react";
import Link from "next/link";

type DeliveryWorkout = {
  id: string;
  name: string;
  route?: { path?: string };
  properties?: {
    title?: string;
    duration?: number; // sekunder
    levelEasyMediumAdvanced?: "Easy" | "Medium" | "Advanced";
    focus?: string[];
    position?: string[];
    chairFriendly?: boolean;
    floorFriendly?: boolean;
    video?: string | null;
    image?: Array<{ url: string }>;
    description?: any; // rich text JSON
    steps?: {
      items?: Array<{
        content?: {
          id: string;
          properties?: {
            order?: number;
            instruction?: string;
            timeSeconds?: number;
            safetyNote?: string;
            easierOption?: string;
            harderOption?: string;
            startAt?: number;
            image?: Array<{ url: string }> | null;
          };
        };
      }>;
    };
  };
};

function richTextToPlain(node: any): string {
  if (!node) return "";
  if (node.tag === "#text" && typeof node.text === "string") return node.text;
  const children = node.elements ?? node.blocks ?? [];
  if (Array.isArray(children)) return children.map(richTextToPlain).join("");
  return "";
}

function fmtTime(seconds?: number | null) {
  const s = Math.max(0, seconds ?? 0);
  if (s < 60) return `${s} seconds`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m} min ${r} s` : `${m} min`;
}

export default function WorkoutDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [data, setData] = useState<DeliveryWorkout | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch(`/api/workouts/${slug}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const item: DeliveryWorkout = await res.json();
        if (alive) setData(item);
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "Failed to load workout");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [slug]);

  const p = data?.properties;

  const umbracoOrigin = process.env.NEXT_PUBLIC_UMBRACO_ORIGIN ?? "https://localhost:44367";
  const heroImg = p?.image?.[0]?.url ? new URL(p.image[0].url, umbracoOrigin).toString() : null;

  const minutes = useMemo(() => Math.max(1, Math.round((p?.duration ?? 0) / 60)), [p?.duration]);

  const tags = useMemo(() => {
    const f = (p?.focus ?? []).filter(Boolean);
    // Om du vill visa position som chips också:
    const pos = (p?.position ?? []).filter(Boolean);
    return [...f, ...pos].slice(0, 6);
  }, [p?.focus, p?.position]);

  const description = useMemo(() => richTextToPlain(p?.description), [p?.description]);

  const steps = useMemo(() => {
    const items =
      (p?.steps?.items ?? [])
        .map((x) => x?.content)
        .filter(Boolean)
        .map((s) => ({
          id: s!.id,
          order: s!.properties?.order ?? 0,
          startAt: s!.properties?.startAt ?? 0,
          instruction: s!.properties?.instruction ?? "",
          timeSeconds: s!.properties?.timeSeconds ?? 0,
          safetyNote: s!.properties?.safetyNote ?? "",
          easierOption: s!.properties?.easierOption ?? "",
          harderOption: s!.properties?.harderOption ?? "",
        })) ?? [];

    // sortera stabilt (order -> startAt)
    return items.sort((a, b) => (a.order - b.order) || (a.startAt - b.startAt));
  }, [p?.steps]);

  const title = p?.title ?? data?.name ?? "Workout";
  const level = p?.levelEasyMediumAdvanced ?? "Easy";

  if (loading) return <div className="min-h-screen bg-[#fbf7f2] p-8">Loading…</div>;
  if (err) return <div className="min-h-screen bg-[#fbf7f2] p-8 text-red-700">Error: {err}</div>;
  if (!data) return null;

  return (
    <div className="min-h-screen bg-[#fbf7f2] text-[#1f1b16]">
      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-full p-2 hover:bg-black/5"
            aria-label="Back"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="font-serif text-3xl">{title} – {level}</h1>
        </div>

        {/* Chips */}
        <div className="mt-5 flex flex-wrap gap-3">
          <Chip solid>{minutes}min</Chip>
          <Chip>{level}</Chip>
          {tags.map((t, i) => (
            <Chip key={`${t}-${i}`}>{t}</Chip>
          ))}
        </div>

{/* Media */}
<div className="mt-6 overflow-hidden rounded-2xl bg-black/5">
  <div className="relative">
    {heroImg ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={heroImg} alt={title} className="h-auto w-full object-cover" />
    ) : (
      <div className="aspect-video w-full" />
    )}

    {/* Clickable play overlay */}
    <Link
      href={`/workouts/${slug}/play`}
      aria-label="Play workout"
      className="absolute inset-0 grid place-items-center"
    >
      <span className="grid h-16 w-16 place-items-center rounded-full bg-black/50 backdrop-blur-sm transition hover:bg-black/60">
        <Play className="h-8 w-8 text-white" />
      </span>
    </Link>
  </div>
</div>
        {/* Description */}
        {description && (
          <p className="mt-6 font-serif text-2xl leading-snug">
            {description}
          </p>
        )}

        {/* Info box */}
        <div className="mt-6 rounded-2xl border border-[#cbb9aa] bg-white/40 p-5">
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-full border border-[#cbb9aa] p-2">
              <Info className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-lg">
              <div className="font-serif">
                Equipment: {p?.chairFriendly ? "Chair" : "None"}
              </div>
              <div className="font-serif">
                Position: {(p?.position?.[0] ?? "—")}
              </div>
              <div className="font-serif">
                {p?.floorFriendly ? "Floor-friendly" : "No floor required"}
              </div>
            </div>
          </div>
        </div>

        {/* Steps */}
        <h2 className="mt-10 font-serif text-3xl">Step-by-step</h2>

        <div className="mt-5 space-y-5">
          {steps.map((s, idx) => (
            <div key={s.id} className="rounded-2xl border border-[#cbb9aa] bg-white/40 p-6">
              <div className="flex items-start gap-4">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[#bfe2ea] font-serif text-lg">
                  {idx + 1}
                </div>

                <div className="flex-1">
                  <div className="font-serif text-2xl leading-snug">{s.instruction}</div>
                  <div className="mt-2 text-lg text-[#6e655c]">Time: {fmtTime(s.timeSeconds)}</div>
                </div>

                <Check className="h-6 w-6 text-[#1f1b16]" />
              </div>

              {/* Safety */}
              {s.safetyNote && (
                <div className="mt-4 flex items-start gap-2 text-[#d97706]">
                  <AlertCircle className="mt-0.5 h-5 w-5" />
                  <div className="text-lg font-semibold">{s.safetyNote}</div>
                </div>
              )}

              {/* Easier/Harder */}
              {s.easierOption && (
                <div className="mt-4 rounded-xl bg-[#d9d1c8]/70 p-4 font-serif text-xl">
                  Easier option: {s.easierOption}
                </div>
              )}
              {s.harderOption && (
                <div className="mt-3 rounded-xl bg-[#d9d1c8]/70 p-4 font-serif text-xl">
                  Harder option: {s.harderOption}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom actions */}
        <div className="mt-10 space-y-4 pb-10">
<Link
  href={`/workouts/${slug}/play`}
  className="flex w-full items-center justify-center gap-3 rounded-full bg-[#2a2521] px-8 py-5 font-serif text-xl text-white hover:opacity-95"
>
  Start now
</Link>

          <button className="flex w-full items-center justify-center gap-3 rounded-full bg-[#2a2521] px-8 py-5 font-serif text-xl text-white hover:opacity-95">
            <Plus className="h-5 w-5" />
            Add to schedule
          </button>
        </div>
      </div>
    </div>
  );
}

function Chip({ children, solid }: { children: React.ReactNode; solid?: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-2xl border px-4 py-2 font-serif text-xl",
        solid ? "border-[#6b5648] bg-[#6b5648] text-white" : "border-[#6b5648] bg-white/50",
      ].join(" ")}
    >
      {children}
    </span>
  );
}
