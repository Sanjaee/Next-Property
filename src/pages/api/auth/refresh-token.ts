import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken, generateAccessToken, generateRefreshToken } from "@/lib/auth";
import { db, sessions, users } from "@/db/index";
import { eq } from "drizzle-orm";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        error: { message: "Refresh token diperlukan." },
      });
    }

    // Verify refresh token
    const payload = verifyToken(refresh_token);
    if (!payload || payload.type !== "refresh") {
      return res.status(401).json({
        error: { message: "Refresh token tidak valid." },
      });
    }

    const userId = payload.userId as string;

    // Check if session exists
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.refreshToken, refresh_token),
    });

    if (!session || new Date(session.expiresAt) < new Date()) {
      return res.status(401).json({
        error: { message: "Refresh token sudah kadaluarsa." },
      });
    }

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return res.status(404).json({
        error: { message: "User tidak ditemukan." },
      });
    }

    // Generate new tokens
    const accessToken = generateAccessToken(user.id, user.email, user.userType);
    const newRefreshToken = generateRefreshToken(user.id);

    // Update session with new refresh token
    await db
      .update(sessions)
      .set({
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      .where(eq(sessions.id, session.id));

    return res.status(200).json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.fullName,
          user_type: user.userType,
          profile_photo: user.profilePhoto,
          is_verified: user.isVerified,
          login_type: user.loginType,
        },
        access_token: accessToken,
        refresh_token: newRefreshToken,
        expires_in: 15 * 60,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
    return res.status(401).json({ error: { message } });
  }
}

