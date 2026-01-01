import { NextRequest, NextResponse } from "next/server";
import https from "https";

const BASE = (process.env.NEXT_PUBLIC_UMBRACO_URL || "").replace(/\/$/, "");

const httpsAgent =
  process.env.NODE_ENV !== "production"
    ? new https.Agent({ rejectUnauthorized: false })
    : undefined;

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  if (!BASE) {
    return NextResponse.json({ error: "Missing NEXT_PUBLIC_UMBRACO_URL" }, { status: 500 });
  }

  const url = `${BASE}/media/${params.path.join("/")}`;

  const upstream = await fetch(url, {
    // @ts-expect-error - Node fetch supports agent but types are web-only in Next
    agent: httpsAgent,
    headers: { Accept: "image/avif,image/webp,image/*,*/*;q=0.8" },
  });

  if (!upstream.ok) {
    return new NextResponse(`Upstream ${upstream.status}`, { status: upstream.status });
  }

  const ct = upstream.headers.get("content-type") || "";
  if (!ct.startsWith("image/")) {
    return new NextResponse("Not an image", { status: 415 });
  }

  const headers = new Headers();
  headers.set("Content-Type", ct);
  const len = upstream.headers.get("content-length");
  if (len) headers.set("Content-Length", len);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new NextResponse(upstream.body, { status: 200, headers });
}
