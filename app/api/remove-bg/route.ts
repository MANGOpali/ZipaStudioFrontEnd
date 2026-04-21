import { NextRequest } from "next/server";

export const runtime = "nodejs";

const RMBG_API_URL = process.env.RMBG_API_URL || "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const mode = String(formData.get("mode") || "none");
    const garmentHint = String(formData.get("garment_hint") || "auto");

    if (!file || !(file instanceof File)) {
      return Response.json({ error: "No valid file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return Response.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    if (file.size === 0) {
      return Response.json({ error: "Uploaded file is empty" }, { status: 400 });
    }

    const rmbgForm = new FormData();
    rmbgForm.append("file", file, file.name);
    rmbgForm.append("mode", mode);
    rmbgForm.append("garment_hint", garmentHint);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180000);

    let response: Response;

    try {
      response = await fetch(`${RMBG_API_URL}/remove-bg`, {
        method: "POST",
        body: rmbgForm,
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
          error: "Background removal API failed",
          upstreamStatus: response.status,
          details: errText,
        },
        { status: 502 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const resultUrl = `data:image/png;base64,${base64}`;

    return Response.json({ resultUrl });
  } catch (err: any) {
    const message =
      err?.name === "AbortError"
        ? "Background removal request timed out"
        : err?.message || "Background removal failed";

    return Response.json({ error: message }, { status: 500 });
  }
}