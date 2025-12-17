export async function forwardToUmbraco(req: Request, path: string, init?: RequestInit) {
  const base = process.env.NEXT_PUBLIC_UMBRACO_URL ?? "https://localhost:44367";

  const headers = new Headers(req.headers);
  headers.delete("host");

  const method = init?.method ?? (req as any).method ?? "GET";
  const url = new URL(path, base).toString();

  const body = method === "GET" || method === "HEAD"
    ? undefined
    : (init?.body ?? await req.text());

  const resp = await fetch(url, {
    method,
    headers,
    body,
    redirect: "manual",
  });

  const respHeaders = new Headers(resp.headers);
  const buf = await resp.arrayBuffer();

  return new Response(buf, {
    status: resp.status,
    statusText: resp.statusText,
    headers: respHeaders,
  });
}
