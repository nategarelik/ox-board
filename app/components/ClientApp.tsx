"use client";

import AppHeader from "./stem-player/AppHeader";
import StemPlayerDashboard from "./stem-player/StemPlayerDashboard";

export default function ClientApp() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white">
      <AppHeader />
      <main>
        <StemPlayerDashboard />
      </main>
      <footer className="border-t border-white/10 bg-black/80 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} OX Board Stem Studio. All rights
            reserved.
          </p>
          <div className="flex gap-4">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
