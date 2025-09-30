"use client";

import { useState } from "react";
import WelcomeScreen from "./DJ/WelcomeScreen";
import SimpleStemPlayer from "./SimpleStemPlayer";
import StemPlayerDashboard from "./stem-player/StemPlayerDashboard";

export default function ClientApp() {
  const [showMainApp, setShowMainApp] = useState(false);

  if (!showMainApp) {
    return <WelcomeScreen onStart={() => setShowMainApp(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white">
      <main>
        <StemPlayerDashboard />
      </main>
    </div>
  );
}
