import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Wegood4u Vendors",
    template: "%s — Wegood4u Vendors",
  },
  description:
    "Real-time partner analytics for Wegood4u F&B partners. Verified visits, customer demographics, peak hours, content performance.",
  manifest: "/manifest.json",
  applicationName: "Wegood4u Vendors",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Wegood4u Vendors",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#206E56",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
