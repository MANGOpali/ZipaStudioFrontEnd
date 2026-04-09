import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const removeBgForm = new FormData();
  removeBgForm.append("image_file", file);
  removeBgForm.append("size", "auto");

  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: {
      "X-Api-Key": process.env.REMOVEBG_API_KEY!,
    },
    body: removeBgForm,
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Remove.bg error:", errText);

    let parsed: any = null;
    try {
      parsed = JSON.parse(errText);
    } catch {}

    const code = parsed?.errors?.[0]?.code;
    const title = parsed?.errors?.[0]?.title;

    if (code === "unknown_foreground") {
      return Response.json(
        {
          error: "Could not identify product clearly",
          code,
          details: title,
        },
        { status: 422 }
      );
    }

    return Response.json(
      {
        error: "Background removal failed",
        code: code || "remove_bg_error",
        details: title || errText,
      },
      { status: 500 }
    );
  }

  const resultBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(resultBuffer).toString("base64");
  const resultUrl = `data:image/png;base64,${base64}`;

  return Response.json({ resultUrl });
}