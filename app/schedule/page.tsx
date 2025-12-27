'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  HelpCircle,
  Trash2,
  X,
} from 'lucide-react';

type ApiScheduleItem = {
  key: string;
  startTime: string; // ISO string
  dateISO: string;   // YYYY-MM-DD
  time: string;      // HH:mm
  title?: string | null;
  workoutUdi?: string | null;
};

type Session = {
  id: string;       // key from API
  dateISO: string;
  time: string;
  title: string;
  workoutUdi?: string | null;
};

type WorkoutOption = {
  title: string;
  udi: string; // umb://document/<guid-without-hyphens>
};

const BG = 'bg-[#fbf7f2]';
const INK = 'text-[#1f1b16]';
const MUTED = 'text-[#6e655c]';
const BORDER = 'border-[#6b5648]';
const ACCENT = '#6b5648';

function pad2(n: number) {
  return String(n).padStart(2, '0');
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
  const day = d.getDay(); // 0..6 (Sun..Sat)
  const diffToMon = (day === 0 ? -6 : 1 - day);
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
  { key: 'Mon', label: 'M' },
  { key: 'Tue', label: 'T' },
  { key: 'Wed', label: 'W' },
  { key: 'Thu', label: 'Th' },
  { key: 'Fri', label: 'F' },
  { key: 'Sat', label: 'Sa' },
  { key: 'Sun', label: 'Su' },
];

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPost<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiDelete(url: string): Promise<void> {
  const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
  if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
}

function isTimeHHmm(v: string) {
  return /^\d{2}:\d{2}$/.test(v);
}

function toUdiFromGuid(guidWithHyphens: string) {
  const g = (guidWithHyphens ?? '').trim();
  if (!g) return null;
  // delivery id = "ce3405a0-e614-41b5-b086-129a9ce4d16c"
  // UDI wants: "umb://document/ce3405a0e61441b5b086129a9ce4d16c"
  return `umb://document/${g.replace(/-/g, '')}`;
}

