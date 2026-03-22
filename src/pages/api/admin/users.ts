import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { db, users } from "@/db";
import { desc, sql } from "drizzle-orm";
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

  if (session.user.role !== "admin") {
    return res.status(403).json({ error: "Akses ditolak. Hanya admin." });
  }

  try {
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        fullName: users.fullName,
        phone: users.phone,
        userType: users.userType,
        isActive: users.isActive,
        isVerified: users.isVerified,
        loginType: users.loginType,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    // Stats by role for chart
    const roleStats = await db
      .select({
        userType: users.userType,
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .groupBy(users.userType);

    return res.status(200).json({
      users: rows.map((u) => ({
        id: u.id,
        email: u.email,
        username: u.username ?? null,
        fullName: u.fullName,
        phone: u.phone ?? null,
        userType: u.userType,
        isActive: u.isActive,
        isVerified: u.isVerified,
        loginType: u.loginType,
        createdAt: u.createdAt,
      })),
      stats: roleStats.map((s) => ({
        role: s.userType,
        count: Number(s.count),
      })),
    });
  } catch (error) {
    console.error("GET admin users error:", error);
    return res.status(500).json({ error: "Gagal mengambil data user" });
  }
}
