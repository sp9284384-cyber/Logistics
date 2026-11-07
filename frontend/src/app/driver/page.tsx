"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Truck,
  MapPin,
  Phone,
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  Navigation,
  ArrowRight,
  Loader2,
  ArrowLeft,
  User,
  ShieldCheck,
  Send,
  Compass,
  Crosshair,
  ExternalLink,
  LogOut,
  RefreshCw,
  AlertCircle,
  Check,
  Building2,
  ClipboardList,
  Weight,
  Scale,
  Plus,
  Copy,
  MessageSquare,
  Flag,
  Route,
  Navigation2,
  Timer,
  PackageCheck,
  Zap,
  AlarmClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/site/status-badge";
import {
  loginDriver,
  getDriverTrips,
  updateDriverLocationAndStatus,
  trackBooking,
  getDriverAvailableOrders,
  claimOrder,
  type Booking,
  ApiError,
} from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { COMPANY } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function DriverPage() {
  const { toast } = useToast();

  // Auth State
  const [phoneInput, setPhoneInput] = useState("");
  const [driverPhone, setDriverPhone] = useState<string | null>(null);
  const [driverName, setDriverName] = useState<string>("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<"trips" | "orders">("orders");

  // Assigned Trips State
  const [trips, setTrips] = useState<Booking[]>([]);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [activeTrip, setActiveTrip] = useState<any | null>(null);
  const [loadingTrip, setLoadingTrip] = useState(false);

  // Available Orders State
  const [availableOrders, setAvailableOrders] = useState<Booking[]>([]);
  const [remainingCapacity, setRemainingCapacity] = useState<number>(15);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // Telematics State
  const [locationText, setLocationText] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [detectingGps, setDetectingGps] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [copiedDelivery, setCopiedDelivery] = useState(false);

  // Auto-checkpoint state
  const [autoCheckpointEnabled, setAutoCheckpointEnabled] = useState(false);
  const [nextAutoCheckIn, setNextAutoCheckIn] = useState<number>(3600); // seconds
  const autoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadTripDetails = useCallback(async (ref: string) => {
    setLoadingTrip(true);
    try {
      const res = await trackBooking(ref);
      setActiveTrip(res);
      if (res.currentLocation) {
        setLocationText(res.currentLocation);
      } else if (res.pickupLocation) {
        setLocationText(`Loaded from Pickup: ${res.pickupLocation}`);
      }
    } catch (err) {
      toast({
        title: "Could not load trip details",
        description: err instanceof ApiError ? err.message : "Network error",
        variant: "destructive",
      });
    } finally {
      setLoadingTrip(false);
    }
  }, [toast]);

  const loadSession = useCallback(async (phone: string) => {
    setLoggingIn(true);
    try {
      const res = await loginDriver(phone);
      setDriverPhone(res.phone);
      setDriverName(res.driverName || "Driver");
      setTrips(res.trips || []);
      localStorage.setItem("gls_driver_phone", res.phone);

      if (res.trips && res.trips.length > 0) {
        const active = res.trips.find((t) => t.status !== "Delivered") || res.trips[0];
        setSelectedRef(active.reference);
        loadTripDetails(active.reference);
        setActiveTab("trips");
      } else {
        setActiveTab("orders");
      }
    } catch {
      localStorage.removeItem("gls_driver_phone");
      setDriverPhone(null);
    } finally {
      setLoggingIn(false);
    }
  }, [loadTripDetails]);

  // Restore session on mount
  useEffect(() => {
    const savedPhone = typeof window !== "undefined" ? localStorage.getItem("gls_driver_phone") : null;
    if (savedPhone) {
      setDriverPhone(savedPhone);
      setPhoneInput(savedPhone);
      loadSession(savedPhone);
    }
  }, [loadSession]);

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phoneInput.replace(/[^0-9]/g, "").slice(-10);
    if (clean.length < 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid 10-digit mobile number.",
        variant: "destructive",
      });
      return;
    }
    setLoggingIn(true);
    try {
      const res = await loginDriver(clean);
      setDriverPhone(res.phone);
      setDriverName(res.driverName || "Driver");
      setTrips(res.trips || []);
      localStorage.setItem("gls_driver_phone", res.phone);
      if (res.trips && res.trips.length > 0) {
        const active = res.trips.find((t) => t.status !== "Delivered") || res.trips[0];
        setSelectedRef(active.reference);
        loadTripDetails(active.reference);
        setActiveTab("trips");
      } else {
        setActiveTab("orders");
        fetchAvailableOrders(res.phone);
      }
    } catch (err) {
      toast({
        title: "Login failed",
        description:
          err instanceof ApiError
            ? err.message
            : "Mobile number not registered. Please ask the admin to add you to the fleet first.",
        variant: "destructive",
      });
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("gls_driver_phone");
    setDriverPhone(null);
    setDriverName("");
    setTrips([]);
    setSelectedRef(null);
    setActiveTrip(null);
    setPhoneInput("");
    setAvailableOrders([]);
  };

  const fetchAvailableOrders = useCallback(async (phone?: string) => {
    const p = phone || driverPhone;
    if (!p) return;
    setLoadingOrders(true);
    try {
      const res = await getDriverAvailableOrders(p);
      setAvailableOrders(res.orders);
      setRemainingCapacity(res.remainingCapacityTons);
    } catch (err) {
      toast({
        title: "Could not load available orders",
        description: err instanceof ApiError ? err.message : "Network error",
        variant: "destructive",
      });
    } finally {
      setLoadingOrders(false);
    }
  }, [driverPhone, toast]);

  useEffect(() => {
    if (activeTab === "orders" && driverPhone) {
      fetchAvailableOrders();
    }
  }, [activeTab, driverPhone, fetchAvailableOrders]);

  const handleClaimOrder = async (bookingRef: string) => {
    if (!driverPhone) return;
    setClaimingId(bookingRef);
    try {
      const res = await claimOrder({ phone: driverPhone, booking_id_or_ref: bookingRef });
      toast({ title: "Order claimed!", description: `${bookingRef} has been assigned to you.` });
      // Refresh both lists
      setTrips((prev) => [...prev, res.booking]);
      setAvailableOrders((prev) => prev.filter((o) => o.reference !== bookingRef));
      fetchAvailableOrders();
      // Switch to trips tab and load this trip
      setSelectedRef(res.booking.reference);
      loadTripDetails(res.booking.reference);
      setActiveTab("trips");
    } catch (err) {
      toast({
        title: "Could not claim order",
        description: err instanceof ApiError ? err.message : "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setClaimingId(null);
    }
  };

async function reverseGeocodeToPlaceName(lat: number, lng: number): Promise<string> {
  // 1. Try Nominatim (OpenStreetMap) for detailed locality, city, state
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      {
        headers: { "Accept-Language": "en" },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const a = data.address || {};
      const locality =
        a.suburb ||
        a.neighbourhood ||
        a.residential ||
        a.village ||
        a.road ||
        a.industrial ||
        a.commercial;
      const city =
        a.city ||
        a.town ||
        a.city_district ||
        a.municipality ||
        a.county ||
        a.district;
      const state = a.state;

      const parts = [locality, city, state].filter(Boolean);
      if (parts.length > 0) {
        return parts.join(", ");
      }
      if (data.display_name) {
        return data.display_name.split(",").slice(0, 3).join(",").trim();
      }
    }
  } catch {
    // try fallback
  }

  // 2. Try BigDataCloud reverse geocode (fast, CORS-friendly)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const parts = [
        data.locality,
        data.city && data.city !== data.locality ? data.city : null,
        data.principalSubdivision,
      ].filter(Boolean);
      if (parts.length > 0) {
        return parts.join(", ");
      }
    }
  } catch {
    // fallback
  }

  return `Near GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      toast({ title: "GPS not supported", variant: "destructive" });
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = Math.round(position.coords.accuracy);
        setGpsCoords({ latitude: lat, longitude: lng, accuracy: acc });
        
        // Show temporary resolving indicator
        setLocationText("Resolving live place name…");

        try {
          const place = await reverseGeocodeToPlaceName(lat, lng);
          setLocationText(place);
          toast({
            title: "Live Location Detected!",
            description: `${place} (GPS ±${acc}m)`,
          });
        } catch {
          setLocationText(`GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          toast({
            title: "GPS Locked",
            description: `${lat.toFixed(4)}, ${lng.toFixed(4)} (±${acc}m)`,
          });
        } finally {
          setDetectingGps(false);
        }
      },
      (error) => {
        setDetectingGps(false);
        let msg = "Could not fetch GPS.";
        if (error.code === error.PERMISSION_DENIED) msg = "Please allow location permission in your mobile browser.";
        else if (error.code === error.POSITION_UNAVAILABLE) msg = "Location information is currently unavailable.";
        else if (error.code === error.TIMEOUT) msg = "Location request timed out. Try again.";
        toast({ title: "GPS Error", description: msg, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleUpdateTrip = async (newStatus?: "In Transit" | "Delivered") => {
    if (!driverPhone || !activeTrip) return;

    // Auto-populate location if empty based on action
    let loc = locationText.trim();
    if (!loc) {
      if (newStatus === "In Transit") {
        loc = `Loaded from Pickup: ${activeTrip.pickupLocation}`;
      } else if (newStatus === "Delivered") {
        loc = `Delivered at Destination: ${activeTrip.deliveryLocation}`;
      } else if (activeTrip.currentLocation) {
        loc = activeTrip.currentLocation;
      } else if (activeTrip.pickupLocation) {
        loc = `Loaded from Pickup: ${activeTrip.pickupLocation}`;
      }
    }

    if (!loc) {
      toast({ title: "Location required", description: "Enter checkpoint or click Detect GPS.", variant: "destructive" });
      return;
    }
    setUpdatingStatus(true);
    try {
      await updateDriverLocationAndStatus({
        phone: driverPhone,
        booking_id_or_ref: activeTrip.reference,
        location: loc,
        status: newStatus,
        note: statusNote.trim() || undefined,
        latitude: gpsCoords?.latitude,
        longitude: gpsCoords?.longitude,
      });
      setLocationText(loc);
      toast({ title: newStatus ? `Status → ${newStatus}` : "Checkpoint logged!", description: "Synced to Admin & Customer Tracking." });
      await loadTripDetails(activeTrip.reference);
      const updatedTrips = await getDriverTrips(driverPhone);
      setTrips(updatedTrips);
      setStatusNote("");
    } catch (err) {
      toast({ title: "Update failed", description: err instanceof ApiError ? err.message : "Network error", variant: "destructive" });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const quickPresets = activeTrip
    ? [
        `📦 Loaded at: ${activeTrip.pickupLocation}`,
        `🚚 En Route to: ${activeTrip.deliveryLocation}`,
        "📍 Highway Checkpoint",
        "⛽ Fuel / Break Stop",
        `🏁 Arrived at Destination: ${activeTrip.deliveryLocation}`,
        `✅ Delivered at: ${activeTrip.deliveryLocation}`,
      ]
    : [
        "📦 At Pickup Warehouse",
        "🚚 Goods Loaded & Dispatched",
        "📍 Highway Checkpoint",
        "⛽ Fuel / Break Stop",
        "🏁 Arrived at Destination",
        "✅ Delivered Successfully",
      ];

  // ─── Auto checkpoint every 1 hour while in transit ───
  const sendAutoCheckpoint = useCallback(async () => {
    if (!driverPhone || !activeTrip || activeTrip.status === "Delivered") return;
    try {
      let loc = "🤖 Auto checkpoint — En Route";
      if (navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              try {
                const place = await reverseGeocodeToPlaceName(pos.coords.latitude, pos.coords.longitude);
                loc = `🤖 Auto checkpoint — ${place}`;
                setGpsCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) });
              } catch {
                loc = `🤖 Auto checkpoint — GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
              }
              resolve();
            },
            () => resolve(),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
          );
        });
      }
      await updateDriverLocationAndStatus({
        phone: driverPhone,
        booking_id_or_ref: activeTrip.reference,
        location: loc,
        note: "Automated 1-hour travel checkpoint",
      });
      await loadTripDetails(activeTrip.reference);
      toast({ title: "🤖 Auto-checkpoint sent!", description: loc });
    } catch {
      // silently skip failed auto-checkpoints
    }
  }, [driverPhone, activeTrip?.reference, activeTrip?.status]);

  // Start / stop the auto-checkpoint interval
  useEffect(() => {
    if (autoCheckpointEnabled && activeTrip && activeTrip.status !== "Delivered") {
      // Reset countdown
      setNextAutoCheckIn(3600);
      // Countdown ticker (every second)
      autoCountdownRef.current = setInterval(() => {
        setNextAutoCheckIn((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      // Actual checkpoint every 60 min
      autoIntervalRef.current = setInterval(() => {
        sendAutoCheckpoint();
        setNextAutoCheckIn(3600);
      }, 3600000);
    } else {
      if (autoIntervalRef.current) clearInterval(autoIntervalRef.current);
      if (autoCountdownRef.current) clearInterval(autoCountdownRef.current);
    }
    return () => {
      if (autoIntervalRef.current) clearInterval(autoIntervalRef.current);
      if (autoCountdownRef.current) clearInterval(autoCountdownRef.current);
    };
  }, [autoCheckpointEnabled, activeTrip?.reference, activeTrip?.status, sendAutoCheckpoint]);

  // Stop auto-checkpoint when trip changes
  useEffect(() => {
    setAutoCheckpointEnabled(false);
  }, [activeTrip?.reference]);

  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0
      ? `${h}h ${String(m).padStart(2, "0")}m`
      : `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  };

  // One-click Loaded button handler
  const handleMarkLoaded = async () => {
    if (!driverPhone || !activeTrip) return;
    setUpdatingStatus(true);
    const loc = `📦 Loaded at Pickup: ${activeTrip.pickupLocation}`;
    try {
      await updateDriverLocationAndStatus({
        phone: driverPhone,
        booking_id_or_ref: activeTrip.reference,
        location: loc,
        status: "In Transit",
        note: "Goods loaded at pickup point. Trip started.",
        latitude: gpsCoords?.latitude,
        longitude: gpsCoords?.longitude,
      });
      setLocationText(loc);
      toast({ title: "✅ Loaded & Trip Started!", description: "Admin & Customer have been notified." });
      await loadTripDetails(activeTrip.reference);
      const updatedTrips = await getDriverTrips(driverPhone);
      setTrips(updatedTrips);
    } catch (err) {
      toast({ title: "Update failed", description: err instanceof ApiError ? err.message : "Network error", variant: "destructive" });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // One-click Delivered button handler
  const handleMarkDelivered = async () => {
    if (!driverPhone || !activeTrip) return;
    setUpdatingStatus(true);
    const loc = `✅ Delivered at Destination: ${activeTrip.deliveryLocation}`;
    try {
      await updateDriverLocationAndStatus({
        phone: driverPhone,
        booking_id_or_ref: activeTrip.reference,
        location: loc,
        status: "Delivered",
        note: "Shipment successfully delivered to customer.",
        latitude: gpsCoords?.latitude,
        longitude: gpsCoords?.longitude,
      });
      setLocationText(loc);
      setAutoCheckpointEnabled(false);
      toast({ title: "🏁 Delivered!", description: "Delivery confirmed. Admin & Customer notified." });
      await loadTripDetails(activeTrip.reference);
      const updatedTrips = await getDriverTrips(driverPhone);
      setTrips(updatedTrips);
    } catch (err) {
      toast({ title: "Update failed", description: err instanceof ApiError ? err.message : "Network error", variant: "destructive" });
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-orange-500 text-white shadow-md">
              <Truck className="size-5" />
            </span>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight">GANRAJ DRIVER PORTAL</h1>
              <p className="text-[10px] text-orange-400 font-semibold tracking-wider uppercase">
                Fleet · Orders · Telematics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {driverPhone && (
              <Button variant="outline" size="sm" onClick={handleLogout}
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 text-xs">
                <LogOut className="size-3.5 mr-1" /> Logout
              </Button>
            )}
            <Button asChild variant="outline" size="sm"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 text-xs">
              <a href="/"><ArrowLeft className="size-3.5 mr-1" /> Site</a>
            </Button>
          </div>
        </div>
        {/* Tab nav — only when logged in */}
        {driverPhone && (
          <div className="flex border-t border-white/10">
            <button
              onClick={() => setActiveTab("orders")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all",
                activeTab === "orders" ? "border-b-2 border-orange-500 text-orange-400" : "text-white/50 hover:text-white"
              )}
            >
              <Package className="size-3.5" />
              Available Orders
              {availableOrders.length > 0 && (
                <span className="ml-1 inline-flex size-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                  {availableOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab("trips"); if (trips.length > 0 && !activeTrip) loadTripDetails(trips[0].reference); }}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all",
                activeTab === "trips" ? "border-b-2 border-orange-500 text-orange-400" : "text-white/50 hover:text-white"
              )}
            >
              <Truck className="size-3.5" />
              My Trips ({trips.length})
            </button>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto w-full p-4 sm:p-6 flex-1 space-y-6">
        {/* ─── LOGIN SCREEN ─── */}
        {!driverPhone ? (
          <div className="max-w-md mx-auto py-8">
            <Card className="border-orange-500/30 bg-slate-900/90 shadow-2xl backdrop-blur">
              <CardContent className="p-6 sm:p-8 space-y-5">
                <div className="text-center space-y-2">
                  <div className="size-14 mx-auto rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                    <Truck className="size-7" />
                  </div>
                  <h2 className="text-xl font-extrabold text-white">Driver Portal Login</h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Enter your <strong className="text-orange-300">mobile number</strong> registered by the Ganraj Logistics admin.
                    You can then view open orders that fit your truck capacity and claim them directly.
                  </p>
                </div>

                <form onSubmit={handlePhoneLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Phone className="size-3.5 text-orange-400" /> Driver Mobile Number
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-xs font-bold text-slate-500">+91</span>
                      <Input
                        type="tel" inputMode="numeric" placeholder="9876543210"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="pl-12 bg-slate-950 border-white/20 text-white font-mono text-base h-12 tracking-wider"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={loggingIn || !phoneInput.trim()}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 shadow-lg">
                    {loggingIn ? (
                      <><Loader2 className="size-4 animate-spin mr-2" /> Verifying…</>
                    ) : (
                      <><ShieldCheck className="size-4 mr-2" /> Access Driver Portal</>
                    )}
                  </Button>
                </form>

                <div className="rounded-lg bg-slate-950/80 border border-white/10 p-3 text-[11px] text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-300">How to get access:</p>
                  <p>1. Admin adds your mobile number and vehicle details in the Fleet Management panel.</p>
                  <p>2. You log in here to view orders that fit your truck capacity and claim them directly.</p>
                  <p>3. After claiming, use the Telematics console to send live GPS checkpoints.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Driver Identity Strip */}
            <Card className="border-white/10 bg-slate-900/90 shadow-xl backdrop-blur">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="size-10 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-bold text-sm shrink-0">
                  {driverName.slice(0, 2).toUpperCase() || "DR"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">{driverName}</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                      Authorized Driver
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono truncate">
                    +91 {driverPhone} · {remainingCapacity.toFixed(1)}T free capacity · {trips.length} trip(s)
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => fetchAvailableOrders()}
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10 text-xs shrink-0"
                  disabled={loadingOrders}>
                  <RefreshCw className={cn("size-3.5", loadingOrders && "animate-spin")} />
                </Button>
              </CardContent>
            </Card>

            {/* ─── AVAILABLE ORDERS TAB ─── */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Package className="size-4 text-orange-400" /> Available Orders
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Orders below fit within your remaining truck capacity ({remainingCapacity.toFixed(1)}T free).
                      Claim an order to get it assigned to you.
                    </p>
                  </div>
                  <Button size="sm" variant="outline"
                    onClick={() => fetchAvailableOrders()}
                    disabled={loadingOrders}
                    className="border-white/20 bg-white/5 text-white hover:bg-white/10 text-xs">
                    <RefreshCw className={cn("size-3.5 mr-1", loadingOrders && "animate-spin")} /> Refresh
                  </Button>
                </div>

                {loadingOrders ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="size-8 animate-spin text-orange-500" />
                  </div>
                ) : availableOrders.length === 0 ? (
                  <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-white/10 bg-slate-900/40">
                    <Package className="size-12 text-slate-600 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-slate-300">No available orders right now</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Either all orders are assigned, or there are no new orders that fit your remaining capacity of {remainingCapacity.toFixed(1)}T.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableOrders.map((order) => (
                      <Card key={order.id} className="border-orange-500/20 bg-slate-900 hover:border-orange-500/40 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <span className="font-mono text-xs font-bold text-orange-400">{order.reference}</span>
                              <StatusBadge status={order.status} />
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleClaimOrder(order.reference)}
                              disabled={claimingId === order.reference}
                              className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shrink-0"
                            >
                              {claimingId === order.reference ? (
                                <Loader2 className="size-3.5 animate-spin mr-1" />
                              ) : (
                                <Plus className="size-3.5 mr-1" />
                              )}
                              Claim Order
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-lg bg-slate-950/60 p-2.5 border border-white/5">
                              <p className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">From</p>
                              <p className="text-white font-medium truncate">{order.pickupLocation}</p>
                            </div>
                            <div className="rounded-lg bg-slate-950/60 p-2.5 border border-white/5">
                              <div className="flex items-center justify-between mb-0.5">
                                <p className="text-[10px] text-slate-400 uppercase font-semibold">To</p>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryLocation)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-sky-400 hover:underline flex items-center gap-0.5"
                                >
                                  <ExternalLink className="size-2.5" /> Map
                                </a>
                              </div>
                              <p className="text-white font-medium truncate">{order.deliveryLocation}</p>
                            </div>
                            <div className="rounded-lg bg-slate-950/60 p-2.5 border border-white/5">
                              <p className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Material</p>
                              <p className="text-white font-medium truncate">{order.materialType}</p>
                            </div>
                            <div className="rounded-lg bg-slate-950/60 p-2.5 border border-white/5">
                              <p className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Load / Weight</p>
                              <p className="text-orange-300 font-bold">{order.quantity}</p>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3" /> {order.pickupDate || "TBD"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Truck className="size-3" /> {order.vehicleType}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── MY TRIPS TAB ─── */}
            {activeTab === "trips" && (
              <div className="space-y-5">
                {/* Trip switcher if multiple */}
                {trips.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-xs text-slate-400 shrink-0">Trip:</span>
                    {trips.map((t) => (
                      <button key={t.reference}
                        onClick={() => { setSelectedRef(t.reference); loadTripDetails(t.reference); }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition shrink-0",
                          selectedRef === t.reference
                            ? "bg-orange-500 text-white shadow-md"
                            : "bg-slate-950 text-slate-300 border border-white/10 hover:border-orange-500/50"
                        )}
                      >
                        {t.reference} ({t.status})
                      </button>
                    ))}
                  </div>
                )}

                {loadingTrip ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="size-8 animate-spin text-orange-500 mb-2" />
                    <p className="text-sm">Loading trip details…</p>
                  </div>
                ) : activeTrip ? (
                  <Card className="border-orange-500/30 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl overflow-hidden">
                    <div className="bg-orange-500/10 border-b border-orange-500/20 px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-orange-400">{activeTrip.reference}</span>
                        <StatusBadge status={activeTrip.status} />
                      </div>
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="size-3.5" /> {activeTrip.pickupDate || "Today"}
                      </span>
                    </div>

                    <CardContent className="p-5 sm:p-6 space-y-6">
                      {/* ─── ROUTE & CUSTOMER DELIVERY LOCATION LOG ─── */}
                      <div className="bg-slate-900/90 rounded-xl p-5 border border-red-500/30 space-y-4 shadow-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="size-9 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                              <MapPin className="size-5" />
                            </div>
                            <div>
                              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                                Customer Delivery Location & Navigation Log
                                {activeTrip.status === "Delivered" ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                                    Delivered
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold animate-pulse">
                                    En Route Target
                                  </span>
                                )}
                              </h3>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Exact drop-off coordinates, customer receiver details & turn-by-turn navigation
                              </p>
                            </div>
                          </div>

                          {/* Quick Navigation & Calling Actions */}
                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeTrip.deliveryLocation)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition shrink-0"
                            >
                              <Navigation className="size-3.5" /> Start Turn-by-Turn GPS
                            </a>
                            {activeTrip.phone && (
                              <a
                                href={`tel:${activeTrip.phone}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition shrink-0"
                              >
                                <Phone className="size-3.5" /> Call Customer
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Exact Destination & Address Detail Box */}
                        <div className="bg-slate-950 rounded-xl p-4 border border-white/10 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1 flex-1">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-red-400 flex items-center gap-1">
                                <Flag className="size-3" /> Exact Destination Address
                              </span>
                              <p className="text-base font-bold text-white leading-snug">
                                {activeTrip.deliveryLocation}
                              </p>
                              {(activeTrip.deliveryAddress || activeTrip.deliveryCity) && (
                                <p className="text-xs text-slate-400">
                                  {activeTrip.deliveryAddress && (
                                    <span><strong className="text-slate-300">Street / Area:</strong> {activeTrip.deliveryAddress} · </span>
                                  )}
                                  {activeTrip.deliveryCity && (
                                    <span><strong className="text-slate-300">City / District:</strong> {activeTrip.deliveryCity}</span>
                                  )}
                                </p>
                              )}
                            </div>

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(activeTrip.deliveryLocation);
                                setCopiedDelivery(true);
                                setTimeout(() => setCopiedDelivery(false), 2500);
                                toast({ title: "Address copied!", description: "Copied exact delivery location to clipboard." });
                              }}
                              className="shrink-0 text-xs h-8 px-2.5 border-white/15 bg-slate-900 hover:bg-white/10 text-slate-200"
                            >
                              {copiedDelivery ? (
                                <span className="flex items-center gap-1 text-emerald-400 font-bold"><Check className="size-3.5" /> Copied</span>
                              ) : (
                                <span className="flex items-center gap-1"><Copy className="size-3.5" /> Copy Exact Address</span>
                              )}
                            </Button>
                          </div>

                          {/* Customer Receiver Strip & Special Delivery Notes */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2.5 border-t border-white/10 text-xs">
                            <div className="flex items-center justify-between rounded-lg bg-slate-900/90 p-2.5 border border-white/5">
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Customer Receiver</span>
                                <span className="font-bold text-white">{activeTrip.name || activeTrip.customerName || "Customer"}</span>
                                <span className="text-slate-400 font-mono text-[11px] block">{activeTrip.phone || "—"}</span>
                              </div>
                              {activeTrip.phone && (
                                <a
                                  href={`https://wa.me/91${activeTrip.phone.replace(/[^0-9]/g, "").slice(-10)}?text=${encodeURIComponent(
                                    `Hello, I am your Ganraj Logistics driver for shipment ${activeTrip.reference}. I am currently en route to your delivery location: ${activeTrip.deliveryLocation}. Please share any specific gate/landmark pin if needed.`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold hover:bg-emerald-500/30 transition flex items-center gap-1"
                                >
                                  <MessageSquare className="size-3" /> WhatsApp
                                </a>
                              )}
                            </div>

                            <div className="rounded-lg bg-slate-900/90 p-2.5 border border-white/5">
                              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Delivery Notes / Drop-off Instructions</span>
                              <span className="text-slate-300 text-xs line-clamp-2">
                                {activeTrip.customerNotes || activeTrip.notes || "Standard safe delivery. Confirm gate number and receiver on arrival."}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Delivery Step-by-Step Location Progress Log */}
                        <div className="space-y-2 pt-1">
                          <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Route className="size-3.5 text-orange-400" /> Real-Time Delivery Progress Log
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                            {/* Step 1: Origin Pickup */}
                            <div className="rounded-lg bg-slate-950 p-3 border border-emerald-500/40 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="size-3" /> 1. Origin Pickup
                                </span>
                                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.5 rounded">
                                  Loaded
                                </span>
                              </div>
                              <p className="text-white font-medium text-xs truncate" title={activeTrip.pickupLocation}>
                                {activeTrip.pickupLocation}
                              </p>
                            </div>

                            {/* Step 2: Live In-Transit Checkpoint */}
                            <div className="rounded-lg bg-slate-950 p-3 border border-orange-500/40 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase text-orange-400 flex items-center gap-1">
                                  <Compass className="size-3 animate-spin" /> 2. Live Checkpoint
                                </span>
                                <span className="text-[10px] text-orange-300 font-semibold bg-orange-950/60 px-1.5 py-0.5 rounded">
                                  En Route
                                </span>
                              </div>
                              <p className="text-white font-medium text-xs truncate" title={activeTrip.currentLocation || "In transit"}>
                                {activeTrip.currentLocation || "En route on highway"}
                              </p>
                            </div>

                            {/* Step 3: Destination Customer Delivery */}
                            <div className={cn(
                              "rounded-lg bg-slate-950 p-3 border space-y-1 transition",
                              activeTrip.status === "Delivered"
                                ? "border-emerald-500/60 bg-emerald-950/30"
                                : "border-red-500/40"
                            )}>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase text-red-400 flex items-center gap-1">
                                  <Flag className="size-3" /> 3. Customer Delivery
                                </span>
                                {activeTrip.status === "Delivered" ? (
                                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.5 rounded">
                                    Delivered
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setLocationText(`Arrived at Customer Delivery: ${activeTrip.deliveryLocation}`);
                                      toast({
                                        title: "Destination checkpoint filled!",
                                        description: "Ready to send checkpoint or mark as delivered.",
                                      });
                                    }}
                                    className="text-[10px] text-red-300 underline hover:text-white font-semibold"
                                  >
                                    Tap When Arrived
                                  </button>
                                )}
                              </div>
                              <p className="text-white font-medium text-xs truncate" title={activeTrip.deliveryLocation}>
                                {activeTrip.deliveryLocation}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cargo & Vehicle Details Strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="bg-slate-950/60 p-3 rounded-lg border border-white/5">
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Assigned Vehicle</p>
                          <p className="text-sm font-bold text-orange-300 font-mono mt-0.5">{activeTrip.vehicleNumber || "Assigned"}</p>
                        </div>
                        <div className="bg-slate-950/60 p-3 rounded-lg border border-white/5">
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Cargo & Weight</p>
                          <p className="text-xs font-semibold text-white mt-0.5">{activeTrip.materialType} · {activeTrip.quantity}</p>
                        </div>
                        <div className="bg-slate-950/60 p-3 rounded-lg border border-white/5">
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Vehicle Type</p>
                          <p className="text-xs font-semibold text-white mt-0.5 truncate">{activeTrip.vehicleType || "Commercial Truck"}</p>
                        </div>
                        <div className="bg-slate-950/60 p-3 rounded-lg border border-white/5">
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Pickup Date</p>
                          <p className="text-xs font-mono font-bold text-white mt-0.5">{activeTrip.pickupDate || "Today"}</p>
                        </div>
                      </div>

                      {/* ─── ONE-CLICK: LOADED AT PICKUP ─── */}
                      {activeTrip.status !== "In Transit" && activeTrip.status !== "Delivered" && (
                        <div className="rounded-xl border border-indigo-500/50 bg-indigo-950/40 p-4 shadow-lg">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="size-10 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
                                <Package className="size-5" />
                              </div>
                              <div>
                                <p className="text-sm font-extrabold text-white">📦 Mark as Loaded</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  Tap when goods are loaded at pickup point. Instantly notifies admin & customer that trip has started.
                                </p>
                                <p className="text-[11px] text-indigo-300 font-semibold mt-1 truncate">{activeTrip.pickupLocation}</p>
                              </div>
                            </div>
                            <Button
                              onClick={handleMarkLoaded}
                              disabled={updatingStatus}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm h-12 px-6 shadow-xl shrink-0 min-w-[160px]"
                            >
                              {updatingStatus ? (
                                <><Loader2 className="size-4 animate-spin mr-2" /> Sending…</>
                              ) : (
                                <><Truck className="size-4 mr-2" /> Loaded — Start Trip</>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* ─── TELEMATICS CONSOLE (keep as-is) ─── */}
                      <div className="bg-slate-900 rounded-xl p-5 border border-orange-500/30 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                          <div>
                            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                              <Compass className="size-4 text-orange-400" /> Live Telematics & Checkpoint
                            </h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Detect GPS or type checkpoint. Updates sync to Admin & Customer Tracking instantly.
                            </p>
                          </div>
                          <Button type="button" onClick={handleDetectGps} disabled={detectingGps}
                            className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs h-9 px-3.5 shadow-sm">
                            {detectingGps ? (
                              <><Loader2 className="size-3.5 animate-spin mr-1.5" /> Finding Live Place…</>
                            ) : (
                              <><Crosshair className="size-3.5 mr-1.5" /> Detect Live Place & GPS</>
                            )}
                          </Button>
                        </div>

                        {gpsCoords && (
                          <div className="rounded-lg bg-sky-950/70 border border-sky-500/40 p-2.5 text-xs text-sky-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                              GPS Locked: <strong>{gpsCoords.latitude.toFixed(5)}, {gpsCoords.longitude.toFixed(5)}</strong>
                              {gpsCoords.accuracy ? ` (±${gpsCoords.accuracy}m)` : ""}
                            </div>
                            <a href={`https://www.google.com/maps?q=${gpsCoords.latitude},${gpsCoords.longitude}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-sky-300 hover:underline flex items-center gap-1 font-semibold text-[11px]">
                              <ExternalLink className="size-3" /> Map
                            </a>
                          </div>
                        )}

                        {/* ─── AUTO-CHECKPOINT TOGGLE (1hr) ─── */}
                        <div className={cn(
                          "rounded-lg border p-3 flex flex-col sm:flex-row sm:items-center gap-3 transition-all",
                          autoCheckpointEnabled
                            ? "border-amber-500/50 bg-amber-950/30"
                            : "border-white/10 bg-slate-950/60"
                        )}>
                          <div className="flex items-center gap-2.5 flex-1">
                            <div className={cn(
                              "size-8 rounded-lg flex items-center justify-center shrink-0",
                              autoCheckpointEnabled
                                ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                                : "bg-slate-800 border border-white/10 text-slate-400"
                            )}>
                              <AlarmClock className="size-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">
                                Auto-Checkpoint Every 1 Hour
                                {autoCheckpointEnabled && (
                                  <span className="ml-2 text-[10px] text-amber-300 font-semibold">● ACTIVE</span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {autoCheckpointEnabled
                                  ? `Next auto-update in: ${formatCountdown(nextAutoCheckIn)}`
                                  : "Automatically sends GPS location to admin & customer every hour while driving"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {autoCheckpointEnabled && (
                              <button
                                type="button"
                                onClick={sendAutoCheckpoint}
                                className="text-[11px] px-2.5 py-1.5 rounded-lg border border-amber-500/40 text-amber-300 bg-amber-950/50 hover:bg-amber-900/50 font-semibold transition flex items-center gap-1"
                              >
                                <Zap className="size-3" /> Send Now
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setAutoCheckpointEnabled((v) => !v)}
                              className={cn(
                                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none",
                                autoCheckpointEnabled ? "bg-amber-500" : "bg-slate-700"
                              )}
                            >
                              <span className={cn(
                                "pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg transform transition duration-200",
                                autoCheckpointEnabled ? "translate-x-5" : "translate-x-0"
                              )} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-400 font-semibold block mb-1.5">Quick Shortcuts:</label>
                          <div className="flex flex-wrap gap-1.5">
                            {quickPresets.map((preset) => (
                              <button key={preset} type="button" onClick={() => setLocationText(preset)}
                                className="px-2.5 py-1 rounded-md text-[11px] bg-slate-950 border border-white/10 text-slate-300 hover:text-white hover:border-orange-400/50 transition">
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <MapPin className="size-3.5 text-orange-400" /> Current Checkpoint
                          </Label>
                          <Input placeholder="e.g. Pune-Bangalore Highway, Toll Booth Km 85"
                            value={locationText} onChange={(e) => setLocationText(e.target.value)}
                            className="bg-slate-950 border-white/20 text-white text-xs h-10" />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-slate-300">Update Note (Optional)</Label>
                          <Input placeholder="e.g. Traffic clear, cargo secure, arrival 6:00 PM"
                            value={statusNote} onChange={(e) => setStatusNote(e.target.value)}
                            className="bg-slate-950 border-white/20 text-white text-xs h-10" />
                        </div>

                        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <Button onClick={() => handleUpdateTrip()}
                            disabled={updatingStatus || !locationText.trim()}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs h-11">
                            {updatingStatus ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Send className="size-4 mr-1.5" />}
                            Send Manual Checkpoint
                          </Button>
                          <Button onClick={() => { handleDetectGps(); }}
                            disabled={detectingGps || updatingStatus}
                            className="bg-sky-700 hover:bg-sky-600 text-white font-semibold text-xs h-11">
                            {detectingGps ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Crosshair className="size-4 mr-1.5" />}
                            Detect GPS & Fill
                          </Button>
                        </div>
                      </div>

                      {/* ─── ONE-CLICK: DELIVERED ─── */}
                      {activeTrip.status !== "Delivered" && (
                        <div className="rounded-xl border-2 border-emerald-500/60 bg-emerald-950/30 p-4 shadow-xl">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="size-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
                                <PackageCheck className="size-5" />
                              </div>
                              <div>
                                <p className="text-sm font-extrabold text-white">🏁 Mark as Delivered</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  Tap when goods have been successfully handed over to the customer. Instantly closes the booking.
                                </p>
                                <p className="text-[11px] text-emerald-300 font-semibold mt-1 truncate">{activeTrip.deliveryLocation}</p>
                              </div>
                            </div>
                            <Button
                              onClick={handleMarkDelivered}
                              disabled={updatingStatus}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm h-12 px-6 shadow-xl shrink-0 min-w-[160px] border-2 border-emerald-400/50"
                            >
                              {updatingStatus ? (
                                <><Loader2 className="size-4 animate-spin mr-2" /> Sending…</>
                              ) : (
                                <><CheckCircle2 className="size-4 mr-2" /> Confirm Delivered</>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Delivered success state */}
                      {activeTrip.status === "Delivered" && (
                        <div className="rounded-xl border border-emerald-500/50 bg-emerald-950/20 p-4 text-center space-y-1">
                          <CheckCircle2 className="size-8 text-emerald-400 mx-auto" />
                          <p className="text-sm font-extrabold text-emerald-300">Shipment Delivered!</p>
                          <p className="text-[11px] text-slate-400">This booking has been marked as delivered. Admin & customer have been notified.</p>
                        </div>
                      )}

                      {/* Timeline */}
                      {activeTrip.history && activeTrip.history.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Clock className="size-3.5 text-orange-400" /> Logged Checkpoints
                          </h4>
                          <div className="space-y-2.5 border-l-2 border-orange-500/40 pl-4">
                            {activeTrip.history.map((h: any, idx: number) => (
                              <div key={idx} className="relative text-xs">
                                <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-orange-400" />
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">{h.toStatus}</span>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(h.createdAt).toLocaleString("en-IN", {
                                      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                {h.note && <p className="text-slate-300 mt-0.5">{h.note}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-white/10 bg-slate-900/40">
                    <Truck className="size-12 text-slate-600 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-300">No Active Trips</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      You have no trips assigned yet. Check the <strong className="text-orange-400">Available Orders</strong> tab to claim open orders that match your truck capacity.
                    </p>
                    <Button onClick={() => setActiveTab("orders")}
                      className="mt-4 bg-orange-500 hover:bg-orange-600 text-white text-xs">
                      <Package className="size-3.5 mr-1.5" /> View Available Orders
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} {COMPANY.name} — Driver Fleet Portal</p>
      </footer>
    </div>
  );
}
