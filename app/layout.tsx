import type { Metadata, Viewport } from "next";
import ErrorBoundary from "./components/ErrorBoundary";
import KeyboardShortcutsProvider from "./components/accessibility/KeyboardShortcutsProvider";
import "./globals.css";
import "./styles/accessibility.css";

export const metadata: Metadata = {
  title: "OX Board Stem Studio",
  description:
    "AI-native stem player for uploading, generating, and mixing music in the browser.",
  keywords: ["ai music", "stem player", "audio mixing", "nextjs", "web audio"],
  authors: [{ name: "OX Board" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
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
