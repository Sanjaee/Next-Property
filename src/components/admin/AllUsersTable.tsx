"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import {
  Search,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Users,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

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

interface AllUsersTableProps {
  users: UserRow[];
  loading?: boolean;
  onRefresh?: () => void;
  onDelete?: (user: UserRow) => void;
}

export function AllUsersTable({
  users,
  loading,
  onRefresh,
  onDelete,
}: AllUsersTableProps) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [methodFilter, setMethodFilter] = React.useState<string>("all");
  const [globalFilter, setGlobalFilter] = React.useState("");

  const columns: ColumnDef<UserRow>[] = React.useMemo(
    () => [
      {
        accessorKey: "fullName",
        header: "Nama",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.fullName}</span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "userType",
        header: "Role",
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.userType === "admin"
                ? "default"
                : row.original.userType === "premium"
                  ? "secondary"
                  : "outline"
            }
          >
            {row.original.userType}
          </Badge>
        ),
      },
      {
        accessorKey: "loginType",
        header: "Metode Login",
        cell: ({ row }) => (
          <Badge
            variant={row.original.loginType === "google" ? "secondary" : "outline"}
            className={
              row.original.loginType === "google"
                ? "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30"
                : "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30"
            }
          >
            {row.original.loginType === "google" ? "Google" : "Credentials"}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Tanggal Daftar",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.createdAt
              ? format(new Date(row.original.createdAt), "dd MMM yyyy")
              : "-"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        id: "status",
        accessorFn: (row) => (row.isActive && row.isVerified ? "aktif" : "pending"),
        cell: ({ row }) => (
          <Badge
            variant={row.original.isActive && row.original.isVerified ? "default" : "secondary"}
            className={
              row.original.isActive && row.original.isVerified
                ? "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30"
                : ""
            }
          >
            {row.original.isActive && row.original.isVerified ? "Aktif" : "Pending"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Aksi</span>,
        cell: ({ row }) =>
          onDelete ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete(row.original)}
              aria-label="Hapus user"
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null,
      },
    ],
    [onDelete]
  );

  const filteredData = React.useMemo(() => {
    return users.filter((u) => {
      if (statusFilter === "aktif" && (!u.isActive || !u.isVerified)) return false;
      if (statusFilter === "pending" && u.isActive && u.isVerified) return false;
      if (methodFilter === "credential" && u.loginType !== "credential") return false;
      if (methodFilter === "google" && u.loginType !== "google") return false;
      return true;
    });
  }, [users, statusFilter, methodFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const search = String(filterValue).toLowerCase();
      if (!search) return true;
      const fullName = String(row.original.fullName ?? "").toLowerCase();
      const email = String(row.original.email ?? "").toLowerCase();
      const userType = String(row.original.userType ?? "").toLowerCase();
      return (
        fullName.includes(search) ||
        email.includes(search) ||
        userType.includes(search)
      );
    },
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  const filteredRows = table.getFilteredRowModel().rows;

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="size-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">User Terdaftar</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Daftar pengguna yang terdaftar di sistem ({filteredData.length} user)
            </p>
          </div>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
              <RefreshCw
                className={`size-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan nama, email, atau role..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border p-0.5">
              <Button
                variant={statusFilter === "all" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setStatusFilter("all")}
              >
                Semua
              </Button>
              <Button
                variant={statusFilter === "aktif" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setStatusFilter("aktif")}
              >
                Aktif
              </Button>
              <Button
                variant={statusFilter === "pending" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setStatusFilter("pending")}
              >
                Pending
              </Button>
            </div>
            <div className="flex rounded-md border p-0.5">
              <Button
                variant={methodFilter === "all" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setMethodFilter("all")}
              >
                Semua Metode
              </Button>
              <Button
                variant={methodFilter === "credential" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setMethodFilter("credential")}
              >
                Credentials
              </Button>
              <Button
                variant={methodFilter === "google" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setMethodFilter("google")}
              >
                Google
              </Button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Memuat data...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {filteredRows.length ? (
                  filteredRows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Tidak ada hasil.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between gap-4 px-4 py-4 border-t">
            <div className="hidden text-sm text-muted-foreground sm:block">
              {table.getFilteredRowModel().rows.length} baris
            </div>
            <div className="flex w-full items-center justify-center gap-6 sm:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Baris per halaman</span>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) =>
                    table.setPageSize(Number(value))
                  }
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 30, 50].map((size) => (
                      <SelectItem key={size} value={`${size}`}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount() || 1}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronsLeft className="size-4" />
                    <span className="sr-only">First page</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronLeft className="size-4" />
                    <span className="sr-only">Previous</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronRight className="size-4" />
                    <span className="sr-only">Next</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() =>
                      table.setPageIndex(table.getPageCount() - 1)
                    }
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronsRight className="size-4" />
                    <span className="sr-only">Last page</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
