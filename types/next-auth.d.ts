import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    loginMethod: string;
    image?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      loginMethod: string;
      image?: string;
    };
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
    email?: string;
    name?: string;
    role?: string;
    picture?: string;
    loginMethod?: string;
  }
}

