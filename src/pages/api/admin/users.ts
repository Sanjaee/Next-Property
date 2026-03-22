import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { db, users, pool } from "@/db";
import { desc, eq, sql } from "drizzle-orm";
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

    // Stats by role
    const roleStats = await db
      .select({
        userType: users.userType,
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .groupBy(users.userType);

    // Stats by verification
    const verifiedCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.isVerified, true));
    const unverifiedCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.isVerified, false));

    const roleMap = Object.fromEntries(
      roleStats.map((s) => [s.userType, Number(s.count)])
    );

    // Registrations by date (last 90 days) for area chart
    const regResult = await pool.query<{
      date: string;
      user_type: string;
      count: string;
    }>(`
      SELECT date_trunc('day', created_at)::date as date, user_type, count(*)::int as count
      FROM users
      WHERE created_at >= now() - interval '90 days'
      GROUP BY date_trunc('day', created_at), user_type
      ORDER BY date
    `);

    const dateMap = new Map<string, { admin: number; member: number; premium: number }>();
    for (const r of regResult.rows) {
      const key = r.date;
      if (!dateMap.has(key)) {
        dateMap.set(key, { admin: 0, member: 0, premium: 0 });
      }
      const row = dateMap.get(key)!;
      const k = r.user_type as keyof typeof row;
      if (k in row) row[k] = Number(r.count);
    }
    const registrationsByDate = Array.from(dateMap.entries())
      .map(([date, counts]) => ({
        date,
        admin: counts.admin,
        member: counts.member,
        premium: counts.premium,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

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
      stats: {
        total: rows.length,
        by_type: {
          admin: roleMap.admin ?? 0,
          member: roleMap.member ?? 0,
          premium: roleMap.premium ?? 0,
        },
        by_verification: {
          verified: Number(verifiedCount[0]?.count ?? 0),
          unverified: Number(unverifiedCount[0]?.count ?? 0),
        },
      },
      registrationsByDate,
    });
  } catch (error) {
    console.error("GET admin users error:", error);
    return res.status(500).json({ error: "Gagal mengambil data user" });
  }
}
