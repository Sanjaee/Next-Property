import type { NextApiRequest, NextApiResponse } from "next";
import { registerUser } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  try {
    const { email, password, full_name, user_type } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({
        error: { message: "Email, password, dan nama lengkap diperlukan." },
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: { message: "Password minimal 8 karakter." },
      });
    }

    const result = await registerUser({
      email,
      password,
      fullName: full_name,
      userType: user_type || "member",
    });

    return res.status(201).json({
      data: {
        message: "Registrasi berhasil. Silakan verifikasi email Anda.",
        user: {
          id: result.user.id,
          email: result.user.email,
          full_name: result.user.fullName,
          user_type: result.user.userType,
          is_verified: result.user.isVerified,
          login_type: result.user.loginType,
          created_at: result.user.createdAt,
        },
        requires_verification: result.requires_verification,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
    return res.status(400).json({ error: { message } });
  }
}

