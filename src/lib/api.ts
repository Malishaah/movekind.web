export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
    // cookies skickas automatiskt (samma origin)
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const Auth = {
  login: (payload: { UsernameOrEmail: string; Password: string; RememberMe?: boolean }) =>
    api<{ ok: boolean; username: string }>("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),

  logout: () => api<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  me:    () => api<any>("/api/auth/me"),
};

export const Favorites = {
  list:  () => api<any[]>("/api/favorites"),
  add:   (id: number) => api(`/api/favorites/${id}`, { method: "POST" }),
  del:   (id: number) => api(`/api/favorites/${id}`, { method: "DELETE" }),
  toggle:(id: number) => api<{ workoutId: number; favorited: boolean }>(`/api/favorites/${id}/toggle`, { method: "POST" }),
};
export const Register = {
  register: (payload: { Username: string; Email: string; Password: string }) =>
    api<{ ok: boolean; username: string }>("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),

  me:    () => api<any>("/api/auth/me"),
  update:(payload: { Username?: string; Email?: string; Password?: string }) =>
    api<{ ok: boolean; username: string }>("/api/auth/me", { method: "PUT", body: JSON.stringify(payload) }),
};  