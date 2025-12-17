'use client';
import { useState } from 'react';
import { apiPost } from '@/app/lib/api';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await apiPost('/api/auth/login', {
        UsernameOrEmail: username,
        Password: password,
        RememberMe: true
      });
      setMsg(`Logged in as ${res?.username ?? username}`);
    } catch (err: any) {
      setMsg(err?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display:'grid', gap:8, maxWidth:320 }}>
      <label>
        Email or Username
        <input value={username} onChange={e=>setUsername(e.target.value)} required
          style={{ width:'100%', padding:8, border:'1px solid #ccc', borderRadius:6 }} />
      </label>
      <label>
        Password
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
          style={{ width:'100%', padding:8, border:'1px solid #ccc', borderRadius:6 }} />
      </label>
      <button disabled={busy} type="submit" style={{ padding:10, borderRadius:6 }}>
        {busy ? 'Logging in...' : 'Login'}
      </button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
