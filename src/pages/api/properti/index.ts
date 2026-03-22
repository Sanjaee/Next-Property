import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { db } from "@/db";
import { properti, properti_images } from "@/db/schema";
import { eq, desc, inArray, and } from "drizzle-orm";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const rows = await db
        .select()
        .from(properti)
        .orderBy(desc(properti.createdAt));

      const ids = rows.map((p) => p.id);
      const thumbnails =
        ids.length > 0
          ? await db
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
              )
          : [];

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
      console.error("GET properti error:", error);
      return res.status(500).json({ error: "Gagal mengambil data properti" });
    }
  }

  if (req.method === "POST") {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Harap login untuk menambahkan properti" });
    }

    try {
      const body = req.body;
      const required = [
        "name",
        "description",
        "type",
        "listingType",
        "price",
        "address",
        "province",
        "city",
        "district",
        "latitude",
        "longitude",
      ];
      for (const field of required) {
        if (!body[field]) {
          return res.status(400).json({ error: `Field ${field} wajib diisi` });
        }
      }

      const lat = parseFloat(String(body.latitude));
      const lng = parseFloat(String(body.longitude));
      if (Number.isNaN(lat) || lat < -90 || lat > 90) {
        return res.status(400).json({
          error: "Latitude tidak valid. Gunakan angka antara -90 sampai 90 (contoh: -6.2088)",
        });
      }
      if (Number.isNaN(lng) || lng < -180 || lng > 180) {
        return res.status(400).json({
          error: "Longitude tidak valid. Gunakan angka antara -180 sampai 180 (contoh: 106.8456)",
        });
      }

      const slug =
        body.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") +
        "-" +
        Date.now();

      const [inserted] = await db
        .insert(properti)
        .values({
          ownerId: session.user.id,
          name: body.name,
          slug,
          description: body.description,
          type: body.type,
          listingType: body.listingType,
          price: String(body.price),
          priceUnit: body.priceUnit ?? "IDR",
          rentPeriod: body.listingType === "rent" ? body.rentPeriod ?? null : null,
          address: body.address,
          province: body.province,
          city: body.city,
          district: body.district,
          postalCode: body.postalCode ?? null,
          latitude: String(lat),
          longitude: String(lng),
        })
        .returning();

      if (body.imageUrl) {
        await db.insert(properti_images).values({
          propertiId: inserted.id,
          imageUrl: body.imageUrl,
          imageType: "thumbnail",
        });
      }

      return res.status(201).json(inserted);
    } catch (error) {
      console.error("POST properti error:", error);
      return res.status(500).json({ error: "Gagal menambahkan properti" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
