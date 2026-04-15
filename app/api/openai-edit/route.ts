import { NextRequest } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const prompt = `
Perform a NON-GENERATIVE edit of this product image.

CRITICAL REQUIREMENTS:
- Preserve the original product exactly
- Do NOT recreate, redraw, restyle, or reimagine the product
- Do NOT change logo, print, text, stitching, folds, seams, shape, proportions, or length
- Do NOT change color, brightness, contrast, or fabric texture
- Do NOT crop the product
- Do NOT zoom in
- Do NOT enlarge the top area
- Do NOT shrink the lower part
- Keep the exact same overall size and proportions as the original product

EDIT ONLY:
- Remove the background
- Remove mannequin, hanger, and surrounding background objects
- Replace background with pure white (#FFFFFF only)

COMPOSITION:
- Output must be square 1:1
- Keep the FULL product visible from top to bottom
- Keep equal padding around the product
- Center the product vertically and horizontally
- Keep the product straight and aligned
- Do not let the top touch the frame
- Do not cut sleeves, hem, shoulders, or neckline

OUTPUT:
- Realistic e-commerce product image
- Pure white background only
- No shadow, no glow, no gradient
- Must look like the original real product photo placed on white background
`.trim();

   const result = await client.images.edit({
  model: "gpt-image-1.5",
  image: new File([buffer], file.name || "product.png", {
    type: file.type || "image/png",
  }),
  prompt,
  size: "1024x1024",
  output_format: "png",
});

    const base64 = result.data?.[0]?.b64_json;

    if (!base64) {
      return Response.json(
        { error: "No edited image returned" },
        { status: 500 }
      );
    }

    return Response.json({
      resultUrl: `data:image/png;base64,${base64}`,
    });
  } catch (error: any) {
    console.error("OpenAI edit error:", error);

    return Response.json(
      {
        error: error?.error?.message || error?.message || "OpenAI image edit failed",
        code: error?.code || null,
        type: error?.type || null,
      },
      { status: error?.status || 500 }
    );
  }
}