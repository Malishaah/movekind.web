"use client";

import { useEffect, useMemo, useState, useId } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPut } from "@/app/lib/api";

type Need =
  | "Knee"
  | "Back"
  | "Shoulder"
  | "Hips"
  | "Seated"
  | "No floor"
  | "Mobility"
  | "Balance";

type Level = "Easy" | "Medium" | "Advanced";

type PersonalizationDto = {
  personalizationNeeds: Need[];
  personalizationLevel: Level | null;
  personalizationSkipped: boolean;
};

type PersonalizationDtoAny = Partial<PersonalizationDto> & {
  PersonalizationNeeds?: Need[];
  PersonalizationLevel?: Level | null;
  PersonalizationSkipped?: boolean;
};

export default function PersonalizePage() {
  const router = useRouter();

  const needs: Need[] = useMemo(
    () => ["Knee", "Back", "Shoulder", "Hips", "Seated", "No floor", "Mobility", "Balance"],
    []
  );

  const [selectedNeeds, setSelectedNeeds] = useState<Need[]>([]);
  const [level, setLevel] = useState<Level | null>(null);

  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const statusId = useId();
  const needsGroupId = useId();
  const levelGroupId = useId();

  // ---- UI tokens ----
  const pageBg = "bg-[var(--bg)] text-[var(--ink)]";
  const panel = "bg-[var(--panel)] border border-[var(--line)]";
  const field = "bg-[var(--field)] border border-[var(--line)]";
  const muted = "text-[var(--muted)]";
  const btn = "bg-[var(--btn)] text-[var(--btnText)]";

  const ring = "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/25";

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setMsg(null);

        const dto = await apiGet<PersonalizationDtoAny>("/api/personalization");
        if (!alive) return;

        const incomingNeeds = (dto.personalizationNeeds ?? dto.PersonalizationNeeds ?? []) as Need[];
        const incomingLevel =
          (dto.personalizationLevel ?? dto.PersonalizationLevel ?? null) as Level | null;

        const safeNeeds = Array.isArray(incomingNeeds) ? incomingNeeds.filter(Boolean) : [];

        setSelectedNeeds(safeNeeds);
        setLevel(incomingLevel ?? null);
      } catch {
        // ok
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const toggleNeed = (n: Need) => {
    setSelectedNeeds((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  };

  async function saveAndGoHome(payload: { needs: Need[]; level: Level | null; skipped?: boolean }) {
    setBusy(true);
    setMsg(null);

    try {
      await apiPut(
        "/api/personalization",
        {
          personalizationNeeds: payload.needs ?? [],
          personalizationLevel: payload.level ?? null,
          personalizationSkipped: !!payload.skipped,
        } satisfies PersonalizationDto
      );

      window.dispatchEvent(new Event("auth-changed"));
      router.replace("/");
      router.refresh();
    } catch (e: any) {
      setMsg(e?.message ?? "Could not save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const canContinue = !!level && !busy;

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-4">
          <div
            className={[
              "inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 font-serif text-base sm:text-lg",
              panel,
              muted,
            ].join(" ")}
          >
            Step 1 of 1
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl tracking-tight">
            Personalize your experience
          </h1>

          <p className={`max-w-2xl text-base sm:text-lg ${muted}`}>
            Tell us what you need so we can suggest sessions that fit your body and your space.
          </p>

          <div className="h-px w-full bg-[var(--line)]" />
        </div>

        {loading ? (
          <div className={`mt-8 text-base sm:text-lg ${muted}`} role="status" aria-live="polite">
            Loading…
          </div>
        ) : (
          <>
            {/* Needs */}
            <section className="mt-8" aria-labelledby={needsGroupId}>
              <h2 id={needsGroupId} className="font-serif text-2xl sm:text-3xl">
                Choose your needs
              </h2>
              <p className={`mt-2 text-sm sm:text-base ${muted}`}>Select one or more:</p>

              <div role="group" aria-label="Needs" className="mt-5 flex flex-wrap gap-2 sm:gap-3">
                {needs.map((n) => {
                  const active = selectedNeeds.includes(n);

                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => toggleNeed(n)}
                      aria-pressed={active}
                      className={[
                        "inline-flex items-center gap-3 rounded-full px-5 py-3 sm:px-6 sm:py-3",
                        "font-serif text-lg sm:text-xl transition",
                        ring,
                        active
                          ? "bg-[var(--accent)] text-[var(--btnText)] border border-[var(--accent)]"
                          : [
                              // ✅ bättre light mode
                              "bg-[color:rgba(255,255,255,0.65)] dark:bg-[color:rgba(255,255,255,0.06)]",
                              "border border-[var(--line)]",
                              "text-[var(--btnnText)]",
                              "shadow-sm hover:opacity-95",
                            ].join(" "),
                      ].join(" ")}
                    >
                      {/* ✅ checkmark-cirkel, perfekt centrerad */}
                      <span
                        className={[
                          "grid h-7 w-7 place-items-center rounded-full border transition",
                          active
                            ? "border-white/35 bg-white/15"
                            : "border-[var(--line)] bg-white/70 dark:bg-white/10",
                        ].join(" ")}
                        aria-hidden="true"
                      >
                        <span className="text-[18px] leading-none">
                          {active ? "✓" : ""}
                        </span>
                      </span>

                      <span className="leading-none">{n}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Level */}
            <section className="mt-10" aria-labelledby={levelGroupId}>
              <h2 id={levelGroupId} className="font-serif text-2xl sm:text-3xl">
                Goal level
              </h2>
              <p className={`mt-2 text-sm sm:text-base ${muted}`}>
                Choose the intensity that feels right now.
              </p>

              <div role="radiogroup" aria-label="Goal level" className="mt-5 space-y-3">
                {(["Easy", "Medium", "Advanced"] as Level[]).map((l) => {
                  const active = level === l;

                  return (
                    <button
                      key={l}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setLevel(l)}
                      className={[
                        "w-full rounded-2xl px-5 py-4 sm:px-6 sm:py-5 text-left transition",
                        ring,
                        active
                          ? "border border-[var(--btn)] bg-[var(--field)]"
                          : `${panel} hover:opacity-95`,
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-serif text-xl sm:text-2xl">{l}</div>
                          <div className={`mt-1 text-sm sm:text-base ${muted}`}>
                            {l === "Easy" && "Gentle, steady pace"}
                            {l === "Medium" && "A bit more challenge"}
                            {l === "Advanced" && "More intensity and tempo"}
                          </div>
                        </div>

                        <span
                          className={[
                            "grid h-6 w-6 place-items-center rounded-full border shrink-0",
                            active
                              ? "border-[var(--btn)] bg-[var(--btn)]"
                              : "border-[var(--line)] bg-transparent",
                          ].join(" ")}
                          aria-hidden="true"
                        >
                          {active ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className={["mt-6 rounded-2xl px-5 py-4", panel].join(" ")}>
                <div className="flex items-start gap-3">
                  <div
                    className={[
                      "mt-0.5 grid h-8 w-8 place-items-center rounded-full border font-serif",
                      "border-[var(--line)]",
                      muted,
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    i
                  </div>
                  <p className={`text-sm sm:text-base leading-relaxed ${muted}`}>
                    You can change your preferences later in your profile.
                  </p>
                </div>
              </div>

              {msg && (
                <p id={statusId} role="alert" className="mt-4 text-sm sm:text-base text-red-600">
                  {msg}
                </p>
              )}

              <div className="mt-8 space-y-4">
                <button
                  type="button"
                  disabled={!canContinue}
                  className={[
                    "w-full rounded-full px-6 py-4 sm:px-8 sm:py-5 text-center font-serif text-lg sm:text-xl shadow-sm transition",
                    ring,
                    canContinue
                      ? `${btn} hover:opacity-95`
                      : "bg-[var(--panel)] text-[var(--muted)] border border-[var(--line)] cursor-not-allowed",
                  ].join(" ")}
                  onClick={() => {
                    if (!level) {
                      setMsg("Please choose a level to continue.");
                      return;
                    }
                    saveAndGoHome({ needs: selectedNeeds, level });
                  }}
                >
                  {busy ? "Saving…" : "Continue"}
                </button>

                <button
                  type="button"
                  disabled={busy}
                  className={`mx-auto block text-base sm:text-lg font-semibold underline underline-offset-4 hover:opacity-80 disabled:opacity-50 ${muted}`}
                  onClick={() => saveAndGoHome({ needs: [], level: "Easy", skipped: true })}
                >
                  Skip for now
                </button>
              </div>

              {busy ? (
                <div className="sr-only" role="status" aria-live="polite">
                  Saving…
                </div>
              ) : null}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
