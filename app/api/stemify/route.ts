import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Forward the request to the Python backend
    const response = await fetch(`${BACKEND_URL}/api/v1/stemify`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying to backend:", error);
    return NextResponse.json(
      {
        error: {
          code: "BACKEND_ERROR",
          message: "Failed to connect to processing backend",
        },
      },
      { status: 502 },
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
