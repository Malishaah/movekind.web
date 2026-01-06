"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useId } from "react";
import { apiGet, apiDelete, apiPost } from "@/app/lib/api";
import { ArrowLeft, Search, Heart, Plus, Play, X } from "lucide-react";

type FavNode = {
  id?: number;
  key?: string; // GUID
  name?: string;
  url?: string;
  imageUrl?: string | null;
  title?: string | null;
  description?: string | null; // kan innehålla html från CMS
  duration?: number | null; // sekunder
  level?: string | null;
  tags?: string[] | null;
};

type ApiScheduleItem = {
  key: string;
  startTime: string;
  dateISO: string;
  time: string;
  title?: string | null;
  workoutUdi?: string | null;
};

function minutesText(seconds?: number | null) {
  if (!seconds || seconds <= 0) return "";
  return `${Math.max(1, Math.round(seconds / 60))} min`;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function formatISO(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function isTimeHHmm(v: string) {
  return /^\d{2}:\d{2}$/.test(v);
}
function toUdiFromGuid(guidWithHyphens?: string | null) {
  const g = (guidWithHyphens ?? "").trim();
  if (!g) return null;
  return `umb://document/${g.replace(/-/g, "")}`;
}

/** WCAG + säker default: visa description som plain text */
function htmlToPlainText(html: string) {
  return (html ?? "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

export default function FavoritesPage() {
  const [items, setItems] = useState<FavNode[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Add-to-schedule modal
  const [openAdd, setOpenAdd] = useState(false);
  const [busyAdd, setBusyAdd] = useState(false);
  const [addItem, setAddItem] = useState<FavNode | null>(null);
  const [dateISO, setDateISO] = useState(() => formatISO(new Date()));
  const [timeHHmm, setTimeHHmm] = useState("17:00");
  const [titleInput, setTitleInput] = useState("Session");

  // a11y ids
  const dialogTitleId = useId();
  const dialogDescId = useId();

  // focus management
  const lastActiveElRef = useRef<HTMLElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  async function load() {
    setMsg(null);
    try {
      const list = await apiGet("/api/favorites");
      setItems(Array.isArray(list) ? (list as FavNode[]) : []);
    } catch (err: any) {
      setMsg(err?.message || "Not logged in?");
      setItems([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter((n) =>
      ((n.title ?? n.name ?? "") + " " + (n.description ?? ""))
        .toLowerCase()
        .includes(q)
    );
  }, [items, query]);

  function slugOf(n: FavNode) {
    return (n.key ?? "").trim();
  }

  async function removeFavorite(n: FavNode) {
    const slug = slugOf(n);
    if (!slug) {
      setMsg("Missing workout key (GUID) from /api/favorites.");
      return;
    }

    try {
      await apiDelete(`/api/favorites/${encodeURIComponent(slug)}`);
      setItems((prev) => prev.filter((x) => (x.key ?? "") !== slug));
      setToast("Removed from favorites");
      window.setTimeout(() => setToast(null), 1600);
    } catch (err: any) {
      setMsg(err?.message || "Remove failed");
    }
  }

  function openAddToSchedule(n: FavNode) {
    const slug = slugOf(n);
    if (!slug) {
      setMsg("Missing workout key (GUID) from /api/favorites.");
      return;
    }

    setMsg(null);
    setAddItem(n);
    setOpenAdd(true);

    setDateISO(formatISO(new Date()));
    setTimeHHmm("17:00");
    setTitleInput((n.title ?? n.name ?? "Session").toString());
  }

  function closeModal() {
    setOpenAdd(false);
    setAddItem(null);
    // return focus
    window.setTimeout(() => {
      lastActiveElRef.current?.focus?.();
    }, 0);
  }

  // focus + esc handling for modal
  useEffect(() => {
    if (!openAdd) return;

    lastActiveElRef.current = document.activeElement as HTMLElement | null;

    // focus first field
    window.setTimeout(() => {
      titleInputRef.current?.focus();
    }, 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busyAdd) closeModal();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAdd, busyAdd]);

  async function createScheduleFromFavorite() {
    if (!addItem) return;

    const slug = slugOf(addItem);
    const udi = toUdiFromGuid(slug);

    if (!udi) return setMsg("Could not build workout UDI.");
    if (!dateISO) return setMsg("Please choose a date.");
    if (!isTimeHHmm(timeHHmm)) return setMsg("Please choose a valid time (HH:mm).");

    const startTime = `${dateISO}T${timeHHmm}:00`;

    try {
      setBusyAdd(true);
      setMsg(null);

      const created = await apiPost("/api/schedule", {
        startTime,
        title: titleInput.trim() || "Session",
        workoutId: udi,
      });

      const createdAny = created as any as ApiScheduleItem | undefined;
      setToast(
        `Added to schedule ${createdAny?.dateISO ?? dateISO} ${createdAny?.time ?? timeHHmm}`
      );
      window.setTimeout(() => setToast(null), 2200);

      closeModal();
    } catch (err: any) {
      setMsg(err?.message || "Failed to add to schedule");
    } finally {
      setBusyAdd(false);
    }
  }

  const pageBg = "bg-[var(--bg)] text-[var(--ink)]";
  const line = "border-[var(--line)]";
  const card = "bg-[var(--card)]";
  const muted = "text-[var(--muted)]";
  const btn = "bg-[var(--btn)] text-[var(--btnText)]";

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Back"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="font-serif text-3xl sm:text-5xl">Favorites</h1>
        </div>

        {/* Search */}
        <div className={`mt-5 flex items-center gap-3 rounded-full ${card} ${line} border px-4 py-3 sm:px-5 sm:py-4`}>
          <Search className={`h-5 w-5 sm:h-6 sm:w-6 ${muted}`} aria-hidden="true" />
          <label className="sr-only" htmlFor="fav-search">Search favorites</label>
          <input
            id="fav-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search favorites"
            className="w-full bg-transparent text-base sm:text-lg text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none"
          />
        </div>

        {/* Messages */}
        {msg && (
          <div className={`mt-4 rounded-2xl ${card} ${line} border px-5 py-4 text-sm sm:text-base`}>
            {msg}
          </div>
        )}

        <div className="mt-5 space-y-6">
          {filtered.length === 0 ? (
            <div className={`rounded-3xl ${card} ${line} border p-6`}>
              <h2 className="font-serif text-2xl sm:text-3xl">No favorites yet.</h2>
              <div className={`mt-2 text-base sm:text-lg ${muted}`}>
                Save a session and it will appear here.
              </div>
            </div>
          ) : (
            filtered.map((n) => {
              const slug = slugOf(n);
              const title = (n.title ?? n.name ?? "Workout").toString();
              const descText = htmlToPlainText((n.description ?? "").toString());

              const mins = minutesText(n.duration);
              const meta = [
                mins,
                n.level ?? null,
                n.tags?.length ? n.tags.slice(0, 2).join(", ") : null,
              ]
                .filter(Boolean)
                .join(" · ");

              const detailHref = slug ? `/workouts/${slug}` : "#";
              const playHref = slug ? `/workouts/${slug}/play` : "#";

              return (
                <article
                  key={slug || n.id || title}
                  className={`overflow-hidden rounded-3xl ${card} ${line} border`}
                >
                  {/* Media */}
                  <div className="relative">
                    <Link href={playHref} aria-label={`Play ${title}`} className="block">
                      <div className={`relative aspect-[16/10] w-full ${card}`}>
                        {n.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={n.imageUrl}
                            alt={title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : null}

                        <div className="absolute inset-0 grid place-items-center">
                          <div className="grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-full bg-black/40 backdrop-blur-sm">
                            <Play className="h-7 w-7 sm:h-8 sm:w-8 text-white" aria-hidden="true" />
                          </div>
                        </div>
                      </div>
                    </Link>

                    {/* Remove favorite */}
                    <button
                      type="button"
                      onClick={() => removeFavorite(n)}
                      className={`absolute right-3 top-3 rounded-full ${card} ${line} border p-2 shadow-sm hover:opacity-90`}
                      aria-label={`Remove ${title} from favorites`}
                      title="Remove favorite"
                    >
                      <Heart className="h-6 w-6 sm:h-7 sm:w-7" fill="currentColor" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-5 sm:p-6">
                    <Link href={detailHref} className="block">
                      <h2 className="font-serif text-2xl sm:text-3xl leading-tight">{title}</h2>

                      {descText ? (
                        <p className={`mt-2 text-base sm:text-lg ${muted} whitespace-pre-line`}>
                          {descText}
                        </p>
                      ) : null}

                      {meta ? (
                        <div className={`mt-3 text-base sm:text-lg ${muted}`}>{meta}</div>
                      ) : null}
                    </Link>

                    <div className="mt-5">
                      <button
                        type="button"
                        onClick={() => openAddToSchedule(n)}
                        className={`flex w-full items-center justify-center gap-3 rounded-full ${btn} px-6 py-4 font-serif text-lg sm:text-xl hover:opacity-95`}
                        aria-label={`Add ${title} to schedule`}
                      >
                        <Plus className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                        Add to schedule
                      </button>
                    </div>

                    {!slug ? (
                      <div className="mt-3 text-sm text-red-600">
                        Missing <code>key</code> (GUID) from /api/favorites — fix backend to include it.
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="h-10" />
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-4 left-1/2 z-50 w-[min(92vw,520px)] -translate-x-1/2 sm:bottom-6"
          role="status"
          aria-live="polite"
        >
          <div className={`rounded-full ${card} ${line} border px-5 py-4 font-serif text-xl shadow-sm text-center`}>
            {toast}
          </div>
        </div>
      )}

      {/* Modal */}
      {openAdd && addItem && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => !busyAdd && closeModal()}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            aria-describedby={dialogDescId}
            className="absolute left-1/2 top-1/2 w-[min(94vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] p-5 sm:p-6 shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div id={dialogTitleId} className="font-serif text-2xl sm:text-3xl">
                  Add to schedule
                </div>
                <div id={dialogDescId} className={`mt-1 text-sm sm:text-base ${muted}`}>
                  {(addItem.title ?? addItem.name ?? "Workout").toString()}
                </div>
              </div>

              <button
                type="button"
                className={`rounded-full p-2 hover:opacity-90 ${card} ${line} border`}
                onClick={() => !busyAdd && closeModal()}
                aria-label="Close dialog"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <div className="font-serif text-lg">Title</div>
                <input
                  ref={titleInputRef}
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className={`mt-2 w-full rounded-2xl border ${line} bg-[var(--card)] px-4 py-3 text-base outline-none focus:ring-2 focus:ring-black/20`}
                  placeholder="e.g. Evening session"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <div className="font-serif text-lg">Date</div>
                  <input
                    type="date"
                    value={dateISO}
                    onChange={(e) => setDateISO(e.target.value)}
                    className={`mt-2 w-full rounded-2xl border ${line} bg-[var(--card)] px-4 py-3 text-base outline-none focus:ring-2 focus:ring-black/20`}
                  />
                </label>

                <label className="block">
                  <div className="font-serif text-lg">Time</div>
                  <input
                    type="time"
                    step={60}
                    value={timeHHmm}
                    onChange={(e) => setTimeHHmm(e.target.value)}
                    className={`mt-2 w-full rounded-2xl border ${line} bg-[var(--card)] px-4 py-3 text-base outline-none focus:ring-2 focus:ring-black/20`}
                  />
                </label>
              </div>
            </div>

            {msg && <div className="mt-4 text-sm sm:text-base text-red-600">{msg}</div>}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={busyAdd}
                className={`w-1/3 rounded-full border ${line} bg-[var(--card)] px-4 py-4 font-serif text-lg hover:opacity-90 disabled:opacity-60`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={createScheduleFromFavorite}
                disabled={busyAdd}
                className={`w-2/3 rounded-full ${btn} px-6 py-4 font-serif text-lg hover:opacity-95 disabled:opacity-60`}
              >
                {busyAdd ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
