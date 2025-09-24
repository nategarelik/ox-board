import type { Metadata, Viewport } from "next";
import ErrorBoundary from "./components/ErrorBoundary";
import KeyboardShortcutsProvider from "./components/accessibility/KeyboardShortcutsProvider";
import "./globals.css";
import "./styles/accessibility.css";

export const metadata: Metadata = {
  title: "OX Board - Gesture-Controlled DJ Platform",
  description:
    "Throw Your Hands Up - Professional DJ mixing with hand gestures",
  keywords: "DJ, gesture control, music mixing, Theta Chi, UW Madison",
  authors: [{ name: "Theta Chi - UW Madison" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FF0000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-black text-white min-h-screen">
        <ErrorBoundary level="page">
          <KeyboardShortcutsProvider>{children}</KeyboardShortcutsProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
