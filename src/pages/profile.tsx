import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import Navbar from "@/components/general/Navbar";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function ProfilePage() {
  return (
    <div
      className={`${geistSans.className} ${geistMono.className} min-h-screen flex flex-col bg-background`}
    >
      <Navbar />
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-20">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Profil</h1>
            <p className="text-muted-foreground mt-1">
              Lengkapi data profil Anda sesuai informasi di akun.
            </p>
          </div>
          <ProfileForm />
        </div>
      </main>
    </div>
  );
}

export async function getServerSideProps(
  context: Parameters<GetServerSideProps>[0]
) {
  const session = await getServerSession(
    context.req,
    context.res,
    authOptions
  );
  if (!session) {
    return {
      redirect: {
        destination: `/auth/login?callbackUrl=${encodeURIComponent("/profile")}`,
        permanent: false,
      },
    };
  }
  return { props: {} };
}
