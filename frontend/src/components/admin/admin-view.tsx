"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  LogOut,
  ArrowLeft,
  Search,
  Loader2,
  Truck,
  Mail,
  Lock,
  Phone,
  MapPin,
  Package,
  Calendar,
  User,
  Scale,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAdmin } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import {
  listBookings,
  getBooking,
  updateBookingStatus,
  type Booking,
  type BookingWithHistory,
  ApiError,
} from "@/lib/api-client";
import { BOOKING_STATUSES, COMPANY } from "@/lib/constants";
import { StatusBadge } from "@/components/site/status-badge";
import { cn } from "@/lib/utils";

export function AdminView({ onBackToSite }: { onBackToSite: () => void }) {
  const { admin, loading, login, logout } = useAdmin();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!admin) {
    return <LoginView onLogin={login} onBackToSite={onBackToSite} />;
  }

  return (
    <DashboardView admin={admin} onLogout={logout} onBackToSite={onBackToSite} />
  );
}

/* --------------------------- LOGIN --------------------------- */
function LoginView({
  onLogin,
  onBackToSite,
}: {
  onLogin: (email: string, password: string) => Promise<unknown>;
  onBackToSite: () => void;
}) {
  const { toast } = useToast();
  const [email, setEmail] = useState("admin@ganrajlogistics.in");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    try {
      await onLogin(email, password);
      toast({ title: "Welcome back!", description: "Logged in successfully." });
    } catch (err) {
      toast({
        title: "Login failed",
        description:
          err instanceof ApiError ? err.message : "Invalid credentials.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-navy px-4 py-12">
      <div className="gls-grid-bg absolute inset-0 opacity-30" />
      <div className="absolute -right-24 top-10 size-72 rounded-full bg-brand/10 blur-3xl" />
      <Card className="relative w-full max-w-md border-white/10 bg-white shadow-2xl">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-navy text-white">
              <Truck className="size-7" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-navy">
              Admin Login
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {COMPANY.name} — Management Panel
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-navy">
                <Mail className="size-3.5 text-brand" /> Email
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ganrajlogistics.in"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-navy">
                <Lock className="size-3.5 text-brand" /> Password
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand text-white hover:bg-brand-600"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-navy">Demo credentials</p>
            <p className="mt-0.5">admin@ganrajlogistics.in / ganraj@123</p>
          </div>

          <button
            onClick={onBackToSite}
            className="mt-6 inline-flex w-full items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-navy"
          >
            <ArrowLeft className="size-4" /> Back to website
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------- DASHBOARD ------------------------- */
function DashboardView({
  admin,
  onLogout,
  onBackToSite,
}: {
  admin: { name: string; email: string };
  onLogout: () => Promise<void>;
  onBackToSite: () => void;
}) {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchBookings = useCallback(
    async (page: number) => {
      setLoadingList(true);
      try {
        const res = await listBookings({
          page,
          limit: 10,
          status: statusFilter,
          search: search.trim() || undefined,
        });
        setBookings(res.data);
        setPagination(res.pagination);
      } catch (err) {
        toast({
          title: "Failed to load bookings",
          description: err instanceof ApiError ? err.message : undefined,
          variant: "destructive",
        });
      } finally {
        setLoadingList(false);
      }
    },
    [statusFilter, search, toast]
  );

  useEffect(() => {
    fetchBookings(1);
  }, [statusFilter, search, fetchBookings]);

  const handleLogout = async () => {
    await onLogout();
    toast({ title: "Logged out" });
  };

  if (selectedId) {
    return (
      <BookingDetail
        id={selectedId}
        onBack={() => setSelectedId(null)}
        onRefreshList={() => fetchBookings(pagination.page)}
      />
    );
  }

  const statusCounts = BOOKING_STATUSES.map((s) => ({
    status: s,
    count: bookings.filter((b) => b.status === s).length,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-navy text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-white">
              <LayoutDashboard className="size-5" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-extrabold">Ganraj Logistics</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-brand">
                Admin Panel
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{admin.name}</p>
              <p className="text-xs text-white/60">{admin.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onBackToSite}
              className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="size-4" /> Site
            </Button>
            <Button
              size="sm"
              onClick={handleLogout}
              className="bg-brand text-white hover:bg-brand-600"
            >
              <LogOut className="size-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            label="Total"
            value={pagination.total}
            tone="navy"
          />
          {statusCounts.map((s) => (
            <StatCard
              key={s.status}
              label={s.status}
              value={s.count}
            />
          ))}
        </div>

        {/* Filters */}
        <Card className="mt-6 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by reference, name, phone, location…"
                  className="pl-9"
                />
              </div>
              <div className="w-full sm:w-56">
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {BOOKING_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={() => fetchBookings(pagination.page)}
                disabled={loadingList}
              >
                <RefreshCw
                  className={cn("size-4", loadingList && "animate-spin")}
                />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="mt-4 border-border shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto gls-scroll">
              <Table>
                <TableHeader>
                  <TableRow className="bg-navy hover:bg-navy">
                    <TableHead className="text-white">Reference</TableHead>
                    <TableHead className="text-white">Customer</TableHead>
                    <TableHead className="text-white">Route</TableHead>
                    <TableHead className="text-white">Vehicle</TableHead>
                    <TableHead className="text-white">Pickup Date</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingList ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((__, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : bookings.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-16 text-center text-muted-foreground"
                      >
                        <ShieldAlert className="mx-auto mb-2 size-8 text-muted-foreground/50" />
                        No booking requests found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookings.map((b) => (
                      <TableRow
                        key={b.id}
                        onClick={() => setSelectedId(b.id)}
                        className="cursor-pointer transition-colors hover:bg-brand/5"
                      >
                        <TableCell className="font-mono text-xs font-semibold text-navy">
                          {b.reference}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-navy">{b.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {b.phone}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[220px]">
                          <div className="truncate text-sm text-navy">
                            {b.pickupLocation}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ArrowLeft className="size-3 rotate-[-90deg]" />
                            <span className="truncate">{b.deliveryLocation}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-navy/80">
                          {b.vehicleType}
                        </TableCell>
                        <TableCell className="text-sm text-navy/80">
                          {b.pickupDate}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={b.status} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(b.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} ·{" "}
                {pagination.total} total
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1 || loadingList}
                  onClick={() => fetchBookings(pagination.page - 1)}
                >
                  <ChevronLeft className="size-4" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    pagination.page >= pagination.totalPages || loadingList
                  }
                  onClick={() => fetchBookings(pagination.page + 1)}
                >
                  Next <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "navy";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        tone === "navy"
          ? "border-navy bg-navy text-white"
          : "border-border bg-white"
      )}
    >
      <p
        className={cn(
          "text-xs font-medium",
          tone === "navy" ? "text-white/70" : "text-muted-foreground"
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-2xl font-extrabold",
          tone === "navy" ? "text-brand" : "text-navy"
        )}
      >
        {value}
      </p>
    </div>
  );
}

/* ---------------------- BOOKING DETAIL ---------------------- */
function BookingDetail({
  id,
  onBack,
  onRefreshList,
}: {
  id: string;
  onBack: () => void;
  onRefreshList: () => void;
}) {
  const { toast } = useToast();
  const [booking, setBooking] = useState<BookingWithHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBooking(id);
      setBooking(res.data);
    } catch (err) {
      toast({
        title: "Failed to load booking",
        description: err instanceof ApiError ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpdate = async () => {
    if (!booking || !newStatus) return;
    setUpdating(true);
    try {
      const res = await updateBookingStatus(booking.id, newStatus, note.trim() || undefined);
      setBooking(res.data);
      setNewStatus("");
      setNote("");
      onRefreshList();
      toast({
        title: "Status updated",
        description: `Marked as ${newStatus}`,
      });
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof ApiError ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-secondary">
        <p className="text-muted-foreground">Booking not found.</p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="size-4" /> Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <header className="sticky top-0 z-40 border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="size-4" /> Back to list
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-navy">
              {booking.reference}
            </span>
            <StatusBadge status={booking.status} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Details */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="border-border shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold text-navy">
                  Shipment Details
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Detail icon={User} label="Customer Name" value={booking.name} />
                  <Detail icon={Phone} label="Phone" value={booking.phone} />
                  {booking.email && (
                    <Detail icon={Mail} label="Email" value={booking.email} />
                  )}
                  <Detail
                    icon={MapPin}
                    label="Pickup Location"
                    value={booking.pickupLocation}
                  />
                  <Detail
                    icon={MapPin}
                    label="Delivery Location"
                    value={booking.deliveryLocation}
                  />
                  <Detail
                    icon={Package}
                    label="Material Type"
                    value={booking.materialType}
                  />
                  <Detail icon={Scale} label="Quantity" value={booking.quantity} />
                  <Detail icon={Truck} label="Vehicle Type" value={booking.vehicleType} />
                  <Detail icon={Calendar} label="Pickup Date" value={booking.pickupDate} />
                  <Detail
                    icon={ClipboardList}
                    label="Created"
                    value={new Date(booking.createdAt).toLocaleString("en-IN")}
                  />
                </div>
                {booking.notes && (
                  <div className="mt-4 rounded-lg bg-secondary p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Notes
                    </p>
                    <p className="mt-1 text-sm text-navy">{booking.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status timeline */}
            <Card className="border-border shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold text-navy">Status Timeline</h2>
                <ol className="mt-5 space-y-4 border-l-2 border-brand/30 pl-5">
                  {booking.history.map((h) => (
                    <li key={h.id} className="relative">
                      <span className="absolute -left-[23px] top-1.5 size-3 rounded-full border-2 border-white bg-brand" />
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={h.toStatus} />
                        {h.fromStatus && (
                          <span className="text-xs text-muted-foreground">
                            from {h.fromStatus}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(h.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {h.note && (
                        <p className="mt-1 text-sm text-navy/80">{h.note}</p>
                      )}
                      {h.admin && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          by {h.admin.name}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          {/* Status updater */}
          <div className="space-y-6">
            <Card className="border-navy/20 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold text-navy">Update Status</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Current: <StatusBadge status={booking.status} className="ml-1" />
                </p>
                <div className="mt-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-navy">
                      New status
                    </Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {BOOKING_STATUSES.filter((s) => s !== booking.status).map(
                          (s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-navy">
                      Note (optional)
                    </Label>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. Vehicle number assigned, ETA shared with customer…"
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={handleUpdate}
                    disabled={!newStatus || updating}
                    className="w-full bg-brand text-white hover:bg-brand-600"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Updating…
                      </>
                    ) : (
                      "Update Status"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-navy text-white shadow-sm">
              <CardContent className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                  Quick Contact
                </p>
                <a
                  href={`tel:${booking.phone}`}
                  className="mt-3 flex items-center gap-2 text-sm text-white/90 hover:text-brand"
                >
                  <Phone className="size-4 text-brand" /> {booking.phone}
                </a>
                {booking.email && (
                  <a
                    href={`mailto:${booking.email}`}
                    className="mt-2 flex items-center gap-2 break-all text-sm text-white/90 hover:text-brand"
                  >
                    <Mail className="size-4 shrink-0 text-brand" /> {booking.email}
                  </a>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-words text-sm font-semibold text-navy">
          {value}
        </p>
      </div>
    </div>
  );
}

