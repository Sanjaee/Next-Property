import type { NextApiRequest, NextApiResponse } from "next";
import { googleOAuth } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  try {
    const { email, full_name, profile_photo, google_id } = req.body;

    if (!email || !full_name || !google_id) {
      return res.status(400).json({
        error: { message: "Email, nama lengkap, dan Google ID diperlukan." },
      });
    }

    const result = await googleOAuth({
      email,
      fullName: full_name,
      profilePhoto: profile_photo || "",
      googleId: google_id,
    });

    return res.status(200).json({
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          full_name: result.user.fullName,
          user_type: result.user.userType,
          profile_photo: result.user.profilePhoto,
          is_verified: result.user.isVerified,
          login_type: result.user.loginType,
          created_at: result.user.createdAt,
        },
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        expires_in: result.expires_in,
      },
    });
  } catch (error) {
    console.error("Google OAuth error:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
    return res.status(400).json({ error: { message } });
  }
}

