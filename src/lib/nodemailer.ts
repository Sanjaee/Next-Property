import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send verification email for new user registration
 */
export const sendVerificationEmail = async (
  email: string,
  username: string,
  verificationToken: string
) => {
  const mailOptions = {
    from: `"Zacode Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email Address to Complete Registration",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #ffffff; padding: 40px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #333333; margin: 0; font-size: 24px;">Welcome to Zacode!</h1>
              </div>

              <!-- Content -->
              <div style="margin-bottom: 30px;">
                <p style="margin-bottom: 15px;">Hello <strong>${username}</strong>,</p>
                <p style="margin-bottom: 15px;">Thank you for signing up with Zacode! We're thrilled to have you on board.</p>
                <p style="margin-bottom: 15px;">To ensure the security of your account and access all the features, please use the following OTP to verify your email address:</p>
                
                <!-- OTP Box -->
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; margin: 25px 0;">
                  <span style="font-size: 28px; font-weight: bold; letter-spacing: 8px; color: #007bff;">
                    ${verificationToken}
                  </span>
                  <!-- Security Notice -->
                  <p style="margin: 15px 0 0 0; color: #6c757d; font-size: 14px;">
                    Kode ini akan kadaluarsa dalam 15 menit
                  </p>
                </div>
                
                <p style="margin-bottom: 15px;">Once your email is verified, you'll be ready to dive into Zacode's exciting features.</p>
                <p style="margin-bottom: 15px;">If you did not register with us, please ignore this email or contact our support team at <a href="mailto:support@zacode.com" style="color: #007bff; text-decoration: none;">support@zacode.com</a>.</p>
              </div>

              <!-- Footer -->
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
                <p style="margin-bottom: 10px;">Thank you for choosing Zacode!</p>
                <p style="margin: 0; color: #666666;">Best regards,<br>Zacode Team</p>
              </div>
            </div>

            <!-- Disclaimer -->
            <div style="text-align: center; margin-top: 20px; color: #999999; font-size: 12px;">
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return verificationToken;
  } catch (error: unknown) {
    console.error("Error sending verification email:", error);
    
    const errorMessage = error instanceof Error ? error.message : "";
    
    // Check if it's a Gmail sending limit error
    if (errorMessage.includes("Daily user sending limit exceeded")) {
      throw new Error("EMAIL_LIMIT_EXCEEDED");
    }
    
    // Check for other common email errors
    const errorCode = (error as { code?: string })?.code;
    if (errorCode === "EAUTH" || errorCode === "EENVELOPE") {
      throw new Error("EMAIL_CONFIG_ERROR");
    }
    
    // Generic email error
    throw new Error("EMAIL_SEND_ERROR");
  }
};

/**
 * Send OTP email for password reset
 */
export const sendVerificationEmailResetPassword = async (
  email: string,
  username: string,
  verificationToken: string
) => {
  const mailOptions = {
    from: `"Zacode Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset Password - Zacode Account Recovery",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Request</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #ffffff; padding: 40px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #333333; margin: 0; font-size: 24px;">Password Reset Request</h1>
              </div>

              <!-- Content -->
              <div style="margin-bottom: 30px;">
                <p style="margin-bottom: 15px;">Hi <strong>${username}</strong>,</p>
                <p style="margin-bottom: 15px;">Tidak perlu khawatir! Kami paham terkadang kita bisa lupa password. Kami siap membantu Anda mendapatkan akses kembali ke akun Anda.</p>
                <p style="margin-bottom: 15px;">Gunakan kode OTP di bawah ini untuk mereset password Anda:</p>
                
                <!-- OTP Box -->
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; margin: 25px 0;">
                  <span style="font-size: 28px; font-weight: bold; letter-spacing: 8px; color: #007bff;">
                    ${verificationToken}
                  </span>
                  <!-- Security Notice -->
                  <p style="margin: 15px 0 0 0; color: #dc3545; font-size: 14px;">
                    Kode ini akan kadaluarsa dalam 15 menit demi keamanan akun Anda
                  </p>
                </div>

                <!-- Security Reminders -->
                <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p style="margin: 0; color: #856404; font-size: 14px;">
                    🔒 Demi keamanan:
                    <br>• Jangan bagikan kode ini kepada siapapun
                    <br>• Tim Zacode tidak akan pernah meminta kode ini melalui telepon atau email
                  </p>
                </div>

                <p style="margin-bottom: 15px;">Jika Anda tidak meminta reset password, mohon abaikan email ini atau segera hubungi tim support kami di <a href="mailto:support@zacode.com" style="color: #007bff; text-decoration: none;">support@zacode.com</a> untuk melaporkan aktivitas mencurigakan.</p>
              </div>

              <!-- Footer -->
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
                <p style="margin-bottom: 10px;">Terima kasih telah mempercayai Zacode</p>
                <p style="margin: 0; color: #666666;">Salam hangat,<br>Tim Zacode</p>
              </div>
            </div>

            <!-- Disclaimer -->
            <div style="text-align: center; margin-top: 20px; color: #999999; font-size: 12px;">
              <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return verificationToken;
  } catch (error: unknown) {
    console.error("Error sending reset password email:", error);
    
    const errorMessage = error instanceof Error ? error.message : "";
    
    // Check if it's a Gmail sending limit error
    if (errorMessage.includes("Daily user sending limit exceeded")) {
      throw new Error("EMAIL_LIMIT_EXCEEDED");
    }
    
    // Check for other common email errors
    const errorCode = (error as { code?: string })?.code;
    if (errorCode === "EAUTH" || errorCode === "EENVELOPE") {
      throw new Error("EMAIL_CONFIG_ERROR");
    }
    
    // Generic email error
    throw new Error("EMAIL_SEND_ERROR");
  }
};

/**
 * Generate random 6-digit OTP code
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export { transporter };

