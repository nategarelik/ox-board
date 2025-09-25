import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { prompt, durationSeconds, style } = body;

  if (!prompt) {
    return new Response(JSON.stringify({ message: "Prompt is required" }), {
      status: 400,
    });
  }

  return Response.json({
    taskId: `gen-${Date.now()}`,
    status: "processing",
    previewUrl: "/previews/latest-demo.mp3",
    etaSeconds: 45,
    prompt,
    durationSeconds: durationSeconds ?? 180,
    style: style ?? "cinematic",
  });
}
