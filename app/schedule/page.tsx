"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";

type ApiScheduleItem = {
  key: string;
  startTime: string; // ISO
  dateISO: string;   // YYYY-MM-DD
  time: string;      // HH:mm
  title?: string | null;
  workoutUdi?: string | null;
};

type Session = {
  id: string;       // key
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

export default function MySchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [openAdd, setOpenAdd] = useState(false);
  const [busyAdd, setBusyAdd] = useState(false);
  const [titleInput, setTitleInput] = useState("Session");
  const [timeInput, setTimeInput] = useState("17:00");

  const [workouts, setWorkouts] = useState<WorkoutOption[]>([]);
  const [workoutsErr, setWorkoutsErr] = useState<string | null>(null);
  const [selectedWorkoutUdi, setSelectedWorkoutUdi] = useState<string>("");
  const [manualWorkoutUdi, setManualWorkoutUdi] = useState<string>("");

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

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);
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
        if (alive) setErr(e?.message ?? "Failed to load schedule");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [weekStart, weekEnd]);

  function openAddModal() {
    setErr(null);
    setTitleInput("Session");
    setTimeInput("17:00");
    setSelectedWorkoutUdi("");
    setManualWorkoutUdi("");
    setOpenAdd(true);
  }

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

    setOpenAdd(true);
    router.replace("/schedule");
  }, [searchParams, router]);

  async function createSession() {
    setErr(null);

    if (!titleInput.trim()) {
      setErr("Please enter a session name.");
      return;
    }
    if (!isTimeHHmm(timeInput)) {
      setErr("Please choose a valid time (HH:mm).");
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
      setErr(e?.message ?? "Failed to add session");
    } finally {
      setBusyAdd(false);
    }
  }

  async function removeSession(id: string) {
    setErr(null);
    try {
      await apiDelete(`/api/schedule/${encodeURIComponent(id)}`);
      setSessions((prev) => prev.filter((x) => x.id !== id));
      setToast("Removed");
      window.setTimeout(() => setToast(null), 1600);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to remove session");
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="mx-auto max-w-xl px-4 py-5 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Back"
          >
            <ArrowLeft className="h-6 w-6 sm:h-7 sm:w-7" />
          </button>
          <h1 className="font-serif text-3xl sm:text-4xl">My Schedule</h1>
        </div>

        <div className="mt-4 h-px w-full bg-[var(--line)]" />

        {/* Week header */}
        <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[color:rgba(255,255,255,0.35)] dark:bg-[color:rgba(255,255,255,0.06)] p-4 sm:p-5">
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
                className="grid h-11 w-11 place-items-center rounded-full border border-[var(--accent)] bg-transparent hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Previous week"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <button
                onClick={() => setWeekOffset((x) => x + 1)}
                className="grid h-11 w-11 place-items-center rounded-full border border-[var(--accent)] bg-transparent hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Next week"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Error / Loading */}
        {err && (
          <div className="mt-4 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm sm:text-base text-red-800">
            {err}
          </div>
        )}
        {loading && (
          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[color:rgba(255,255,255,0.35)] dark:bg-[color:rgba(255,255,255,0.06)] p-4 text-sm sm:text-base">
            Loading schedule…
          </div>
        )}

        {/* Day chips */}
        <div className="mt-5">
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
                      : "border-[var(--accent)] bg-transparent text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/10",
                  ].join(" ")}
                >
                  <div className="text-2xl md:text-3xl leading-none">{d.label}</div>
                  <div className="mt-1 md:mt-2 text-3xl md:text-4xl leading-none">{d.dayOfMonth}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day title */}
        <div className="mt-6 flex items-end justify-between gap-3">
          <div>
            <div className="font-serif text-2xl sm:text-3xl">{selectedDay.key}</div>
            <div className="text-sm sm:text-base text-[var(--muted)]">{selectedDay.dateISO}</div>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--btn)] px-4 py-3 font-serif text-lg text-[var(--btnText)] hover:opacity-95"
          >
            <Plus className="h-5 w-5" />
            Add
          </button>
        </div>

        {/* Sessions panel */}
        <div className="mt-5 rounded-2xl bg-[var(--card)] p-4 sm:p-6">
          {sessionsForSelectedDay.length === 0 ? (
            <>
              <div className="text-center font-serif text-2xl sm:text-3xl">
                No sessions scheduled
              </div>

              <button
                onClick={openAddModal}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[color:rgba(255,255,255,0.65)] dark:bg-[color:rgba(255,255,255,0.08)] px-6 py-4 font-serif text-xl hover:opacity-95"
              >
                <Plus className="h-6 w-6" />
                Add session
              </button>
            </>
          ) : (
            <div className="space-y-3">
              {sessionsForSelectedDay.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl bg-[color:rgba(255,255,255,0.65)] dark:bg-[color:rgba(255,255,255,0.08)] p-4"
                >
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
                        className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10"
                        aria-label="Remove session"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={openAddModal}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[color:rgba(255,255,255,0.65)] dark:bg-[color:rgba(255,255,255,0.08)] px-6 py-4 font-serif text-xl hover:opacity-95"
              >
                <Plus className="h-6 w-6" />
                Add session
              </button>
            </div>
          )}
        </div>

        <div className="h-10" />
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
          <div className="rounded-full bg-[#9CFF7A] px-6 py-4 font-serif text-xl shadow-sm">
            {toast}
          </div>
        </div>
      )}

      {/* Add session modal */}
      {openAdd && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !busyAdd && setOpenAdd(false)}
          />

          {/* bottom sheet-ish */}
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-[var(--bg)] text-[var(--ink)] p-5 shadow-lg sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[min(92vw,560px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-serif text-2xl sm:text-3xl">Add session</div>
                <div className="mt-1 text-sm sm:text-base text-[var(--muted)]">
                  {selectedDay.dateISO} ({selectedDay.key})
                </div>
              </div>
              <button
                type="button"
                className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => !busyAdd && setOpenAdd(false)}
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <div className="font-serif text-lg sm:text-xl">Session name</div>
                <input
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[color:rgba(255,255,255,0.65)] dark:bg-[color:rgba(255,255,255,0.08)] px-4 py-3 text-base sm:text-lg outline-none focus:ring-2 focus:ring-black/20"
                  placeholder="e.g. Morning Mobility"
                />
              </label>

              <label className="block">
                <div className="font-serif text-lg sm:text-xl">Time</div>
                <input
                  type="time"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[color:rgba(255,255,255,0.65)] dark:bg-[color:rgba(255,255,255,0.08)] px-4 py-3 text-base sm:text-lg outline-none focus:ring-2 focus:ring-black/20"
                />
              </label>

              <div>
                <div className="font-serif text-lg sm:text-xl">Workout</div>

                {workouts.length > 0 ? (
                  <select
                    value={selectedWorkoutUdi}
                    onChange={(e) => setSelectedWorkoutUdi(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[color:rgba(255,255,255,0.65)] dark:bg-[color:rgba(255,255,255,0.08)] px-4 py-3 text-base sm:text-lg outline-none focus:ring-2 focus:ring-black/20"
                  >
                    <option value="">No workout (optional)</option>
                    {workouts.map((w) => (
                      <option key={w.udi} value={w.udi}>
                        {w.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <>
                    {workoutsErr && (
                      <div className="mt-2 rounded-xl bg-black/5 dark:bg-white/10 px-4 py-3 text-sm">
                        {workoutsErr}
                      </div>
                    )}
                    <input
                      value={manualWorkoutUdi}
                      onChange={(e) => setManualWorkoutUdi(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[color:rgba(255,255,255,0.65)] dark:bg-[color:rgba(255,255,255,0.08)] px-4 py-3 text-base sm:text-lg outline-none focus:ring-2 focus:ring-black/20"
                      placeholder="Paste workout UDI (umb://document/...)"
                    />
                  </>
                )}
              </div>
            </div>

            {err && <div className="mt-4 text-sm sm:text-base text-red-700">{err}</div>}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setOpenAdd(false)}
                disabled={busyAdd}
                className="w-1/3 rounded-full border border-[var(--line)] bg-transparent px-4 py-4 font-serif text-lg hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={createSession}
                disabled={busyAdd}
                className="w-2/3 rounded-full bg-[var(--btn)] px-5 py-4 font-serif text-lg text-[var(--btnText)] hover:opacity-95 disabled:opacity-60"
              >
                {busyAdd ? "Saving…" : "Save session"}
              </button>
            </div>

            <div className="h-[env(safe-area-inset-bottom)]" />
          </div>
        </div>
      )}
    </div>
  );
}
