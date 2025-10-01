"use client";

import { useState } from "react";
import WelcomeScreen from "./DJ/WelcomeScreen";
// import SimpleStemPlayer from "./SimpleStemPlayer"; // Deleted in Phase 2 cleanup
import StemPlayerDashboard from "./stem-player/StemPlayerDashboard";
import { TerminalApp } from "./terminal";
import { TierSelector } from "./TierSelector";
import { useFeature } from "@/contexts/FeatureFlagContext";
import { Feature } from "@/lib/featureFlags";

export default function ClientApp() {
  const [showMainApp, setShowMainApp] = useState(false);
  const [useTerminalUI, setUseTerminalUI] = useState(false);
  const [showTierSelector, setShowTierSelector] = useState(false);

  const hasTerminalUI = useFeature(Feature.TERMINAL_UI);

  if (!showMainApp) {
    return <WelcomeScreen onStart={() => setShowMainApp(true)} />;
  }

  // Terminal UI Mode (if feature enabled)
  if (useTerminalUI && hasTerminalUI) {
    return (
      <>
        <TerminalApp />
        {/* Tier Selector */}
        {showTierSelector && <TierSelector />}
        {/* Tier Selector Toggle */}
        <button
          onClick={() => setShowTierSelector(!showTierSelector)}
          className="fixed top-4 right-4 z-[60] px-3 py-2 bg-purple-500/20 border-2 border-purple-500
                     text-purple-400 font-mono text-xs hover:bg-purple-500/30 transition-all"
          title="Toggle Tier Selector"
        >
          {showTierSelector ? "✕" : "⚙️"} TIER
        </button>
        {/* UI Toggle Button */}
        <button
          onClick={() => setUseTerminalUI(false)}
          className="fixed bottom-4 right-4 z-[60] px-4 py-2 bg-green-500/20 border-2 border-green-500
                     text-green-400 font-mono text-sm hover:bg-green-500/30 transition-all"
          title="Switch to Classic UI"
        >
          CLASSIC_MODE
        </button>
      </>
    );
  }

  // Classic UI Mode
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white">
      <main>
        <StemPlayerDashboard />
      </main>

      {/* Tier Selector */}
      {showTierSelector && <TierSelector />}

      {/* Tier Selector Toggle */}
      <button
        onClick={() => setShowTierSelector(!showTierSelector)}
        className="fixed top-4 right-4 z-50 px-3 py-2 bg-purple-500/20 border-2 border-purple-500
                   text-purple-400 font-mono text-xs hover:bg-purple-500/30 transition-all"
        title="Toggle Tier Selector"
      >
        {showTierSelector ? "✕" : "⚙️"} TIER
      </button>

      {/* UI Toggle Button - Only show if Terminal UI feature is enabled */}
      {hasTerminalUI && (
        <button
          onClick={() => setUseTerminalUI(true)}
          className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-green-500/20 border-2 border-green-500
                     text-green-400 font-mono text-sm hover:bg-green-500/30 transition-all"
          title="Switch to Terminal UI"
        >
          TERMINAL_MODE
        </button>
      )}

      {/* Upgrade Prompt if Terminal UI is locked */}
      {!hasTerminalUI && (
        <div className="fixed bottom-4 right-4 z-50 bg-yellow-500/10 border-2 border-yellow-500/50 p-3 font-mono max-w-xs">
          <div className="text-yellow-500 font-bold text-sm mb-1">
            🔒 TERMINAL UI LOCKED
          </div>
          <div className="text-yellow-600 text-xs mb-2">
            Upgrade to unlock Terminal UI mode
          </div>
          <button
            onClick={() => setShowTierSelector(true)}
            className="w-full border-2 border-yellow-500 bg-yellow-500/20 hover:bg-yellow-500/30 px-3 py-1 text-yellow-400 text-xs font-bold transition-all"
          >
            VIEW TIERS
          </button>
        </div>
      )}
    </div>
  );
}
