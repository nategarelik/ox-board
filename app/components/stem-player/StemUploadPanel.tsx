"use client";

import { useRef, useState } from "react";
import {
  createDefaultTrack,
  createMockWaveform,
} from "../../lib/data/defaultTrack";
import { StemTrack } from "../../types/stem-player";
import { requestStemSeparation } from "../../services/aiStemService";

// Poll for job completion
const pollJobStatus = async (jobId: string): Promise<any> => {
  const response = await fetch(`/api/stemify?jobId=${jobId}`);
  if (!response.ok) {
    throw new Error("Failed to check job status");
  }
  return response.json();
};

interface StemUploadPanelProps {
  onUploadStart: () => void;
  onUploadProgress: (value: number) => void;
  onUploadComplete: (track: StemTrack) => void;
  onUploadError: () => void;
  uploadProgress: number | null;
  isProcessing: boolean;
}

export default function StemUploadPanel({
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  uploadProgress,
  isProcessing,
}: StemUploadPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setError(null);
    onUploadStart();

    try {
      // Step 1: Queue the stem separation job
      const jobResponse = await requestStemSeparation({
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
      });

      console.log("🎵 Stem separation job queued:", jobResponse.jobId);

      // Step 2: Poll for completion if status is not complete
      let finalResponse = jobResponse;
      if (jobResponse.status !== "complete") {
        console.log("⏳ Polling for job completion...");
        onUploadProgress(0.2);

        // Poll every 2 seconds for up to 60 seconds
        const maxPolls = 30;
        for (let poll = 0; poll < maxPolls; poll++) {
          await new Promise((resolve) => setTimeout(resolve, 2000));

          try {
            const statusResponse = await pollJobStatus(jobResponse.jobId);
            if (statusResponse.status === "complete") {
              finalResponse = statusResponse;
              console.log("✅ Stem separation completed!");
              break;
            } else if (statusResponse.status === "failed") {
              throw new Error("Stem separation failed");
            }
            // Still processing, continue polling
            onUploadProgress(0.2 + (poll / maxPolls) * 0.6);
          } catch (pollError) {
            console.warn("⚠️ Job status poll failed:", pollError);
            if (poll === maxPolls - 1) {
              throw new Error("Job status polling timed out");
            }
          }
        }
      }

      // Step 3: Create track with real stem URLs
      const baseTrack = createDefaultTrack();
      const newTrack: StemTrack = {
        ...baseTrack,
        id: `upload-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        createdAt: new Date().toISOString(),
        stems: baseTrack.stems.map((stem) => {
          const apiStem = finalResponse.stems.find(
            (item) => item.id === stem.id,
          );
          return {
            ...stem,
            hlsUrl: apiStem?.url ?? stem.hlsUrl,
            waveform: apiStem?.waveform ?? createMockWaveform(512, 0.5),
            volume: 0.7,
            muted: false,
            solo: false,
          };
        }),
        durationSeconds: finalResponse.metadata.durationSeconds,
        updatedAt: new Date().toISOString(),
      };

      onUploadProgress(1);
      onUploadComplete(newTrack);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to process stems at this time.",
      );
      onUploadError();
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-xl shadow-black/30">
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Upload stems or full track</h3>
        <p className="text-sm text-white/70">
          We queue uploads into GPU-backed stem separation. Preview stems arrive
          instantly, lossless versions when your subscription allows it.
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          className="rounded-2xl border border-dashed border-white/30 bg-black/60 px-4 py-6 text-sm text-white/80 transition hover:border-white/60 hover:text-white"
        >
          {isProcessing ? "Processing…" : "Drop files or browse"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleUpload(file);
            }
            // Allow selecting the same file again after handling the upload
            event.target.value = "";
          }}
        />
        {uploadProgress !== null && (
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500"
              style={{ width: `${Math.round(uploadProgress * 100)}%` }}
            />
          </div>
        )}
        {error && <p className="text-sm text-rose-400">{error}</p>}
      </div>
    </div>
  );
}
