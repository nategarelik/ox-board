/**
 * @fileoverview Audio File Loading Utilities
 * @description Web Audio API-based audio file parsing, metadata extraction, and BPM detection
 * Supports drag-and-drop file uploads for local audio playback
 */

import { parseBlob } from "music-metadata";
import * as BeatDetector from "web-audio-beat-detector";

/**
 * Complete audio file metadata
 */
export interface AudioFileMetadata {
  // Basic metadata (always available)
  fileName: string;
  fileSize: number;
  mimeType: string;
  duration: number;
  sampleRate: number;
  channels: number;

  // Enhanced metadata (ID3 tags, may be missing)
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
  genre?: string[];
  bpm?: number; // From ID3 or analysis
  key?: string;

  // Technical metadata
  bitrate?: number;
  codec?: string;
}

/**
 * Audio file loading result
 */
export interface LoadedAudioFile {
  audioBuffer: AudioBuffer;
  metadata: AudioFileMetadata;
  objectUrl: string; // For Tone.js Player
}

/**
 * File upload progress stages
 */
export type UploadStage =
  | "reading"
  | "decoding"
  | "metadata"
  | "bpm"
  | "complete"
  | "error";

export interface UploadProgress {
  stage: UploadStage;
  progress: number; // 0-100
  message: string;
}

/**
 * Validate audio file before processing
 */
export function validateAudioFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Size check (100MB limit)
  const MAX_SIZE = 100 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 100MB)`,
    };
  }

  // Type check
  const validTypes = [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/wave",
    "audio/webm",
    "audio/flac",
    "audio/x-m4a",
    "audio/aac",
    "audio/ogg",
  ];

  if (!file.type || !validTypes.some((type) => file.type.includes(type))) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type || "unknown"}`,
    };
  }

  return { valid: true };
}

/**
 * Extract metadata from audio file using music-metadata library
 */
async function extractEnhancedMetadata(
  file: File,
): Promise<Partial<AudioFileMetadata>> {
  try {
    const metadata = await parseBlob(file);

    return {
      title: metadata.common.title,
      artist: metadata.common.artist,
      album: metadata.common.album,
      year: metadata.common.year,
      genre: metadata.common.genre,
      bpm: metadata.common.bpm, // ID3 tag BPM (often missing or inaccurate)
      key: metadata.common.key,
      bitrate: metadata.format.bitrate,
      codec: metadata.format.codec,
    };
  } catch (error) {
    console.warn("Enhanced metadata extraction failed:", error);
    return {};
  }
}

/**
 * Detect BPM using web-audio-beat-detector
 * Analyzes first 30 seconds after 1-second intro skip
 */
async function detectBPM(audioBuffer: AudioBuffer): Promise<number> {
  try {
    // Analyze 1-30 seconds (skip intro, analyze main section)
    const tempo = await BeatDetector.analyze(audioBuffer, 1, 30, {
      minTempo: 60,
      maxTempo: 180,
    });

    console.log(`✅ Detected BPM: ${tempo}`);
    return Math.round(tempo);
  } catch (error) {
    console.warn("BPM detection failed, using default:", error);
    return 120; // Default fallback
  }
}

/**
 * Load audio file with progress tracking
 * Decodes audio, extracts metadata, and detects BPM
 */
export async function loadAudioFile(
  file: File,
  audioContext: AudioContext,
  onProgress?: (progress: UploadProgress) => void,
): Promise<LoadedAudioFile> {
  try {
    // Validate file
    const validation = validateAudioFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Stage 1: Read file
    onProgress?.({
      stage: "reading",
      progress: 0,
      message: `Reading ${file.name}...`,
    });

    const arrayBuffer = await file.arrayBuffer();

    // Stage 2: Decode audio
    onProgress?.({
      stage: "decoding",
      progress: 25,
      message: "Decoding audio...",
    });

    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    console.log(
      `✅ Decoded: ${audioBuffer.duration.toFixed(1)}s, ${audioBuffer.numberOfChannels} channels`,
    );

    // Stage 3: Extract metadata (parallel)
    onProgress?.({
      stage: "metadata",
      progress: 50,
      message: "Extracting metadata...",
    });

    const enhancedMeta = await extractEnhancedMetadata(file);

    // Stage 4: Detect BPM (async, can take 1-2 seconds)
    onProgress?.({
      stage: "bpm",
      progress: 75,
      message: "Analyzing BPM...",
    });

    const detectedBPM = await detectBPM(audioBuffer);

    // Stage 5: Complete
    onProgress?.({
      stage: "complete",
      progress: 100,
      message: "Ready!",
    });

    // Create object URL for Tone.js Player
    const objectUrl = URL.createObjectURL(file);

    // Combine all metadata
    const metadata: AudioFileMetadata = {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels,
      title: enhancedMeta.title,
      artist: enhancedMeta.artist,
      album: enhancedMeta.album,
      year: enhancedMeta.year,
      genre: enhancedMeta.genre,
      bpm: detectedBPM, // Use detected BPM, not ID3
      key: enhancedMeta.key,
      bitrate: enhancedMeta.bitrate,
      codec: enhancedMeta.codec,
    };

    return { audioBuffer, metadata, objectUrl };
  } catch (error: any) {
    const errorMessage = error.message || "Unknown error";

    onProgress?.({
      stage: "error",
      progress: 0,
      message: `Error: ${errorMessage}`,
    });

    console.error("Audio file loading failed:", error);
    throw new Error(`Failed to load audio file: ${errorMessage}`);
  }
}

/**
 * Quick load without BPM detection (faster for previews)
 */
export async function loadAudioFileQuick(
  file: File,
  audioContext: AudioContext,
): Promise<LoadedAudioFile> {
  const validation = validateAudioFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const objectUrl = URL.createObjectURL(file);

  const metadata: AudioFileMetadata = {
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels,
    bpm: 120, // Default, no analysis
  };

  return { audioBuffer, metadata, objectUrl };
}

/**
 * Create track object for DeckManager from loaded audio file
 */
export function createTrackFromFile(loadedFile: LoadedAudioFile) {
  const { metadata, objectUrl } = loadedFile;

  return {
    id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url: objectUrl,
    title: metadata.title || metadata.fileName.replace(/\.[^/.]+$/, ""),
    artist: metadata.artist || "Unknown Artist",
    duration: metadata.duration,
    bpm: metadata.bpm || 120,
    key: metadata.key || "C",
  };
}

/**
 * Cleanup object URL when track is unloaded
 */
export function cleanupTrackUrl(url: string): void {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}
