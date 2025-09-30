import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/jobs/${params.id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching job status:", error);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/jobs/${params.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error deleting job:", error);
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
