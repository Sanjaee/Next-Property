import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import Navbar from "@/components/general/Navbar";
import { PropertiListUser } from "@/components/properti/PropertiListUser";
import { PropertiTambahForm } from "@/components/properti/PropertiTambahForm";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function TambahPropertiPage() {
  return (
    <div
      className={`${geistSans.className} ${geistMono.className} min-h-screen flex flex-col bg-background`}
    >
      <Navbar />
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-20">
        <div className="space-y-6">
          <PropertiListUser />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tambah Properti</h1>
            <p className="text-muted-foreground mt-1">
              Lengkapi form untuk mempublikasikan properti di peta.
            </p>
          </div>
          <PropertiTambahForm />
        </div>
      </main>
    </div>
  );
}

export async function getServerSideProps(context: Parameters<GetServerSideProps>[0]) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    return {
      redirect: {
        destination: `/auth/login?callbackUrl=${encodeURIComponent("/properti/tambah")}`,
        permanent: false,
      },
    };
  }
  return { props: {} };
}
