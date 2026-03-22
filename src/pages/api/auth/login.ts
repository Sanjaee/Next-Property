import type { NextApiRequest, NextApiResponse } from "next";
import { loginUser } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: { message: "Email dan password diperlukan." },
      });
    }

    const result = await loginUser(email, password);

    // Check if verification is required
    if (result.requires_verification) {
      return res.status(200).json({
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            full_name: result.user.fullName,
            user_type: result.user.userType,
            is_verified: result.user.isVerified,
            login_type: result.user.loginType,
          },
          requires_verification: true,
          verification_token: result.verification_token,
        },
      });
    }

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
    console.error("Login error:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
    return res.status(401).json({ error: { message } });
  }
}

