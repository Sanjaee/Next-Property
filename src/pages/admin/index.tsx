import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import Navbar from "@/components/general/Navbar";
import { Geist, Geist_Mono } from "next/font/google";
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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

interface RoleStat {
  role: string;
  count: number;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<RoleStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil data");
        return res.json();
      })
      .then((data: { users: UserRow[]; stats: RoleStat[] }) => {
        setUsers(data.users);
        setStats(data.stats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      className={`${geistSans.className} ${geistMono.className} min-h-screen flex flex-col bg-background`}
    >
      <Navbar />
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-24">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Kelola semua user yang terdaftar di sistem.
            </p>
          </div>

          {stats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>User per Role</CardTitle>
                <CardDescription>Distribusi jumlah user berdasarkan role</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="role"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                        formatter={(value: number) => [value, "Jumlah"]}
                        labelFormatter={(label) => `Role: ${label}`}
                      />
                      <Bar
                        dataKey="count"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Daftar User</CardTitle>
              <CardDescription>Semua user yang telah mendaftar</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground py-8 text-center">Memuat data...</p>
              ) : (
                <Table>
                  <TableCaption>Total {users.length} user terdaftar</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Login</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Terdaftar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.fullName}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              u.userType === "admin"
                                ? "default"
                                : u.userType === "premium"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {u.userType}
                          </Badge>
                        </TableCell>
                        <TableCell>{u.loginType}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            <Badge variant={u.isVerified ? "default" : "secondary"} className="text-xs">
                              {u.isVerified ? "Verified" : "Pending"}
                            </Badge>
                            {!u.isActive && (
                              <Badge variant="destructive" className="text-xs">
                                Nonaktif
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {u.createdAt
                            ? format(new Date(u.createdAt), "dd MMM yyyy")
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
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
  if (session.user?.role !== "admin") {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }
  return { props: {} };
};
