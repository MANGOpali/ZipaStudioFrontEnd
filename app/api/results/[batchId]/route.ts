import { NextRequest } from "next/server";

export const runtime = "nodejs";

const RMBG_API_URL = process.env.RMBG_API_URL || "http://127.0.0.1:8000";

export async function GET(
  req: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    const { batchId } = params;

    if (!batchId) {
      return Response.json({ error: "Missing batchId" }, { status: 400 });
    }

    const controller = new AbortController();
    // Results download can be large (100 images worth of Cloudinary URLs)
    const timeout = setTimeout(() => controller.abort(), 120_000); // 2 minutes

    let response: Response;

    try {
      response = await fetch(`${RMBG_API_URL}/batch/results/${batchId}`, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      });
    } finally {
      clearTimeout(timeout);
    }

    // 202 means batch not ready yet — pass it through cleanly to the frontend
    if (response.status === 202) {
      const data = await response.json();
      return Response.json(data, { status: 202 });
    }

    if (!response.ok) {
      const errText = await response.text();
      return Response.json(
        {
          error: "Results fetch failed",
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
        ? "Results fetch timed out"
        : err?.message || "Results fetch failed";

    return Response.json({ error: message }, { status: 500 });
  }
}