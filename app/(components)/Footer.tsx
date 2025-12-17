"use client";
import { renderRichText, absoluteMedia } from "@/app/lib/site";

export default function Footer({
  aboutHeading,
  aboutText,
  contactHeading,
  contactText,
  footerLinks,
  socialMediaTitle,
  footerSocialMedia,
  copyrightText,
}: {
  aboutHeading?: string | null;
  aboutText?: any;
  contactHeading?: string | null;
  contactText?: any;
  footerLinks?: { url: string | null; title?: string | null; target?: string | null }[] | null;
  socialMediaTitle?: string | null;
  footerSocialMedia?: { url: string | null; title?: string | null; target?: string | null }[] | null;
  copyrightText?: string | null;
}) {
  return (
    <footer className="w-full border-t bg-gray-50">
      <div className="mx-auto max-w-6xl grid md:grid-cols-3 gap-8 p-6">
        <div>
          <h3 className="font-semibold mb-2">{aboutHeading ?? "About"}</h3>
          <div className="prose text-sm text-gray-700">
            {renderRichText(aboutText)}
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">{contactHeading ?? "Contact"}</h3>
          <div className="prose text-sm text-gray-700">
            {renderRichText(contactText)}
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Links</h3>
          <ul className="space-y-1 text-sm">
            {(footerLinks ?? []).map((l, i) =>
              l?.url ? (
                <li key={i}>
                  <a href={l.url.startsWith("/") ? absoluteMedia(l.url) : l.url} target={l.target ?? "_self"} className="hover:underline">
                    {l.title ?? l.url}
                  </a>
                </li>
              ) : null
            )}
          </ul>

          {footerSocialMedia && footerSocialMedia.length > 0 && (
            <>
              <h3 className="font-semibold mt-4 mb-2">{socialMediaTitle ?? "Social"}</h3>
              <ul className="flex gap-3 text-sm">
                {footerSocialMedia.map((l, i) =>
                  l?.url ? (
                    <li key={i}>
                      <a href={l.url} target={l.target ?? "_blank"} className="hover:underline">
                        {l.title ?? l.url}
                      </a>
                    </li>
                  ) : null
                )}
              </ul>
            </>
          )}
        </div>
      </div>
      <div className="text-center text-xs text-gray-500 py-3 border-t">
        {copyrightText ?? "© MoveKind"}
      </div>
    </footer>
  );
}
