"use client";

import { FormEvent, useState } from "react";
import { usePlayer } from "../../hooks/usePlayer";
import { requestTrackGeneration } from "../../services/aiStemService";

const STYLES = ["Cinematic", "Lo-fi", "Hip-hop", "Afrobeats", "Techno"];

export default function AIGenerationPanel() {
  const { addGenerationTask, updateGenerationTask } = usePlayer();
  const [prompt, setPrompt] = useState(
    "Create a soulful neo-soul groove with lush chords and a halftime switch",
  );
  const [style, setStyle] = useState("Cinematic");
  const [duration, setDuration] = useState(180);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const taskId = `local-${Date.now()}`;
    addGenerationTask({
      id: taskId,
      prompt,
      status: "queued",
      createdAt: new Date().toISOString(),
      durationSeconds: duration,
    });

    try {
      const response = await requestTrackGeneration({
        prompt,
        durationSeconds: duration,
        style,
      });

      updateGenerationTask({
        id: taskId,
        prompt,
        status: "processing",
        createdAt: new Date().toISOString(),
        durationSeconds: duration,
      });

      setTimeout(() => {
        updateGenerationTask({
          id: taskId,
          prompt,
          status: "completed",
          createdAt: new Date().toISOString(),
          previewUrl: response.previewUrl,
          durationSeconds: duration,
        });
      }, 1500);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Unable to start generation right now.",
      );
      updateGenerationTask({
        id: taskId,
        prompt,
        status: "failed",
        createdAt: new Date().toISOString(),
        error: "Generation failed",
        durationSeconds: duration,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-black via-slate-950 to-black p-6 text-white shadow-xl shadow-purple-900/40">
      <h3 className="text-lg font-semibold">Generate music from a prompt</h3>
      <p className="mt-2 text-sm text-white/70">
        We forward prompts to curated AI models like AIVA and Suno, then return
        stems ready for remixing. Tune style, length, and instrumentation before
        rendering.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm">
          Prompt
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="min-h-[100px] rounded-2xl border border-white/10 bg-black/60 p-4 text-sm text-white focus:border-white/40 focus:outline-none"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            Style
            <select
              value={style}
              onChange={(event) => setStyle(event.target.value)}
              className="rounded-2xl border border-white/10 bg-black/60 p-3 text-sm text-white focus:border-white/40 focus:outline-none"
            >
              {STYLES.map((styleOption) => (
                <option key={styleOption}>{styleOption}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Duration (seconds)
            <input
              type="number"
              min={30}
              max={360}
              step={30}
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
              className="rounded-2xl border border-white/10 bg-black/60 p-3 text-sm text-white focus:border-white/40 focus:outline-none"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/40 transition hover:shadow-purple-500/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Queuing task…" : "Generate track"}
        </button>
        {error && <p className="text-sm text-rose-400">{error}</p>}
      </form>
    </div>
  );
}
