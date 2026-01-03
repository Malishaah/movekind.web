"use client";

import { useEffect, useMemo, useRef, useState, useId } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";

type ApiScheduleItem = {
  key: string;
  startTime: string; // ISO
  dateISO: string; // YYYY-MM-DD
  time: string; // HH:mm
  title?: string | null;
  workoutUdi?: string | null;
};

type Session = {
  id: string; // key
  dateISO: string;
  time: string;
  title: string;
  workoutUdi?: string | null;
};

type WorkoutOption = {
  title: string;
  udi: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function formatISO(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function getISOWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
function startOfISOWeek(base: Date) {
  const d = new Date(base);
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMon);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

const weekDays = [
  { key: "Mon", label: "M" },
  { key: "Tue", label: "T" },
  { key: "Wed", label: "W" },
  { key: "Thu", label: "Th" },
  { key: "Fri", label: "F" },
  { key: "Sat", label: "Sa" },
  { key: "Sun", label: "Su" },
];

async function apiGet(url: string) {
  const res = await fetch(url, { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
async function apiPost(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
async function apiDelete(url: string) {
  const res = await fetch(url, { method: "DELETE", credentials: "include" });
  if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
}

function isTimeHHmm(v: string) {
  return /^\d{2}:\d{2}$/.test(v);
}
function toUdiFromGuid(guidWithHyphens: string) {
  const g = (guidWithHyphens ?? "").trim();
  if (!g) return null;
  return `umb://document/${g.replace(/-/g, "")}`;
}

function getFocusable(container: HTMLElement | null) {
  if (!container) return [];
  const nodes = Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
    )
  );
  return nodes.filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));
}

export default function MySchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageErr, setPageErr] = useState<string | null>(null);

  const [openAdd, setOpenAdd] = useState(false);
  const [busyAdd, setBusyAdd] = useState(false);
  const [modalErr, setModalErr] = useState<string | null>(null);

  const [titleInput, setTitleInput] = useState("Session");
  const [timeInput, setTimeInput] = useState("17:00");

  const [workouts, setWorkouts] = useState<WorkoutOption[]>([]);
  const [workoutsErr, setWorkoutsErr] = useState<string | null>(null);
  const [selectedWorkoutUdi, setSelectedWorkoutUdi] = useState<string>("");
  const [manualWorkoutUdi, setManualWorkoutUdi] = useState<string>("");

  // a11y ids
  const dialogTitleId = useId();
  const dialogDescId = useId();
  const dialogErrId = useId();
  const titleId = useId();
  const timeId = useId();
  const workoutSelectId = useId();
  const workoutManualId = useId();

  // a11y refs
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleFieldRef = useRef<HTMLInputElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  // ---- UI tokens (för bättre light mode) ----
  const panel = "bg-[var(--panel)] border border-[var(--line)]";
  const field = "bg-[var(--field)] border border-[var(--line)]";
  const ghostBtn =
    "hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/25";
  const ring =
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/25";

  const inputBase = [
    "mt-2 w-full rounded-2xl px-4 py-3 text-base sm:text-lg",
    field,
    "text-[var(--ink)] placeholder:text-[var(--muted)]",
    "outline-none",
    // skyddar mot @tailwindcss/forms defaults
    "border-0 ring-0 focus:ring-2 focus:ring-[var(--accent)]/20",
  ].join(" ");

  const weekStart = useMemo(() => {
    const now = new Date();
    const base = new Date(now);
    base.setDate(base.getDate() + weekOffset * 7);
    return startOfISOWeek(base);
  }, [weekOffset]);

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const weekNumber = useMemo(() => getISOWeekNumber(weekStart), [weekStart]);

  const days = useMemo(() => {
    return weekDays.map((wd, i) => {
      const d = addDays(weekStart, i);
      return { ...wd, date: d, dateISO: formatISO(d), dayOfMonth: d.getDate() };
    });
  }, [weekStart]);

  const selectedDay = days[selectedIndex];

  const workoutTitleByUdi = useMemo(() => {
    const map = new Map<string, string>();
    for (const w of workouts) map.set(w.udi, w.title);
    return map;
  }, [workouts]);

  const sessionsForSelectedDay = useMemo(() => {
    return sessions
      .filter((s) => s.dateISO === selectedDay.dateISO)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [sessions, selectedDay.dateISO]);

  // load workouts list for dropdown
  useEffect(() => {
    let alive = true;

    (async () => {
      setWorkoutsErr(null);
      try {
        const res = await apiGet("/api/workouts");
        const mapped: WorkoutOption[] = (res?.items ?? [])
          .map((w: any) => {
            const title = (w?.properties?.title ?? w?.name ?? "Workout").toString();
            const guid = (w?.id ?? "").toString();
            const udi = toUdiFromGuid(guid);
            if (!udi) return null;
            return { title, udi };
          })
          .filter(Boolean);

        if (alive) setWorkouts(mapped);
      } catch {
        if (alive) {
          setWorkouts([]);
          setWorkoutsErr("Could not load workouts list (paste workout UDI manually).");
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // load schedule for the current week
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setPageErr(null);
      try {
        const from = formatISO(weekStart);
        const to = formatISO(weekEnd);

        const data = await apiGet(
          `/api/schedule?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
        );

        const mapped: Session[] = (data ?? []).map((x: ApiScheduleItem) => ({
          id: x.key,
          dateISO: x.dateISO,
          time: x.time,
          title: (x.title ?? "Session").toString(),
          workoutUdi: x.workoutUdi ?? null,
        }));

        if (alive) setSessions(mapped);
      } catch (e: any) {
        if (alive) setPageErr(e?.message ?? "Failed to load schedule");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [weekStart, weekEnd]);

  function closeAddModal() {
    setOpenAdd(false);
    setModalErr(null);
    openerRef.current?.focus?.();
    openerRef.current = null;
  }

  function openAddModal(opener?: HTMLElement | null) {
    setModalErr(null);
    setTitleInput("Session");
    setTimeInput("17:00");
    setSelectedWorkoutUdi("");
    setManualWorkoutUdi("");
    openerRef.current = opener ?? (document.activeElement as HTMLElement | null);
    setOpenAdd(true);
  }

  // open from query (?add=1...)
  useEffect(() => {
    const add = searchParams.get("add");
    if (add !== "1") return;

    const presetTitle = (searchParams.get("title") ?? "Session").toString();
    const presetWorkoutUdi = (searchParams.get("workoutUdi") ?? "").trim();

    setTitleInput(presetTitle);
    setTimeInput("17:00");

    if (presetWorkoutUdi) {
      setSelectedWorkoutUdi(presetWorkoutUdi);
      setManualWorkoutUdi(presetWorkoutUdi);
    }

    openerRef.current = null;
    setOpenAdd(true);
    router.replace("/schedule");
  }, [searchParams, router]);

  // a11y: focus + Esc + simple focus trap while dialog open
  useEffect(() => {
    if (!openAdd) return;

    setTimeout(() => titleFieldRef.current?.focus(), 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busyAdd) {
        e.preventDefault();
        closeAddModal();
        return;
      }

      if (e.key === "Tab") {
        const focusables = getFocusable(dialogRef.current);
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          if (!active || active === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAdd, busyAdd]);

  async function createSession() {
    setModalErr(null);

    if (!titleInput.trim()) {
      setModalErr("Please enter a session name.");
      return;
    }
    if (!isTimeHHmm(timeInput)) {
      setModalErr("Please choose a valid time (HH:mm).");
      return;
    }

    const workoutId = (selectedWorkoutUdi || manualWorkoutUdi).trim() || null;
    const startTimeISO = `${selectedDay.dateISO}T${timeInput}:00`;

    try {
      setBusyAdd(true);

      const created: ApiScheduleItem = await apiPost("/api/schedule", {
        startTime: startTimeISO,
        title: titleInput.trim(),
        workoutId,
      });

      const newItem: Session = {
        id: created.key,
        dateISO: created.dateISO,
        time: created.time,
        title: (created.title ?? titleInput.trim()).toString(),
        workoutUdi: created.workoutUdi ?? (workoutId?.startsWith("umb://") ? workoutId : null),
      };

      setSessions((prev) => [...prev, newItem]);
      setOpenAdd(false);

      setToast(`Added to ${selectedDay.key} ${created.time}`);
      window.setTimeout(() => setToast(null), 2200);
    } catch (e: any) {
      setModalErr(e?.message ?? "Failed to add session");
    } finally {
      setBusyAdd(false);
    }
  }

  async function removeSession(id: string) {
    setPageErr(null);
    try {
      await apiDelete(`/api/schedule/${encodeURIComponent(id)}`);
      setSessions((prev) => prev.filter((x) => x.id !== id));
      setToast("Removed");
      window.setTimeout(() => setToast(null), 1600);
    } catch (e: any) {
      setPageErr(e?.message ?? "Failed to remove session");
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="mx-auto max-w-xl px-4 py-5 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className={["rounded-full p-2", ghostBtn].join(" ")}
            aria-label="Back"
          >
            <ArrowLeft className="h-6 w-6 sm:h-7 sm:w-7" />
          </button>
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl">My Schedule</h1>
            <h2 className="mt-1 text-sm sm:text-base text-[var(--muted)]">
              Focus, schedule, and move.
            </h2>
          </div>
        </div>

        <div className="mt-5 h-px w-full bg-[var(--line)]" />

        {/* Week header */}
        <section aria-label="Week overview" className={["mt-6 rounded-2xl p-4 sm:p-5", panel].join(" ")}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-serif text-2xl sm:text-3xl">Week {weekNumber}</div>
              <div className="mt-1 text-sm sm:text-base text-[var(--muted)]">
                {formatISO(weekStart)} – {formatISO(weekEnd)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset((x) => x - 1)}
                className={["grid h-11 w-11 place-items-center rounded-full", field, ring].join(" ")}
                aria-label="Previous week"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <button
                onClick={() => setWeekOffset((x) => x + 1)}
                className={["grid h-11 w-11 place-items-center rounded-full", field, ring].join(" ")}
                aria-label="Next week"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>
        </section>

        {/* Error / Loading */}
        {pageErr && (
          <div
            className="mt-4 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm sm:text-base text-red-800"
            role="alert"
            aria-live="polite"
          >
            {pageErr}
          </div>
        )}

        {loading && (
          <div className={["mt-4 rounded-2xl p-4 text-sm sm:text-base", panel].join(" ")}>
            Loading schedule…
          </div>
        )}

        {/* Day chips */}
        <section className="mt-5" aria-label="Choose a day">
          <div className="mb-2 text-sm text-[var(--muted)]">Pick a day</div>

          <div
            className={[
              "flex gap-3 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]",
              "md:grid md:grid-cols-7 md:gap-4 md:overflow-visible md:pb-0",
            ].join(" ")}
          >
            {days.map((d, i) => {
              const active = i === selectedIndex;

              return (
                <button
                  key={d.dateISO}
                  onClick={() => setSelectedIndex(i)}
                  aria-pressed={active}
                  className={[
                    "shrink-0 h-[74px] w-[70px] md:h-[92px] md:w-full",
                    "rounded-2xl border text-center font-serif transition",
                    active
                      ? "border-transparent text-[var(--btnText)] bg-[var(--accent)]"
                      : "border-[var(--line)] bg-[var(--panel)] text-[var(--ink)] hover:opacity-95",
                  ].join(" ")}
                >
                  <div className="text-2xl md:text-3xl leading-none">{d.label}</div>
                  <div className="mt-1 md:mt-2 text-3xl md:text-4xl leading-none">{d.dayOfMonth}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Selected day title */}
        <section className="mt-6" aria-label="Selected day">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="font-serif text-2xl sm:text-3xl">{selectedDay.key}</div>
              <div className="text-sm sm:text-base text-[var(--muted)]">{selectedDay.dateISO}</div>
            </div>

            <button
              onClick={(e) => openAddModal(e.currentTarget)}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--btn)] px-4 py-3 font-serif text-lg text-[var(--btnText)] hover:opacity-95"
            >
              <Plus className="h-5 w-5" />
              Add
            </button>
          </div>
        </section>

        {/* Sessions panel */}
        <section className={["mt-5 rounded-2xl p-4 sm:p-6", panel].join(" ")} aria-label="Sessions">
          {sessionsForSelectedDay.length === 0 ? (
            <>
              <div className="text-center font-serif text-2xl sm:text-3xl">
                No sessions scheduled
              </div>

              <button
                onClick={(e) => openAddModal(e.currentTarget)}
                className={["mt-5 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 font-serif text-xl hover:opacity-95", field, ring].join(" ")}
              >
                <Plus className="h-6 w-6" />
                Add session
              </button>
            </>
          ) : (
            <div className="space-y-3">
              {sessionsForSelectedDay.map((s) => (
                <div key={s.id} className={["rounded-2xl p-4", field].join(" ")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-serif text-xl sm:text-2xl truncate">{s.title}</div>
                      {s.workoutUdi ? (
                        <div className="mt-1 text-sm sm:text-base text-[var(--muted)] truncate">
                          {workoutTitleByUdi.get(s.workoutUdi) ?? s.workoutUdi}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-sm sm:text-base text-[var(--muted)]">{s.time}</div>
                      <button
                        type="button"
                        onClick={() => removeSession(s.id)}
                        className={["rounded-full p-2", ghostBtn].join(" ")}
                        aria-label="Remove session"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={(e) => openAddModal(e.currentTarget)}
                className={["mt-2 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 font-serif text-xl hover:opacity-95", field, ring].join(" ")}
              >
                <Plus className="h-6 w-6" />
                Add session
              </button>
            </div>
          )}
        </section>

        <div className="h-10" />
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2" role="status" aria-live="polite">
          <div className={["rounded-full px-6 py-4 font-serif text-lg shadow-sm", panel].join(" ")}>
            {toast}
          </div>
        </div>
      )}

      {/* Add session modal */}
      {openAdd && (
        <div className="fixed inset-0 z-50" aria-hidden={busyAdd ? "false" : undefined}>
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !busyAdd && closeAddModal()}
            aria-hidden="true"
          />

          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            aria-describedby={`${dialogDescId}${modalErr ? ` ${dialogErrId}` : ""}`}
            className={[
              "absolute inset-x-0 bottom-0 rounded-t-3xl p-5 shadow-lg",
              "bg-[var(--bg)] text-[var(--ink)]",
              "sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[min(92vw,560px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:p-6",
            ].join(" ")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div id={dialogTitleId} className="font-serif text-2xl sm:text-3xl">
                  Add session
                </div>
                <div id={dialogDescId} className="mt-1 text-sm sm:text-base text-[var(--muted)]">
                  {selectedDay.dateISO} ({selectedDay.key})
                </div>
              </div>

              <button
                type="button"
                className={["rounded-full p-2", ghostBtn].join(" ")}
                onClick={() => !busyAdd && closeAddModal()}
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor={titleId} className="font-serif text-lg sm:text-xl">
                  Session name
                </label>
                <input
                  ref={titleFieldRef}
                  id={titleId}
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className={inputBase}
                  placeholder="e.g. Morning Mobility"
                />
              </div>

              <div>
                <label htmlFor={timeId} className="font-serif text-lg sm:text-xl">
                  Time
                </label>
                <input
                  id={timeId}
                  type="time"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  className={inputBase}
                />
              </div>

              <div>
                <div className="font-serif text-lg sm:text-xl">Workout</div>

                {workouts.length > 0 ? (
                  <div className="mt-2">
                    <label htmlFor={workoutSelectId} className="sr-only">
                      Choose workout (optional)
                    </label>
                    <select
                      id={workoutSelectId}
                      value={selectedWorkoutUdi}
                      onChange={(e) => setSelectedWorkoutUdi(e.target.value)}
                      className={[
                        "w-full rounded-2xl px-4 py-3 text-base sm:text-lg",
                        field,
                        "text-[var(--ink)]",
                        "outline-none border-0 ring-0 focus:ring-2 focus:ring-[var(--accent)]/20",
                        "[background-image:none]",
                      ].join(" ")}
                    >
                      <option value="">No workout (optional)</option>
                      {workouts.map((w) => (
                        <option key={w.udi} value={w.udi}>
                          {w.title}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    {workoutsErr && (
                      <div className={["mt-2 rounded-xl px-4 py-3 text-sm", panel].join(" ")}>
                        {workoutsErr}
                      </div>
                    )}

                    <div className="mt-2">
                      <label htmlFor={workoutManualId} className="sr-only">
                        Paste workout UDI (optional)
                      </label>
                      <input
                        id={workoutManualId}
                        value={manualWorkoutUdi}
                        onChange={(e) => setManualWorkoutUdi(e.target.value)}
                        className={inputBase}
                        placeholder="Paste workout UDI (umb://document/...)"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {modalErr && (
              <div
                id={dialogErrId}
                className="mt-4 text-sm sm:text-base text-red-700"
                role="alert"
                aria-live="polite"
              >
                {modalErr}
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => closeAddModal()}
                disabled={busyAdd}
                className={["w-1/3 rounded-full px-4 py-4 font-serif text-lg disabled:opacity-60", field, ring].join(" ")}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={createSession}
                disabled={busyAdd}
                className="w-2/3 rounded-full bg-[var(--btn)] px-5 py-4 font-serif text-lg text-[var(--btnText)] hover:opacity-95 disabled:opacity-60"
                aria-busy={busyAdd}
              >
                {busyAdd ? "Saving…" : "Save session"}
              </button>
            </div>

            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>
        </div>
      )}
    </main>
  );
}
