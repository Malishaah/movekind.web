import Header from "@/app/(components)/Header";
import Footer from "@/app/(components)/Footer";
import { getHome } from "@/app/lib/site";
import "./globals.css";
import { ThemeProvider } from "./theme-provider";
import type { Metadata } from "next";


import { Inria_Serif } from "next/font/google";

const inriaSerif = Inria_Serif({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
export const metadata: Metadata = {
  title: {
    default: "MoveKind",
    template: "%s – MoveKind",
  },
  description: "MoveKind helps you find gentle sessions that fit your body and space.",
};
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const home = await getHome();
  const logo = home?.properties?.logoUrl?.[0]?.url ?? null;

  return (
<html lang="en" className={inriaSerif.variable} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <ThemeProvider initialLightMode={true}>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
