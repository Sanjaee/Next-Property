"use client";

import React from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useRouter } from "next/router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMapUI } from "@/components/contex/MapUIContext";
import { LogOut, User, Settings, Moon, Sun, Plus, Map, Check } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const mapUI = useMapUI();
  const router = useRouter();
  const isLoading = status === "loading";

  const handleSignIn = () => {
    signIn(undefined, { callbackUrl: router.asPath });
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo/Brand */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.push("/")}
            variant="ghost"
            className="font-semibold text-lg hover:opacity-80 transition-opacity mr-4"
          >
            Zacode
          </Button>
        </div>

        {/* Right side - Auth */}
        <div className="flex items-center gap-3">
          {!session?.user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative shrink-0 size-9"
            >
              <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle dark mode</span>
            </Button>
          )}
          {session?.user && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/properti/tambah")}
              className="shrink-0"
            >
              <Plus className="size-4 mr-1.5" />
              Tambah Properti
            </Button>
          )}
          {isLoading ? (
            <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
          ) : session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <Avatar className="h-9 w-9 ring-2 ring-offset-2 ring-offset-background ring-ring">
                    <AvatarImage
                      src={session.user.image || undefined}
                      alt={session.user.name || "User"}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(session.user.name, session.user.email)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col space-y-1 p-0">
                  <div className="flex items-center gap-3 px-2 py-1.5">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={session.user.image || undefined}
                        alt={session.user.name || "User"}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(session.user.name, session.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {session.user.name || "User"}
                      </span>
                      {session.user.email && (
                        <span className="text-xs font-normal text-muted-foreground">
                          {session.user.email}
                        </span>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="cursor-pointer"
                >
                  {theme === "dark" ? (
                    <Sun className="mr-2 h-4 w-4" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4" />
                  )}
                  {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
                </DropdownMenuItem>
                {mapUI && (
                  <DropdownMenuItem
                    onClick={() => mapUI.setShowViewportOverlay(!mapUI.showViewportOverlay)}
                    className="cursor-pointer justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Map className="h-4 w-4" />
                      Viewport (lng, lat, zoom)
                    </span>
                    {mapUI.showViewportOverlay && (
                      <Check className="h-4 w-4" />
                    )}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("/profile")}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/settings")}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                  variant="destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={handleSignIn} variant="default">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}

