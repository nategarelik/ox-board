import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const duration = parseInt(searchParams.get("duration") || "180");
  const stem = searchParams.get("stem") || "unknown";

  // Generate a silent audio buffer
  const sampleRate = 44100;
  const length = sampleRate * duration;
  const buffer = new ArrayBuffer(44 + length * 2); // WAV header + 16-bit PCM data
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  writeString(36, "data");
  view.setUint32(40, length * 2, true);

  // Silent PCM data (all zeros)
  for (let i = 44; i < buffer.byteLength; i += 2) {
    view.setUint16(i, 0, true);
  }

  return new Response(buffer, {
    headers: {
      "Content-Type": "audio/wav",
      "Content-Length": buffer.byteLength.toString(),
      "Cache-Control": "public, max-age=31536000", // Cache for 1 year
    },
  });
}
