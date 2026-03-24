import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { v2 as cloudinary } from "cloudinary";
import { authOptions } from "../auth/[...nextauth]";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "3mb",
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Harap login untuk mengunggah gambar" });
  }

  const { image, folder } = req.body as { image?: string; folder?: string };
  if (!image || typeof image !== "string") {
    return res.status(400).json({ error: "Data gambar tidak valid" });
  }

  if (!image.startsWith("data:image/")) {
    return res.status(400).json({ error: "Format gambar tidak didukung" });
  }

  const uploadFolder =
    typeof folder === "string" && folder.length > 0 && folder.length <= 64
      ? folder.replace(/[^a-zA-Z0-9_-]/g, "")
      : "property";

  try {
    const result = await cloudinary.uploader.upload(image, {
      folder: uploadFolder,
      resource_type: "image",
    });

    return res.status(200).json({ url: result.secure_url });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return res.status(500).json({ error: "Gagal mengunggah gambar" });
  }
}
