import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "image/png";
    const dataUri = `data:${mimeType};base64,${base64}`;

    const uploaded = await cloudinary.uploader.upload(dataUri, {
      folder: "imageforge",
      resource_type: "image",
    });

    if (!uploaded?.public_id) {
      return Response.json({ error: "Upload failed" }, { status: 500 });
    }

    const resultUrl = cloudinary.url(uploaded.public_id, {
      transformation: [
        {
          width: 2000,
          height: 2000,
          crop: "pad",
          background: "white",
          gravity: "center",
        },
        {
          format: "png",
        },
      ],
      secure: true,
    });

    return Response.json({ resultUrl });
  } catch (err: any) {
    console.error("Format original error:", err?.message || err);
    return Response.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}