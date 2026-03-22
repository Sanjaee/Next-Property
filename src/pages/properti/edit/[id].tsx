import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import Navbar from "@/components/general/Navbar";
import { PropertiEditForm } from "@/components/properti/PropertiEditForm";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function EditPropertiPage({ id }: { id: string }) {
  return (
    <div
      className={`${geistSans.className} ${geistMono.className} min-h-screen flex flex-col bg-background`}
    >
      <Navbar />
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-20">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Properti</h1>
            <p className="text-muted-foreground mt-1">
              Ubah data properti Anda.
            </p>
          </div>
          <PropertiEditForm editId={id} />
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    return {
      redirect: {
        destination: `/auth/login?callbackUrl=${encodeURIComponent(context.resolvedUrl || "/properti/tambah")}`,
        permanent: false,
      },
    };
  }
  const id = context.params?.id as string;
  if (!id) {
    return { redirect: { destination: "/properti/tambah", permanent: false } };
  }
  return { props: { id } };
};
