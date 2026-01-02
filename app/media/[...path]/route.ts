import { NextRequest, NextResponse } from "next/server";
import https from "https";

export const runtime = "nodejs"; // viktigt för streaming

const BASE = (process.env.NEXT_PUBLIC_UMBRACO_URL || "").replace(/\/$/, "");

const httpsAgent =
  process.env.NODE_ENV !== "production"
    ? new https.Agent({ rejectUnauthorized: false })
    : undefined;

function pickHeaders(upstream: Headers) {
  // Viktiga headers för media-streaming
  const h = new Headers();

  const passthrough = [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "etag",
    "last-modified",
    "cache-control",
  ];

  for (const k of passthrough) {
    const v = upstream.get(k);
    if (v) h.set(k, v);
  }

  // Om upstream saknar accept-ranges men du vill vara safe:
  // h.set("Accept-Ranges", h.get("accept-ranges") ?? "bytes");

  return h;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  if (!BASE) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_UMBRACO_URL" },
      { status: 500 }
    );
  }

  const url = `${BASE}/media/${params.path.join("/")}`;

  // Skicka vidare Range header om klienten ber om det (video!)
  const range = req.headers.get("range");

  const upstream = await fetch(url, {
    // @ts-expect-error Node fetch supports agent; Next types är web-only
    agent: httpsAgent,
    headers: {
      // Tillåt både images + video. (Du kan även sätta "*/*" om du vill.)
      Accept: "image/avif,image/webp,image/*,video/*,*/*;q=0.8",
      ...(range ? { Range: range } : {}),
    },
  });

  // Om upstream säger nej på range (416 etc) vill vi bubbla upp det
  if (!upstream.ok && upstream.status !== 206) {
    return new NextResponse(`Upstream ${upstream.status}`, {
      status: upstream.status,
    });
  }

  const ct = upstream.headers.get("content-type") || "";

  // Tillåt images + video. (Umbraco kan ibland svara octet-stream för mp4 beroende på config.)
  const isAllowed =
    ct.startsWith("image/") ||
    ct.startsWith("video/") ||
    ct === "application/octet-stream";

  if (!isAllowed) {
    return new NextResponse("Unsupported media type", { status: 415 });
  }

  const headers = pickHeaders(upstream.headers);

  // Bra defaults om upstream inte skickar cache-control:
  if (!headers.get("cache-control")) {
    // För versionerade URLs kan du köra immutable, annars hellre kortare.
    headers.set("Cache-Control", "public, max-age=3600");
  }

  // Viktigt: returnera samma status som upstream (200 eller 206)
  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}
