"use client";

import { useEffect, useMemo, useState } from "react";
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

// ✅ Matchar din backend (camelCase)
type PersonalizationDto = {
  personalizationNeeds: Need[];
  personalizationLevel: Level | null;
  personalizationSkipped: boolean;
};

// (valfritt) tolerant om backend nån gång skickar PascalCase
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

  const pageBg = "bg-[var(--bg)] text-[var(--ink)]";
  const card = "bg-[var(--card)]";
  const line = "border-[var(--line)]";
  const muted = "text-[var(--muted)]";
  const btn = "bg-[var(--btn)] text-[var(--btnText)]";

  // ✅ Load saved personalization (pre-fill)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setMsg(null);

        const dto = await apiGet<PersonalizationDtoAny>("/api/personalization");
        if (!alive) return;

        const incomingNeeds =
          (dto.personalizationNeeds ?? dto.PersonalizationNeeds ?? []) as Need[];
        const incomingLevel =
          (dto.personalizationLevel ?? dto.PersonalizationLevel ?? null) as Level | null;

        const safeNeeds = Array.isArray(incomingNeeds)
          ? incomingNeeds.filter(Boolean)
          : [];

        setSelectedNeeds(safeNeeds); // tom array är ok här
        setLevel(incomingLevel ?? null);
      } catch (e: any) {
        // ok att ignorera om endpoint saknas / ej inloggad
        // setMsg(e?.message ?? "Could not load personalization");
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
        {/* Header / Step */}
        <div className="flex flex-col gap-4">
          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full ${card} ${line} border px-4 py-2 font-serif text-base sm:text-lg ${muted}`}
          >
            Step 1 of 1
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl tracking-tight">
            Personalize your experience
          </h1>

          <p className={`max-w-2xl text-base sm:text-lg ${muted}`}>
            Tell us what you need so we can suggest sessions that fit your body and your space.
          </p>

          <div className={`h-px w-full ${line} border-t`} />
        </div>

        {loading ? (
          <div className={`mt-8 text-base sm:text-lg ${muted}`}>Loading…</div>
        ) : (
          <>
            {/* Needs */}
            <section className="mt-8">
              <h2 className="font-serif text-2xl sm:text-3xl">Choose your needs</h2>
              <p className={`mt-2 text-sm sm:text-base ${muted}`}>Select one or more:</p>

              <div className="mt-5 flex flex-wrap gap-2 sm:gap-3">
                {needs.map((n) => {
                  const active = selectedNeeds.includes(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => toggleNeed(n)}
                      aria-pressed={active}
                      className={[
                        "inline-flex items-center gap-2 rounded-full border px-4 py-3 sm:px-5 sm:py-3",
                        "text-base sm:text-lg transition",
                        "focus:outline-none focus:ring-2 focus:ring-black/15 dark:focus:ring-white/15",
                        active
                          ? "border-[var(--btn)] bg-[var(--btn)] text-[var(--btnText)]"
                          : `${line} ${card} hover:opacity-95`,
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "grid h-6 w-6 place-items-center rounded-full border",
                          active ? "border-white/30 bg-white/15" : `${line} bg-transparent`,
                        ].join(" ")}
                        aria-hidden="true"
                      >
                        {active ? "✓" : ""}
                      </span>
                      <span className="font-serif">{n}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Level */}
            <section className="mt-10">
              <h2 className="font-serif text-2xl sm:text-3xl">Goal level</h2>
              <p className={`mt-2 text-sm sm:text-base ${muted}`}>
                Choose the intensity that feels right right now.
              </p>

              <div className="mt-5 space-y-3">
                {(["Easy", "Medium", "Advanced"] as Level[]).map((l) => {
                  const active = level === l;
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLevel(l)}
                      className={[
                        "w-full rounded-2xl border px-5 py-4 sm:px-6 sm:py-5 text-left transition",
                        "focus:outline-none focus:ring-2 focus:ring-black/15 dark:focus:ring-white/15",
                        active ? `border-[var(--btn)] ${card}` : `${line} ${card} hover:opacity-95`,
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
                            active ? "border-[var(--btn)] bg-[var(--btn)]" : `${line}`,
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

              {/* Info box */}
              <div className={`mt-6 rounded-2xl ${card} ${line} border px-5 py-4`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 grid h-8 w-8 place-items-center rounded-full ${line} border font-serif ${muted}`}>
                    i
                  </div>
                  <p className={`text-sm sm:text-base leading-relaxed ${muted}`}>
                    You can change your preferences later in your profile.
                  </p>
                </div>
              </div>

              {msg && <p className="mt-4 text-sm sm:text-base text-red-600">{msg}</p>}

              {/* Actions */}
              <div className="mt-8 space-y-4">
                <button
                  type="button"
                  disabled={!canContinue}
                  className={[
                    "w-full rounded-full px-6 py-4 sm:px-8 sm:py-5 text-center font-serif text-lg sm:text-xl shadow-sm transition",
                    "focus:outline-none focus:ring-2 focus:ring-black/15 dark:focus:ring-white/15",
                    canContinue ? `${btn} hover:opacity-95` : "bg-black/20 text-white/70 cursor-not-allowed",
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
                  onClick={() => saveAndGoHome({ needs: [], level: null, skipped: true })}
                >
                  Skip for now
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
