// app/lib/umbraco.ts
const UMBRACO_BASE_URL = process.env.UMBRACO_BASE_URL ?? "https://movekindb.bovision.se";

const STRIP_HEADERS = [
  "connection","keep-alive","proxy-authenticate","proxy-authorization","te",
  "trailers","transfer-encoding","upgrade","content-length","content-encoding" 
];

function rewriteSetCookieForCurrentHost(headers: Headers) {
  const setCookies = headers.getSetCookie?.() ?? [];
  headers.delete("set-cookie");
  for (const sc of setCookies) {
    // Ta bort Domain och tvinga Path=/ om Umbraco skickar /umbraco
    const cleaned = sc
      .replace(/;\s*Domain=[^;]+/gi, "")
      .replace(/;\s*Path=\/umbraco/gi, "; Path=/");
    headers.append("set-cookie", cleaned);
  }
}

export async function forwardToUmbraco(req: Request, path: string) {
  const incomingUrl = new URL(req.url);
  const targetUrl = new URL(path, UMBRACO_BASE_URL);
  targetUrl.search = incomingUrl.search;

  const method = req.method.toUpperCase();
  const headers = new Headers(req.headers);
  headers.delete("host");

  const body = method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer();

  const umbracoRes = await fetch(targetUrl.toString(), {
    method,
    headers,
    body,
    redirect: "manual",
  });

  const out = new Headers(umbracoRes.headers);
  for (const h of STRIP_HEADERS) out.delete(h);

  // 🔐 Rewrita cookies till din domän
  rewriteSetCookieForCurrentHost(out);

  // 204/205/304 -> ingen body
  if ([204,205,304].includes(umbracoRes.status)) {
    return new Response(null, { status: umbracoRes.status, headers: out });
  }

  // Läs kropp (nu är den redan dekomprimerad av fetch) → därför tog vi bort content-encoding
  const resBody = await umbracoRes.arrayBuffer();
  return new Response(resBody, { status: umbracoRes.status, headers: out });
}
