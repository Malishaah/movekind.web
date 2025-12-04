export async function forwardToUmbraco(
  req: Request,
  path: string,
  init: RequestInit = {},
) {
  const base = process.env.UMBRACO_BASE_URL!;
  const url = new URL(path, base);

  // Vidarebefordra bara nödvändiga headers (inkl. cookie för auth)
  const headers = new Headers(init.headers || {});
  headers.set("cookie", req.headers.get("cookie") || "");
  headers.set("content-type", headers.get("content-type") || req.headers.get("content-type") || "application/json");

  const body = init.body ?? (req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined);

  const resp = await fetch(url, {
    method: init.method || req.method,
    headers,
    body,
    // viktigt för att Next inte ska cachea auth-svar
    cache: "no-store",
  });

  // Skicka tillbaka Set-Cookie etc.
  const outHeaders = new Headers(resp.headers);
  const data = await resp.arrayBuffer();
  return new Response(data, { status: resp.status, headers: outHeaders });
}
