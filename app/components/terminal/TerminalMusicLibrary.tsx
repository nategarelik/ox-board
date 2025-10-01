"use client";

import React, { useState } from "react";
import {
  Folder,
  Music,
  Search,
  Upload,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/terminal/TerminalCard";

interface Track {
  id: string;
  name: string;
  artist: string;
  bpm: number;
  key: string;
  duration: string;
  size: string;
}

export function TerminalMusicLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "bpm" | "key">("name");

  // Mock data
  const tracks: Track[] = [
    {
      id: "1",
      name: "house_track_128.mp3",
      artist: "Unknown",
      bpm: 128,
      key: "8A",
      duration: "5:23",
      size: "8.2MB",
    },
    {
      id: "2",
      name: "techno_loop_130.mp3",
      artist: "Unknown",
      bpm: 130,
      key: "9A",
      duration: "4:45",
      size: "7.1MB",
    },
    {
      id: "3",
      name: "bass_heavy_mix.mp3",
      artist: "Unknown",
      bpm: 125,
      key: "7A",
      duration: "6:12",
      size: "9.4MB",
    },
    {
      id: "4",
      name: "vocal_house_128.mp3",
      artist: "Unknown",
      bpm: 128,
      key: "8A",
      duration: "5:55",
      size: "8.8MB",
    },
  ];

  const folders = [
    { name: "House", count: 24 },
    { name: "Techno", count: 18 },
    { name: "Bass", count: 12 },
    { name: "Samples", count: 45 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-2 border-green-500/50 bg-black/60 p-4">
        <h1 className="text-2xl font-bold text-green-400 tracking-wider font-mono">
          MUSIC_LIBRARY
        </h1>
        <p className="text-green-600 text-sm mt-1 font-mono">
          FILE BROWSER // TRACK MANAGEMENT SYSTEM
        </p>
      </div>

      {/* Search and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 flex items-center gap-2 border-2 border-green-700 bg-black/60 px-3 py-2">
              <Search className="w-4 h-4 text-green-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH TRACKS..."
                className="flex-1 bg-transparent text-green-400 font-mono text-sm
                         placeholder:text-green-800 outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                className="border-2 border-green-700 hover:border-green-500 bg-black/60
                               px-4 py-2 text-green-400 font-mono text-sm flex items-center gap-2
                               transition-all duration-200"
              >
                <Filter className="w-4 h-4" />
                FILTER
              </button>
              <button
                className="border-2 border-green-700 hover:border-green-500 bg-black/60
                               px-4 py-2 text-green-400 font-mono text-sm flex items-center gap-2
                               transition-all duration-200"
              >
                <ArrowUpDown className="w-4 h-4" />
                SORT
              </button>
              <button
                className="border-2 border-green-500 bg-green-500/20 hover:bg-green-500/30
                               px-4 py-2 text-green-400 font-mono text-sm flex items-center gap-2
                               transition-all duration-200"
              >
                <Upload className="w-4 h-4" />
                UPLOAD
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Folders Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Folder className="w-4 h-4" />
              FOLDERS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {folders.map((folder) => (
              <button
                key={folder.name}
                className="w-full flex items-center justify-between px-3 py-2
                         border border-green-700 hover:border-green-500 hover:bg-green-500/10
                         bg-black/40 text-green-600 hover:text-green-400
                         font-mono text-sm transition-all duration-200"
              >
                <span className="flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  {folder.name}
                </span>
                <span className="text-xs">[{folder.count}]</span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Track List */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Music className="w-4 h-4" />
              TRACKS ({tracks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Table Header */}
            <div
              className="grid grid-cols-12 gap-4 pb-2 border-b-2 border-green-700/50
                          text-green-600 font-mono text-xs font-bold"
            >
              <div className="col-span-4">FILENAME</div>
              <div className="col-span-2">ARTIST</div>
              <div className="col-span-1">BPM</div>
              <div className="col-span-1">KEY</div>
              <div className="col-span-2">DURATION</div>
              <div className="col-span-2">SIZE</div>
            </div>

            {/* Track Rows */}
            <div className="space-y-1 mt-2">
              {tracks.map((track) => (
                <button
                  key={track.id}
                  className="w-full grid grid-cols-12 gap-4 px-2 py-3
                           border border-green-900 hover:border-green-500
                           bg-black/40 hover:bg-green-500/10
                           text-green-600 hover:text-green-400
                           font-mono text-xs transition-all duration-200"
                >
                  <div className="col-span-4 text-left flex items-center gap-2">
                    <Music className="w-3 h-3" />
                    {track.name}
                  </div>
                  <div className="col-span-2 text-left">{track.artist}</div>
                  <div className="col-span-1">{track.bpm}</div>
                  <div className="col-span-1">{track.key}</div>
                  <div className="col-span-2">{track.duration}</div>
                  <div className="col-span-2 text-right">{track.size}</div>
                </button>
              ))}
            </div>

            {/* Status Bar */}
            <div
              className="mt-4 pt-4 border-t-2 border-green-700/50
                          flex items-center justify-between text-green-600 font-mono text-xs"
            >
              <span>{tracks.length} TRACKS LOADED</span>
              <span>TOTAL: 33.5MB</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">QUICK_ACTIONS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["ANALYZE_ALL", "EXPORT_STEMS", "CLEAR_CACHE", "REFRESH"].map(
              (action) => (
                <button
                  key={action}
                  className="border-2 border-green-700 bg-black/60 hover:bg-green-500/20 hover:border-green-500
                         text-green-600 hover:text-green-400 py-3 font-mono font-bold text-sm
                         transition-all duration-200"
                >
                  {action}
                </button>
              ),
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
