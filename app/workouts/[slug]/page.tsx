"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useId } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Info, AlertCircle, Play, Plus } from "lucide-react";

type DeliveryWorkout = {
  id: string; // guid with hyphens
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
    description?: any; // rich text json
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
          };
        };
      }>;
    };
  };
};

function toUdiFromGuid(guidWithHyphens: string) {
  const g = (guidWithHyphens ?? "").trim();
  if (!g) return null;
  return `umb://document/${g.replace(/-/g, "")}`;
}

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

function Chip({ children }: { children: React.ReactNode; }) {
  return (
<span
  className={[
    "inline-flex items-center rounded-2xl px-4 py-2 font-serif text-xl transition border text-zinc-900 bg-white/90 border-zinc-300 dark:text-zinc-100 dark:bg-zinc-900/60 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900/70",
  ].join(" ")}>
  {children}
</span>
  );
}

export default function WorkoutDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [data, setData] = useState<DeliveryWorkout | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const descId = useId();
  const stepsId = useId();
  const infoId = useId();

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

  const umbracoOrigin =
    process.env.NEXT_PUBLIC_UMBRACO_ORIGIN ??
    process.env.NEXT_PUBLIC_UMBRACO_URL ??
    "https://localhost:44367";

  const heroImg = p?.image?.[0]?.url ? new URL(p.image[0].url, umbracoOrigin).toString() : null;

  const title = p?.title ?? data?.name ?? "Workout";
  const level = p?.levelEasyMediumAdvanced ?? "Easy";
  const minutes = useMemo(() => Math.max(1, Math.round((p?.duration ?? 0) / 60)), [p?.duration]);

  const tags = useMemo(() => {
    const f = (p?.focus ?? []).filter(Boolean);
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

    return items.sort((a, b) => (a.order - b.order) || (a.startAt - b.startAt));
  }, [p?.steps]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg)] p-8 text-[var(--ink)]" aria-busy="true">
        Loading…
      </main>
    );
  }

  if (err) {
    return (
      <main className="min-h-screen bg-[var(--bg)] p-8 text-red-700" role="alert">
        Error: {err}
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Header */}
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/20"
            aria-label="Back"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>

          <h1 className="font-serif text-3xl">
            {title} – <span className="text-[var(--muted)]">{level}</span>
          </h1>
        </header>

        {/* Chips */}
        <section className="mt-5" aria-label="Workout details">
          <div className="flex flex-wrap gap-3">
            <Chip>{minutes}min</Chip>
            <Chip>{level}</Chip>
            {tags.map((t, i) => (
              <Chip key={`${t}-${i}`}>{t}</Chip>
            ))}
          </div>
        </section>

        {/* Media */}
        <section className="mt-6" aria-label="Workout media">
          <div className="overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5">
            <div className="relative">
              {heroImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroImg} alt={title} className="h-auto w-full object-cover" />
              ) : (
                <div className="aspect-video w-full" aria-hidden="true" />
              )}

              <Link
                href={`/workouts/${slug}/play`}
                aria-label={`Play workout: ${title}`}
                className="absolute inset-0 grid place-items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <span className="grid h-16 w-16 place-items-center rounded-full bg-black/50 backdrop-blur-sm transition hover:bg-black/60">
                  <Play className="h-8 w-8 text-white" aria-hidden="true" />
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Description */}
        {description ? (
          <section className="mt-6" aria-labelledby={descId}>
            <h2 id={descId} className="sr-only">
              Description
            </h2>
            <p className="font-serif text-2xl leading-snug">{description}</p>
          </section>
        ) : null}

        {/* Info box (dl/dt/dd är mer semantiskt) */}
        <section className="mt-6" aria-labelledby={infoId}>
          <h2 id={infoId} className="sr-only">
            Session info
          </h2>

          <div className="rounded-2xl border border-[var(--accent)] bg-[color:rgba(255,255,255,0.45)] dark:bg-[color:rgba(255,255,255,0.06)] p-5">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full border border-[var(--accent)] p-2" aria-hidden="true">
                <Info className="h-6 w-6" />
              </div>

              <dl className="grid gap-2 text-lg">
                <div>
                  <dt className="sr-only">Equipment</dt>
                  <dd className="font-serif">Equipment: {p?.chairFriendly ? "Chair" : "None"}</dd>
                </div>

                <div>
                  <dt className="sr-only">Position</dt>
                  <dd className="font-serif">Position: {p?.position?.[0] ?? "—"}</dd>
                </div>

                <div>
                  <dt className="sr-only">Floor requirement</dt>
                  <dd className="font-serif">
                    {p?.floorFriendly ? "Floor-friendly" : "No floor required"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* Steps (ol/li är bäst här) */}
        <section className="mt-10" aria-labelledby={stepsId}>
          <h2 id={stepsId} className="font-serif text-3xl">
            Step-by-step
          </h2>

          <ol className="mt-5 space-y-5">
            {steps.map((s, idx) => (
              <li
                key={s.id}
                className="rounded-2xl border border-[var(--accent)] bg-[color:rgba(255,255,255,0.45)] dark:bg-[color:rgba(255,255,255,0.06)] p-6"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="grid h-9 w-9 place-items-center rounded-full bg-[color:rgba(191,226,234,0.9)] dark:bg-[color:rgba(191,226,234,0.18)] font-serif text-lg"
                    aria-label={`Step ${idx + 1}`}
                  >
                    {idx + 1}
                  </div>

                  <div className="flex-1">
                    <p className="font-serif text-2xl leading-snug">{s.instruction}</p>
                    <p className="mt-2 text-lg text-[var(--muted)]">
                      Time:{" "}
                      <time dateTime={`PT${Math.max(0, s.timeSeconds)}S`}>
                        {fmtTime(s.timeSeconds)}
                      </time>
                    </p>
                  </div>

                  <Check className="h-6 w-6 text-[var(--ink)]" aria-hidden="true" />
                </div>

                {s.safetyNote ? (
                  <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[color:rgba(255,242,214,0.95)] dark:bg-[color:rgba(180,83,9,0.12)] p-4 text-[color:#b45309] dark:text-[color:rgba(255,206,150,0.95)]">
                    <AlertCircle className="mt-0.5 h-9 w-9 shrink-0" aria-hidden="true" />
                    <div>
                      <div className="font-serif text-xl sm:text-2xl">Safety</div>
                      <div className="mt-1 text-base sm:text-lg font-semibold leading-snug">
                        {s.safetyNote}
                      </div>
                    </div>
                  </div>
                ) : null}

                {s.easierOption ? (
                  <div className="mt-4 rounded-xl bg-[color:rgba(255,255,255,0.35)] dark:bg-[color:rgba(255,255,255,0.06)] p-4 font-serif text-xl">
                    Easier option: <span className="text-[var(--muted)]">{s.easierOption}</span>
                  </div>
                ) : null}

                {s.harderOption ? (
                  <div className="mt-3 rounded-xl bg-[color:rgba(255,255,255,0.35)] dark:bg-[color:rgba(255,255,255,0.06)] p-4 font-serif text-xl">
                    Harder option: <span className="text-[var(--muted)]">{s.harderOption}</span>
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        {/* Bottom actions */}
        <section className="mt-10 space-y-4 pb-10" aria-label="Actions">

          <button
            type="button"
            onClick={() => {
              const workoutUdi = toUdiFromGuid(data.id) ?? "";
              const qp = new URLSearchParams({ add: "1", title, workoutUdi });
              router.push(`/schedule?${qp.toString()}`);
            }}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-[var(--btn)] px-8 py-5 font-serif text-xl text-[var(--btnText)] hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/20"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            Add to schedule
          </button>
        </section>
      </div>
    </main>
  );
}
