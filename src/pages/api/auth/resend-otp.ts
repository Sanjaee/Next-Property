import type { NextApiRequest, NextApiResponse } from "next";
import { resendOTP } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  try {
    const { email, type } = req.body;

    if (!email) {
      return res.status(400).json({
        error: { message: "Email diperlukan." },
      });
    }

    const result = await resendOTP(email, type || "email_verification");

    return res.status(200).json({
      data: result,
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
    return res.status(400).json({ error: { message } });
  }
}

