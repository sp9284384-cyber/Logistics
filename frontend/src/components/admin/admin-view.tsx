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
  Send,
  DollarSign,
  CheckCircle2,
  MessageSquare,
  PhoneCall,
  ExternalLink,
  ShieldCheck,
  Navigation,
  Sparkles,
  Clock,
  UsersRound,
  Plus,
  Pencil,
  Trash2,
  Weight,
  X,
  AlertCircle,
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
  sendInvoiceToCustomer,
  assignDriverToBooking,
  listFleetDrivers,
  createFleetDriver,
  updateFleetDriver,
  deleteFleetDriver,
  type Booking,
  type BookingWithHistory,
  type DriverProfile,
  ApiError,
} from "@/lib/api-client";
import { BOOKING_STATUSES, COMPANY } from "@/lib/constants";
import { StatusBadge } from "@/components/site/status-badge";
import { cn } from "@/lib/utils";

export function AdminView({ onBackToSite }: { onBackToSite: () => void }) {
  const { admin, loading, login, logout } = useAdmin();
  const { toast } = useToast();

  // Inactivity Auto-Logout (15 minutes of idle time)
  useEffect(() => {
    if (!admin) return;

    const INACTIVITY_MS = 15 * 60 * 1000; // 15 mins
    let idleTimer: NodeJS.Timeout;

    const triggerLogout = async () => {
      await logout();
      toast({
        title: "Session Expired",
        description: "You were automatically logged out due to inactivity for security.",
        variant: "destructive",
      });
    };

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      try {
        localStorage.setItem("gls_last_active", String(Date.now()));
      } catch {}
      idleTimer = setTimeout(triggerLogout, INACTIVITY_MS);
    };

    const checkBackgroundElapsed = () => {
      try {
        const last = parseInt(localStorage.getItem("gls_last_active") || "0", 10);
        if (last && Date.now() - last > INACTIVITY_MS) {
          triggerLogout();
          return;
        }
      } catch {}
      resetIdleTimer();
    };

    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    activityEvents.forEach((ev) =>
      window.addEventListener(ev, resetIdleTimer, { passive: true })
    );
    window.addEventListener("focus", checkBackgroundElapsed);

    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      activityEvents.forEach((ev) =>
        window.removeEventListener(ev, resetIdleTimer)
      );
      window.removeEventListener("focus", checkBackgroundElapsed);
    };
  }, [admin, logout, toast]);

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    if (!cleanEmail || !cleanPassword) return;
    setSubmitting(true);
    try {
      await onLogin(cleanEmail, cleanPassword);
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
                <Mail className="size-3.5 text-brand" /> Email or Username
              </Label>
              <Input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email or username"
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
                placeholder="Enter password"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand text-white hover:bg-brand-600 font-semibold"
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
  const [activeTab, setActiveTab] = useState<"bookings" | "fleet">("bookings");
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
            {/* Tab nav */}
            <div className="hidden sm:flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 p-1">
              <button
                onClick={() => setActiveTab("bookings")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
                  activeTab === "bookings"
                    ? "bg-brand text-white shadow"
                    : "text-white/70 hover:text-white"
                )}
              >
                <ClipboardList className="size-3.5" /> Bookings
              </button>
              <button
                onClick={() => setActiveTab("fleet")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
                  activeTab === "fleet"
                    ? "bg-brand text-white shadow"
                    : "text-white/70 hover:text-white"
                )}
              >
                <UsersRound className="size-3.5" /> Fleet
              </button>
            </div>
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
        {/* Mobile tab nav */}
        <div className="flex sm:hidden border-t border-white/10">
          <button
            onClick={() => setActiveTab("bookings")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-all",
              activeTab === "bookings" ? "border-b-2 border-brand text-brand" : "text-white/60"
            )}
          >
            <ClipboardList className="size-3.5" /> Bookings
          </button>
          <button
            onClick={() => setActiveTab("fleet")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-all",
              activeTab === "fleet" ? "border-b-2 border-brand text-brand" : "text-white/60"
            )}
          >
            <UsersRound className="size-3.5" /> Fleet
          </button>
        </div>
      </header>

      {activeTab === "fleet" ? (
        <FleetView />
      ) : (
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
                          {b.totalAmount ? (
                            <span className="inline-block mt-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              ₹{b.totalAmount.toLocaleString("en-IN")}
                            </span>
                          ) : null}
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
                          <div>{b.vehicleType}</div>
                          {b.driverName && (
                            <div className="text-[11px] text-brand font-medium truncate">
                              {b.driverName} ({b.vehicleNumber || "Assigned"})
                            </div>
                          )}
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
      )}
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

/* ─────────────────── FLEET VIEW ─────────────────── */
const VEHICLE_TYPES = [
  "Mini Truck (Tempo)", "Small Truck (Tata Ace / Bolero Pickup)",
  "Medium Truck (14ft / 17ft)", "Large Truck (20ft / 24ft)",
  "Full Truck Load (22 Wheeler)", "Flatbed Trailer",
  "Refrigerated Truck", "Tanker", "Container Truck",
];
const DRIVER_STATUSES = ["Available", "On Trip", "Off Duty"];

type DriverFormData = {
  name: string; phone: string; vehicle_number: string;
  vehicle_type: string; capacity_tons: number;
  status: string; license_number: string; notes: string;
};

