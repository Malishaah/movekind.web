"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Settings,
  Check,
  AlertCircle,
  Play,
  Pause,
  SkipForward,
} from "lucide-react";

type DeliveryWorkout = {
  id: string;
  name: string;
  route?: { path?: string };
  properties?: {
    title?: string;
    video?: string; // ✅ din data: "/media/...mp4"
    duration?: number; // (du har 120)
    levelEasyMediumAdvanced?: "Easy" | "Medium" | "Advanced";
    steps?: {
      items?: Array<{
        content?: {
          id: string;
          properties?: {
            order?: number;
            instruction?: string;
            timeSeconds?: number; // kan vara 0
            safetyNote?: string;
            easierOption?: string;
            harderOption?: string;
            startAt?: number; // ✅ används för sync
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
  // fallback för browsers/TS utan findLastIndex
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

  // player state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepElapsed, setStepElapsed] = useState(0);

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

  const umbracoOrigin =
    process.env.NEXT_PUBLIC_UMBRACO_ORIGIN ?? "https://localhost:44367";

  const title = data?.properties?.title ?? data?.name ?? "Workout";
  const level = data?.properties?.levelEasyMediumAdvanced ?? "Easy";

  const videoUrl = useMemo(() => {
    const v = data?.properties?.video;
    return v ? new URL(v, umbracoOrigin).toString() : "";
  }, [data, umbracoOrigin]);

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

    // sortera efter startAt (viktigast för video-sync)
    raw.sort((a, b) => a.startAt - b.startAt);

    // Om timeSeconds är 0: räkna duration från nästa step.startAt
    return raw.map((s, i) => {
      const next = raw[i + 1];
      const inferred = next ? Math.max(0, next.startAt - s.startAt) : s.timeSeconds;
      return { ...s, timeSeconds: s.timeSeconds > 0 ? s.timeSeconds : inferred };
    });
  }, [data]);

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

  const overallProgress = overallTotal > 0 ? overallElapsed / overallTotal : 0;
  const stepProgress =
    (current?.timeSeconds ?? 0) > 0 ? stepElapsed / (current?.timeSeconds ?? 1) : 0;

  // Sync stepIndex + stepElapsed med video time
  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || steps.length === 0) return;

    const t = v.currentTime; // seconds
    const idx = findLastIndexByStartAt(steps, t);

    if (idx !== stepIndex) setStepIndex(idx);

    const elapsedInStep = Math.max(0, Math.floor(t - steps[idx].startAt));
    setStepElapsed(elapsedInStep);
  };

  const togglePlay = async () => {
    const v = videoRef.current;
    if (!v) return;

    if (v.paused) {
      await v.play();
    } else {
      v.pause();
    }
  };

  const goToStep = async (i: number) => {
    const v = videoRef.current;
    if (!v) return;
    const safeIndex = Math.max(0, Math.min(i, steps.length - 1));
    v.currentTime = steps[safeIndex].startAt;
    await v.play();
  };

  const nextStep = async () => {
    if (stepIndex >= steps.length - 1) return;
    await goToStep(stepIndex + 1);
  };

  if (loading) return <div className="min-h-screen bg-[#fbf7f2] p-8">Loading…</div>;
  if (err) return <div className="min-h-screen bg-[#fbf7f2] p-8 text-red-700">Error: {err}</div>;
  if (!data) return null;

  return (
    <div className="min-h-screen bg-[#fbf7f2] text-[#1f1b16]">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href={`/workouts/${slug}`}
            className="rounded-full p-2 hover:bg-black/5"
            aria-label="Back"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>

          <h1 className="flex-1 px-4 font-serif text-3xl">
            {title} – {level}
          </h1>

          <button className="rounded-full p-2 hover:bg-black/5" aria-label="Settings">
            <Settings className="h-6 w-6" />
          </button>
        </div>

        {/* Video */}
        <div className="mt-6 overflow-hidden rounded-2xl bg-black/5">
          <div className="relative">
            {videoUrl ? (
              <video
                ref={videoRef}
                className="w-full"
                controls
                playsInline
                onTimeUpdate={onTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source src={videoUrl} type="video/mp4" />
              </video>
            ) : (
              <div className="aspect-video grid place-items-center text-[#6e655c]">
                No video set on this workout
              </div>
            )}

            {/* “Subtitle” overlay like the screenshot */}
            {current?.instruction ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-24 mx-auto w-[82%] bg-black/50 px-6 py-4 text-center font-serif text-2xl text-white">
                {current.instruction}
              </div>
            ) : null}

            {/* Small step progress (like the pink bar in screenshot) */}
            <div className="pointer-events-none absolute inset-x-6 bottom-16">
              <div className="h-2 w-full rounded-full bg-white/30">
                <div
                  className="h-2 rounded-full bg-pink-500"
                  style={{ width: `${Math.round(stepProgress * 100)}%` }}
                />
              </div>
            </div>

            {/* Custom play/pause + next (optional). Video has controls too. */}
            <div className="absolute bottom-4 left-6 flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="grid h-12 w-12 place-items-center rounded-full bg-black/45 text-white hover:bg-black/55"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause /> : <Play />}
              </button>

              <button
                onClick={nextStep}
                className="grid h-12 w-12 place-items-center rounded-full bg-black/45 text-white hover:bg-black/55"
                aria-label="Next step"
              >
                <SkipForward />
              </button>

              <div className="ml-3 font-serif text-2xl text-white">
                {formatMMSS(overallElapsed)} / {formatMMSS(overallTotal)}
              </div>
            </div>
          </div>
        </div>

        {/* Step header */}
        <div className="mt-10 flex items-end justify-between">
          <div className="font-serif text-4xl">
            Step {Math.min(stepIndex + 1, steps.length)}/{steps.length}
          </div>
          <div className="font-serif text-4xl">{formatMMSS(stepLeft)} left</div>
        </div>

        {/* Overall progress */}
        <div className="mt-6 h-4 w-full rounded-full bg-black/10">
          <div
            className="h-4 rounded-full bg-black"
            style={{ width: `${Math.round(overallProgress * 100)}%` }}
          />
        </div>

        {/* Step card */}
        <div className="mt-8 rounded-2xl bg-[#f1eadf] p-8">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[#bfe2ea] font-serif text-2xl">
              {stepIndex + 1}
            </div>

            <div className="font-serif text-4xl leading-tight">
              {current?.instruction ?? "—"}
            </div>
          </div>

          {current?.safetyNote ? (
            <div className="mt-10 flex items-start gap-3 text-[#d97706]">
              <AlertCircle className="mt-1 h-7 w-7" />
              <div className="font-serif text-3xl leading-snug">
                {current.safetyNote}
              </div>
            </div>
          ) : null}

          {current?.easierOption ? (
            <div className="mt-8 rounded-xl bg-[#d9d1c8]/70 p-5 font-serif text-2xl">
              Easier option: {current.easierOption}
            </div>
          ) : null}

          {current?.harderOption ? (
            <div className="mt-4 rounded-xl bg-[#d9d1c8]/70 p-5 font-serif text-2xl">
              Harder option: {current.harderOption}
            </div>
          ) : null}
        </div>

        {/* Next step */}
        <div className="mt-16">
          <button
            onClick={nextStep}
            disabled={stepIndex >= steps.length - 1}
            className="mx-auto flex w-full max-w-2xl items-center justify-center gap-4 rounded-full bg-[#2a2521] px-10 py-6 font-serif text-3xl text-white disabled:opacity-40"
          >
            Next step <span className="text-3xl">▶|</span>
          </button>
        </div>

        {/* Step circles */}
        <div className="mt-10 flex items-center justify-center gap-6 pb-10">
          {steps.map((_, i) => {
            const done = i < stepIndex;
            const active = i === stepIndex;

            return (
              <button
                key={steps[i].id}
                onClick={() => goToStep(i)}
                className={[
                  "grid h-20 w-20 place-items-center rounded-full border-2 font-serif text-3xl",
                  active
                    ? "border-[#bfe2ea] bg-[#bfe2ea]"
                    : "border-[#bfe2ea] bg-transparent hover:bg-black/5",
                ].join(" ")}
                aria-label={`Go to step ${i + 1}`}
              >
                {done ? <Check className="h-9 w-9" /> : i + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
