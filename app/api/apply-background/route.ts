import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Read the compressed image blob sent as FormData from page.tsx
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return Response.json({ error: "Missing file in form data" }, { status: 400 });
    }

    // Convert Blob → Buffer for Cloudinary upload stream
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload via stream — avoids writing a temp file to disk
    const uploaded = await new Promise<{ public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "imageforge",
          resource_type: "image",
          format: "png",
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error("Upload failed"));
          resolve(result);
        }
      );
      stream.end(buffer);
    });

    if (!uploaded?.public_id) {
      return Response.json({ error: "Upload failed" }, { status: 500 });
    }

    const resultUrl = cloudinary.url(uploaded.public_id, {
      secure: true,
      transformation: [
        // Step 1: Shrink product to 85% of the output frame.
        // "fit" preserves aspect ratio and never crops — only shrinks.
        // This ensures white padding is always visible around the product,
        // even when GPT-image-1.5 outputs a full-bleed image like jeans.
        {
          width: 1700,
          height: 1700,
          crop: "fit",
          gravity: "center",
        },
        // Step 2: Pad out to 2000x2000 with pure white background.
        // Product is already at 85% so this always adds visible breathing room.
        {
          width: 2000,
          height: 2000,
          crop: "pad",
          background: "white",
          gravity: "center",
        },
        { format: "png" },
      ],
    });

    return Response.json({
      resultUrl,
      publicId: uploaded.public_id,
    });
  } catch (err: any) {
    console.error("apply-background error:", err);
    return Response.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}