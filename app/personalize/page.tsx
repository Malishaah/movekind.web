"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPut } from "@/app/lib/api";

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

export default function PersonalizePage() {
  const router = useRouter();

  const needs: Need[] = useMemo(
    () => ["Knee", "Back", "Shoulder", "Hips", "Seated", "No floor", "Mobility", "Balance"],
    []
  );

  const [selectedNeeds, setSelectedNeeds] = useState<Need[]>(["Knee"]);
  const [level, setLevel] = useState<Level | null>(null);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const toggleNeed = (n: Need) => {
    setSelectedNeeds((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  };

  async function saveAndGoHome(payload: { needs: Need[]; level: Level | null; skipped?: boolean }) {
    setBusy(true);
    setMsg(null);

    try {
      // Anpassa fältnamn efter din backendmodell:
      // ex: PersonalizationNeeds / PersonalizationLevel
      await apiPut("/api/members/me", {
        PersonalizationNeeds: payload.needs,
        PersonalizationLevel: payload.level,
        PersonalizationSkipped: !!payload.skipped,
      });

      // Uppdatera header-menyn direkt (om du använder auth-changed mönstret)
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
    <div className="min-h-screen bg-[#fbf7f2] text-[#1f1b16]">
      <div className="relative mx-auto max-w-6xl px-6 py-10 sm:px-8 sm:py-12">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] rounded-3xl bg-gradient-to-b from-[#f3e7dc]/70 to-transparent lg:block"
          aria-hidden="true"
        />

        <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
          {/* Left */}
          <main className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d8cbbf] bg-white/50 px-4 py-2 font-serif text-lg text-[#6e655c]">
              Step 1 of 1
            </div>

            <h1 className="mt-5 font-serif text-5xl tracking-tight">
              Personalize your experience
            </h1>

            <p className="mt-4 max-w-2xl text-lg text-[#6e655c]">
              Tell us what you need so we can suggest sessions that fit your body and your space.
            </p>

            <div className="mt-10 h-px w-full bg-[#d8cbbf]" />

            {/* Needs */}
            <section className="mt-10">
              <h2 className="font-serif text-3xl">Choose your needs</h2>
              <p className="mt-2 text-base text-[#6e655c]">Select one or more:</p>

              <div className="mt-6 flex flex-wrap gap-3">
                {needs.map((n) => {
                  const active = selectedNeeds.includes(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => toggleNeed(n)}
                      aria-pressed={active}
                      className={[
                        "inline-flex items-center gap-2 rounded-full border px-5 py-3 text-lg",
                        "transition focus:outline-none focus:ring-2 focus:ring-[#6b5648]/40",
                        active
                          ? "border-[#6b5648] bg-[#6b5648] text-white"
                          : "border-[#6b5648] bg-white/70 hover:bg-white",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "grid h-6 w-6 place-items-center rounded-full border",
                          active ? "border-white/40 bg-white/15" : "border-[#b9aa9c] bg-transparent",
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
            <section className="mt-12">
              <h2 className="font-serif text-3xl">Goal level</h2>
              <p className="mt-2 text-base text-[#6e655c]">
                Choose the intensity that feels right right now.
              </p>

              <div className="mt-6 space-y-3">
                {(["Easy", "Medium", "Advanced"] as Level[]).map((l) => {
                  const active = level === l;
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLevel(l)}
                      className={[
                        "w-full rounded-2xl border px-6 py-5 text-left",
                        "transition focus:outline-none focus:ring-2 focus:ring-[#6b5648]/40",
                        active
                          ? "border-[#6b5648] bg-white shadow-sm"
                          : "border-[#d8cbbf] bg-white/60 hover:bg-white",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-serif text-2xl">{l}</div>
                          <div className="mt-1 text-base text-[#6e655c]">
                            {l === "Easy" && "Gentle, steady pace"}
                            {l === "Medium" && "A bit more challenge"}
                            {l === "Advanced" && "More intensity and tempo"}
                          </div>
                        </div>

                        <span
                          className={[
                            "grid h-6 w-6 place-items-center rounded-full border",
                            active ? "border-[#6b5648] bg-[#6b5648]" : "border-[#b9aa9c]",
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
              <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#e9dfd4] px-5 py-4 text-[#554c43]">
                <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-full border border-[#b9aa9c] font-serif">
                  i
                </div>
                <p className="text-base leading-relaxed">
                  You can change your preferences later in your profile.
                </p>
              </div>

              {msg && <p className="mt-4 text-base text-red-700">{msg}</p>}

              {/* Actions */}
              <div className="mt-10">
                <button
                  type="button"
                  disabled={!canContinue}
                  className={[
                    "w-full rounded-full px-8 py-5 text-center font-serif text-xl shadow-sm transition",
                    "focus:outline-none focus:ring-2 focus:ring-[#2a2521]/40",
                    canContinue
                      ? "bg-[#2a2521] text-white hover:opacity-95"
                      : "bg-black/20 text-white/70 cursor-not-allowed",
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
                  className="mx-auto mt-5 block text-lg font-semibold underline underline-offset-4 hover:opacity-80 disabled:opacity-50"
                  onClick={() => saveAndGoHome({ needs: [], level: null, skipped: true })}
                >
                  Skip for now
                </button>
              </div>
            </section>
          </main>

          {/* Right column placeholder (valfritt: illustration / summary card) */}
          <aside className="relative z-10 hidden lg:block">
            <div className="rounded-3xl border border-[#d8cbbf] bg-white/40 p-7">
              <div className="font-serif text-3xl">Your choices</div>
              <div className="mt-4 text-lg text-[#6e655c]">Needs</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedNeeds.length ? (
                  selectedNeeds.map((n) => (
                    <span
                      key={n}
                      className="rounded-full border border-[#6b5648] bg-white/60 px-3 py-1 font-serif text-lg"
                    >
                      {n}
                    </span>
                  ))
                ) : (
                  <span className="text-[#6e655c]">None selected</span>
                )}
              </div>

              <div className="mt-5 text-lg text-[#6e655c]">Level</div>
              <div className="mt-2 font-serif text-2xl">{level ?? "Not selected"}</div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
