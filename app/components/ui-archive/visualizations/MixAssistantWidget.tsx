"use client";

import { useState } from "react";
import { MessageCircle, TrendingUp, Music, Zap, Send } from "lucide-react";
import dynamic from "next/dynamic";

const CamelotWheel = dynamic(() => import("./CamelotWheelVisualizer"), {
  ssr: false,
});

export default function MixAssistantWidget() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [activeTab, setActiveTab] = useState<
    "chat" | "suggestions" | "camelot"
  >("suggestions");

  const suggestions = [
    {
      icon: TrendingUp,
      text: "BPM matches within 5%",
      color: "text-green-400",
    },
    { icon: Music, text: "Key: 8B → 9B, 7B, 8A", color: "text-purple-400" },
    {
      icon: Zap,
      text: "Energy level: High → Medium",
      color: "text-yellow-400",
    },
  ];

  const handleSendMessage = () => {
    if (!message.trim()) return;

    setMessages([...messages, { role: "user", content: message }]);
    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I suggest transitioning to a track in 9B for harmonic mixing. The energy levels match well.",
        },
      ]);
    }, 1000);
    setMessage("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-black/40 rounded-lg mb-3">
        {(["suggestions", "chat", "camelot"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-all ${
              activeTab === tab
                ? "bg-purple-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "suggestions" && (
          <div className="space-y-2">
            <div className="text-xs text-gray-500 mb-2">AI Mix Suggestions</div>
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 bg-black/40 rounded-lg border border-gray-700/50 hover:border-purple-500/30 transition-colors"
              >
                <suggestion.icon
                  className={`w-4 h-4 ${suggestion.color} flex-shrink-0 mt-0.5`}
                />
                <span className="text-xs text-gray-300">{suggestion.text}</span>
              </div>
            ))}

            <div className="mt-4 p-3 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-500/30">
              <div className="text-xs font-medium text-purple-400 mb-2">
                Next Track Recommendation
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-300">
                  Track: &quot;Midnight Dreams&quot;
                </div>
                <div className="text-xs text-gray-500">Artist: DJ Nova</div>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-purple-600/30 rounded-full text-xs text-purple-400">
                    128 BPM
                  </span>
                  <span className="px-2 py-0.5 bg-pink-600/30 rounded-full text-xs text-pink-400">
                    9B
                  </span>
                  <span className="px-2 py-0.5 bg-green-600/30 rounded-full text-xs text-green-400">
                    95% Match
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-2 mb-2">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 text-xs py-8">
                  Ask me anything about mixing, track selection, or DJ
                  techniques!
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-lg text-xs ${
                      msg.role === "user"
                        ? "bg-purple-600/20 text-purple-300 ml-8"
                        : "bg-gray-800/50 text-gray-300 mr-8"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask about mixing..."
                className="flex-1 bg-black/50 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 placeholder-gray-600 focus:border-purple-500 outline-none"
              />
              <button
                onClick={handleSendMessage}
                className="p-1.5 bg-purple-600 hover:bg-purple-700 rounded transition-colors"
              >
                <Send className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        )}

        {activeTab === "camelot" && (
          <div className="flex flex-col items-center">
            <div className="text-xs text-gray-500 mb-3">
              Harmonic Mixing Guide
            </div>
            <div className="w-full max-w-[240px] h-[240px]">
              <CamelotWheel
                currentKey={{ key: "8B", scale: "minor" }}
                compatibleKeys={["9B", "7B", "8A"]}
              />
            </div>
            <div className="mt-3 text-center">
              <div className="text-xs text-gray-400 mb-1">
                Current: 8B (C# Minor)
              </div>
              <div className="text-xs text-green-400">
                Compatible: 9B, 7B, 8A
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
