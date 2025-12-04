"use client";

import { useState } from "react";
import { Favorites } from "@/lib/api";

export default function FavoriteButton({ workoutId, initial }: { workoutId: number; initial: boolean }) {
  const [fav, setFav] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function onToggle() {
    if (loading) return;
    setLoading(true);
    const prev = fav;
    setFav(!fav); // optimistic
    try {
      await Favorites.toggle(workoutId);
    } catch {
      setFav(prev); // rollback
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={onToggle} disabled={loading} className="px-3 py-1 rounded border">
      {fav ? "★ Favorit" : "☆ Lägg som favorit"}
    </button>
  );
}
