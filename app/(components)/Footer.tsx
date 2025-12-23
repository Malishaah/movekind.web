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
  // allow http(s), mailto, tel, and relative routes
  const u = url.trim();
  if (u.startsWith("/")) return absoluteMedia(u);
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("mailto:") || u.startsWith("tel:")) return u;
  // fallback: treat as relative
  return u;
}

function relForTarget(target?: string | null) {
  return target === "_blank" ? "noopener noreferrer" : undefined;
}

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
    <footer className="border-t border-black/10 bg-[#fbf7f2] text-[#1f1b16]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Top grid */}
        <div className="grid gap-10 md:grid-cols-12">
          {/* About */}
          <div className="md:col-span-5">
            <h3 className="font-serif text-2xl">
              {aboutHeading ?? "About"}
            </h3>
            <div className="mt-4 text-lg leading-relaxed text-[#6e655c]">
              {renderRichText(aboutText)}
            </div>
          </div>

          {/* Contact */}
          <div className="md:col-span-4">
            <h3 className="font-serif text-2xl">
              {contactHeading ?? "Contact"}
            </h3>
            <div className="mt-4 text-lg leading-relaxed text-[#6e655c]">
              {renderRichText(contactText)}
            </div>
          </div>

          {/* Links + Social */}
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
                      className="group inline-flex items-center gap-2 rounded-lg px-2 py-1 text-lg text-[#1f1b16] hover:bg-black/5"
                    >
                      <span className="underline-offset-4 group-hover:underline">
                        {l?.title ?? l!.url}
                      </span>
                      {l?.target === "_blank" && (
                        <span className="text-sm text-[#6e655c]">(new)</span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 text-lg text-[#6e655c]">—</div>
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
                      className="rounded-full border border-black/20 bg-white/40 px-4 py-2 font-serif text-lg hover:bg-black/5"
                    >
                      {l?.title ?? l!.url}
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-black/10 pt-6 md:flex-row">
          <div className="font-serif text-lg text-[#6e655c]">
            {`© ${new Date().getFullYear()} MoveKind`}
          </div>


        </div>
      </div>
    </footer>
  );
}
