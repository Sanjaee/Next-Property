import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { and, eq, ne } from "drizzle-orm";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { db, users } from "@/db";
import {
  profileFormSchema,
  normalizeProfilePayload,
} from "@/lib/schemas";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Harap login" });
  }

  const userId = session.user.id;

  if (req.method === "GET") {
    try {
      const row = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
      if (!row) {
        return res.status(404).json({ error: "Pengguna tidak ditemukan" });
      }
      return res.status(200).json({
        id: row.id,
        email: row.email,
        username: row.username ?? "",
        phone: row.phone ?? "",
        fullName: row.fullName,
        profilePhoto: row.profilePhoto ?? "",
        dateOfBirth: row.dateOfBirth
          ? row.dateOfBirth.toISOString().slice(0, 10)
          : "",
        gender: row.gender ?? null,
        userType: row.userType,
        loginType: row.loginType,
        isVerified: row.isVerified,
      });
    } catch (e) {
      console.error("GET profile error:", e);
      return res.status(500).json({ error: "Gagal memuat profil" });
    }
  }

  if (req.method === "PATCH") {
    const parsed = profileFormSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Data tidak valid",
        details: parsed.error.flatten(),
      });
    }

    const payload = normalizeProfilePayload(parsed.data);

    if (payload.username) {
      const conflict = await db.query.users.findFirst({
        where: and(
          eq(users.username, payload.username),
          ne(users.id, userId)
        ),
      });
      if (conflict) {
        return res.status(409).json({ error: "Username sudah dipakai" });
      }
    }

    let dateOfBirth: Date | null = null;
    if (payload.dateOfBirth) {
      const d = new Date(payload.dateOfBirth + "T12:00:00");
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ error: "Tanggal lahir tidak valid" });
      }
      dateOfBirth = d;
    }

    try {
      await db
        .update(users)
        .set({
          fullName: payload.fullName,
          username: payload.username ?? null,
          phone: payload.phone ?? null,
          gender: payload.gender ?? null,
          dateOfBirth,
          profilePhoto: payload.profilePhoto ?? null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error("PATCH profile error:", e);
      return res.status(500).json({ error: "Gagal menyimpan profil" });
    }
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ error: "Method not allowed" });
}
