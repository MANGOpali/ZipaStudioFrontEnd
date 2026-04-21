import { NextRequest } from "next/server";

export const runtime = "nodejs";

const RMBG_API_URL = process.env.RMBG_API_URL || "http://127.0.0.1:8000";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;

    if (!batchId) {
      return Response.json({ error: "Missing batchId" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    let response: Response;

    try {
      response = await fetch(`${RMBG_API_URL}/batch/status/${batchId}`, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const errText = await response.text();
      return Response.json(
        {
          error: "Status check failed",
          upstreamStatus: response.status,
          details: errText,
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (err: any) {
    const message =
      err?.name === "AbortError"
        ? "Status check timed out"
        : err?.message || "Status check failed";

    return Response.json({ error: message }, { status: 500 });
  }
}