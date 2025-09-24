import { Metadata, Viewport } from "next";
import ClientApp from "./components/ClientApp";
import "./styles/theme.css";

export const metadata: Metadata = {
  title: "OX Board - AI-Powered DJ Platform",
  description:
    "Professional DJ mixing platform with gesture control and AI assistance",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
};

export default function Home() {
  return <ClientApp />;
}
