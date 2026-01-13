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

export const metadata: Metadata = {
  title: "Celestia - Interactive Star Chart",
  description: "A realistic, real-time interactive star map showing stars, constellations, and planets as seen from your location on Earth.",
  keywords: ["star chart", "planetarium", "astronomy", "night sky", "stars", "constellations", "planets"],
  authors: [{ name: "Celestia" }],
  openGraph: {
    title: "Celestia - Interactive Star Chart",
    description: "Explore the night sky with an accurate, real-time star map",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black`}
      >
        {children}
      </body>
    </html>
  );
}
