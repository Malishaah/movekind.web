"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LogOut, Bell } from "lucide-react";
import { apiGet, apiPut, apiPost } from "@/app/lib/api";

type Profile = {
  email: string;
  name: string;
  largerText: boolean;
  highContrast: boolean;
  lightMode: boolean; // true = light, false = dark
  captionsOnByDefault: boolean;
  remindersEnabled: boolean;
  defaultReminderTime: string; // "HH:mm" (eller "HH:mm:ss")
};

function toHHMM(v: string) {
  if (!v) return "08:00";
  return v.length >= 5 ? v.slice(0, 5) : v;
}

function applyUiPreferences(p: Profile | null) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // LightMode true => INTE dark. LightMode false => dark.
  root.classList.toggle("dark", !p?.lightMode);

  // valfria extra
  root.classList.toggle("mk-large-text", !!p?.largerText);
  root.classList.toggle("mk-high-contrast", !!p?.highContrast);
}

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  const didHydrate = useRef(false);
  const saveTimer = useRef<number | null>(null);

  async function load() {
    setMsg(null);
    setLoading(true);

    try {
      const p = (await apiGet("/api/members/me")) as any;

      const mapped: Profile = {
        email: p.email ?? "",
        name: p.name ?? "",
        largerText: !!p.largerText,
        highContrast: !!p.highContrast,
        lightMode: !!p.lightMode,
        captionsOnByDefault: !!p.captionsOnByDefault,
        remindersEnabled: !!p.remindersEnabled,
        defaultReminderTime: toHHMM(p.defaultReminderTime ?? "08:00"),
      };

      setProfile(mapped);
      applyUiPreferences(mapped);
    } catch (err: any) {
      setMsg(err?.message || "Not logged in?");
      setProfile(null);
      applyUiPreferences(null);
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

  // ✅ Apply theme instantly when toggling in UI
  useEffect(() => {
    if (!profile) return;
    applyUiPreferences(profile);
  }, [profile?.lightMode, profile?.largerText, profile?.highContrast]);

  // Autosave (debounce)
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
      applyUiPreferences(null);
      router.push("/");
    } catch (err: any) {
      setMsg(err?.message || "Logout failed");
    }
  }

  const email = useMemo(() => profile?.email ?? "", [profile]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="mx-auto max-w-xl px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Back"
          >
            <ArrowLeft className="h-7 w-7" />
          </button>
          <h1 className="font-serif text-3xl">Profile &amp; Settings</h1>
        </div>

        <div className="mt-4 h-px w-full bg-[var(--line)]" />

        {loading ? (
          <div className="py-10 text-lg text-[var(--muted)]">Loading…</div>
        ) : !profile ? (
          <div className="py-10">
            <p className="text-lg text-[var(--muted)]">{msg ?? "Not logged in."}</p>
          </div>
        ) : (
          <>
            {/* User card */}
            <div className="mt-6 rounded-2xl bg-[var(--card)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-serif text-2xl">User</div>
                  <div className="mt-2 text-xl text-[var(--muted)]">{email}</div>
                </div>

                <button
                  onClick={logout}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--btn)] px-5 py-3 font-serif text-xl text-[var(--btnText)] hover:opacity-95"
                >
                  <LogOut className="h-5 w-5" />
                  Log out
                </button>
              </div>
            </div>

            <div className="mt-6 h-px w-full bg-[var(--line)]" />

            <SectionTitle>Accessibility</SectionTitle>

            {/* (valfritt) largerText/highContrast om du vill visa senare */}
            {/* <SettingRow title="Larger text" checked={profile.largerText} onChange={(v)=>setProfile({...profile, largerText:v})} /> */}
            {/* <SettingRow title="High contrast" checked={profile.highContrast} onChange={(v)=>setProfile({...profile, highContrast:v})} /> */}

            <SettingRow
              title="Light mode"
              description="Turn off to enable dark mode"
              checked={profile.lightMode}
              onChange={(v) => setProfile({ ...profile, lightMode: v })}
            />

            <SettingRow
              title="Captions on by default"
              description="Show captions automatically in videos"
              checked={profile.captionsOnByDefault}
              onChange={(v) => setProfile({ ...profile, captionsOnByDefault: v })}
            />

            <div className="mt-6 h-px w-full bg-[var(--line)]" />

            <SectionTitle>Reminders</SectionTitle>

            <SettingRow
              icon={<Bell className="h-6 w-6" />}
              title="Enable reminders"
              description="Receive notifications for scheduled sessions"
              checked={profile.remindersEnabled}
              onChange={(v) => setProfile({ ...profile, remindersEnabled: v })}
            />

            <div className="mt-6">
              <div className="font-serif text-2xl">Default reminder time</div>
              <div className="mt-3 rounded-2xl bg-[var(--card)] p-4">
                <input
                  type="time"
                  step={60}
                  value={toHHMM(profile.defaultReminderTime)}
                  onChange={(e) =>
                    setProfile({ ...profile, defaultReminderTime: toHHMM(e.target.value) })
                  }
                  className="w-full bg-transparent font-serif text-3xl outline-none"
                  aria-label="Default reminder time"
                />
              </div>
            </div>

            <div className="mt-8 h-px w-full bg-[var(--line)]" />

            <SectionTitle>My needs</SectionTitle>

            <Link
              href="/personalize"
              className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-[var(--accent)] bg-transparent px-6 py-4 font-serif text-2xl hover:bg-black/5 dark:hover:bg-white/10"
            >
              Review onboarding
            </Link>

            <div className="mt-6 text-sm text-[var(--muted)]">
              {status === "saving"
                ? "Saving…"
                : status === "saved"
                ? "Saved"
                : status === "error"
                ? "Error saving"
                : ""}
              {msg ? ` · ${msg}` : ""}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 font-serif text-3xl">{children}</h2>;
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
  return (
    <div className="mt-7 flex items-start justify-between gap-6">
      <div className="flex items-start gap-3">
        {icon ? <div className="mt-1">{icon}</div> : null}
        <div>
          <div className="font-serif text-2xl">{title}</div>
          {description ? (
            <div className="mt-2 text-lg text-[var(--muted)]">{description}</div>
          ) : null}
        </div>
      </div>

      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        "relative h-10 w-16 rounded-full border transition",
        "border-[var(--accent)]",
        checked ? "bg-[var(--accent)]" : "bg-transparent",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-white transition",
          checked ? "left-8" : "left-1",
        ].join(" ")}
      />
      <span className="absolute left-3 top-1/2 h-4 w-px -translate-y-1/2 bg-white/70" />
    </button>
  );
}
