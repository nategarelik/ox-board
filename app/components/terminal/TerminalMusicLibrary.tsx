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
import { FileUploader } from "@/components/terminal/FileUploader";
import { useDeckManager } from "@/hooks/useDeckManager";
import { stemCache } from "@/lib/storage/stemCache";
import { stemifyClient } from "@/lib/api/stemifyClient";
import type { JobResult } from "@/types/api";

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
  const [showUploader, setShowUploader] = useState(false);
  const [loadedTracks, setLoadedTracks] = useState<Track[]>([]);
  const [enableBackendSeparation, setEnableBackendSeparation] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);

  // Get audio context from useDeckManager
  const { audioInit, loadTrack } = useDeckManager();

  // Test backend connection on mount
  React.useEffect(() => {
    stemifyClient.testConnection().then((connected) => {
      setBackendConnected(connected);
      if (connected) {
        console.log("✅ Backend stem separation service connected");
      } else {
        console.warn("⚠️ Backend stem separation service unavailable");
      }
    });
  }, []);

  // Mock data (will be replaced by user-loaded tracks)
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

  // Handle file loaded from FileUploader
  const handleFileLoaded = async (track: {
    id: string;
    url: string;
    title: string;
    artist: string;
    duration: number;
    bpm?: number;
    key?: string;
  }) => {
    console.log("✅ File loaded to library:", track.title);

    // Format duration for display
    const minutes = Math.floor(track.duration / 60);
    const seconds = Math.floor(track.duration % 60);
    const durationStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    // Add to loaded tracks list
    const newTrack: Track = {
      id: track.id,
      name: track.title,
      artist: track.artist,
      bpm: track.bpm || 120,
      key: track.key || "C",
      duration: durationStr,
      size: "LOCAL", // File size unknown from object URL
    };

    setLoadedTracks((prev) => [...prev, newTrack]);

    // Optionally auto-load into Deck A if no track loaded
    try {
      await loadTrack("A", track);
      console.log(`✅ Auto-loaded ${track.title} into Deck A`);
    } catch (error) {
      console.error("Failed to auto-load track into deck:", error);
    }
  };

  // Handle file upload errors
  const handleError = (fileName: string, error: string) => {
    console.error(`❌ Upload error for ${fileName}:`, error);
    // Could show toast notification here
  };

  // Handle backend stem separation completion
  const handleStemSeparationComplete = async (result: JobResult) => {
    console.log("🎉 Stem separation complete:", result);

    try {
      // Download stems from backend URLs
      const [drumsBlob, bassBlob, vocalsBlob, otherBlob] = await Promise.all([
        fetch(result.stems.drums).then((r) => r.blob()),
        fetch(result.stems.bass).then((r) => r.blob()),
        fetch(result.stems.vocals).then((r) => r.blob()),
        fetch(result.stems.other).then((r) => r.blob()),
      ]);

      // Convert blobs to audio buffers
      const audioContext = new AudioContext();
      const [drumsBuffer, bassBuffer, vocalsBuffer, otherBuffer] =
        await Promise.all([
          drumsBlob
            .arrayBuffer()
            .then((ab) => audioContext.decodeAudioData(ab)),
          bassBlob.arrayBuffer().then((ab) => audioContext.decodeAudioData(ab)),
          vocalsBlob
            .arrayBuffer()
            .then((ab) => audioContext.decodeAudioData(ab)),
          otherBlob
            .arrayBuffer()
            .then((ab) => audioContext.decodeAudioData(ab)),
        ]);

      // Cache stems in IndexedDB
      await stemCache.init();
      const trackUrl = URL.createObjectURL(drumsBlob); // Placeholder URL
      const stemId = await stemCache.saveStem(
        trackUrl,
        result.metadata.original_filename,
        {
          drums: { audioBuffer: drumsBuffer },
          bass: { audioBuffer: bassBuffer },
          melody: { audioBuffer: otherBuffer },
          vocals: { audioBuffer: vocalsBuffer },
        },
        {
          bpm: 120, // TODO: Extract from analysis
          key: "C", // TODO: Extract from analysis
          duration: result.metadata.duration,
          processingDate: Date.now(),
          processingTime: 0,
          priority: "high",
          quality: "lossless",
        },
      );

      console.log(`✅ Cached stems with ID: ${stemId}`);

      // Add to loaded tracks
      const minutes = Math.floor(result.metadata.duration / 60);
      const seconds = Math.floor(result.metadata.duration % 60);
      const durationStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

      const newTrack: Track = {
        id: stemId,
        name: result.metadata.original_filename,
        artist: "Unknown",
        bpm: 120,
        key: "C",
        duration: durationStr,
        size: "CACHED",
      };

      setLoadedTracks((prev) => [...prev, newTrack]);

      console.log(
        `✅ Backend stem separation complete for: ${result.metadata.original_filename}`,
      );
    } catch (error) {
      console.error("❌ Failed to cache separated stems:", error);
    }
  };

  // Combine mock tracks with loaded tracks
  const allTracks = [...loadedTracks, ...tracks];

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
                onClick={() => setShowUploader(!showUploader)}
                className="border-2 border-green-500 bg-green-500/20 hover:bg-green-500/30
                               px-4 py-2 text-green-400 font-mono text-sm flex items-center gap-2
                               transition-all duration-200"
              >
                <Upload className="w-4 h-4" />
                {showUploader ? "HIDE_UPLOAD" : "UPLOAD"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Uploader (conditionally shown) */}
      {showUploader && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="w-4 h-4" />
              FILE_UPLOAD
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Backend separation toggle */}
            {backendConnected && (
              <div className="mb-4 p-3 border-2 border-green-600 bg-green-500/10 rounded">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableBackendSeparation}
                    onChange={(e) =>
                      setEnableBackendSeparation(e.target.checked)
                    }
                    className="w-4 h-4 accent-green-500"
                  />
                  <span className="text-green-400 font-mono text-sm font-bold">
                    ENABLE_BACKEND_STEM_SEPARATION
                  </span>
                </label>
                <p className="text-green-600 text-xs mt-1 ml-6 font-mono">
                  Uses AI-powered Demucs model to separate drums, bass, vocals,
                  and other stems
                </p>
              </div>
            )}
            <FileUploader
              onFileLoaded={handleFileLoaded}
              onError={handleError}
              audioContext={
                audioInit.isReady
                  ? (typeof window !== "undefined" &&
                      window.AudioContext &&
                      new AudioContext()) ||
                    null
                  : null
              }
              multiple={true}
              enableBackendSeparation={enableBackendSeparation}
              onStemSeparationComplete={handleStemSeparationComplete}
            />
            {!audioInit.isReady && (
              <div className="mt-4 p-3 border border-yellow-600 bg-yellow-500/10 text-yellow-400 font-mono text-xs">
                ⚠️ Audio system not initialized. Initialize audio in Studio tab
                first.
              </div>
            )}
            {!backendConnected && (
              <div className="mt-4 p-3 border border-orange-600 bg-orange-500/10 text-orange-400 font-mono text-xs">
                ⚠️ Backend stem separation service not available. Using local
                file loading only.
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
              TRACKS ({allTracks.length})
              {loadedTracks.length > 0 && (
                <span className="text-green-600 text-xs">
                  [{loadedTracks.length} LOCAL]
                </span>
              )}
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
              {allTracks.map((track) => (
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
              <span>
                {allTracks.length} TRACKS LOADED
                {loadedTracks.length > 0 &&
                  ` (${loadedTracks.length} LOCAL FILES)`}
              </span>
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
