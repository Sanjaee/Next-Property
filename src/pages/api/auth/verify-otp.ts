import type { NextApiRequest, NextApiResponse } from "next";
import { verifyOTP } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  try {
    const { email, otp_code } = req.body;

    if (!email || !otp_code) {
      return res.status(400).json({
        error: { message: "Email dan kode OTP diperlukan." },
      });
    }

    const result = await verifyOTP(email, otp_code, "email_verification");

    // Return user data for auto-login (similar to zacode pattern)
    return res.status(200).json({
      success: result.success,
      user: result.user,
      // Include OTP code for AUTO_LOGIN_ pattern
      otpCode: otp_code,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
    return res.status(400).json({ error: { message } });
  }
}

