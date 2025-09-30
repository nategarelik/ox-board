import { Metadata, Viewport } from "next";
import ClientApp from "./components/ClientApp";
import "./styles/theme.css";

export const metadata: Metadata = {
  title: "OX Board Stem Studio",
  description:
    "AI-powered web stem player for uploading, generating, and mixing music with real-time control.",
  keywords: ["stem player", "ai music", "nextjs", "audio mixing", "web audio"],
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  themeColor: "#0f172a",
};

export default function Home() {
  return <ClientApp />;
}
