export async function apiPost(path: string, data?: any) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined
  });
  if (!res.ok) {
    let t = await res.text();
    throw new Error(t || res.statusText);
  }
  return res.json().catch(() => ({}));
}

export async function apiPut(path: string, data?: any) {
  const res = await fetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined
  });
  if (!res.ok) {
    let t = await res.text();
    throw new Error(t || res.statusText);
  }
  return res.json().catch(() => ({}));
}

export async function apiGet(path: string) {
  const res = await fetch(path, { credentials: 'include' });
  if (!res.ok) {
    let t = await res.text();
    throw new Error(t || res.statusText);
  }
  return res.json();
}

export async function apiDelete(path: string) {
  const res = await fetch(path, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) {
    let t = await res.text();
    throw new Error(t || res.statusText);
  }
  return res.text();
}
