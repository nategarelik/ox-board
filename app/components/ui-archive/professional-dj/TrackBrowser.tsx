"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  Music,
  Clock,
  Key,
  TrendingUp,
  Download,
  Play,
} from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  duration: number;
  energy?: number;
  url?: string;
}

interface TrackBrowserProps {
  onTrackSelect: (track: Track, deckId: number) => void;
  currentDeck1Track?: Track;
  currentDeck2Track?: Track;
}

export default function TrackBrowser({
  onTrackSelect,
  currentDeck1Track,
  currentDeck2Track,
}: TrackBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "bpm" | "key" | "energy"
  >("all");

  // Helper function to format duration from milliseconds to MM:SS
  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Mock track library with streaming URLs and local samples
  const mockTracks: Track[] = [
    {
      id: "1",
      title: "Test Beat Loop",
      artist: "OX Board Demo",
      bpm: 128,
      key: "9B",
      duration: 30000,
      energy: 8,
      url: "/samples/kicks/kick_01.wav",
    },
    {
      id: "2",
      title: "Night Drive",
      artist: "Synthwave",
      bpm: 120,
      key: "8A",
      duration: 225000,
      energy: 9,
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    },
    {
      id: "3",
      title: "Deep House Mix",
      artist: "DJ Sample",
      bpm: 124,
      key: "7B",
      duration: 242000,
      energy: 6,
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    },
    {
      id: "4",
      title: "Techno Loop",
      artist: "Electronic",
      bpm: 140,
      key: "10A",
      duration: 225000,
      energy: 10,
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    },
    {
      id: "5",
      title: "Ambient Space",
      artist: "Chillout",
      bpm: 90,
      key: "8B",
      duration: 355000,
      energy: 4,
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    },
  ];

  const filteredTracks = mockTracks.filter(
    (track) =>
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tracks..."
            className="w-full pl-10 pr-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:border-purple-500 outline-none"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-1">
          {(["all", "bpm", "key", "energy"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                selectedFilter === filter
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {filter.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-2">
          {filteredTracks.map((track) => (
            <div
              key={track.id}
              className="group flex items-center gap-3 p-3 bg-gray-900/50 hover:bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-purple-500/30 transition-all cursor-pointer"
            >
              {/* Track Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-300">
                    {track.title}
                  </span>
                  {currentDeck1Track?.id === track.id && (
                    <span className="px-1.5 py-0.5 bg-cyan-600/30 rounded text-xs text-cyan-400">
                      A
                    </span>
                  )}
                  {currentDeck2Track?.id === track.id && (
                    <span className="px-1.5 py-0.5 bg-magenta-600/30 rounded text-xs text-magenta-400">
                      B
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">{track.artist}</div>
              </div>

              {/* Track Metadata */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-600" />
                  <span className="text-gray-400">
                    {formatDuration(track.duration)}
                  </span>
                </div>
                <div className="px-2 py-0.5 bg-purple-600/20 rounded-full text-purple-400 font-mono">
                  {track.bpm} BPM
                </div>
                <div className="px-2 py-0.5 bg-pink-600/20 rounded-full text-pink-400 font-mono">
                  {track.key}
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-yellow-500" />
                  <div className="w-12 h-1 bg-gray-700 rounded-full">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                      style={{ width: `${(track.energy || 0) * 10}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="p-1.5 rounded hover:bg-white/10 transition-colors"
                  title="Preview"
                >
                  <Play className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => onTrackSelect(track, 0)}
                  className="p-1.5 rounded bg-cyan-600/20 hover:bg-cyan-600/30 transition-colors"
                  title="Load to Deck A"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                </button>
                <button
                  onClick={() => onTrackSelect(track, 1)}
                  className="p-1.5 rounded bg-magenta-600/20 hover:bg-magenta-600/30 transition-colors"
                  title="Load to Deck B"
                >
                  <Download className="w-4 h-4 text-magenta-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between items-center">
        <span className="text-xs text-gray-500">
          {filteredTracks.length} tracks found
        </span>
        <div className="flex items-center gap-2">
          <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
            Import Playlist
          </button>
          <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
            Analyze Library
          </button>
        </div>
      </div>
    </div>
  );
}
