import { NextRequest } from "next/server";

export const runtime = "nodejs";

const RMBG_API_URL = process.env.RMBG_API_URL || "http://127.0.0.1:8000";

// Batch jobs run BRIA on all images first (up to 240s),
// then submit to OpenAI Batch API — allow generous timeout
const BATCH_TIMEOUT_MS = 600_000; // 10 minutes for large batches

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files");
    const garmentHint = String(formData.get("garment_hint") || "auto");

    if (!files || files.length === 0) {
      return Response.json({ error: "No files provided" }, { status: 400 });
    }

    if (files.length > 100) {
      return Response.json(
        { error: "Maximum batch size is 100 images" },
        { status: 400 }
      );
    }

    // Validate all files before sending
    for (const file of files) {
      if (!(file instanceof File)) {
        return Response.json({ error: "Invalid file in batch" }, { status: 400 });
      }
      if (!file.type.startsWith("image/")) {
        return Response.json(
          { error: `File "${file.name}" is not an image` },
          { status: 400 }
        );
      }
      if (file.size === 0) {
        return Response.json(
          { error: `File "${file.name}" is empty` },
          { status: 400 }
        );
      }
    }

    // Build FormData for FastAPI — append all files under "files" key
    const batchForm = new FormData();
    for (const file of files) {
      batchForm.append("files", file as File, (file as File).name);
    }
    batchForm.append("garment_hint", garmentHint);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), BATCH_TIMEOUT_MS);

    let response: Response;

    try {
      response = await fetch(`${RMBG_API_URL}/batch/submit`, {
        method: "POST",
        body: batchForm,
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
          error: "Batch submit failed",
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
        ? "Batch submit timed out — try with fewer images"
        : err?.message || "Batch submit failed";

    return Response.json({ error: message }, { status: 500 });
  }
}