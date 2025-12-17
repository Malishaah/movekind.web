'use client';
import { useEffect, useState } from 'react';
import { apiGet, apiPut, apiPost } from '@/app/lib/api';

type Profile = {
  Email: string;
  Name: string;
  LargerText: boolean;
  HighContrast: boolean;
  LightMode: boolean;
  CaptionsOnByDefault: boolean;
  RemindersEnabled: boolean;
  DefaultReminderTime: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setMsg(null);
    try {
      const p = await apiGet('/api/members/me');
      setProfile(p);
    } catch (err: any) {
      setMsg(err?.message || 'Not logged in?');
    }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!profile) return;
    setMsg(null);
    try {
      await apiPut('/api/members/me', profile);
      setMsg('Saved');
    } catch (err: any) {
      setMsg(err?.message || 'Save failed');
    }
  }

  async function logout() {
    await apiPost('/api/auth/logout');
    setMsg('Logged out');
    setProfile(null);
  }

  if (!profile) return (
    <section>
      <h1>Profile</h1>
      {msg ? <p>{msg}</p> : <p>Loading...</p>}
    </section>
  );

  return (
    <section style={{ display:'grid', gap:12, maxWidth:520 }}>
      <h1>Profile</h1>
      <label>Email <input value={profile.Email} onChange={e=>setProfile({...profile, Email: e.target.value})} /></label>
      <label>Name <input value={profile.Name} onChange={e=>setProfile({...profile, Name: e.target.value})} /></label>
      <label><input type="checkbox" checked={profile.LargerText} onChange={e=>setProfile({...profile, LargerText: e.target.checked})} /> Larger Text</label>
      <label><input type="checkbox" checked={profile.HighContrast} onChange={e=>setProfile({...profile, HighContrast: e.target.checked})} /> High Contrast</label>
      <label><input type="checkbox" checked={profile.LightMode} onChange={e=>setProfile({...profile, LightMode: e.target.checked})} /> Light Mode</label>
      <label><input type="checkbox" checked={profile.CaptionsOnByDefault} onChange={e=>setProfile({...profile, CaptionsOnByDefault: e.target.checked})} /> Captions On By Default</label>
      <label><input type="checkbox" checked={profile.RemindersEnabled} onChange={e=>setProfile({...profile, RemindersEnabled: e.target.checked})} /> Reminders Enabled</label>
      <label>Default Reminder Time <input value={profile.DefaultReminderTime} onChange={e=>setProfile({...profile, DefaultReminderTime: e.target.value})} /></label>

      <div style={{ display:'flex', gap:8 }}>
        <button onClick={save}>Save</button>
        <button onClick={logout}>Logout</button>
      </div>
      {msg && <p>{msg}</p>}
    </section>
  );
}
