/**
 * @fileoverview Terminal UI File Uploader Component
 * @description Drag-and-drop audio file uploader with terminal aesthetic
 * Integrates with audioFileLoader for audio processing
 */

"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileAudio, AlertCircle, Loader2 } from "lucide-react";
import {
  loadAudioFile,
  createTrackFromFile,
  validateAudioFile,
  type UploadProgress,
} from "@/lib/audio/audioFileLoader";

interface FileUploaderProps {
  /**
   * Callback when audio file is successfully loaded
   */
  onFileLoaded: (track: {
    id: string;
    url: string;
    title: string;
    artist: string;
    duration: number;
    bpm?: number;
    key?: string;
  }) => void;

  /**
   * Optional callback for upload progress
   */
  onProgress?: (fileName: string, progress: UploadProgress) => void;

  /**
   * Optional callback for errors
   */
  onError?: (fileName: string, error: string) => void;

  /**
   * AudioContext for decoding audio
   */
  audioContext: AudioContext | null;

  /**
   * Maximum file size in bytes (default: 100MB)
   */
  maxSize?: number;

  /**
   * Allow multiple file uploads (default: true)
   */
  multiple?: boolean;
}

/**
 * Terminal-styled file uploader with drag-and-drop support
 */
export function FileUploader({
  onFileLoaded,
  onProgress,
  onError,
  audioContext,
  maxSize = 100 * 1024 * 1024,
  multiple = true,
}: FileUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<
    { name: string; progress: UploadProgress }[]
  >([]);
  const [errorFiles, setErrorFiles] = useState<
    { name: string; error: string }[]
  >([]);

  const handleFileDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!audioContext) {
        const error = "Audio system not initialized";
        console.error(error);
        onError?.(acceptedFiles[0]?.name || "unknown", error);
        return;
      }

      for (const file of acceptedFiles) {
        // Validate before processing
        const validation = validateAudioFile(file);
        if (!validation.valid) {
          console.error(
            `Validation failed for ${file.name}:`,
            validation.error,
          );
          setErrorFiles((prev) => [
            ...prev,
            { name: file.name, error: validation.error! },
          ]);
          onError?.(file.name, validation.error!);
          continue;
        }

        try {
          // Add to uploading list
          setUploadingFiles((prev) => [
            ...prev,
            {
              name: file.name,
              progress: {
                stage: "reading",
                progress: 0,
                message: "Starting...",
              },
            },
          ]);

          // Load and process audio file
          const loadedFile = await loadAudioFile(
            file,
            audioContext,
            (progress) => {
              // Update progress in UI
              setUploadingFiles((prev) =>
                prev.map((f) =>
                  f.name === file.name ? { ...f, progress } : f,
                ),
              );
              onProgress?.(file.name, progress);
            },
          );

          // Create track object for DeckManager
          const track = createTrackFromFile(loadedFile);

          console.log(`✅ Successfully loaded: ${file.name}`);
          onFileLoaded(track);

          // Remove from uploading list after delay (show success)
          setTimeout(() => {
            setUploadingFiles((prev) =>
              prev.filter((f) => f.name !== file.name),
            );
          }, 1500);
        } catch (error: any) {
          const errorMessage = error.message || "Unknown error";
          console.error(`❌ Failed to load ${file.name}:`, error);

          // Update uploading list with error state
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.name === file.name
                ? {
                    ...f,
                    progress: {
                      stage: "error",
                      progress: 0,
                      message: errorMessage,
                    },
                  }
                : f,
            ),
          );

          setErrorFiles((prev) => [
            ...prev,
            { name: file.name, error: errorMessage },
          ]);
          onError?.(file.name, errorMessage);

          // Remove from uploading list after delay
          setTimeout(() => {
            setUploadingFiles((prev) =>
              prev.filter((f) => f.name !== file.name),
            );
          }, 3000);
        }
      }
    },
    [audioContext, onFileLoaded, onProgress, onError],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop: handleFileDrop,
      accept: {
        "audio/mpeg": [".mp3"],
        "audio/wav": [".wav"],
        "audio/webm": [".webm"],
        "audio/flac": [".flac"],
        "audio/x-m4a": [".m4a"],
        "audio/aac": [".aac"],
        "audio/ogg": [".ogg"],
      },
      maxSize,
      multiple,
      disabled: !audioContext, // Disable until audio system ready
      onDropRejected: (fileRejections) => {
        fileRejections.forEach(({ file, errors }) => {
          errors.forEach((error) => {
            const errorMsg = `${error.code}: ${error.message}`;
            console.error(`Rejected ${file.name}:`, errorMsg);
            setErrorFiles((prev) => [
              ...prev,
              { name: file.name, error: errorMsg },
            ]);
            onError?.(file.name, errorMsg);
          });
        });
      },
    });

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8
          transition-all duration-200 cursor-pointer
          ${
            isDragActive && !isDragReject
              ? "border-green-400 bg-green-500/10"
              : isDragReject
                ? "border-red-400 bg-red-500/10"
                : audioContext
                  ? "border-green-600 bg-green-500/5 hover:border-green-400 hover:bg-green-500/10"
                  : "border-gray-600 bg-gray-500/5 cursor-not-allowed opacity-50"
          }
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          {/* Icon */}
          <div
            className={`
            p-4 rounded-full border-2
            ${
              isDragActive && !isDragReject
                ? "border-green-400 bg-green-500/20"
                : isDragReject
                  ? "border-red-400 bg-red-500/20"
                  : audioContext
                    ? "border-green-600 bg-green-500/10"
                    : "border-gray-600 bg-gray-500/10"
            }
          `}
          >
            {isDragReject ? (
              <AlertCircle className="w-8 h-8 text-red-400" />
            ) : (
              <FileAudio
                className={`w-8 h-8 ${audioContext ? "text-green-400" : "text-gray-600"}`}
              />
            )}
          </div>

          {/* Text */}
          <div className="font-mono space-y-2">
            {!audioContext ? (
              <p className="text-gray-400 text-sm">
                Audio system not initialized
              </p>
            ) : isDragActive && !isDragReject ? (
              <>
                <p className="text-green-400 text-lg font-bold tracking-wider">
                  DROP_FILES_HERE
                </p>
                <p className="text-green-600 text-xs">Release to upload</p>
              </>
            ) : isDragReject ? (
              <>
                <p className="text-red-400 text-lg font-bold tracking-wider">
                  INVALID_FILE
                </p>
                <p className="text-red-600 text-xs">Only audio files allowed</p>
              </>
            ) : (
              <>
                <p className="text-green-400 text-lg font-bold tracking-wider">
                  <Upload className="inline w-5 h-5 mr-2 -mt-1" />
                  DRAG_AUDIO_FILES
                </p>
                <p className="text-green-600 text-xs">or click to browse</p>
                <p className="text-green-700 text-xs mt-2">
                  Supported: MP3, WAV, FLAC, M4A, OGG (max{" "}
                  {maxSize / 1024 / 1024}MB)
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <div className="text-green-400 text-xs font-mono font-bold tracking-wider">
            UPLOADING...
          </div>
          {uploadingFiles.map((file) => (
            <div
              key={file.name}
              className="border border-green-600 bg-green-500/5 rounded p-3 font-mono text-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-400 truncate flex-1 mr-4">
                  {file.name}
                </span>
                {file.progress.stage !== "error" &&
                  file.progress.stage !== "complete" && (
                    <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                  )}
                {file.progress.stage === "complete" && (
                  <span className="text-green-400 font-bold">✓</span>
                )}
                {file.progress.stage === "error" && (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full h-1 bg-black border border-green-700 rounded overflow-hidden mb-2">
                <div
                  className={`h-full transition-all duration-300 ${
                    file.progress.stage === "error"
                      ? "bg-red-500"
                      : file.progress.stage === "complete"
                        ? "bg-green-400"
                        : "bg-green-600"
                  }`}
                  style={{ width: `${file.progress.progress}%` }}
                />
              </div>

              {/* Status message */}
              <div
                className={`text-xs ${
                  file.progress.stage === "error"
                    ? "text-red-400"
                    : file.progress.stage === "complete"
                      ? "text-green-400"
                      : "text-green-600"
                }`}
              >
                {file.progress.message}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error List */}
      {errorFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-red-400 text-xs font-mono font-bold tracking-wider">
              ERRORS
            </div>
            <button
              onClick={() => setErrorFiles([])}
              className="text-red-600 text-xs hover:text-red-400 transition-colors"
            >
              Clear
            </button>
          </div>
          {errorFiles.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="border border-red-600 bg-red-500/10 rounded p-3 font-mono text-xs"
            >
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-red-400 font-bold">{file.name}</div>
                  <div className="text-red-600 text-xs mt-1">{file.error}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
