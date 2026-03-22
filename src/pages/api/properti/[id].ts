import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { db } from "@/db";
import { properti, properti_images } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: "ID tidak valid" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Harap login" });
  }

  if (req.method === "GET") {
    try {
      const [row] = await db
        .select()
        .from(properti)
        .where(eq(properti.id, id))
        .limit(1);

      if (!row) return res.status(404).json({ error: "Properti tidak ditemukan" });
      if (row.ownerId !== session.user.id) {
        return res.status(403).json({ error: "Akses ditolak" });
      }

      const [thumb] = await db
        .select({ imageUrl: properti_images.imageUrl })
        .from(properti_images)
        .where(
          and(
            eq(properti_images.propertiId, id),
            eq(properti_images.imageType, "thumbnail")
          )
        )
        .limit(1);

      return res.status(200).json({
        ...row,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        imageUrl: thumb?.imageUrl ?? null,
      });
    } catch (error) {
      console.error("GET properti error:", error);
      return res.status(500).json({ error: "Gagal mengambil data" });
    }
  }

  if (req.method === "PATCH") {
    try {
      const [existing] = await db
        .select()
        .from(properti)
        .where(eq(properti.id, id))
        .limit(1);

      if (!existing) return res.status(404).json({ error: "Properti tidak ditemukan" });
      if (existing.ownerId !== session.user.id) {
        return res.status(403).json({ error: "Akses ditolak" });
      }

      const body = req.body;
      const updates: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      const fields = [
        "name", "description", "type", "listingType", "price", "priceUnit",
        "rentPeriod", "address", "province", "city", "district", "postalCode",
        "latitude", "longitude",
      ] as const;

      if (body.latitude !== undefined) {
        const lat = parseFloat(String(body.latitude));
        if (Number.isNaN(lat) || lat < -90 || lat > 90) {
          return res.status(400).json({
            error: "Latitude tidak valid. Gunakan angka -90 sampai 90.",
          });
        }
        updates.latitude = String(lat);
      }
      if (body.longitude !== undefined) {
        const lng = parseFloat(String(body.longitude));
        if (Number.isNaN(lng) || lng < -180 || lng > 180) {
          return res.status(400).json({
            error: "Longitude tidak valid. Gunakan angka -180 sampai 180.",
          });
        }
        updates.longitude = String(lng);
      }

      for (const f of fields) {
        if (body[f] !== undefined) {
          if (f === "price") {
            updates[f] = String(body[f]);
          } else if (f === "latitude" || f === "longitude") {
            // Already handled above
          } else if (f === "rentPeriod" && body.listingType !== "rent") {
            updates[f] = null;
          } else {
            updates[f] = body[f];
          }
        }
      }

      const [updated] = await db
        .update(properti)
        .set(updates as Record<string, unknown>)
        .where(eq(properti.id, id))
        .returning();

      if (body.removeImage) {
        await db
          .delete(properti_images)
          .where(
            and(
              eq(properti_images.propertiId, id),
              eq(properti_images.imageType, "thumbnail")
            )
          );
      } else if (body.imageUrl) {
        await db
          .delete(properti_images)
          .where(
            and(
              eq(properti_images.propertiId, id),
              eq(properti_images.imageType, "thumbnail")
            )
          );
        await db.insert(properti_images).values({
          propertiId: id,
          imageUrl: body.imageUrl,
          imageType: "thumbnail",
        });
      }

      return res.status(200).json(updated);
    } catch (error) {
      console.error("PATCH properti error:", error);
      return res.status(500).json({ error: "Gagal mengubah properti" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
