import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://visitgarut.com"),
  title: {
    default: "VisitGarut — Discover Garut Like a Local",
    template: "%s | VisitGarut",
  },
  description:
    "Temukan wisata, kuliner, penginapan, transportasi, event, dan bisnis lokal terbaik di Garut dalam satu platform.",
  keywords: [
    "Garut",
    "wisata Garut",
    "kuliner Garut",
    "hotel Garut",
    "rental motor Garut",
    "rental mobil Garut",
    "VisitGarut",
  ],
  openGraph: {
    title: "VisitGarut — Discover Garut Like a Local",
    description:
      "Jelajahi destinasi, kuliner, penginapan, transportasi, dan bisnis lokal Garut.",
    url: "https://visitgarut.com",
    siteName: "VisitGarut",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VisitGarut — Discover Garut Like a Local",
    description:
      "Jelajahi destinasi, kuliner, penginapan, transportasi, dan bisnis lokal Garut.",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
