import { NextRequest } from "next/server";
import { createMockWaveform } from "../../lib/data/defaultTrack";

export async function POST(request: NextRequest) {
  let body:
    | Partial<{
        fileName: string;
        mimeType: string;
        size: number;
      }>
    | undefined;

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ message: "Invalid JSON payload" }), {
      status: 400,
    });
  }

  const { fileName, mimeType, size } = body ?? {};

  if (!fileName || !mimeType || !size) {
    return new Response(
      JSON.stringify({ message: "Missing required upload metadata" }),
      { status: 400 },
    );
  }

  const stems = ["vocals", "drums", "bass", "other"].map((stemId, index) => ({
    id: stemId,
    label: stemId.charAt(0).toUpperCase() + stemId.slice(1),
    url: `/media/${encodeURIComponent(fileName)}/${stemId}.m3u8`,
    waveform: createMockWaveform(512, 0.4 + index * 0.1),
  }));

  return Response.json({
    jobId: `stem-${Date.now()}`,
    status: "complete",
    stems,
    metadata: {
      durationSeconds: Math.round(180 + Math.random() * 120),
      estimatedLatencyMs: Math.round(45 + Math.random() * 20),
    },
  });
}
