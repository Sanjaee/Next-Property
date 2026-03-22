"use client";

import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import Navbar from "@/components/general/Navbar";
import { Geist, Geist_Mono } from "next/font/google";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Shield } from "lucide-react";
import { AllUsersTable } from "@/components/admin/AllUsersTable";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

interface RegistrationByDate {
  date: string;
  admin: number;
  member: number;
  premium: number;
}

interface UserStats {
  total: number;
  by_type: { admin: number; member: number; premium: number };
  by_verification: { verified: number; unverified: number };
}

interface UserRow {
  id: string;
  email: string;
  username: string | null;
  fullName: string;
  phone: string | null;
  userType: string;
  isActive: boolean;
  isVerified: boolean;
  loginType: string;
  createdAt: string;
}

const areaChartConfig = {
  visitors: { label: "Registrations" },
  admin: { label: "Admin", color: "var(--chart-1)" },
  member: { label: "Member", color: "var(--chart-2)" },
  premium: { label: "Premium", color: "var(--chart-3)" },
} satisfies ChartConfig;

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [registrationsByDate, setRegistrationsByDate] = useState<RegistrationByDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = React.useState("90d");

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Gagal mengambil data");
      const data = await res.json();
      setStats(data.stats);
      setUsers(data.users ?? []);
      setRegistrationsByDate(data.registrationsByDate ?? []);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !session) {
      router.replace(`/auth/login?callbackUrl=${encodeURIComponent("/admin")}`);
      return;
    }
    const role = (session.user as { role?: string })?.role;
    if (role !== "admin") {
      router.replace("/");
      return;
    }
    loadData();
  }, [session, status, router, loadData]);

  const filteredRegistrations = React.useMemo(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return registrationsByDate.filter((d) => new Date(d.date) >= cutoff);
  }, [registrationsByDate, timeRange]);

  return (
    <div className={`${geistSans.className} ${geistMono.className} min-h-screen flex flex-col bg-zinc-100 dark:bg-zinc-950`}>
      <Navbar />
      <main className="flex-1 pt-24 pb-8">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                Admin Dashboard
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Kelola user dan lihat statistik platform
              </p>
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="py-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Semua user terdaftar</p>
                </CardContent>
              </Card>

              <Card className="py-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Admin</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.by_type.admin}</div>
                  <p className="text-xs text-muted-foreground">User admin</p>
                </CardContent>
              </Card>

              <Card className="py-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Verified</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.by_verification.verified}</div>
                  <p className="text-xs text-muted-foreground">Email terverifikasi</p>
                </CardContent>
              </Card>

              <Card className="py-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unverified</CardTitle>
                  <UserX className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.by_verification.unverified}</div>
                  <p className="text-xs text-muted-foreground">Belum verifikasi</p>
                </CardContent>
              </Card>
            </div>
          )}

          {stats && (
            <Card className="pt-0 mb-6">
              <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                <div className="grid flex-1 gap-1">
                  <CardTitle>User Registration - Interactive</CardTitle>
                  <CardDescription>
                    Jumlah registrasi user berdasarkan role (stacked)
                  </CardDescription>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger
                    className="w-[160px] rounded-lg sm:ml-auto"
                    aria-label="Pilih periode"
                  >
                    <SelectValue placeholder="Last 3 months" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="90d" className="rounded-lg">
                      Last 3 months
                    </SelectItem>
                    <SelectItem value="30d" className="rounded-lg">
                      Last 30 days
                    </SelectItem>
                    <SelectItem value="7d" className="rounded-lg">
                      Last 7 days
                    </SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer
                  config={areaChartConfig}
                  className="aspect-auto h-[250px] w-full"
                >
                  <AreaChart data={filteredRegistrations}>
                    <defs>
                      <linearGradient id="fillAdmin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-admin)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-admin)" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="fillMember" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-member)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-member)" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="fillPremium" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-premium)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-premium)" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={32}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => {
                            return new Date(value).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            });
                          }}
                          indicator="dot"
                        />
                      }
                    />
                    <Area
                      dataKey="member"
                      type="natural"
                      fill="url(#fillMember)"
                      stroke="var(--color-member)"
                      stackId="a"
                    />
                    <Area
                      dataKey="admin"
                      type="natural"
                      fill="url(#fillAdmin)"
                      stroke="var(--color-admin)"
                      stackId="a"
                    />
                    <Area
                      dataKey="premium"
                      type="natural"
                      fill="url(#fillPremium)"
                      stroke="var(--color-premium)"
                      stackId="a"
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          <AllUsersTable
            users={users}
            loading={loading}
            onRefresh={loadData}
          />
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
        destination: `/auth/login?callbackUrl=${encodeURIComponent("/admin")}`,
        permanent: false,
      },
    };
  }
  if ((session.user as { role?: string })?.role !== "admin") {
    return { redirect: { destination: "/", permanent: false } };
  }
  return { props: {} };
};
