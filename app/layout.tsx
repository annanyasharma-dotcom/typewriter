import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

/* Self-hosted (SIL Open Font License) so builds never depend on the network. */
const typewriter = localFont({
  src: [
    { path: "./fonts/courier-prime-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/courier-prime-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--nf-type",
  display: "swap",
  preload: true,
});

const display = localFont({
  src: "./fonts/special-elite-latin-400-normal.woff2",
  weight: "400",
  variable: "--nf-display",
  display: "swap",
});

const sans = localFont({
  src: "./fonts/instrument-sans-latin-wght-normal.woff2",
  weight: "400 700",
  variable: "--nf-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Margin — a little space to think",
  description: "A vintage typewriter, on the web. Sit down, roll in a sheet, and write.",
  applicationName: "Margin",
  openGraph: {
    title: "Margin — a little space to think",
    description: "A vintage typewriter, on the web. Sit down, roll in a sheet, and write.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ebe5d8",
  interactiveWidget: "resizes-visual",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${typewriter.variable} ${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
