"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  FileAudio,
  CheckCircle,
  AlertCircle,
  Loader2,
  Music,
  Mic,
  Play,
  Pause,
  Download,
  Cloud,
  HardDrive,
  Zap,
} from "lucide-react";

interface UploadProgress {
  file: File;
  progress: number;
  status: "uploading" | "processing" | "completed" | "error";
  error?: string;
  stemCount?: number;
  duration?: number;
}

interface AudioUploadInterfaceProps {
  isProcessing?: boolean;
  uploadProgress?: number | null;
  onUploadStart?: (progress: number) => void;
  onUploadProgress?: (progress: number | null) => void;
  onUploadComplete?: (track: any) => void;
  onUploadError?: (error: string) => void;
  onClose?: () => void;
  className?: string;
}

const SUPPORTED_FORMATS = [
  "audio/mpeg", // .mp3
  "audio/wav", // .wav
  "audio/flac", // .flac
  "audio/aac", // .aac
  "audio/ogg", // .ogg
  "audio/m4a", // .m4a
  "audio/mp4", // .mp4
  "audio/webm", // .webm
];

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export default function AudioUploadInterface({
  isProcessing = false,
  uploadProgress,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  onClose,
  className = "",
}: AudioUploadInterfaceProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [showDemoTracks, setShowDemoTracks] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Demo tracks for quick testing
  const demoTracks = [
    {
      name: "Demo Track 1 - Electronic",
      duration: "3:24",
      size: "8.2 MB",
      url: "/demo/electronic.mp3",
    },
    {
      name: "Demo Track 2 - Rock",
      duration: "4:12",
      size: "10.1 MB",
      url: "/demo/rock.mp3",
    },
    {
      name: "Demo Track 3 - Jazz",
      duration: "5:33",
      size: "12.8 MB",
      url: "/demo/jazz.mp3",
    },
    {
      name: "Demo Track 4 - Classical",
      duration: "6:45",
      size: "15.2 MB",
      url: "/demo/classical.mp3",
    },
  ];

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return `Unsupported file format. Supported formats: ${SUPPORTED_FORMATS.map(
        (format) => format.split("/")[1].toUpperCase(),
      ).join(", ")}`;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }

    // Check file name
    if (file.name.length > 100) {
      return "File name too long. Maximum 100 characters.";
    }

    return null;
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        onUploadError?.(validationError);
        return;
      }

      const upload: UploadProgress = {
        file,
        progress: 0,
        status: "uploading",
      };

      setUploads((prev) => [...prev, upload]);
      onUploadStart?.(0);

      try {
        // Simulate upload progress
        const uploadInterval = setInterval(() => {
          setUploads((prev) =>
            prev.map((u) => {
              if (u.file === file && u.progress < 90) {
                const newProgress = u.progress + Math.random() * 15;
                onUploadProgress?.(Math.min(newProgress, 90));
                return { ...u, progress: Math.min(newProgress, 90) };
              }
              return u;
            }),
          );
        }, 200);

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        clearInterval(uploadInterval);

        // Move to processing stage
        setUploads((prev) =>
          prev.map((u) =>
            u.file === file ? { ...u, status: "processing", progress: 90 } : u,
          ),
        );

        // Simulate stem separation
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Generate mock track data
        const mockTrack = {
          id: `track_${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, ""),
          artist: "Unknown Artist",
          duration: Math.floor(Math.random() * 300) + 120, // 2-7 minutes
          stems: [
            {
              id: "vocals",
              name: "Vocals",
              type: "vocals" as const,
              volume: 0.8,
              muted: false,
              solo: false,
              pan: 0,
              eq: { low: 0, mid: 0, high: 0 },
              effects: { reverb: 0.3, delay: 0.1, distortion: 0 },
              color: "from-pink-500 to-rose-500",
            },
            {
              id: "drums",
              name: "Drums",
              type: "drums" as const,
              volume: 0.9,
              muted: false,
              solo: false,
              pan: 0,
              eq: { low: 0.2, mid: -0.1, high: 0.1 },
              effects: { reverb: 0.2, delay: 0, distortion: 0 },
              color: "from-orange-500 to-red-500",
            },
            {
              id: "bass",
              name: "Bass",
              type: "bass" as const,
              volume: 0.7,
              muted: false,
              solo: false,
              pan: 0,
              eq: { low: 0.3, mid: 0, high: -0.2 },
              effects: { reverb: 0.1, delay: 0, distortion: 0 },
              color: "from-purple-500 to-indigo-500",
            },
            {
              id: "melody",
              name: "Melody",
              type: "melody" as const,
              volume: 0.85,
              muted: false,
              solo: false,
              pan: 0,
              eq: { low: -0.1, mid: 0.2, high: 0.1 },
              effects: { reverb: 0.4, delay: 0.2, distortion: 0 },
              color: "from-cyan-500 to-blue-500",
            },
          ],
        };

        // Complete the upload
        setUploads((prev) =>
          prev.map((u) =>
            u.file === file
              ? {
                  ...u,
                  status: "completed",
                  progress: 100,
                  stemCount: 4,
                  duration: mockTrack.duration,
                }
              : u,
          ),
        );

        onUploadProgress?.(100);
        onUploadComplete?.(mockTrack);
      } catch (error) {
        setUploads((prev) =>
          prev.map((u) =>
            u.file === file
              ? {
                  ...u,
                  status: "error",
                  error:
                    error instanceof Error ? error.message : "Upload failed",
                }
              : u,
          ),
        );
        onUploadError?.(
          error instanceof Error ? error.message : "Upload failed",
        );
      }
    },
    [
      validateFile,
      onUploadStart,
      onUploadProgress,
      onUploadComplete,
      onUploadError,
    ],
  );

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      Array.from(files).forEach(processFile);
    },
    [processFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Only set drag over to false if we're leaving the drop zone entirely
    if (
      dropZoneRef.current &&
      !dropZoneRef.current.contains(e.relatedTarget as Node)
    ) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files);
      }
    },
    [handleFileSelect],
  );

  const removeUpload = (file: File) => {
    setUploads((prev) => prev.filter((u) => u.file !== file));
  };

  const loadDemoTrack = async (track: (typeof demoTracks)[0]) => {
    // Simulate loading demo track
    const mockFile = new File([], track.name, { type: "audio/mpeg" });
    await processFile(mockFile);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm ${className}`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-xl p-8 w-full max-w-2xl mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Upload className="w-6 h-6 mr-3 text-cyan-400" />
              Upload Audio
            </h2>
            <p className="text-white/60 text-sm mt-1">
              Upload multitrack audio or select a demo to get started
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Upload Area */}
        <div
          ref={dropZoneRef}
          className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            isDragOver
              ? "border-cyan-400 bg-cyan-500/10"
              : "border-white/20 hover:border-white/30 hover:bg-white/5"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={SUPPORTED_FORMATS.join(",")}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />

          <AnimatePresence mode="wait">
            {uploads.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileAudio className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Drop your audio files here
                </h3>
                <p className="text-white/60 mb-6">
                  Support for MP3, WAV, FLAC, AAC, and more • Max 500MB
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all"
                >
                  Choose Files
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {uploads.map((upload, index) => (
                  <div key={index} className="bg-black/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                          {upload.status === "uploading" && (
                            <Upload className="w-5 h-5 text-blue-400" />
                          )}
                          {upload.status === "processing" && (
                            <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                          )}
                          {upload.status === "completed" && (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          )}
                          {upload.status === "error" && (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {upload.file.name}
                          </p>
                          <p className="text-white/60 text-sm">
                            {(upload.file.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => removeUpload(upload.file)}
                        className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${upload.progress}%` }}
                        transition={{ duration: 0.3 }}
                        className={`h-full rounded-full ${
                          upload.status === "completed"
                            ? "bg-green-400"
                            : upload.status === "error"
                              ? "bg-red-400"
                              : upload.status === "processing"
                                ? "bg-yellow-400"
                                : "bg-blue-400"
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70">
                        {upload.status === "uploading" && "Uploading..."}
                        {upload.status === "processing" &&
                          "Separating stems..."}
                        {upload.status === "completed" &&
                          `✓ ${upload.stemCount} stems detected`}
                        {upload.status === "error" && `✗ ${upload.error}`}
                      </span>
                      <span className="text-white/60">
                        {Math.round(upload.progress)}%
                      </span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Demo Tracks Section */}
        <div className="mt-6">
          <button
            onClick={() => setShowDemoTracks(!showDemoTracks)}
            className="w-full p-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all flex items-center justify-center space-x-2"
          >
            <Music className="w-4 h-4" />
            <span>{showDemoTracks ? "Hide" : "Show"} Demo Tracks</span>
          </button>

          <AnimatePresence>
            {showDemoTracks && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-2"
              >
                {demoTracks.map((track, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Music className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">
                          {track.name}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-white/60">
                          <span>{track.duration}</span>
                          <span>{track.size}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => loadDemoTrack(track)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 disabled:opacity-50 transition-all text-sm"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Upload Guidelines */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h4 className="text-sm font-medium text-blue-400 mb-2">
            Upload Guidelines
          </h4>
          <ul className="text-xs text-white/70 space-y-1">
            <li>
              • For best results, use high-quality audio files (WAV, FLAC)
            </li>
            <li>
              • Multitrack files will be automatically separated into stems
            </li>
            <li>• Processing time depends on file size and complexity</li>
            <li>• All processing happens locally in your browser</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
