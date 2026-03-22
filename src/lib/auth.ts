import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, users, otpCodes, sessions } from "@/db/index";
import { eq, and, gt } from "drizzle-orm";
import { generateOTP, sendVerificationEmail, sendVerificationEmailResetPassword } from "./nodemailer";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";
const ACCESS_TOKEN_EXPIRES = "15m";
const REFRESH_TOKEN_EXPIRES = "7d";

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

/**
 * Verify password against hash
 */
export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Generate JWT access token
 */
export const generateAccessToken = (userId: string, email: string, role: string): string => {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId, type: "refresh" },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES }
  );
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): jwt.JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
  } catch {
    return null;
  }
};

/**
 * Register new user
 */
export const registerUser = async (data: {
  email: string;
  password: string;
  fullName: string;
  userType?: string;
}) => {
  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });

  if (existingUser) {
    if (existingUser.loginType === "google") {
      throw new Error("Email sudah terdaftar dengan Google. Silakan login menggunakan Google Sign In.");
    }
    throw new Error("Email sudah terdaftar. Silakan login.");
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create user
  const [newUser] = await db
    .insert(users)
    .values({
      email: data.email,
      password: hashedPassword,
      fullName: data.fullName,
      userType: (data.userType as "member" | "admin" | "moderator") || "member",
      loginType: "credential",
      isVerified: false,
    })
    .returning();

  // Generate and save OTP
  const otpCode = generateOTP();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await db.insert(otpCodes).values({
    userId: newUser.id,
    email: data.email,
    otpCode,
    type: "email_verification",
    expiresAt,
  });

  // Send verification email
  await sendVerificationEmail(data.email, data.fullName, otpCode);

  return {
    user: newUser,
    requires_verification: true,
  };
};

/**
 * Login user with email/password
 */
export const loginUser = async (email: string, password: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    throw new Error("Email atau password salah.");
  }

  if (user.loginType === "google") {
    throw new Error("Email terdaftar dengan Google. Silakan login menggunakan Google Sign In.");
  }

  if (!user.password) {
    throw new Error("Password tidak ditemukan. Silakan reset password.");
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    throw new Error("Email atau password salah.");
  }

  if (!user.isVerified) {
    // Generate new OTP for verification
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.insert(otpCodes).values({
      userId: user.id,
      email: user.email,
      otpCode,
      type: "email_verification",
      expiresAt,
    });

    await sendVerificationEmail(user.email, user.fullName, otpCode);

    return {
      user,
      requires_verification: true,
      verification_token: otpCode,
    };
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.email, user.userType);
  const refreshToken = generateRefreshToken(user.id);

  // Save refresh token to sessions
  await db.insert(sessions).values({
    userId: user.id,
    refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  // Update last login
  await db
    .update(users)
    .set({ lastLogin: new Date() })
    .where(eq(users.id, user.id));

  return {
    user,
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 15 * 60, // 15 minutes in seconds
  };
};

/**
 * Verify OTP code
 */
export const verifyOTP = async (email: string, otpCode: string, type: string = "email_verification") => {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    throw new Error("User tidak ditemukan.");
  }

  // Find valid OTP
  const validOtp = await db.query.otpCodes.findFirst({
    where: and(
      eq(otpCodes.userId, user.id),
      eq(otpCodes.otpCode, otpCode),
      eq(otpCodes.type, type),
      eq(otpCodes.isUsed, false),
      gt(otpCodes.expiresAt, new Date())
    ),
  });

  if (!validOtp) {
    throw new Error("Kode OTP tidak valid atau sudah kadaluarsa.");
  }

  // Mark OTP as used
  await db
    .update(otpCodes)
    .set({ isUsed: true })
    .where(eq(otpCodes.id, validOtp.id));

  // If email verification, update user
  if (type === "email_verification") {
    await db
      .update(users)
      .set({ isVerified: true })
      .where(eq(users.id, user.id));
  }

  // Return user data for auto-login (using AUTO_LOGIN_ pattern)
  // No JWT tokens needed - NextAuth will handle authentication
  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.fullName,
      role: user.userType,
      loginMethod: user.loginType ?? "credential",
      image: user.profilePhoto ?? undefined,
    },
  };
};

/**
 * Resend OTP code
 */
export const resendOTP = async (email: string, type: string = "email_verification") => {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    throw new Error("User tidak ditemukan.");
  }

  // Generate new OTP
  const otpCode = generateOTP();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.insert(otpCodes).values({
    userId: user.id,
    email: user.email,
    otpCode,
    type,
    expiresAt,
  });

  // Send email based on type
  if (type === "password_reset") {
    await sendVerificationEmailResetPassword(user.email, user.fullName, otpCode);
  } else {
    await sendVerificationEmail(user.email, user.fullName, otpCode);
  }

  return { message: "OTP telah dikirim ulang." };
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    // Return success even if user not found (security best practice)
    return { message: "Jika email terdaftar, OTP telah dikirim." };
  }

  if (user.loginType === "google") {
    throw new Error("Akun ini terdaftar dengan Google. Silakan login menggunakan Google Sign In.");
  }

  // Generate OTP
  const otpCode = generateOTP();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.insert(otpCodes).values({
    userId: user.id,
    email: user.email,
    otpCode,
    type: "password_reset",
    expiresAt,
  });

  await sendVerificationEmailResetPassword(user.email, user.fullName, otpCode);

  return { message: "OTP reset password telah dikirim." };
};

/**
 * Reset password with OTP
 */
export const resetPassword = async (email: string, otpCode: string, newPassword: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    throw new Error("User tidak ditemukan.");
  }

  // Verify OTP
  const validOtp = await db.query.otpCodes.findFirst({
    where: and(
      eq(otpCodes.userId, user.id),
      eq(otpCodes.otpCode, otpCode),
      eq(otpCodes.type, "password_reset"),
      eq(otpCodes.isUsed, false),
      gt(otpCodes.expiresAt, new Date())
    ),
  });

  if (!validOtp) {
    throw new Error("Kode OTP tidak valid atau sudah kadaluarsa.");
  }

  // Mark OTP as used
  await db
    .update(otpCodes)
    .set({ isUsed: true })
    .where(eq(otpCodes.id, validOtp.id));

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  await db
    .update(users)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  // Generate tokens for auto-login
  const accessToken = generateAccessToken(user.id, user.email, user.userType);
  const refreshToken = generateRefreshToken(user.id);

  await db.insert(sessions).values({
    userId: user.id,
    refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return {
    user,
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 15 * 60,
  };
};

/**
 * Google OAuth login/register
 */
export const googleOAuth = async (data: {
  email: string;
  fullName: string;
  profilePhoto: string;
  googleId: string;
}) => {
  let user = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });

  if (user) {
    // User exists
    if (user.loginType === "credential") {
      throw new Error("Email sudah terdaftar dengan password. Silakan login dengan email dan password.");
    }

    // Update Google ID if not set
    if (!user.googleId) {
      await db
        .update(users)
        .set({ googleId: data.googleId, profilePhoto: data.profilePhoto })
        .where(eq(users.id, user.id));
    }
  } else {
    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        email: data.email,
        fullName: data.fullName,
        profilePhoto: data.profilePhoto,
        googleId: data.googleId,
        loginType: "google",
        isVerified: true,
        userType: "member",
      })
      .returning();

    user = newUser;
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.email, user.userType);
  const refreshToken = generateRefreshToken(user.id);

  await db.insert(sessions).values({
    userId: user.id,
    refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // Update last login
  await db
    .update(users)
    .set({ lastLogin: new Date() })
    .where(eq(users.id, user.id));

  return {
    user,
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 15 * 60,
  };
};

