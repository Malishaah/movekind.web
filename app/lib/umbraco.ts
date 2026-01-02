// app/lib/umbraco.ts
const UMBRACO_BASE_URL = process.env.UMBRACO_BASE_URL ?? "https://api:8443";

const HOP_BY_HOP_HEADERS = [
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "content-length",
];

export async function forwardToUmbraco(req: Request, path: string) {
  const incomingUrl = new URL(req.url);

  // bygg target-url och behåll querystring
  const targetUrl = new URL(path, UMBRACO_BASE_URL);
  targetUrl.search = incomingUrl.search;

  // forwarda headers (inkl cookies)
  const headers = new Headers(req.headers);
  headers.delete("host");

  // läs body endast om det finns (inte GET/HEAD)
  const method = req.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer();

  const umbracoRes = await fetch(targetUrl.toString(), {
    method,
    headers,
    body,
    redirect: "manual",
  });

  // kopiera headers men ta bort hop-by-hop
  const outHeaders = new Headers(umbracoRes.headers);
  for (const h of HOP_BY_HOP_HEADERS) outHeaders.delete(h);

  // ✅ 204/205/304 får INTE ha body
  if (umbracoRes.status === 204 || umbracoRes.status === 205 || umbracoRes.status === 304) {
    return new Response(null, { status: umbracoRes.status, headers: outHeaders });
  }

  const resBody = await umbracoRes.arrayBuffer();
  return new Response(resBody, { status: umbracoRes.status, headers: outHeaders });
}
