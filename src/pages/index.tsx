import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/general/Navbar";
import { UnifiedMap } from "@/components/map/UnifiedMap";
import { Card } from "@/components/ui/card";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div
      className={`${geistSans.className} ${geistMono.className} flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black`}
    >
      <Navbar />
      <Card className="h-screen p-0 overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0">
          <UnifiedMap />
        </div>
      </Card>
    </div>
  );
}
