// app/lib/site.tsx
import React from "react";

export type UmbracoLink = {
  url: string | null;
  title?: string | null;
  target?: string | null;
};

export function absoluteMedia(url?: string | null) {
  if (!url) return "";
  const base = process.env.NEXT_PUBLIC_UMBRACO_URL?.replace(/\/+$/, "") ?? "";
  return `${base}${url?.startsWith("/") ? url : `/${url}`}`;
}

// Minimal renderer för Delivery API Rich Text
export function renderRichText(node: any): JSX.Element | null {
  if (!node) return null;

  if (node.tag === "#text") return <>{node.text}</>;

  const children = (node.elements ?? []).map((el: any, i: number) => (
    <React.Fragment key={i}>{renderRichText(el)}</React.Fragment>
  ));

  switch (node.tag) {
    case "#root":
      return <>{(node.elements ?? []).map((el: any, i: number) => <React.Fragment key={i}>{renderRichText(el)}</React.Fragment>)}</>;
    case "p":
      return <p>{children}</p>;
    case "strong":
      return <strong>{children}</strong>;
    case "span":
      return (
        <span style={node.attributes?.style ? styleFromInline(node.attributes.style) : undefined}>
          {children}
        </span>
      );
    default:
      return <>{children}</>;
  }
}

// superenkel style-parser (inline CSS -> React style object)
function styleFromInline(s: string): React.CSSProperties {
  return Object.fromEntries(
    s
      .split(";")
      .map(pair => {
        const [k, v] = pair.split(":").map(x => x?.trim());
        if (!k || !v) return [];
        const camel = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        return [camel, v];
      })
      .filter(Boolean)
  ) as React.CSSProperties;
}

export type HomeNode = {
  id: string;
  name: string;
  properties: {
    logoUrl?: { url: string }[] | null;
    headerLinks?: UmbracoLink[] | null;
    aboutHeading?: string | null;
    aboutText?: any;
    contactHeading?: string | null;
    contactText?: any;
    footerLinks?: UmbracoLink[] | null;
    socialMediaTitle?: string | null;
    footerSocialMedia?: UmbracoLink[] | null;
    copyrightText?: string | null;
  };
};

export async function getHome(): Promise<HomeNode | null> {
  const base = process.env.UMBRACO_URL || process.env.NEXT_PUBLIC_UMBRACO_URL;
  if (!base) throw new Error("Missing NEXT_PUBLIC_UMBRACO_URL");

  const res = await fetch(`${base.replace(/\/+$/, "")}/umbraco/delivery/api/v2/content`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;

  const data = await res.json();
  const home = (data.items as any[]).find(x => x.contentType === "home");
  return home ?? null;
}
