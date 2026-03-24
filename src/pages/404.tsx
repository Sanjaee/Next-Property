import Link from "next/link";
import Navbar from "@/components/general/Navbar";
import { Button } from "@/components/ui/button";
import { Geist, Geist_Mono } from "next/font/google";
import { Home } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function NotFoundPage() {
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} min-h-screen flex flex-col bg-background font-sans text-foreground`}
    >
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="mx-auto max-w-md text-center space-y-6">
          <p className="text-7xl sm:text-8xl font-bold tabular-nums text-muted-foreground/30">
            404
          </p>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Halaman tidak ditemukan
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Alamat yang Anda buka tidak ada atau sudah dipindahkan. Silakan kembali ke
              beranda untuk melanjutkan.
            </p>
          </div>
          <Button
            asChild
            className="bg-foreground text-background hover:bg-foreground/90 gap-2"
          >
            <Link href="/">
              <Home className="size-4" />
              Kembali ke beranda
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
