'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, HelpCircle } from 'lucide-react';

type Session = {
  id: string;
  dateISO: string; // YYYY-MM-DD
  time: string;    // "17:00"
  title?: string;
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

// ISO week number
function getISOWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Monday-start week
function startOfISOWeek(base: Date) {
  const d = new Date(base);
  const day = d.getDay(); // 0..6 (Sun..Sat)
  const diffToMon = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diffToMon);
  d.setHours(0, 0, 0, 0);
  return d;
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

export default function MySchedulePage() {
  const router = useRouter();

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0); // 0 = Mon
  const [toast, setToast] = useState<string | null>('Added to Tue 17:00'); // demo
  const [sessions, setSessions] = useState<Session[]>([]); // koppla till API senare

  const weekStart = useMemo(() => {
    const now = new Date();
    const base = new Date(now);
    base.setDate(base.getDate() + weekOffset * 7);
    return startOfISOWeek(base);
  }, [weekOffset]);

  const weekNumber = useMemo(() => getISOWeekNumber(weekStart), [weekStart]);

  const days = useMemo(() => {
    return weekDays.map((wd, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return {
        ...wd,
        date: d,
        dateISO: formatISO(d),
        dayOfMonth: d.getDate(),
      };
    });
  }, [weekStart]);

  const selectedDay = days[selectedIndex];
  const sessionsForSelectedDay = useMemo(
    () => sessions.filter((s) => s.dateISO === selectedDay.dateISO),
    [sessions, selectedDay.dateISO]
  );

  const sessionIndexDisplay = useMemo(() => {
    // I din mock står "Session 3/11" (här statiskt/placeholder)
    // Du kan byta till verklig logik när du har plan.
    return { current: 3, total: 11 };
  }, []);

  function addSession() {
    // Demo: lägg till 17:00 på valt datum och visa toast
    const newItem: Session = {
      id: crypto.randomUUID(),
      dateISO: selectedDay.dateISO,
      time: '17:00',
      title: 'Session',
    };

    setSessions((prev) => [...prev, newItem]);

    const dayName = selectedDay.key; // Tue etc
    setToast(`Added to ${dayName} 17:00`);
    window.setTimeout(() => setToast(null), 2200);
  }

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

        {/* Week Overview row */}
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

        {/* Session title */}
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
                onClick={addSession}
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
                  <div className="flex items-center justify-between">
                    <div>{s.title ?? 'Session'}</div>
                    <div className={MUTED}>{s.time}</div>
                  </div>
                </div>
              ))}

              <button
                onClick={addSession}
                className="mt-4 flex w-full items-center justify-center gap-3 rounded-full bg-white px-8 py-6 font-serif text-3xl hover:bg-white/90"
              >
                <Plus className="h-8 w-8" />
                Add session
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toast bottom-left */}
      {toast && (
        <div className="fixed bottom-6 left-6">
          <div className="rounded-full bg-[#9CFF7A] px-8 py-5 font-serif text-3xl shadow-sm">
            {toast}
          </div>
        </div>
      )}

      {/* Help button bottom-right */}
      <button
        type="button"
        className="fixed bottom-6 right-6 grid h-16 w-16 place-items-center rounded-full border-4 border-black bg-transparent"
        aria-label="Help"
      >
        <HelpCircle className="h-10 w-10" />
      </button>
    </div>
  );
}
