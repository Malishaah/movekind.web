'use client';
import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiDelete } from '@/app/lib/api';

type Workout = {
  id: number;
  key?: string;
  name: string;
  url?: string;
  imageUrl?: string | null;
  title?: string | null;
  duration?: number | null;
};

export default function WorkoutsPage() {
  const [items, setItems] = useState<Workout[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  // For demo: you can replace with your own Delivery API endpoint or static
  async function loadWorkouts() {
    // Example static list - replace with your fetch to Umbraco if you prefer
    setItems([
      { id: 1090, name: 'workout1' },
      { id: 1092, name: 'workout2' },
    ]);
  }

  async function loadFavorites() {
    try {
      const ids = await apiGet('/api/favorites/ids');
      setFavoriteIds(ids);
    } catch (err: any) {
      setMsg(err?.message || 'Could not load favorites');
    }
  }

  useEffect(() => {
    loadWorkouts();
    loadFavorites();
  }, []);

  function isFav(id: number) { return favoriteIds.includes(id); }

  async function toggle(id: number) {
    try {
      if (isFav(id)) {
        await apiDelete(`/api/favorites/${id}`);
        setFavoriteIds(favoriteIds.filter(x => x !== id));
      } else {
        await apiPost(`/api/favorites/${id}`);
        setFavoriteIds([...favoriteIds, id]);
      }
    } catch (err: any) {
      setMsg(err?.message || 'Toggle failed');
    }
  }

  return (
    <section>
      <h1>Workouts</h1>
      {msg && <p>{msg}</p>}
      <ul style={{ display:'grid', gap:12, padding:0, listStyle:'none' }}>
        {items.map(w => (
          <li key={w.id} style={{ border:'1px solid #ddd', borderRadius:8, padding:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:600 }}>{w.name}</div>
                <small>ID: {w.id}</small>
              </div>
              <button onClick={() => toggle(w.id)}>
                {isFav(w.id) ? '★ Unfavorite' : '☆ Favorite'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
