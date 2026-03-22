import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { db } from "@/db";
import { properti, properti_images } from "@/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Harap login" });
  }

  try {
    const rows = await db
      .select()
      .from(properti)
      .where(eq(properti.ownerId, session.user.id))
      .orderBy(desc(properti.createdAt));

    if (rows.length === 0) {
      return res.status(200).json([]);
    }

    const ids = rows.map((p) => p.id);
    const thumbnails = await db
      .select({
        propertiId: properti_images.propertiId,
        imageUrl: properti_images.imageUrl,
      })
      .from(properti_images)
      .where(
        and(
          inArray(properti_images.propertiId, ids),
          eq(properti_images.imageType, "thumbnail")
        )
      );

    const thumbMap = new Map<string, string>();
    for (const t of thumbnails) {
      if (!thumbMap.has(t.propertiId)) thumbMap.set(t.propertiId, t.imageUrl);
    }

    const data = rows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      type: p.type,
      status: p.status,
      listingType: p.listingType,
      price: p.price,
      priceUnit: p.priceUnit,
      rentPeriod: p.rentPeriod,
      address: p.address,
      province: p.province,
      city: p.city,
      district: p.district,
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
      imageUrl: thumbMap.get(p.id) ?? null,
    }));

    return res.status(200).json(data);
  } catch (error) {
    console.error("GET my properti error:", error);
    return res.status(500).json({ error: "Gagal mengambil data" });
  }
}
