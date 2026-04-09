import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, mode } = await req.json();

    if (!imageUrl) {
      return Response.json({ error: "Missing imageUrl" }, { status: 400 });
    }

    const isZipaWhite = mode === "zipa-white";

    const transformation = isZipaWhite
      ? {
          width: 2000,
          height: 2000,
          crop: "pad",
          background: "white",
          format: "png",
        }
      : {
          width: 2000,
          height: 2000,
          crop: "pad",
          background: "white",
          format: "png",
        };

    const uploaded = await cloudinary.uploader.upload(imageUrl, {
      folder: "imageforge",
      eager: [transformation],
      eager_async: false,
    });

    const resultUrl = uploaded?.eager?.[0]?.secure_url;

    if (!resultUrl) {
      console.error("Cloudinary: no transformed image returned", uploaded);
      return Response.json(
        { error: "No transformed image returned" },
        { status: 500 }
      );
    }

    return Response.json({ resultUrl });
  } catch (err: any) {
    console.error("Cloudinary error:", err?.message || err);
    return Response.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}