// app/workouts/[slug]/play/page.tsx
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { apiGet, apiPut } from "@/app/lib/api";

type DeliveryWorkout = {
  id: string;
  name: string;
  route?: { path?: string };
  properties?: {
    title?: string;
    video?: string;
    duration?: number;
    levelEasyMediumAdvanced?: "Easy" | "Medium" | "Advanced";
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

type Step = {
  id: string;
  startAt: number;
  timeSeconds: number;
  instruction: string;
  safetyNote: string;
  easierOption: string;
  harderOption: string;
};

function formatMMSS(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function findLastIndexByStartAt(steps: Step[], t: number) {
  let idx = 0;
  for (let i = 0; i < steps.length; i++) {
    if (t >= steps[i].startAt) idx = i;
    else break;
  }
  return idx;
}

export default function WorkoutPlayPage() {
  const { slug } = useParams<{ slug: string }>();

  const [data, setData] = useState<DeliveryWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);

  // steps
  const [stepIndex, setStepIndex] = useState(0);
  const [stepElapsed, setStepElapsed] = useState(0);

  // ✅ Captions / instruction overlay
  const [captionsOn, setCaptionsOn] = useState(true);
  const [savingCaptions, setSavingCaptions] = useState(false);

  // Load workout
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch(`/api/workouts/${slug}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const item: DeliveryWorkout = await res.json();
        if (alive) {
          setData(item);
          setVideoDuration(item?.properties?.duration ?? 0);
        }
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

  // ✅ Load captionsOnByDefault from profile (if logged in)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const me: any = await apiGet("/api/members/me");
        if (!alive) return;
        // captionsOnByDefault = true => show overlay
        setCaptionsOn(!!me?.captionsOnByDefault);
      } catch {
        // not logged in => keep default true (or set false if you prefer)
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  async function toggleCaptions() {
    const next = !captionsOn;
    setCaptionsOn(next);

    // Spara till profil om endpoint finns/kräver login.
    // Om din backend kräver "hela profilen", gör GET + PUT merge (se kommentaren nedan).
    try {
      setSavingCaptions(true);

      // ✅ Variant A: PATCH-lik PUT (funkar om din backend accepterar partial)
      await apiPut("/api/members/me", { captionsOnByDefault: next });

      // ✅ Variant B (om du får 400/valideringsfel): uncommenta istället
      // const me: any = await apiGet("/api/members/me");
      // await apiPut("/api/members/me", { ...me, captionsOnByDefault: next });
    } catch {
      // om save failar, låt ändå UI vara togglad (eller revert om du vill)
    } finally {
      setSavingCaptions(false);
    }
  }



  const title = data?.properties?.title ?? data?.name ?? "Workout";
  const level = data?.properties?.levelEasyMediumAdvanced ?? "Easy";

  const videoUrl = useMemo(() => {
    const v = data?.properties?.video;
    return v ? v : "";
  }, [data]);

  const steps: Step[] = useMemo(() => {
    const raw =
      (data?.properties?.steps?.items ?? [])
        .map((x) => x?.content)
        .filter(Boolean)
        .map((s) => {
          const p = s!.properties ?? {};
          return {
            id: s!.id,
            startAt: Math.max(0, p.startAt ?? 0),
            timeSeconds: Math.max(0, p.timeSeconds ?? 0),
            instruction: p.instruction ?? "",
            safetyNote: p.safetyNote ?? "",
            easierOption: p.easierOption ?? "",
            harderOption: p.harderOption ?? "",
          };
        }) ?? [];

    raw.sort((a, b) => a.startAt - b.startAt);
    if (raw.length === 0) return [];

    const end = Math.max(
      0,
      videoDuration || 0,
      data?.properties?.duration || 0,
      raw[raw.length - 1].startAt + raw[raw.length - 1].timeSeconds
    );

    return raw.map((s, i) => {
      const next = raw[i + 1];
      const inferred = next
        ? Math.max(1, next.startAt - s.startAt)
        : Math.max(1, end - s.startAt);

      return { ...s, timeSeconds: s.timeSeconds > 0 ? s.timeSeconds : inferred };
    });
  }, [data, videoDuration]);

  const current = steps[stepIndex];

  const overallTotal = useMemo(
    () => steps.reduce((acc, s) => acc + (s.timeSeconds ?? 0), 0),
    [steps]
  );

  const overallElapsed = useMemo(() => {
    const prev = steps.slice(0, stepIndex).reduce((acc, s) => acc + s.timeSeconds, 0);
    return prev + stepElapsed;
  }, [steps, stepIndex, stepElapsed]);

  const stepLeft = Math.max(0, (current?.timeSeconds ?? 0) - stepElapsed);

  const overallProgress = overallTotal > 0 ? Math.min(1, overallElapsed / overallTotal) : 0;
  const stepProgress =
    (current?.timeSeconds ?? 0) > 0
      ? Math.min(1, stepElapsed / (current!.timeSeconds || 1))
      : 0;

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || steps.length === 0) return;

    const t = v.currentTime;
    const idx = findLastIndexByStartAt(steps, t);

    if (idx !== stepIndex) setStepIndex(idx);

    const elapsedInStep = Math.max(0, t - steps[idx].startAt);
    const clamped = Math.min(steps[idx].timeSeconds, elapsedInStep);
    setStepElapsed(clamped);
  };

  if (loading)
    return <div className="min-h-screen bg-[var(--bg)] p-6 text-[var(--ink)]">Loading…</div>;

  if (err)
    return (
      <div className="min-h-screen bg-[var(--bg)] p-6 text-red-700">
        Error: {err}
      </div>
    );

  if (!data) return null;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/workouts/${slug}`}
            className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Back"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>

          <h1 className="min-w-0 flex-1 px-1 font-serif text-xl leading-tight sm:px-4 sm:text-3xl">
            <span className="block truncate">{title}</span>
            <span className="block text-[var(--muted)]">{level}</span>
          </h1>

          {/* ✅ Replace Settings with Instruction toggle */}
          <button
            type="button"
            onClick={toggleCaptions}
            disabled={savingCaptions}
            className={[
              "rounded-full border border-[var(--accent)] px-4 py-2 font-serif text-sm sm:text-base",
              "hover:bg-black/5 dark:hover:bg-white/10 transition",
              captionsOn ? "bg-[var(--accent)] text-white" : "bg-transparent text-[var(--ink)]",
              savingCaptions ? "opacity-60" : "",
            ].join(" ")}
            aria-label="Toggle instructions"
            title="Toggle instructions"
          >
            {captionsOn ? "Instruction: ON" : "Instruction: OFF"}
          </button>
        </div>

        {/* Video */}
        <div className="mt-4 sm:mt-6">
          <div className="-mx-4 overflow-hidden bg-black/5 dark:bg-white/5 sm:mx-0 sm:rounded-2xl">
            <div className="relative">
              {videoUrl ? (
                <video
                  ref={videoRef}
                  className="w-full"
                  controls
                  playsInline
                  onLoadedMetadata={(e) => {
                    const d = Math.floor((e.currentTarget as HTMLVideoElement).duration || 0);
                    if (d > 0) setVideoDuration(d);
                  }}
                  onTimeUpdate={onTimeUpdate}
                  onEnded={() => {
                    if (steps.length > 0) {
                      const last = steps.length - 1;
                      setStepIndex(last);
                      setStepElapsed(steps[last].timeSeconds);
                    }
                  }}
                >
                  <source src={videoUrl} type="video/mp4" />
                </video>
              ) : (
                <div className="aspect-video grid place-items-center text-[var(--muted)]">
                  No video set on this workout
                </div>
              )}

              {/* ✅ Subtitle overlay only if captionsOn */}
              {captionsOn && current?.instruction ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-20 mx-auto w-[92%] bg-black/55 px-4 py-3 text-center font-serif text-lg text-white sm:bottom-24 sm:w-[82%] sm:px-6 sm:py-4 sm:text-2xl">
                  {current.instruction}
                </div>
              ) : null}

              {/* Step progress bar */}
              <div className="pointer-events-none absolute inset-x-4 bottom-12 sm:inset-x-6 sm:bottom-16">
                <div className="h-2 w-full rounded-full bg-white/25">
                  <div
                    className="h-2 rounded-full bg-[var(--btn)]"
                    style={{ width: `${Math.round(stepProgress * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step header */}
        <div className="mt-6 flex items-end justify-between">
          <div className="font-serif text-2xl sm:text-4xl">
            Step {Math.min(stepIndex + 1, steps.length)}/{steps.length}
          </div>
          <div className="font-serif text-2xl sm:text-4xl">{formatMMSS(stepLeft)} left</div>
        </div>

        {/* Overall progress */}
        <div className="mt-4 h-3 w-full rounded-full bg-[var(--line)] sm:mt-6 sm:h-4">
          <div
            className="h-3 rounded-full bg-[var(--btn)] sm:h-4"
            style={{ width: `${Math.round(overallProgress * 100)}%` }}
          />
        </div>

        {/* Step card */}
        <div className="mt-6 rounded-2xl bg-[var(--card)] p-5 sm:mt-8 sm:p-8">
          <div className="font-serif text-2xl leading-snug sm:text-4xl">
            {current?.instruction ?? "—"}
          </div>

          {current?.safetyNote ? (
            <div className="mt-6 rounded-xl bg-[color:rgba(255,255,255,0.55)] dark:bg-[color:rgba(255,255,255,0.08)] p-4 text-[var(--muted)] sm:mt-10 sm:p-5">
              <div className="font-serif text-lg sm:text-2xl text-[var(--ink)]">Safety note</div>
              <div className="mt-2 text-base sm:text-xl">{current.safetyNote}</div>
            </div>
          ) : null}

          {current?.easierOption ? (
            <div className="mt-4 rounded-xl bg-[color:rgba(255,255,255,0.35)] dark:bg-[color:rgba(255,255,255,0.06)] p-4 sm:mt-8 sm:p-5">
              <div className="font-serif text-lg sm:text-2xl">Easier option</div>
              <div className="mt-2 text-base sm:text-xl text-[var(--muted)]">{current.easierOption}</div>
            </div>
          ) : null}

          {current?.harderOption ? (
            <div className="mt-4 rounded-xl bg-[color:rgba(255,255,255,0.35)] dark:bg-[color:rgba(255,255,255,0.06)] p-4 sm:p-5">
              <div className="font-serif text-lg sm:text-2xl">Harder option</div>
              <div className="mt-2 text-base sm:text-xl text-[var(--muted)]">{current.harderOption}</div>
            </div>
          ) : null}
        </div>

        {/* Time summary */}
        <div className="mt-6 text-center text-[var(--muted)]">
          {formatMMSS(overallElapsed)} / {formatMMSS(overallTotal)}
        </div>

        <div className="h-10" />
      </div>
    </div>
  );
}