export default function MySchedulePage() {
  const router = useRouter();

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Modal state
  const [openAdd, setOpenAdd] = useState(false);
  const [busyAdd, setBusyAdd] = useState(false);
  const [titleInput, setTitleInput] = useState('Session');
  const [timeInput, setTimeInput] = useState('17:00');

  // Workouts (from /api/workouts -> delivery api v2)
  const [workouts, setWorkouts] = useState<WorkoutOption[]>([]);
  const [workoutsErr, setWorkoutsErr] = useState<string | null>(null);
  const [selectedWorkoutUdi, setSelectedWorkoutUdi] = useState<string>(''); // dropdown
  const [manualWorkoutUdi, setManualWorkoutUdi] = useState<string>('');     // fallback

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
      return {
        ...wd,
        date: d,
        dateISO: formatISO(d),
        dayOfMonth: d.getDate(),
      };
    });
  }, [weekStart]);

  const selectedDay = days[selectedIndex];

  // map workout title by UDI for display
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

  // Load workouts list
  useEffect(() => {
    let alive = true;

    async function loadWorkouts() {
      setWorkoutsErr(null);
      try {
        // Your Next route forwards to:
        // /umbraco/delivery/api/v2/content?filter=contentType:workout
        const res = await apiGet<{ total: number; items: any[] }>(`/api/workouts`);

        const mapped: WorkoutOption[] = (res?.items ?? [])
          .map((w) => {
            const title = (w?.properties?.title ?? w?.name ?? 'Workout').toString();
            const guid = (w?.id ?? '').toString();
            const udi = toUdiFromGuid(guid);
            if (!udi) return null;
            return { title, udi };
          })
          .filter(Boolean) as WorkoutOption[];

        if (alive) setWorkouts(mapped);
      } catch (e: any) {
        if (alive) {
          setWorkouts([]);
          setWorkoutsErr('Could not load workouts list (paste workout UDI manually).');
        }
      }
    }

    loadWorkouts();
    return () => {
      alive = false;
    };
  }, []);

  // Load week schedule
  useEffect(() => {
    let alive = true;

    async function loadWeek() {
      setLoading(true);
      setErr(null);

      try {
        const from = formatISO(weekStart);
        const to = formatISO(weekEnd);

        const data = await apiGet<ApiScheduleItem[]>(
          `/api/schedule?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
        );

        const mapped: Session[] = (data ?? []).map((x) => ({
          id: x.key,
          dateISO: x.dateISO,
          time: x.time,
          title: (x.title ?? 'Session').toString(),
          workoutUdi: x.workoutUdi ?? null,
        }));

        if (alive) setSessions(mapped);
      } catch (e: any) {
        if (alive) setErr(e?.message ?? 'Failed to load schedule');
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadWeek();
    return () => {
      alive = false;
    };
  }, [weekStart, weekEnd]);

  function openAddModal() {
    setErr(null);
    setTitleInput('Session');
    setTimeInput('17:00');
    setSelectedWorkoutUdi('');
    setManualWorkoutUdi('');
    setOpenAdd(true);
  }

  async function createSession() {
    setErr(null);

    if (!titleInput.trim()) {
      setErr('Please enter a session name.');
      return;
    }
    if (!isTimeHHmm(timeInput)) {
      setErr('Please choose a valid time (HH:mm).');
      return;
    }

    const workoutId = (selectedWorkoutUdi || manualWorkoutUdi).trim() || null;
    const startTimeISO = `${selectedDay.dateISO}T${timeInput}:00`;

    try {
      setBusyAdd(true);

      const created = await apiPost<ApiScheduleItem>('/api/schedule', {
        startTime: startTimeISO,
        title: titleInput.trim(),
        workoutId, // UDI (umb://document/...)
      });

      const newItem: Session = {
        id: created.key,
        dateISO: created.dateISO,
        time: created.time,
        title: (created.title ?? titleInput.trim()).toString(),
        workoutUdi: created.workoutUdi ?? (workoutId?.startsWith('umb://') ? workoutId : null),
      };

      setSessions((prev) => [...prev, newItem]);
      setOpenAdd(false);

      setToast(`Added to ${selectedDay.key} ${created.time}`);
      window.setTimeout(() => setToast(null), 2200);
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to add session');
    } finally {
      setBusyAdd(false);
    }
  }

  async function removeSession(id: string) {
    setErr(null);
    try {
      await apiDelete(`/api/schedule/${encodeURIComponent(id)}`);
      setSessions((prev) => prev.filter((x) => x.id !== id));
      setToast('Removed');
      window.setTimeout(() => setToast(null), 1600);
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to remove session');
    }
  }

  const sessionIndexDisplay = useMemo(() => {
    return { current: Math.min(1 + selectedIndex, 7), total: 11 };
  }, [selectedIndex]);

  return (
    <div className={`min-h-screen ${BG} ${INK}`}>
      <div className="mx-auto max-w-xl px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-full p-2 hover:bg-black/5"
            aria-label="Back"
          >
            <ArrowLeft className="h-7 w-7" />
          </button>
          <h1 className="font-serif text-4xl">My Schedule</h1>
        </div>

        <div className="mt-4 h-px w-full bg-black/15" />

        {/* Week overview */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <h2 className="font-serif text-4xl">Week Overview</h2>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setWeekOffset((x) => x - 1)}
              className={`grid h-14 w-14 place-items-center rounded-full border ${BORDER} bg-transparent hover:bg-black/5`}
              aria-label="Previous week"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>

            <div className="font-serif text-4xl">Week {weekNumber}</div>

            <button
              onClick={() => setWeekOffset((x) => x + 1)}
              className={`grid h-14 w-14 place-items-center rounded-full border ${BORDER} bg-transparent hover:bg-black/5`}
              aria-label="Next week"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          </div>
        </div>

        {/* Error / Loading */}
        {err && (
          <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-800">
            {err}
          </div>
        )}
        {loading && (
          <div className="mt-6 rounded-2xl border border-black/10 bg-white/50 p-4">
            Loading schedule…
          </div>
        )}

        {/* Day chips */}
        <div className="mt-7 flex gap-4">
          {days.map((d, i) => {
            const active = i === selectedIndex;
            return (
              <button
                key={d.dateISO}
                onClick={() => setSelectedIndex(i)}
                className={[
                  'flex h-[92px] w-[86px] flex-col items-center justify-center rounded-2xl border text-center font-serif',
                  active
                    ? `border-transparent bg-[${ACCENT}] text-white`
                    : `border ${BORDER} bg-transparent ${INK}`,
                ].join(' ')}
                aria-pressed={active}
              >
                <div className="text-3xl leading-none">{d.label}</div>
                <div className="mt-2 text-4xl leading-none">{d.dayOfMonth}</div>
              </button>
            );
          })}
        </div>

        {/* Session header */}
        <div className="mt-10 font-serif text-4xl">
          Session {sessionIndexDisplay.current}/{sessionIndexDisplay.total}
        </div>

        {/* Sessions panel */}
        <div className="mt-6 rounded-2xl bg-[#d9d1c8] p-8">
          {sessionsForSelectedDay.length === 0 ? (
            <>
              <div className="text-center font-serif text-4xl">
                No sessions scheduled for this day
              </div>

              <button
                onClick={openAddModal}
                className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-white px-8 py-6 font-serif text-3xl hover:bg-white/90"
              >
                <Plus className="h-8 w-8" />
                Add session
              </button>
            </>
          ) : (
            <div className="space-y-4">
              {sessionsForSelectedDay.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl bg-white/70 p-5 font-serif text-2xl"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="truncate">{s.title}</div>
                      {s.workoutUdi ? (
                        <div className={`mt-1 text-base ${MUTED} truncate`}>
                          {workoutTitleByUdi.get(s.workoutUdi) ?? s.workoutUdi}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={MUTED}>{s.time}</div>
                      <button
                        type="button"
                        onClick={() => removeSession(s.id)}
                        className="rounded-full p-2 hover:bg-black/5"
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
                className="mt-4 flex w-full items-center justify-center gap-3 rounded-full bg-white px-8 py-6 font-serif text-3xl hover:bg-white/90"
              >
                <Plus className="h-8 w-8" />
                Add session
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-6">
          <div className="rounded-full bg-[#9CFF7A] px-8 py-5 font-serif text-3xl shadow-sm">
            {toast}
          </div>
        </div>
      )}

      {/* Help */}
      <button
        type="button"
        className="fixed bottom-6 right-6 grid h-16 w-16 place-items-center rounded-full border-4 border-black bg-transparent"
        aria-label="Help"
      >
        <HelpCircle className="h-10 w-10" />
      </button>

      {/* Add session modal */}
      {openAdd && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !busyAdd && setOpenAdd(false)}
          />
          <div className="absolute left-1/2 top-1/2 w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-serif text-3xl">Add session</div>
                <div className={`mt-1 text-base ${MUTED}`}>
                  {selectedDay.dateISO} ({selectedDay.key})
                </div>
              </div>
              <button
                type="button"
                className="rounded-full p-2 hover:bg-black/5"
                onClick={() => !busyAdd && setOpenAdd(false)}
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <div className="font-serif text-xl">Session name</div>
                <input
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-black/20"
                  placeholder="e.g. Morning Mobility"
                />
              </label>

              <label className="block">
                <div className="font-serif text-xl">Time</div>
                <input
                  type="time"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-black/20"
                />
              </label>

              <div>
                <div className="font-serif text-xl">Workout</div>

                {workouts.length > 0 ? (
                  <select
                    value={selectedWorkoutUdi}
                    onChange={(e) => setSelectedWorkoutUdi(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-black/20"
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
                      <div className="mt-2 rounded-xl bg-black/5 px-4 py-3 text-sm">
                        {workoutsErr}
                      </div>
                    )}
                    <input
                      value={manualWorkoutUdi}
                      onChange={(e) => setManualWorkoutUdi(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-black/15 bg-white px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-black/20"
                      placeholder="Paste workout UDI (umb://document/...)"
                    />
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setOpenAdd(false)}
                disabled={busyAdd}
                className="w-1/3 rounded-full border border-black/15 bg-white px-5 py-4 font-serif text-xl hover:bg-black/5 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={createSession}
                disabled={busyAdd}
                className="w-2/3 rounded-full bg-[#2a2521] px-6 py-4 font-serif text-xl text-white hover:opacity-95 disabled:opacity-60"
              >
                {busyAdd ? 'Saving…' : 'Save session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
