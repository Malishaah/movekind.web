'use client';
import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiDelete } from '@/app/lib/api';

type FavNode = {
  id: number;
  key?: string;
  name: string;
  url?: string;
  imageUrl?: string | null;
  title?: string | null;
  duration?: number | null;
};

export default function FavoritesPage() {
  const [items, setItems] = useState<FavNode[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setMsg(null);
    try {
      const list = await apiGet('/api/favorites');
      setItems(list);
    } catch (err: any) {
      setMsg(err?.message || 'Not logged in?');
    }
  }

  useEffect(() => { load(); }, []);

  async function remove(id: number) {
    try {
      await apiDelete(`/api/favorites/${id}`);
      setItems(items.filter(i => i.id !== id));
    } catch (err: any) {
      setMsg(err?.message || 'Remove failed');
    }
  }

  return (
    <section>
      <h1>My Favorites</h1>
      {msg && <p>{msg}</p>}
      {items.length === 0 && <p>No favorites yet.</p>}
      <ul style={{ display:'grid', gap:12, padding:0, listStyle:'none' }}>
        {items.map(n => (
          <li key={n.id} style={{ border:'1px solid #ddd', borderRadius:8, padding:12 }}>
            <div style={{ display:'flex', gap:12 }}>
              {n.imageUrl && <img src={n.imageUrl} alt={n.name} width={96} height={96} />}
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600 }}>{n.title ?? n.name}</div>
                {n.duration != null && <div>Duration: {n.duration}s</div>}
                {n.url && <a href={n.url} target="_blank" rel="noreferrer">Open</a>}
              </div>
              <button onClick={() => remove(n.id)}>Remove</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
