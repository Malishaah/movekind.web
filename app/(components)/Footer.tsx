"use client";

import { renderRichText, absoluteMedia } from "@/app/lib/site";

type LinkItem = {
  url: string | null;
  title?: string | null;
  target?: string | null;
};

type Props = {
  aboutHeading?: string | null;
  aboutText?: any;
  contactHeading?: string | null;
  contactText?: any;
  footerLinks?: LinkItem[] | null;
  socialMediaTitle?: string | null;
  footerSocialMedia?: LinkItem[] | null;
  copyrightText?: string | null;
};

function safeHref(url: string) {
  const u = url.trim();
  if (u.startsWith("/")) return absoluteMedia(u);
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("mailto:") || u.startsWith("tel:")) return u;
  return u;
}

function relForTarget(target?: string | null) {
  return target === "_blank" ? "noopener noreferrer" : undefined;
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]";

export default function Footer({
  aboutHeading,
  aboutText,
  contactHeading,
  contactText,
  footerLinks,
  socialMediaTitle,
  footerSocialMedia,
  copyrightText,
}: Props) {
  const links = (footerLinks ?? []).filter((l) => l?.url);
  const socials = (footerSocialMedia ?? []).filter((l) => l?.url);

  return (
    <footer className="border-t border-[var(--line)] bg-[var(--bg)] text-[var(--ink)]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <h3 className="font-serif text-2xl">{aboutHeading ?? "About"}</h3>
            <div className="mt-4 text-lg leading-relaxed text-[var(--muted)]">
              {renderRichText(aboutText)}
            </div>
          </div>

          <div className="md:col-span-4">
            <h3 className="font-serif text-2xl">{contactHeading ?? "Contact"}</h3>
            <div className="mt-4 text-lg leading-relaxed text-[var(--muted)]">
              {renderRichText(contactText)}
            </div>
          </div>

          <div className="md:col-span-3">
            <h3 className="font-serif text-2xl">Links</h3>

            {links.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {links.map((l, i) => (
                  <li key={i}>
                    <a
                      href={safeHref(l!.url!)}
                      target={l?.target ?? "_self"}
                      rel={relForTarget(l?.target)}
                      className={[
                        "group inline-flex items-center gap-2 rounded-lg px-2 py-1 text-lg",
                        "text-[var(--ink)]",
                        "hover:bg-black/5 dark:hover:bg-white/10",
                        focusRing,
                      ].join(" ")}
                    >
                      <span className="underline-offset-4 group-hover:underline">
                        {l?.title ?? l!.url}
                      </span>

                      {l?.target === "_blank" && (
                        <span className="text-sm text-[var(--muted)]">(opens in a new tab)</span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 text-lg text-[var(--muted)]">—</div>
            )}

            {socials.length > 0 && (
              <>
                <h3 className="mt-8 font-serif text-2xl">
                  {socialMediaTitle ?? "Social"}
                </h3>

                <div className="mt-4 flex flex-wrap gap-3">
                  {socials.map((l, i) => (
                    <a
                      key={i}
                      href={safeHref(l!.url!)}
                      target={l?.target ?? "_blank"}
                      rel="noopener noreferrer"
                      className={[
                        "rounded-full border px-4 py-2 font-serif text-lg transition",
                        "border-[var(--line)]",
                        "bg-white/40 dark:bg-white/5",
                        "text-[var(--ink)]",
                        "hover:bg-black/5 dark:hover:bg-white/10",
                        focusRing,
                      ].join(" ")}
                    >
                      {l?.title ?? l!.url}
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--line)] pt-6 md:flex-row">
          <div className="font-serif text-lg text-[var(--muted)]">
            {copyrightText?.trim()
              ? copyrightText
              : `© ${new Date().getFullYear()} MoveKind`}
          </div>
        </div>
      </div>
    </footer>
  );
}
