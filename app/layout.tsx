import type { Metadata, Viewport } from "next";
import ErrorBoundary from "./components/ErrorBoundary";
import KeyboardShortcutsProvider from "./components/accessibility/KeyboardShortcutsProvider";
import "./globals.css";
import "./styles/accessibility.css";

export const metadata: Metadata = {
  title: "OX Gesture Stem Player",
  description: "Professional gesture-controlled stem player",
  keywords: [
    "ai music",
    "stem player",
    "audio mixing",
    "gesture control",
    "nextjs",
    "web audio",
    "dj",
    "mixing",
  ],
  authors: [{ name: "OX Board" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OX Board",
    startupImage: [
      {
        url: "/icons/apple-splash-2048-2732.png",
        media:
          "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/icons/apple-splash-1668-2388.png",
        media:
          "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/icons/apple-splash-1536-2048.png",
        media:
          "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "OX Board",
    "application-name": "OX Board",
    "msapplication-TileColor": "#9333ea",
    "msapplication-TileImage": "/icons/icon-144x144.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#9333ea",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#9333ea" />
        <meta name="background-color" content="#0a0a0a" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/icons/icon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/icons/icon-16x16.png"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="OX Board" />
        <meta name="application-name" content="OX Board" />
        <meta name="msapplication-TileColor" content="#9333ea" />
        <meta
          name="msapplication-TileImage"
          content="/icons/icon-144x144.png"
        />
      </head>
      <body className="antialiased bg-black text-white min-h-screen">
        <ErrorBoundary level="page">
          <KeyboardShortcutsProvider>{children}</KeyboardShortcutsProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
