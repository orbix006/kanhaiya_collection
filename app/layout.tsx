import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://kanhaiyacollection.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Kanhaiya Collection | Royal Ethnic Couture & Festive Elegance",
    template: "%s | Kanhaiya Collection",
  },
  description:
    "Discover handcrafted Indian ethnic wear, royal wedding sherwanis, bespoke bridal lehengas, silk sarees, and festive couture at Kanhaiya Collection.",
  keywords: [
    "ethnic wear",
    "sherwani",
    "lehenga",
    "saree",
    "kurta",
    "Indian couture",
    "wedding attire",
    "Kanhaiya Collection",
  ],
  authors: [{ name: "Kanhaiya Collection" }],
  creator: "Kanhaiya Collection",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Kanhaiya Collection",
    title: "Kanhaiya Collection | Royal Ethnic Couture",
    description:
      "Handcrafted Indian bridal & groom couture, sherwanis, and festive wear.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
