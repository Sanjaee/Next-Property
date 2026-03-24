import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { ApiProvider } from "@/components/contex/ApiProvider";
import { MapUIProvider } from "@/components/contex/MapUIContext";
import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { RouteLoadingProvider } from "@/components/general/RouteLoadingProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <div className={cn(geistSans.variable, geistMono.variable)}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <SessionProvider session={session}>
          <ApiProvider>
            <MapUIProvider>
              <RouteLoadingProvider>
                <Component {...pageProps} />
                <Toaster />
              </RouteLoadingProvider>
            </MapUIProvider>
          </ApiProvider>
        </SessionProvider>
      </ThemeProvider>
    </div>
  );
}
