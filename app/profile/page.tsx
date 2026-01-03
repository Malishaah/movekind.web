"use client";

import { useEffect, useMemo, useRef, useState, useId } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LogOut, Bell, Clock } from "lucide-react";
import { apiGet, apiPut, apiPost } from "@/app/lib/api";
import { useTheme } from "@/app/theme-provider"; // <-- ändra path om behövs

type Profile = {
  email: string;
  name: string;

  // UI
  lightMode: boolean;

  // other prefs
  captionsOnByDefault: boolean;
  remindersEnabled: boolean;
  defaultReminderTime: string;
};

function toHHMM(v: string) {
  if (!v) return "08:00";
  return v.length >= 5 ? v.slice(0, 5) : v;
}

export default function ProfilePage() {
  const router = useRouter();

  // ✅ Enda globala theme-källa
  const { lightMode, setLightMode } = useTheme();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  const didHydrate = useRef(false);
  const saveTimer = useRef<number | null>(null);
  const statusRegionId = useId();

  // UI tokens
  const panel = "bg-[var(--panel)] border border-[var(--line)]";
  const field = "bg-[var(--field)] border border-[var(--line)]";
  const muted = "text-[var(--muted)]";
  const ring = "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/25";
  const ghostHover = "hover:bg-black/5 dark:hover:bg-white/10";

  async function load() {
    setMsg(null);
    setLoading(true);

    try {
      const p = (await apiGet("/api/members/me")) as any;

      const mapped: Profile = {
        email: p.email ?? "",
        name: p.name ?? "",
        lightMode: !!p.lightMode,
        captionsOnByDefault: !!p.captionsOnByDefault,
        remindersEnabled: !!p.remindersEnabled,
        defaultReminderTime: toHHMM(p.defaultReminderTime ?? "08:00"),
      };

      setProfile(mapped);

      // ✅ synca theme-state (provider sköter root-klassen)
      setLightMode(mapped.lightMode);
    } catch (err: any) {
      setMsg(err?.message || "Not logged in?");
      setProfile(null);
    } finally {
      setLoading(false);
      setStatus("idle");
      didHydrate.current = true;
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // autosave (debounce)
  useEffect(() => {
    if (!profile) return;
    if (!didHydrate.current) return;

    if (saveTimer.current) window.clearTimeout(saveTimer.current);

    setStatus("saving");
    setMsg(null);

    saveTimer.current = window.setTimeout(async () => {
      try {
        const payload = {
          ...profile,
          defaultReminderTime: toHHMM(profile.defaultReminderTime),
        };

        await apiPut("/api/members/me", payload);

        setStatus("saved");
        window.setTimeout(() => setStatus("idle"), 1200);

        window.dispatchEvent(new Event("auth-changed"));
      } catch (err: any) {
        setStatus("error");
        setMsg(err?.message || "Save failed");
      }
    }, 500);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [profile]);

  async function logout() {
    try {
      await apiPost("/api/auth/logout");
      setProfile(null);
      setMsg("Logged out");

      window.dispatchEvent(new Event("auth-changed"));
      window.location.replace("/login");
    } catch (err: any) {
      setMsg(err?.message || "Logout failed");
    }
  }

  const email = useMemo(() => profile?.email ?? "", [profile]);

  const statusText =
    status === "saving" ? "Saving…" : status === "saved" ? "Saved" : status === "error" ? "Error saving" : "";

  function setPref<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="mx-auto max-w-xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className={["rounded-full p-2", ghostHover, ring].join(" ")}
            aria-label="Back"
          >
            <ArrowLeft className="h-7 w-7" />
          </button>
          <h1 className="font-serif text-3xl">Profile &amp; Settings</h1>
        </div>

        <div className="mt-4 h-px w-full bg-[var(--line)]" />

        {loading ? (
          <div className={["py-10 text-lg", muted].join(" ")} role="status" aria-live="polite">
            Loading…
          </div>
        ) : !profile ? (
          <div className="py-10">
            <p className={["text-lg", muted].join(" ")}>{msg ?? "Not logged in."}</p>
          </div>
        ) : (
          <>
            {/* User card */}
            <div className={["mt-6 rounded-2xl p-5", panel].join(" ")}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-serif text-2xl">User</div>
                  <div className={["mt-2 text-lg sm:text-xl", muted].join(" ")}>{email}</div>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  aria-label="Log out"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--btn)] px-5 py-3 font-serif text-lg sm:text-xl text-[var(--btnText)] hover:opacity-95"
                >
                  <LogOut className="h-5 w-5" />
                  Log out
                </button>
              </div>
            </div>

            <div className="mt-6 h-px w-full bg-[var(--line)]" />

            <SectionTitle>Accessibility</SectionTitle>

            {/* ✅ Dark mode toggle (ON = dark) */}
            <SettingRow
              title="Dark mode"
              description="Turn on to enable dark mode"
              checked={!lightMode}
              onChange={(darkOn) => {
                const nextLightMode = !darkOn;
                setLightMode(nextLightMode);
                setPref("lightMode", nextLightMode);
              }}
            />

            <SettingRow
              title="Captions on by default"
              description="Show captions automatically in videos"
              checked={profile.captionsOnByDefault}
              onChange={(v) => setPref("captionsOnByDefault", v)}
            />

            <div className="mt-6 h-px w-full bg-[var(--line)]" />

            <SectionTitle>Reminders</SectionTitle>

            <SettingRow
              icon={<Bell className="h-6 w-6" />}
              title="Enable reminders"
              description="Receive notifications for scheduled sessions"
              checked={profile.remindersEnabled}
              onChange={(v) => setPref("remindersEnabled", v)}
            />

            {/* ✅ time input with custom icon that becomes white in dark mode */}
            <div className="mt-6">
              <div className="font-serif text-2xl">Default reminder time</div>

              <div className="mt-3">
                <div className={["relative rounded-2xl p-4", field].join(" ")}>
                  <input
                    type="time"
                    step={60}
                    value={toHHMM(profile.defaultReminderTime)}
                    onChange={(e) => setPref("defaultReminderTime", toHHMM(e.target.value))}
                    className={[
                      "w-full bg-transparent font-serif text-2xl sm:text-3xl outline-none",
                      "text-[var(--ink)] pr-12",
                      ring,

                      // ✅ hide native clock indicator (WebKit)
                      "[&::-webkit-calendar-picker-indicator]:opacity-0",
                      "[&::-webkit-calendar-picker-indicator]:absolute",
                      "[&::-webkit-calendar-picker-indicator]:right-4",
                      "[&::-webkit-calendar-picker-indicator]:top-1/2",
                      "[&::-webkit-calendar-picker-indicator]:-translate-y-1/2",
                      "[&::-webkit-calendar-picker-indicator]:w-8",
                      "[&::-webkit-calendar-picker-indicator]:h-8",
                      "[&::-webkit-calendar-picker-indicator]:cursor-pointer",

                      // ✅ make iOS/Safari keep text readable
                      "[color-scheme:light]",
                      "dark:[color-scheme:dark]",
                    ].join(" ")}
                    aria-label="Default reminder time"
                  />

                  <Clock
                    className="pointer-events-none absolute right-6 top-1/2 h-6 w-6 -translate-y-1/2 text-[var(--muted)] dark:text-white"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 h-px w-full bg-[var(--line)]" />

            <SectionTitle>My needs</SectionTitle>

            <Link
              href="/personalize"
              className={[
                "mt-4 inline-flex w-full items-center justify-center rounded-full px-6 py-4 font-serif text-xl sm:text-2xl",
                field,
                ghostHover,
                ring,
              ].join(" ")}
            >
              Review onboarding
            </Link>

            {/* Live region */}
            <div
              id={statusRegionId}
              className={["mt-6 text-sm", muted].join(" ")}
              role={status === "error" ? "alert" : "status"}
              aria-live={status === "error" ? "assertive" : "polite"}
            >
              {statusText}
              {msg ? ` · ${msg}` : ""}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 font-serif text-2xl sm:text-3xl">{children}</h2>;
}

function SettingRow({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const titleId = useId();

  return (
    <div className="mt-5 rounded-2xl bg-[var(--panel)] border border-[var(--line)] p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-3">
          {icon ? <div className="mt-1 shrink-0">{icon}</div> : null}

          <div className="min-w-0">
            <div id={titleId} className="font-serif text-xl sm:text-2xl leading-snug">
              {title}
            </div>
            {description ? (
              <div className="mt-2 text-base sm:text-lg text-[var(--muted)] leading-relaxed">
                {description}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end sm:justify-start">
          <Switch checked={checked} onChange={onChange} ariaLabelledby={titleId} />
        </div>
      </div>
    </div>
  );
}

function Switch({
  checked,
  onChange,
  ariaLabelledby,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabelledby: string;
}) {
  const ring = "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/25";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={ariaLabelledby}
      onClick={() => onChange(!checked)}
      className={[
        "relative h-10 w-16 rounded-full transition-colors shrink-0",
        ring,

        // ✅ OFF: mer line / tydligare kant
        !checked
          ? [
              "bg-[var(--field)]",
              "border-2 border-black/20 dark:border-white/20",
              "shadow-sm",
            ].join(" ")
          : [
              "bg-[var(--accent)]",
              "border border-[var(--accent)]",
            ].join(" "),
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-1/2 h-7 w-7 -translate-y-1/2 rounded-full transition",
          "bg-white dark:bg-[color:rgba(255,255,255,0.92)]",
          "border border-black/10 dark:border-white/15 shadow-sm",
          checked ? "left-8" : "left-1",
        ].join(" ")}
      />
    </button>
  );
}
