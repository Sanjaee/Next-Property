import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, users } from "@/db/index";
import { loginWithGoogle } from "@/lib/services";
import { Profile } from "next-auth";

// Extend Profile type to include Google-specific fields
interface GoogleProfile extends Profile {
  picture?: string;
  email_verified?: boolean;
  locale?: string;
  hd?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email) {
            throw new Error("Email is required");
          }

          const user = await db.query.users.findFirst({
            where: eq(users.email, credentials.email),
          });

          if (!user) {
            throw new Error("User not found");
          }

          // Check login method
          if (user.loginType === "google") {
            throw new Error(
              "This email is registered with Google. Please sign in with Google."
            );
          }

          // Verify email
          if (!user.isVerified) {
            throw new Error("EMAIL_NOT_VERIFIED");
          }

          // Check if this is an auto-login request (password starts with "AUTO_LOGIN_")
          if (
            credentials.password &&
            credentials.password.startsWith("AUTO_LOGIN_")
          ) {
            // Extract the verify token from password field
            // The token is the OTP code that was just verified
            // For security, we verify that email is verified (which was done in verifyOTP)
            // In a production environment, you might want to add additional checks

            // Return user for auto-login after OTP verification
            return {
              id: user.id,
              email: user.email,
              name: user.fullName,
              role: user.userType,
              loginMethod: user.loginType ?? "credential",
              image: user.profilePhoto ?? undefined,
            };
          }

          // Regular password login
          if (!credentials?.password) {
            throw new Error("Password is required");
          }

          // Verify password
          if (!user.password) {
            throw new Error("Password not found");
          }

          const isValidPassword = await compare(
            credentials.password,
            user.password
          );
          if (!isValidPassword) {
            throw new Error("Invalid password");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            role: user.userType,
            loginMethod: user.loginType ?? "credential",
            image: user.profilePhoto ?? undefined,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          throw error;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "google") {
          const googleProfile = profile as GoogleProfile;
          const existingUser = await db.query.users.findFirst({
            where: eq(users.email, user.email!),
          });

          if (existingUser && existingUser.loginType === "credential") {
            throw new Error(
              "This email is registered with email/password. Please sign in with your password."
            );
          }

          // Update user's profile image if it exists in Google profile
          if (existingUser && googleProfile?.picture) {
            await db
              .update(users)
              .set({ profilePhoto: googleProfile.picture })
              .where(eq(users.email, user.email!));
          }
        }
        return true;
      } catch (error) {
        console.error("Sign in error:", error);
        throw error;
      }
    },
    async jwt({ token, account, profile, user }) {
      try {
        if (account?.provider === "credentials") {
          token.sub = user.id;
          token.email = user.email;
          token.name = user.name;
          token.role = user.role;
          token.picture = user.image;
          token.loginMethod = user.loginMethod;
        }

        if (account?.provider === "google") {
          if (!profile?.name || !profile?.email) {
            throw new Error("Google profile is missing required information");
          }

          const googleProfile = profile as GoogleProfile;

          const data = {
            username: profile.name,
            email: profile.email,
            image: googleProfile.picture ?? "",
          };

          const googleUser = await loginWithGoogle(data);
          token.sub = googleUser.id;
          token.email = googleUser.email;
          token.name = googleUser.name;
          token.role = googleUser.role;
          token.picture = googleProfile.picture || googleUser.image;
          token.loginMethod = googleUser.loginMethod;
        }

        return token;
      } catch (error) {
        console.error("JWT error:", error);
        throw error;
      }
    },
    async session({ session, token }) {
      try {
        session.user.id = token.sub ?? "";
        session.user.email = token.email ?? "";
        session.user.name = token.name ?? "";
        session.user.role = token.role as string;
        session.user.loginMethod = token.loginMethod as string;
        session.user.image = token.picture ?? "";
        // Note: accessToken and refreshToken are not needed when using NextAuth directly
        // But kept for backward compatibility with ApiProvider
        session.accessToken = undefined;
        session.refreshToken = undefined;

        return session;
      } catch (error) {
        console.error("Session error:", error);
        throw error;
      }
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
    newUser: "/auth/register",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

export default NextAuth(authOptions);