function FleetView() {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editDriver, setEditDriver] = useState<DriverProfile | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyForm: DriverFormData = {
    name: "", phone: "", vehicle_number: "", vehicle_type: VEHICLE_TYPES[2],
    capacity_tons: 15, status: "Available", license_number: "", notes: "",
  };
  const [form, setForm] = useState<DriverFormData>(emptyForm);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listFleetDrivers(statusFilter);
      setDrivers(data);
    } catch (err) {
      toast({
        title: "Failed to load fleet",
        description: err instanceof ApiError ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const openAdd = () => { setEditDriver(null); setForm(emptyForm); setShowForm(true); };

  const openEdit = (d: DriverProfile) => {
    setEditDriver(d);
    setForm({
      name: d.name, phone: d.phone, vehicle_number: d.vehicleNumber,
      vehicle_type: d.vehicleType, capacity_tons: d.capacityTons,
      status: d.status, license_number: d.licenseNumber || "", notes: d.notes || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.vehicle_number.trim()) {
      toast({ title: "Name, phone and vehicle number are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editDriver) {
        await updateFleetDriver(editDriver.id, {
          name: form.name, phone: form.phone, vehicle_number: form.vehicle_number,
          vehicle_type: form.vehicle_type, capacity_tons: form.capacity_tons,
          status: form.status, license_number: form.license_number || undefined,
          notes: form.notes || undefined,
        });
        toast({ title: "Driver updated" });
      } else {
        await createFleetDriver({
          name: form.name, phone: form.phone, vehicle_number: form.vehicle_number,
          vehicle_type: form.vehicle_type, capacity_tons: form.capacity_tons,
          status: form.status,
          license_number: form.license_number || undefined,
          notes: form.notes || undefined,
        });
        toast({ title: "Driver added to fleet" });
      }
      setShowForm(false);
      fetchDrivers();
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof ApiError ? err.message : "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this driver from the fleet?")) return;
    setDeleting(id);
    try {
      await deleteFleetDriver(id);
      toast({ title: "Driver removed" });
      fetchDrivers();
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof ApiError ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const statusColor = (s: string) =>
    s === "Available" ? "bg-emerald-100 text-emerald-800 border-emerald-200"
    : s === "On Trip" ? "bg-blue-100 text-blue-800 border-blue-200"
    : "bg-amber-100 text-amber-800 border-amber-200";

  const capacityPct = (d: DriverProfile) =>
    Math.min(100, Math.round((d.currentLoadTons / Math.max(d.capacityTons, 0.1)) * 100));

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-navy flex items-center gap-2">
            <UsersRound className="size-5 text-brand" /> Fleet Management
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Add drivers here so they can log in to the Driver Portal and claim orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Drivers</SelectItem>
              {DRIVER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchDrivers} disabled={loading}>
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </Button>
          <Button onClick={openAdd} className="bg-brand text-white hover:bg-brand-600">
            <Plus className="size-4" /> Add Driver
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-navy bg-navy text-white p-4">
          <p className="text-xs text-white/70 font-medium">Total Drivers</p>
          <p className="text-3xl font-extrabold text-brand mt-1">{drivers.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-muted-foreground font-medium">Available</p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-1">
            {drivers.filter(d => d.status === "Available").length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-muted-foreground font-medium">On Trip</p>
          <p className="text-3xl font-extrabold text-blue-600 mt-1">
            {drivers.filter(d => d.status === "On Trip").length}
          </p>
        </div>
      </div>

      {/* Driver cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-brand" />
        </div>
      ) : drivers.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center py-20 text-center">
            <UsersRound className="size-12 text-muted-foreground/30 mb-3" />
            <p className="font-semibold text-navy">No drivers added yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add drivers so they can log into the Driver Portal using their mobile number.
            </p>
            <Button onClick={openAdd} className="mt-5 bg-brand text-white hover:bg-brand-600">
              <Plus className="size-4" /> Add First Driver
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {drivers.map((d) => (
            <Card key={d.id} className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-brand/10 text-brand font-extrabold text-lg">
                      {d.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="font-bold text-navy text-sm leading-tight">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.phone}</p>
                    </div>
                  </div>
                  <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded border", statusColor(d.status))}>
                    {d.status}
                  </span>
                </div>

                {/* Vehicle info */}
                <div className="rounded-lg bg-secondary p-3 mb-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-navy">
                    <Truck className="size-3.5 text-brand flex-shrink-0" />
                    <span className="font-semibold">{d.vehicleNumber}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground truncate">{d.vehicleType}</span>
                  </div>
                  {d.licenseNumber && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="size-3.5 flex-shrink-0" />
                      {d.licenseNumber}
                    </div>
                  )}
                </div>

                {/* Capacity bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Scale className="size-3" /> Load
                    </span>
                    <span className="font-semibold text-navy">
                      {d.currentLoadTons.toFixed(1)}T / {d.capacityTons}T
                      <span className="text-muted-foreground font-normal ml-1">
                        ({d.remainingCapacityTons.toFixed(1)}T free)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden border border-border">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        capacityPct(d) >= 90 ? "bg-red-500"
                        : capacityPct(d) >= 60 ? "bg-amber-500"
                        : "bg-emerald-500"
                      )}
                      style={{ width: `${capacityPct(d)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {d.activeOrdersCount} active order{d.activeOrdersCount !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => openEdit(d)}
                  >
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleDelete(d.id)}
                    disabled={deleting === d.id}
                  >
                    {deleting === d.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg border-border shadow-2xl max-h-[90vh] overflow-y-auto gls-scroll">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-navy">
                  {editDriver ? "Edit Driver" : "Add Driver to Fleet"}
                </h3>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-navy">
                  <X className="size-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name + Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">Driver Name *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">Mobile Number *</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="10-digit number"
                      maxLength={10}
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Driver uses this to log in to the portal
                    </p>
                  </div>
                </div>

                {/* Vehicle */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">Vehicle Number *</Label>
                    <Input
                      value={form.vehicle_number}
                      onChange={(e) => setForm((f) => ({ ...f, vehicle_number: e.target.value.toUpperCase() }))}
                      placeholder="MH12AB1234"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">Vehicle Type</Label>
                    <Select
                      value={form.vehicle_type}
                      onValueChange={(v) => setForm((f) => ({ ...f, vehicle_type: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VEHICLE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Capacity + Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">
                      Max Capacity (Tons)
                    </Label>
                    <Input
                      type="number"
                      min={0.5} max={50} step={0.5}
                      value={form.capacity_tons}
                      onChange={(e) => setForm((f) => ({ ...f, capacity_tons: parseFloat(e.target.value) || 15 }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DRIVER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* License + Notes */}
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">License Number</Label>
                  <Input
                    value={form.license_number}
                    onChange={(e) => setForm((f) => ({ ...f, license_number: e.target.value }))}
                    placeholder="DL number (optional)"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Any additional details…"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button
                  className="bg-brand text-white hover:bg-brand-600 min-w-28"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : (editDriver ? "Save Changes" : "Add Driver")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
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

  // Invoice / Quotation State
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [taxPercent, setTaxPercent] = useState("5");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [invoiceResult, setInvoiceResult] = useState<any>(null);

  // Driver Assignment State
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverNotes, setDriverNotes] = useState("");
  const [assigningDriver, setAssigningDriver] = useState(false);
  const [fleetDrivers, setFleetDrivers] = useState<DriverProfile[]>([]);
  const [loadingFleetDrivers, setLoadingFleetDrivers] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [updateDefaultVehicle, setUpdateDefaultVehicle] = useState(false);

  const loadDrivers = useCallback(async () => {
    setLoadingFleetDrivers(true);
    try {
      const drivers = await listFleetDrivers();
      setFleetDrivers(drivers);
    } catch {
      // ignore
    } finally {
      setLoadingFleetDrivers(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBooking(id);
      const b = res.data;
      setBooking(b);
      if (b.totalAmount) setInvoiceAmount(String(b.totalAmount));
      if (b.invoiceNotes) setInvoiceNotes(b.invoiceNotes);
      if (b.driverName) setDriverName(b.driverName);
      if (b.driverPhone) setDriverPhone(b.driverPhone);
      if (b.vehicleNumber) setVehicleNumber(b.vehicleNumber);
      if (b.driverNotes) setDriverNotes(b.driverNotes);
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
    loadDrivers();
  }, [load, loadDrivers]);

  // Sync selected driver if booking has a driver assigned that matches fleet
  useEffect(() => {
    if (booking?.driverPhone && fleetDrivers.length > 0 && !selectedDriverId) {
      const match = fleetDrivers.find(
        (d) => d.phone.replace(/[^0-9]/g, "") === booking.driverPhone?.replace(/[^0-9]/g, "")
      );
      if (match) {
        setSelectedDriverId(String(match.id));
      }
    }
  }, [booking?.driverPhone, fleetDrivers, selectedDriverId]);

  const handleSelectDriver = (driverIdStr: string) => {
    setSelectedDriverId(driverIdStr);
    if (!driverIdStr || driverIdStr === "custom") {
      return;
    }
    const found = fleetDrivers.find((d) => String(d.id) === driverIdStr);
    if (found) {
      setDriverName(found.name);
      setDriverPhone(found.phone);
      setVehicleNumber(found.vehicleNumber);
      toast({
        title: `Selected: ${found.name}`,
        description: `Auto-filled phone (${found.phone}) and default vehicle (${found.vehicleNumber}). You can edit the vehicle number below if needed.`,
      });
    }
  };

  const selectedDriver = fleetDrivers.find((d) => String(d.id) === selectedDriverId);
  const isVehicleModified = Boolean(
    selectedDriver &&
      vehicleNumber.trim() &&
      vehicleNumber.trim().toUpperCase() !== selectedDriver.vehicleNumber.trim().toUpperCase()
  );

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

  const handleSendInvoice = async (waInvoiceText?: string) => {
    if (!booking) return;
    const amt = parseFloat(invoiceAmount);
    if (isNaN(amt) || amt <= 0) {
      toast({
        title: "Please enter total amount",
        description: "The total quotation/invoice amount must be given by the admin.",
        variant: "destructive",
      });
      return;
    }

    setSendingInvoice(true);
    try {
      const res = await sendInvoiceToCustomer(booking.id, {
        total_amount: amt,
        advance_amount: advanceAmount ? parseFloat(advanceAmount) : undefined,
        tax_percent: taxPercent ? parseFloat(taxPercent) : undefined,
        invoice_notes: invoiceNotes.trim() || undefined,
      });

      setInvoiceResult(res);

      // WhatsApp text: use passed string, or backend generated whatsapp_text, or formatted template
      const textToSend =
        typeof waInvoiceText === "string" && waInvoiceText.trim()
          ? waInvoiceText
          : res.email_info?.whatsapp_text ||
            `*Ganraj Logistics Service - Transport Quotation / Invoice*\nRef: ${booking.reference}\nRoute: ${booking.pickupLocation} to ${booking.deliveryLocation}\nTotal Amount: ₹${amt.toLocaleString("en-IN")}\n${advanceAmount ? `Advance: ₹${parseFloat(advanceAmount).toLocaleString("en-IN")}\n` : ""}${invoiceNotes ? `Notes: ${invoiceNotes.trim()}\n` : ""}Bank / UPI: 8108767159@upi\nFor dispatch: +91 8108767159`;

      // 📧 Email sent by backend — simultaneously open WhatsApp with invoice to customer's mobile
      const cleanP = booking.phone.replace(/[^0-9]/g, "").slice(-10);
      if (cleanP) {
        window.open(
          `https://wa.me/91${cleanP}?text=${encodeURIComponent(textToSend)}`,
          "_blank"
        );
      }

      toast({
        title: "✅ Invoice Sent (Email + WhatsApp)",
        description: `₹${amt.toLocaleString("en-IN")} invoice sent${booking.email ? ` to ${booking.email}` : ""} and WhatsApp opened for ${booking.name} (+91 ${cleanP}).`,
      });

      await load();
      onRefreshList();
    } catch (err) {
      toast({
        title: "Failed to send invoice",
        description: err instanceof ApiError ? err.message : "Could not send invoice.",
        variant: "destructive",
      });
    } finally {
      setSendingInvoice(false);
      setShowInvoicePreview(false);
    }
  };

  const handleAssignDriver = async () => {
    if (!booking) return;
    if (!driverName.trim() || !driverPhone.trim() || !vehicleNumber.trim()) {
      toast({
        title: "Missing driver information",
        description: "Driver Name, 10-digit Mobile Number, and Vehicle Number are required.",
        variant: "destructive",
      });
      return;
    }

    setAssigningDriver(true);
    try {
      await assignDriverToBooking(booking.id, {
        driver_name: driverName.trim(),
        driver_phone: driverPhone.trim(),
        vehicle_number: vehicleNumber.trim().toUpperCase(),
        driver_notes: driverNotes.trim() || undefined,
      });

      if (updateDefaultVehicle && selectedDriver) {
        try {
          await updateFleetDriver(selectedDriver.id, {
            vehicle_number: vehicleNumber.trim().toUpperCase(),
          });
        } catch {
          // ignore non-fatal fleet vehicle sync
        }
      }

      toast({
        title: "Driver Assigned Successfully!",
        description: `${driverName} is assigned to vehicle ${vehicleNumber.toUpperCase()}. Driver can now log in to the Driver Portal using mobile ${driverPhone}.`,
      });

      await load();
      await loadDrivers();
      onRefreshList();
    } catch (err) {
      toast({
        title: "Failed to assign driver",
        description: err instanceof ApiError ? err.message : "Could not assign driver.",
        variant: "destructive",
      });
    } finally {
      setAssigningDriver(false);
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

  const cleanPhone = booking.phone.replace(/[^0-9]/g, "").slice(-10);
  const waMessage = `Hello ${booking.name}, this is Ganraj Logistics regarding your transport request ${booking.reference} (${booking.pickupLocation} to ${booking.deliveryLocation}).`;
  const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="flex min-h-screen flex-col bg-secondary pb-12">
      <header className="sticky top-0 z-40 border-b border-border bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-navy hover:text-brand">
            <ArrowLeft className="size-4 mr-1" /> Back to bookings
          </Button>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-navy">
              {booking.reference}
            </span>
            <StatusBadge status={booking.status} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Top Call Customer & Direct Action Banner */}
        <Card className="border-brand/30 bg-gradient-to-r from-navy via-navy to-navy-800 text-white shadow-md">
          <CardContent className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand text-white mb-2">
                <Sparkles className="size-3" /> Direct Customer Contact
              </span>
              <h2 className="text-xl font-bold">{booking.name}</h2>
              <p className="text-xs text-white/70 mt-0.5">
                {booking.pickupLocation} → {booking.deliveryLocation} · {booking.vehicleType}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                asChild
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
              >
                <a href={`tel:${booking.phone}`}>
                  <PhoneCall className="size-4 mr-1.5" /> Call Customer Now
                </a>
              </Button>

              <Button
                asChild
                className="bg-[#25D366] hover:bg-[#1ebd5a] text-white font-semibold shadow-sm"
              >
                <a href={waUrl} target="_blank" rel="noopener noreferrer">
                  <MessageSquare className="size-4 mr-1.5" /> WhatsApp Customer
                </a>
              </Button>

              {booking.email && (
                <Button
                  asChild
                  variant="outline"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  <a href={`mailto:${booking.email}`}>
                    <Mail className="size-4 mr-1.5" /> Email
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Details & Workflows */}
          <div className="space-y-6 lg:col-span-2">
            {/* 1. Shipment Details */}
            <Card className="border-border shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-base font-bold text-navy flex items-center gap-2">
                  <ClipboardList className="size-4 text-brand" /> Shipment Booking Details
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Detail icon={User} label="Customer Name" value={booking.name} />
                  <Detail icon={Phone} label="Customer Phone" value={booking.phone} />
                  {booking.email && (
                    <Detail icon={Mail} label="Customer Email" value={booking.email} />
                  )}
                  <Detail
                    icon={MapPin}
                    label="Pickup Location"
                    value={booking.pickupLocation}
                  />
                  <div className="flex items-start justify-between gap-3 sm:col-span-2 rounded-lg bg-red-50/60 border border-red-200/70 p-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-600">
                        <MapPin className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-red-600">Customer Delivery Destination</p>
                        <p className="mt-0.5 break-words text-sm font-bold text-navy">
                          {booking.deliveryLocation}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Exact destination synced to driver console with turn-by-turn navigation
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.deliveryLocation)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-white border border-red-200 hover:bg-red-50 px-2.5 py-1.5 rounded-md shadow-sm transition"
                    >
                      <ExternalLink className="size-3" /> View Map
                    </a>
                  </div>
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
                      Customer Request Notes
                    </p>
                    <p className="mt-1 text-sm text-navy">{booking.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 2. Customer Quote & Invoice Forwarding Card */}
            <Card className="border-brand/40 shadow-sm bg-gradient-to-br from-white to-orange-50/30">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-navy flex items-center gap-2">
                      <DollarSign className="size-5 text-brand" /> Forward Quotation / Invoice Mail
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Talk to customer, finalize agreed freight rate, and send the official invoice email directly.
                    </p>
                  </div>
                  {booking.totalAmount && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-500/30">
                      <CheckCircle2 className="size-3.5" /> Quoted: ₹{booking.totalAmount.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>

                {booking.invoiceSentAt && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Invoice previously forwarded to customer:</p>
                      <p className="text-emerald-700 mt-0.5">
                        Amount: <strong>₹{booking.totalAmount?.toLocaleString("en-IN")}</strong> · Sent on{" "}
                        {new Date(booking.invoiceSentAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs"
                      onClick={() => {
                        const invShare = `*Ganraj Logistics Service - Transport Invoice*\nRef: ${booking.reference}\nRoute: ${booking.pickupLocation} to ${booking.deliveryLocation}\nTotal Amount: ₹${booking.totalAmount?.toLocaleString("en-IN")}\n${booking.invoiceNotes ? `Notes: ${booking.invoiceNotes}\n` : ""}For queries, call ${COMPANY.phone}`;
                        window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(invShare)}`, "_blank");
                      }}
                    >
                      <MessageSquare className="size-3.5 mr-1" /> Share on WhatsApp
                    </Button>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-navy">
                      Total Amount (₹) <span className="text-brand">* Admin set</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="e.g. 24000"
                      value={invoiceAmount}
                      onChange={(e) => setInvoiceAmount(e.target.value)}
                      className="h-10 font-mono font-bold text-base"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-navy">
                      Advance Required (₹)
                    </Label>
                    <Input
                      type="number"
                      placeholder="e.g. 10000"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(e.target.value)}
                      className="h-10 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-navy">
                      GST / Tax (%)
                    </Label>
                    <Input
                      type="number"
                      placeholder="e.g. 5"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(e.target.value)}
                      className="h-10 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-navy">
                    Invoice Notes / Payment Instructions
                  </Label>
                  <Textarea
                    placeholder="e.g. 50% advance before loading, balance immediately upon vehicle unloading. Halting charges ₹1500/day after 24 hrs."
                    value={invoiceNotes}
                    onChange={(e) => setInvoiceNotes(e.target.value)}
                    rows={2}
                    className="text-xs"
                  />
                </div>

                {/* Preview & Send Button */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const amt = parseFloat(invoiceAmount);
                      if (isNaN(amt) || amt <= 0) {
                        toast({ title: "Enter total amount first", variant: "destructive" });
                        return;
                      }
                      setShowInvoicePreview(true);
                    }}
                    disabled={!invoiceAmount}
                    className="flex-1 bg-brand hover:bg-brand-600 text-white font-semibold h-11"
                  >
                    <Send className="size-4 mr-2" /> Preview & Send Invoice
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ─── INVOICE PREVIEW MODAL ─── */}
            {showInvoicePreview && booking && (() => {
              const amt = parseFloat(invoiceAmount) || 0;
              const tax = parseFloat(taxPercent) || 0;
              const subtotal = tax > 0 ? Math.round((amt / (1 + tax / 100)) * 100) / 100 : amt;
              const taxAmt = Math.round((amt - subtotal) * 100) / 100;
              const adv = parseFloat(advanceAmount) || 0;
              const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
              const waInvoiceText = `Hello ${booking.name},\nGreetings from *Ganraj Logistics Service*.\n\n📋 Transport Quotation / Invoice for Ref *${booking.reference}*:\n📍 Route: ${booking.pickupLocation} ➔ ${booking.deliveryLocation}\n🚛 Vehicle: ${booking.vehicleType}\n📦 Material: ${booking.materialType}\n💰 *Total Amount: ₹${amt.toLocaleString("en-IN")}*\n${adv ? `💵 Advance Required: ₹${adv.toLocaleString("en-IN")}\n` : ""}📝 Terms: ${invoiceNotes || "Safe transport & on-time pickup"}\n🏦 Bank/UPI: 8108767159@upi\n📞 Dispatch Helpline: +91 8108767159\n📧 Email: ganrajlogisticsservice@gmail.com\n\nPlease confirm to dispatch the vehicle. Thank you!`;
              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    {/* Modal Header */}
                    <div className="sticky top-0 bg-navy text-white px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                      <div>
                        <h2 className="text-base font-extrabold">Invoice Preview</h2>
                        <p className="text-xs text-white/60 mt-0.5">Review before sending to customer</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-brand/20 text-orange-300 border border-brand/30 px-2.5 py-1 rounded-full font-semibold">Ref: {booking.reference}</span>
                        <button onClick={() => setShowInvoicePreview(false)} className="size-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition text-white">
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>

                    {/* Invoice Body Preview */}
                    <div className="p-6 space-y-5">
                      {/* Company Header */}
                      <div className="rounded-xl bg-navy text-white px-6 py-5">
                        <p className="text-xl font-extrabold tracking-tight">GANRAJ LOGISTICS SERVICE</p>
                        <p className="text-[11px] text-orange-400 font-bold uppercase tracking-widest mt-0.5">Reliable Transport. On Time. Every Time.</p>
                      </div>

                      {/* Ref + Date Strip */}
                      <div className="rounded-lg border-l-4 border-brand bg-orange-50 px-4 py-3">
                        <div className="grid grid-cols-2 gap-1 text-sm">
                          <div><span className="text-muted-foreground text-xs">Invoice Ref:</span><p className="font-bold text-navy font-mono">{booking.reference}</p></div>
                          <div className="text-right"><span className="text-muted-foreground text-xs">Date:</span><p className="font-bold text-navy">{today}</p></div>
                          <div><span className="text-muted-foreground text-xs">Customer:</span><p className="font-semibold text-navy">{booking.name}</p></div>
                          <div className="text-right"><span className="text-muted-foreground text-xs">Vehicle:</span><p className="font-semibold text-navy">{booking.vehicleType}</p></div>
                        </div>
                      </div>

                      <p className="text-sm text-slate-600">Dear <strong className="text-navy">{booking.name}</strong>, thank you for choosing Ganraj Logistics. Below is your approved quotation/invoice for your transport consignment.</p>

                      {/* Route Visual */}
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">ROUTE</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 rounded-lg bg-white border border-slate-200 p-2 text-center">
                            <p className="text-[10px] text-slate-400">Pickup</p>
                            <p className="font-bold text-navy text-sm">{booking.pickupLocation}</p>
                          </div>
                          <div className="text-brand text-xl font-bold">➔</div>
                          <div className="flex-1 rounded-lg bg-white border border-red-200 p-2 text-center">
                            <p className="text-[10px] text-red-400">Delivery</p>
                            <p className="font-bold text-navy text-sm">{booking.deliveryLocation}</p>
                          </div>
                        </div>
                      </div>

                      {/* Billing Table */}
                      <div className="rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="text-left px-4 py-2.5 text-xs text-slate-400 font-semibold uppercase">Description</th>
                              <th className="text-right px-4 py-2.5 text-xs text-slate-400 font-semibold uppercase">Details / Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <tr><td className="px-4 py-2.5 font-semibold text-navy">Cargo / Material</td><td className="px-4 py-2.5 text-right text-slate-600">{booking.materialType}</td></tr>
                            <tr><td className="px-4 py-2.5 font-semibold text-navy">Vehicle Type</td><td className="px-4 py-2.5 text-right text-slate-600">{booking.vehicleType}</td></tr>
                            <tr><td className="px-4 py-2.5 font-semibold text-navy">Weight / Quantity</td><td className="px-4 py-2.5 text-right text-slate-600">{booking.quantity}</td></tr>
                            <tr><td className="px-4 py-2.5">Base Freight Charge</td><td className="px-4 py-2.5 text-right font-mono">₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>
                            {tax > 0 && <tr><td className="px-4 py-2.5 text-slate-500">GST ({tax}%)</td><td className="px-4 py-2.5 text-right font-mono text-slate-500">₹{taxAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>}
                            <tr className="bg-navy">
                              <td className="px-4 py-3 font-extrabold text-white text-base">TOTAL AMOUNT</td>
                              <td className="px-4 py-3 text-right font-extrabold text-orange-400 text-xl font-mono">₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                            </tr>
                            {adv > 0 && <tr className="bg-emerald-50"><td className="px-4 py-2.5 font-bold text-emerald-800">Advance Required</td><td className="px-4 py-2.5 text-right font-bold text-emerald-700 font-mono">₹{adv.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>}
                          </tbody>
                        </table>
                      </div>

                      {/* Payment Notes */}
                      {invoiceNotes && (
                        <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
                          <p className="text-xs font-bold text-orange-800 uppercase">Terms & Notes</p>
                          <p className="text-sm text-orange-900 mt-1">{invoiceNotes}</p>
                        </div>
                      )}

                      {/* Payment Info */}
                      <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm space-y-0.5">
                        <p className="font-bold text-navy text-xs uppercase tracking-wider mb-1">Bank / Payment Details</p>
                        <p className="text-slate-600">A/C Name: <strong>Ganraj Logistics Service</strong></p>
                        <p className="text-slate-600">UPI ID: <strong className="font-mono">8108767159@upi</strong></p>
                        <p className="text-slate-600">Contact Dispatch: <strong>+91 8108767159</strong> / <strong>+91 99870 51430</strong></p>
                        <p className="text-slate-600">Official Email: <strong>ganrajlogisticsservice@gmail.com</strong></p>
                      </div>

                      {/* Channels & Delivery Route notice */}
                      <div className="rounded-lg border border-dashed border-slate-300 p-3 text-xs space-y-1.5 bg-slate-50/70">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Dispatched From:</span>
                          <span className="font-semibold text-navy">ganrajlogisticsservice@gmail.com · +91 8108767159</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Customer Channels:</span>
                          {booking.email ? (
                            <span className="font-semibold text-emerald-700">
                              📧 {booking.email} &nbsp;+&nbsp; 💬 WhatsApp (+91 {cleanPhone})
                            </span>
                          ) : (
                            <span className="font-semibold text-amber-700">
                              💬 WhatsApp (+91 {cleanPhone}) · No customer email on file
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button
                          onClick={() => handleSendInvoice(waInvoiceText)}
                          disabled={sendingInvoice}
                          className="flex-1 bg-brand hover:bg-brand-600 text-white font-bold h-12 shadow-md"
                        >
                          {sendingInvoice ? (
                            <><Loader2 className="size-4 animate-spin mr-2" /> Sending Email & Opening WhatsApp…</>
                          ) : (
                            <><Send className="size-4 mr-2" /> Confirm & Send (Email + WhatsApp)</>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(waInvoiceText)}`, "_blank");
                          }}
                          className="h-12 border-[#25D366] text-[#128C7E] hover:bg-[#25D366]/10 font-semibold"
                        >
                          <MessageSquare className="size-4 mr-2" /> WhatsApp Only
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setShowInvoicePreview(false)}
                          className="h-12 text-muted-foreground hover:text-navy"
                        >
                          <X className="size-4 mr-1" /> Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 3. Driver & Vehicle Assignment Card */}
            <Card className="border-border shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-navy flex items-center gap-2">
                      <Truck className="size-5 text-brand" /> Assign Driver & Vehicle
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Assign driver details here. The driver will log into the Driver Portal using this mobile number.
                    </p>
                  </div>
                  {booking.driverName && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-navy text-white px-2.5 py-1 text-xs font-bold">
                      <ShieldCheck className="size-3.5 text-brand" /> Driver Active
                    </span>
                  )}
                </div>

                {booking.driverPhone && (
                  <div className="rounded-lg bg-navy/5 border border-navy/15 p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-navy">
                        Current Driver: {booking.driverName} ({booking.vehicleNumber})
                      </p>
                      <p className="text-muted-foreground">
                        Driver Login Phone: <strong className="text-navy">{booking.driverPhone}</strong>
                        {booking.assignedAt && ` · Assigned ${new Date(booking.assignedAt).toLocaleDateString("en-IN")}`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="text-xs border-navy/20 hover:bg-navy hover:text-white"
                    >
                      <a href={`tel:${booking.driverPhone}`}>
                        <Phone className="size-3 mr-1" /> Call Driver
                      </a>
                    </Button>
                  </div>
                )}

                {/* SELECT REGISTERED FLEET DRIVER */}
                <div className="space-y-2 rounded-xl border border-navy/15 bg-slate-50/80 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <Label className="text-xs font-bold text-navy flex items-center gap-1.5">
                      <UsersRound className="size-4 text-brand" /> Select Registered Driver (Free / Available Fleet)
                    </Label>
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {loadingFleetDrivers ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="size-3 animate-spin" /> Loading fleet…
                        </span>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {fleetDrivers.filter((d) => d.status === "Available").length} driver(s) currently free
                        </span>
                      )}
                    </span>
                  </div>

                  <Select
                    value={selectedDriverId}
                    onValueChange={handleSelectDriver}
                  >
                    <SelectTrigger className="h-11 bg-white font-medium text-sm border-navy/20">
                      <SelectValue placeholder="— Click here to select a driver from fleet —" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom" className="text-xs text-muted-foreground font-semibold">
                        ✏️ Custom / Unregistered Driver (Manual Entry)
                      </SelectItem>
                      {fleetDrivers.length === 0 ? (
                        <SelectItem value="empty" disabled className="text-xs">
                          No fleet drivers registered yet. Add drivers in Fleet tab.
                        </SelectItem>
                      ) : (
                        fleetDrivers.map((d) => {
                          const isFree = d.status === "Available";
                          return (
                            <SelectItem key={d.id} value={String(d.id)} className="text-xs py-2">
                              <span className="font-semibold text-navy">
                                {isFree ? "🟢 [FREE] " : "🟡 [ON TRIP] "}
                                {d.name} ({d.phone})
                              </span>
                              {" — "}
                              <span className="font-mono text-muted-foreground">
                                {d.vehicleType} • {d.vehicleNumber}
                              </span>
                              {" • "}
                              <span className="font-bold text-brand">
                                {d.remainingCapacityTons}T Free
                              </span>
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>

                  {/* Selected Driver Summary Strip */}
                  {selectedDriver && (
                    <div className="mt-2.5 rounded-lg border border-brand/25 bg-brand/5 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                          {selectedDriver.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-navy">{selectedDriver.name}</span>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                selectedDriver.status === "Available"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : "bg-amber-100 text-amber-800 border border-amber-300"
                              )}
                            >
                              {selectedDriver.status === "Available" ? "🟢 Free / Available" : "🟡 On Trip"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            Mobile: <strong className="text-navy">{selectedDriver.phone}</strong> · Registered Vehicle: <strong className="text-navy">{selectedDriver.vehicleType} ({selectedDriver.vehicleNumber})</strong>
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right text-xs shrink-0">
                        <span className="font-bold text-brand block">{selectedDriver.remainingCapacityTons} Tons Capacity Free</span>
                        <span className="text-[11px] text-muted-foreground">
                          {selectedDriver.activeOrdersCount} Active Order(s)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Auto-filled details with editable vehicle number */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-navy">
                      Driver Name <span className="text-brand">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. Ramesh Kumar"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-navy">
                      Driver Mobile No. <span className="text-brand">* Used for login</span>
                    </Label>
                    <Input
                      placeholder="10-digit phone"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      className="h-10 font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-navy">
                        Vehicle / Car Number <span className="text-brand">*</span>
                      </Label>
                      {selectedDriver && vehicleNumber && vehicleNumber !== selectedDriver.vehicleNumber && (
                        <button
                          type="button"
                          onClick={() => setVehicleNumber(selectedDriver.vehicleNumber)}
                          className="text-[10px] text-brand hover:underline font-medium"
                        >
                          Revert to default
                        </button>
                      )}
                    </div>
                    <Input
                      placeholder="e.g. MH 12 AB 1234"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                      className={cn(
                        "h-10 font-mono uppercase text-sm",
                        isVehicleModified && "border-amber-400 bg-amber-50/40"
                      )}
                    />
                  </div>
                </div>

                {/* If vehicle number was modified, show option to also update fleet record */}
                {isVehicleModified && selectedDriver && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50/80 p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-amber-900">
                      <AlertCircle className="size-4 text-amber-600 shrink-0" />
                      <span>
                        Car number changed from registered <strong>{selectedDriver.vehicleNumber}</strong> to <strong>{vehicleNumber}</strong> for this dispatch.
                      </span>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-navy shrink-0">
                      <input
                        type="checkbox"
                        checked={updateDefaultVehicle}
                        onChange={(e) => setUpdateDefaultVehicle(e.target.checked)}
                        className="rounded border-navy/30 size-3.5 text-brand"
                      />
                      Also update {selectedDriver.name}&apos;s default vehicle in fleet
                    </label>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-navy">
                    Driver Dispatch Instructions / Notes (Optional)
                  </Label>
                  <Input
                    placeholder="e.g. Pickup from Gate 3, carry tarp, report before 9 AM"
                    value={driverNotes}
                    onChange={(e) => setDriverNotes(e.target.value)}
                    className="h-10 text-xs"
                  />
                </div>

                <Button
                  onClick={handleAssignDriver}
                  disabled={assigningDriver || !driverName || !driverPhone || !vehicleNumber}
                  className="w-full bg-navy hover:bg-navy-800 text-white font-semibold h-11"
                >
                  {assigningDriver ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" /> Assigning Driver & Authorizing Login…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4 mr-2 text-brand" /> Save Driver Details & Authorize Phone Login
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* 4. Live Automated Tracking & Telematics Display */}
            <Card className="border-border shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-navy flex items-center gap-2">
                    <Navigation className="size-5 text-brand" /> Live Automated Telematics & Checkpoints
                  </h3>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <RefreshCw className="size-3" /> Auto-synced from Driver App
                  </span>
                </div>

                <div className="rounded-xl bg-slate-900 text-white p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <p className="text-[10px] text-brand uppercase font-bold tracking-wider">
                        Current Live Location Checkpoint
                      </p>
                      <p className="text-base font-bold text-white mt-0.5">
                        {booking.currentLocation || "Waiting for driver to submit checkpoint..."}
                      </p>
                    </div>

                    {booking.currentLatitude && booking.currentLongitude && (
                      <a
                        href={`https://www.google.com/maps?q=${booking.currentLatitude},${booking.currentLongitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-600 transition"
                      >
                        <ExternalLink className="size-3.5" /> View on Google Maps
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-white/50 block">Last Checkpoint Update:</span>
                      <span className="text-white font-medium">
                        {booking.lastLocationUpdate
                          ? new Date(booking.lastLocationUpdate).toLocaleString("en-IN")
                          : "Not updated yet"}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/50 block">Assigned Vehicle:</span>
                      <span className="font-mono text-brand font-bold">
                        {booking.vehicleNumber || "Pending"}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/50 block">Assigned Driver:</span>
                      <span className="text-white font-medium">
                        {booking.driverName || "Pending"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 5. Status & Checkpoint Timeline */}
            <Card className="border-border shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-base font-bold text-navy flex items-center gap-2">
                  <Clock className="size-4 text-brand" /> Complete Tracking & Status Timeline
                </h3>
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
                        <p className="mt-1 text-sm text-navy/90">{h.note}</p>
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

          {/* Right Sidebar: Status Updater & Links */}
          <div className="space-y-6">
            <Card className="border-navy/20 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-base font-bold text-navy">Manual Status Override</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Current: <StatusBadge status={booking.status} className="ml-1" />
                </p>
                <div className="mt-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-navy">
                      Advance Status
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
                    <Label className="text-xs font-semibold text-navy">
                      Status Note (optional)
                    </Label>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. Loading completed at depot, driver started journey…"
                      rows={3}
                      className="text-xs"
                    />
                  </div>
                  <Button
                    onClick={handleUpdate}
                    disabled={!newStatus || updating}
                    className="w-full bg-brand text-white hover:bg-brand-600"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-1" /> Updating…
                      </>
                    ) : (
                      "Apply Status Change"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-navy text-white shadow-sm">
              <CardContent className="p-6 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                  System Shortcuts
                </p>
                <div className="space-y-2 text-xs">
                  <a
                    href="/driver"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white"
                  >
                    <span>Open Driver Portal</span>
                    <ExternalLink className="size-3.5 text-brand" />
                  </a>
                  <a
                    href={`/?track=${booking.reference}#book`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white"
                  >
                    <span>Customer Live Tracking</span>
                    <ExternalLink className="size-3.5 text-brand" />
                  </a>
                </div>
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

