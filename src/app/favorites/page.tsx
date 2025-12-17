import { Favorites } from "@/lib/api";
import FavoriteButton from "@/components/FavoriteButton";
const base = process.env.UMBRACO_BASE_URL!;

export default async function FavoritesPage() {
  const items = await Favorites.list(); // server component fetch (SSR)

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Mina favoriter</h1>

      <div className="grid grid-cols-1 gap-4">
        {items.map((w: any) => (
          <article key={w.id} className="rounded border p-4 flex gap-4">
            <img
              src={base + (w.imageUrl ?? "/placeholder.png")}
              alt={w.title ?? w.name}
              className="w-32 h-24 object-cover rounded"
            />
            <div className="flex-1">
              <a href={w.url} className="font-semibold hover:underline">
                {w.title ?? w.name}
              </a>
              <div className="text-sm text-gray-500">
                {w.duration ? `${w.duration}s` : null}
              </div>
              <div className="mt-2">
                <FavoriteButton workoutId={Number(w.id)} initial={true} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
