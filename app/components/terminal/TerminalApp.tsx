"use client";

import React, { useState } from "react";
import { TerminalNavigation } from "./TerminalNavigation";
import { TerminalDashboard } from "./TerminalDashboard";
import { TerminalStudio } from "./TerminalStudio";
import { TerminalMusicLibrary } from "./TerminalMusicLibrary";
import { TerminalSettings } from "./TerminalSettings";

export function TerminalApp() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <TerminalDashboard />;
      case "studio":
        return <TerminalStudio />;
      case "music":
        return <TerminalMusicLibrary />;
      case "settings":
        return <TerminalSettings />;
      default:
        return <TerminalDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono overflow-hidden">
      {/* Corner Decorations */}
      <div className="fixed top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-white/60 z-50"></div>
      <div className="fixed top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-white/60 z-50"></div>
      <div className="fixed bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-white/60 z-50"></div>
      <div className="fixed bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-white/60 z-50"></div>

      {/* CRT Scanline Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-20"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0, 255, 0, 0.15), rgba(0, 255, 0, 0.15) 1px, transparent 1px, transparent 2px)",
        }}
      />

      {/* CRT Flicker Effect */}
      <div className="fixed inset-0 pointer-events-none z-50 bg-gradient-to-b from-transparent via-green-500/5 to-transparent animate-flicker" />

      {/* Navigation */}
      <TerminalNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <div className="pt-20 p-6 min-h-screen">
        <div className="animate-fade-in">{renderContent()}</div>
      </div>
    </div>
  );
}
