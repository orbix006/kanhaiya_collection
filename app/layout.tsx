import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://kanhaiyacollection.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Kanhaiya Collection | Sacred Devotion & Spiritual Living",
    template: "%s | Kanhaiya Collection",
  },
  description:
    "Curated Sanatana Dharma-inspired e-commerce for pure idols, authentic puja essentials, temple brassware, and handcrafted spiritual living.",
  keywords: [
    "puja essentials",
    "brass idols",
    "temple brassware",
    "akhand diya",
    "spiritual decor",
    "Kanhaiya Collection",
    "Indian handicrafts",
    "ethnic wear",
    "festive couture",
  ],
  authors: [{ name: "Kanhaiya Collection" }],
  creator: "Kanhaiya Collection",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Kanhaiya Collection",
    title: "Kanhaiya Collection | Sacred Devotion & Spiritual Living",
    description:
      "Curated Sanatana Dharma-inspired e-commerce for pure idols, authentic puja essentials, temple brassware, and handcrafted spiritual living.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground font-normal">
        {children}
      </body>
    </html>
  );
}
