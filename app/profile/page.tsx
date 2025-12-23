'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, LogOut, Bell } from 'lucide-react';
import { apiGet, apiPut, apiPost } from '@/app/lib/api';

type Profile = {
  Email: string;
  Name: string;
  LargerText: boolean;
  HighContrast: boolean;
  LightMode: boolean;
  CaptionsOnByDefault: boolean;
  RemindersEnabled: boolean;
  DefaultReminderTime: string; // "HH:mm" (eller med sekunder från backend)
};

function toHHMM(v: string) {
  if (!v) return '08:00';
  // backend kan skicka "08:00:00" -> gör "08:00"
  return v.length >= 5 ? v.slice(0, 5) : v;
}

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [msg, setMsg] = useState<string | null>(null);

  const didHydrate = useRef(false);
  const saveTimer = useRef<number | null>(null);

  async function load() {
    setMsg(null);
    setLoading(true);
    try {
      const p = await apiGet('/api/members/me');
      setProfile({
        ...p,
        DefaultReminderTime: toHHMM(p.DefaultReminderTime),
      });
    } catch (err: any) {
      setMsg(err?.message || 'Not logged in?');
      setProfile(null);
    } finally {
      setLoading(false);
      setStatus('idle');
      didHydrate.current = true;
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave (debounce) när profil ändras
  useEffect(() => {
    if (!profile) return;
    if (!didHydrate.current) return;

    if (saveTimer.current) window.clearTimeout(saveTimer.current);

    setStatus('saving');
    setMsg(null);

    saveTimer.current = window.setTimeout(async () => {
      try {
        const payload = { ...profile, DefaultReminderTime: toHHMM(profile.DefaultReminderTime) };
        await apiPut('/api/members/me', payload);
        setStatus('saved');
        window.setTimeout(() => setStatus('idle'), 1200);
      } catch (err: any) {
        setStatus('error');
        setMsg(err?.message || 'Save failed');
      }
    }, 500);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [profile]);

  async function logout() {
    try {
      await apiPost('/api/auth/logout');
      setProfile(null);
      setMsg('Logged out');
      router.push('/'); // eller /login om du har det
    } catch (err: any) {
      setMsg(err?.message || 'Logout failed');
    }
  }

  const email = useMemo(() => profile?.Email ?? '', [profile]);

  return (
    <div className="min-h-screen bg-[#fbf7f2] text-[#1f1b16]">
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
          <h1 className="font-serif text-3xl">Profile &amp; Settings</h1>
        </div>

        <div className="mt-4 h-px w-full bg-black/10" />

        {/* Content */}
        {loading ? (
          <div className="py-10 text-lg text-[#6e655c]">Loading…</div>
        ) : !profile ? (
          <div className="py-10">
            <p className="text-lg text-[#6e655c]">{msg ?? 'Not logged in.'}</p>
          </div>
        ) : (
          <>
            {/* User card */}
            <div className="mt-6 rounded-2xl bg-[#d9d1c8] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-serif text-2xl">User</div>
                  <div className="mt-2 text-xl text-[#6e655c]">{email}</div>
                </div>

                <button
                  onClick={logout}
                  className="inline-flex items-center gap-2 rounded-full bg-[#2a2521] px-5 py-3 font-serif text-xl text-white hover:opacity-95"
                >
                  <LogOut className="h-5 w-5" />
                  Log out
                </button>
              </div>
            </div>

            <div className="mt-6 h-px w-full bg-black/10" />

            {/* Accessibility */}
            <SectionTitle>Accessibility</SectionTitle>

            <SettingRow
              title="Larger text"
              description="Increase text size throughout the app"
              checked={profile.LargerText}
              onChange={(v) => setProfile({ ...profile, LargerText: v })}
            />

            <SettingRow
              title="High contrast"
              description="Improved readability with higher contrast"
              checked={profile.HighContrast}
              onChange={(v) => setProfile({ ...profile, HighContrast: v })}
            />

            <SettingRow
              title="Light mode"
              checked={profile.LightMode}
              onChange={(v) => setProfile({ ...profile, LightMode: v })}
            />

            <SettingRow
              title="Captions on by default"
              description="Show captions automatically in videos"
              checked={profile.CaptionsOnByDefault}
              onChange={(v) => setProfile({ ...profile, CaptionsOnByDefault: v })}
            />

            <div className="mt-6 h-px w-full bg-black/10" />

            {/* Reminders */}
            <SectionTitle>Reminders</SectionTitle>

            <SettingRow
              icon={<Bell className="h-6 w-6" />}
              title="Enable reminders"
              description="Receive notifications for scheduled sessions"
              checked={profile.RemindersEnabled}
              onChange={(v) => setProfile({ ...profile, RemindersEnabled: v })}
            />

            <div className="mt-6">
              <div className="font-serif text-2xl">Default reminder time</div>
              <div className="mt-3 rounded-2xl bg-[#d9d1c8] p-4">
                <input
                  type="time"
                  step={60}
                  value={toHHMM(profile.DefaultReminderTime)}
                  onChange={(e) =>
                    setProfile({ ...profile, DefaultReminderTime: toHHMM(e.target.value) })
                  }
                  className="w-full bg-transparent font-serif text-3xl outline-none"
                  aria-label="Default reminder time"
                />
              </div>
            </div>

            <div className="mt-8 h-px w-full bg-black/10" />

            {/* My needs */}
            <SectionTitle>My needs</SectionTitle>

            <Link
              href="/onboarding"
              className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-[#6b5648] bg-transparent px-6 py-4 font-serif text-2xl hover:bg-black/5"
            >
              Review onboarding
            </Link>
 
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
          {description ? <div className="mt-2 text-lg text-[#6e655c]">{description}</div> : null}
        </div>
      </div>

      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}

function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        'relative h-10 w-16 rounded-full border transition',
        checked ? 'border-[#6b5648] bg-[#6b5648]' : 'border-[#6b5648] bg-transparent',
      ].join(' ')}
    >
      {/* knob */}
      <span
        className={[
          'absolute top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-white transition',
          checked ? 'left-8' : 'left-1',
        ].join(' ')}
      />
      {/* tiny vertical mark like in mock */}
      <span className="absolute left-3 top-1/2 h-4 w-px -translate-y-1/2 bg-white/70" />
    </button>
  );
}
