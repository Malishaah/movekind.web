import Header from "@/app/(components)/Header";
import Footer from "@/app/(components)/Footer";
import { getHome } from "@/app/lib/site";
import "./globals.css";


export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const home = await getHome();

  const logo = home?.properties?.logoUrl?.[0]?.url ?? null;

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Header logoUrl={logo ?? undefined} menu={home?.properties?.headerLinks} />
        <main className="flex-1">{children}</main>
        <Footer
          aboutHeading={home?.properties?.aboutHeading}
          aboutText={home?.properties?.aboutText}
          contactHeading={home?.properties?.contactHeading}
          contactText={home?.properties?.contactText}
          footerLinks={home?.properties?.footerLinks as any}
          socialMediaTitle={home?.properties?.socialMediaTitle}
          footerSocialMedia={home?.properties?.footerSocialMedia as any}
          copyrightText={home?.properties?.copyrightText}
        />
      </body>
    </html>
  );
}
