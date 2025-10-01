"use client";

import React from "react";
import { Terminal, Activity, Music, Settings, Disc3 } from "lucide-react";

interface TerminalNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TerminalNavigation({
  activeTab,
  onTabChange,
}: TerminalNavigationProps) {
  const tabs = [
    { id: "dashboard", label: "DASHBOARD", icon: Activity },
    { id: "studio", label: "STUDIO", icon: Disc3 },
    { id: "music", label: "LIBRARY", icon: Music },
    { id: "settings", label: "SETTINGS", icon: Settings },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-sm border-b-2 border-green-500/50">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo / Brand */}
        <div className="flex items-center gap-3">
          <Terminal className="w-6 h-6 text-green-400" />
          <span className="text-xl font-bold text-green-400 tracking-wider font-mono">
            OX_BOARD v1.0.0
          </span>
          <div className="flex gap-1 ml-4">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 font-mono text-sm
                  transition-all duration-200 border-2
                  ${
                    isActive
                      ? "bg-green-500/20 text-green-400 border-green-500 shadow-lg shadow-green-500/50"
                      : "bg-black/40 text-green-600 border-green-900 hover:border-green-700 hover:text-green-400"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="tracking-wider">{tab.label}</span>
                {isActive && (
                  <span className="text-green-400 animate-pulse">▸</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-green-600">
            SYSTEM: <span className="text-green-400 font-bold">ONLINE</span>
          </span>
          <div className="w-px h-4 bg-green-500/30"></div>
          <span className="text-green-600">
            {new Date().toLocaleTimeString("en-US", { hour12: false })}
          </span>
        </div>
      </div>

      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-green-500/5 to-transparent animate-scanline"></div>
    </nav>
  );
}
