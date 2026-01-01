export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "include", cache: "no-store" });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }
  return res.json();
}

export async function apiPost<T = any>(path: string, body?: any): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }

  // om endpoint ibland returnerar 204
  if (res.status === 204) return undefined as unknown as T;

  return res.json();
}

export async function apiPut<T = any>(path: string, body: any): Promise<T> {
  const res = await fetch(path, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }

  if (res.status === 204) return undefined as unknown as T;

  return res.json();
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(path, { method: "DELETE", credentials: "include" });
  if (!res.ok && res.status !== 204) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }
}