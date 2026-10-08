"use client";

import { useState } from "react";
import {
  Truck,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  Scale,
  Calendar,
  ClipboardList,
  Send,
  CheckCircle2,
  Search,
  ArrowRight,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  createBooking,
  trackBooking,
  type FieldErrors,
  ApiError,
} from "@/lib/api-client";
import { VEHICLE_TYPES, COMPANY } from "@/lib/constants";
import { StatusBadge } from "@/components/site/status-badge";
import { useToast } from "@/hooks/use-toast";

interface FormState {
  name: string;
  phone: string;
  email: string;
  pickupLocation: string;
  deliveryLocation: string;
  materialType: string;
  quantity: string;
  vehicleType: string;
  pickupDate: string;
  notes: string;
}

const EMPTY: FormState = {
  name: "",
  phone: "",
  email: "",
  pickupLocation: "",
  deliveryLocation: "",
  materialType: "",
  quantity: "",
  vehicleType: "",
  pickupDate: "",
  notes: "",
};

export function BookingSection() {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    reference: string;
    name: string;
  } | null>(null);

  // Track state
  const [trackRef, setTrackRef] = useState("");
  const [tracking, setTracking] = useState(false);
  const [trackResult, setTrackResult] = useState<null | {
    reference: string;
    status: string;
    pickupLocation: string;
    deliveryLocation: string;
    vehicleType: string;
    pickupDate: string;
    createdAt: string;
    history: { toStatus: string; note: string | null; createdAt: string }[];
  }>(null);
  const [trackError, setTrackError] = useState("");

  const update = (field: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Please enter your full name";
    if (form.phone.trim().length < 10)
      e.phone = "Enter a valid 10-digit phone number";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email";
    if (form.pickupLocation.trim().length < 3)
      e.pickupLocation = "Enter the pickup location";
    if (form.deliveryLocation.trim().length < 3)
      e.deliveryLocation = "Enter the delivery location";
    if (form.materialType.trim().length < 2)
      e.materialType = "Enter the material type";
    if (!form.quantity.trim()) e.quantity = "Enter the quantity";
    if (!form.vehicleType) e.vehicleType = "Select a vehicle type";
    if (!form.pickupDate) e.pickupDate = "Select a pickup date";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await createBooking({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        pickupLocation: form.pickupLocation.trim(),
        deliveryLocation: form.deliveryLocation.trim(),
        materialType: form.materialType.trim(),
        quantity: form.quantity.trim(),
        vehicleType: form.vehicleType,
        pickupDate: form.pickupDate,
        notes: form.notes.trim() || undefined,
      });
      setSuccess({ reference: res.reference, name: res.name });
      setForm(EMPTY);
      toast({
        title: "Booking request submitted!",
        description: `Your reference is ${res.reference}`,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.issues) {
          const fieldErrs: Record<string, string> = {};
          Object.entries(err.issues as FieldErrors).forEach(([k, v]) => {
            if (v && v.length) fieldErrs[k] = v[0];
          });
          setErrors(fieldErrs);
        }
        toast({
          title: "Could not submit",
          description: err.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Could not submit",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onTrack = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!trackRef.trim()) return;
    setTracking(true);
    setTrackError("");
    setTrackResult(null);
    try {
      const data = await trackBooking(trackRef.trim());
      setTrackResult(data);
    } catch (err) {
      setTrackError(
        err instanceof ApiError ? err.message : "Could not find booking."
      );
    } finally {
      setTracking(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <section id="book" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-brand">
            Book Now
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
            Request a Transport Quote
          </h2>
          <p className="mt-3 text-muted-foreground">
            Share your shipment details — our team will coordinate the right
            vehicle and get back to you with a quote.
          </p>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-brand" />
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-5">
          {/* Form */}
          <Card className="lg:col-span-3 border-border shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full Name" icon={User} error={errors.name} required>
                    <Input
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="Your name"
                    />
                  </Field>
                  <Field label="Phone Number" icon={Phone} error={errors.phone} required>
                    <Input
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder="10-digit mobile number"
                      inputMode="tel"
                    />
                  </Field>
                </div>

                <Field label="Email (optional)" icon={Mail} error={errors.email}>
                  <Input
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="you@company.com"
                    type="email"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Pickup Location"
                    icon={MapPin}
                    error={errors.pickupLocation}
                    required
                  >
                    <Input
                      value={form.pickupLocation}
                      onChange={(e) => update("pickupLocation", e.target.value)}
                      placeholder="City / area"
                    />
                  </Field>
                  <Field
                    label="Delivery Location"
                    icon={MapPin}
                    error={errors.deliveryLocation}
                    required
                  >
                    <Input
                      value={form.deliveryLocation}
                      onChange={(e) =>
                        update("deliveryLocation", e.target.value)
                      }
                      placeholder="City / area"
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Material Type"
                    icon={Package}
                    error={errors.materialType}
                    required
                  >
                    <Input
                      value={form.materialType}
                      onChange={(e) => update("materialType", e.target.value)}
                      placeholder="e.g. Cement, Steel, FMCG"
                    />
                  </Field>
                  <Field
                    label="Quantity"
                    icon={Scale}
                    error={errors.quantity}
                    required
                  >
                    <Input
                      value={form.quantity}
                      onChange={(e) => update("quantity", e.target.value)}
                      placeholder="e.g. 12 Ton / 1 Truck"
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Vehicle Type"
                    icon={Truck}
                    error={errors.vehicleType}
                    required
                  >
                    <Select
                      value={form.vehicleType}
                      onValueChange={(v) => update("vehicleType", v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72 gls-scroll">
                        {VEHICLE_TYPES.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field
                    label="Pickup Date"
                    icon={Calendar}
                    error={errors.pickupDate}
                    required
                  >
                    <Input
                      type="date"
                      min={today}
                      value={form.pickupDate}
                      onChange={(e) => update("pickupDate", e.target.value)}
                    />
                  </Field>
                </div>

                <Field
                  label="Notes (optional)"
                  icon={ClipboardList}
                  error={errors.notes}
                >
                  <Textarea
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    placeholder="Any special instructions, loading/unloading details, etc."
                    rows={3}
                  />
                </Field>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-brand text-white hover:bg-brand-600"
                    size="lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Submitting…
                      </>
                    ) : (
                      <>
                        <Send className="size-4" /> Submit Request
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    By submitting, you agree to be contacted about your shipment.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Side: track + info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-navy bg-navy text-white shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold">Track Your Booking</h3>
                <p className="mt-1 text-sm text-white/70">
                  Enter the reference you received after booking.
                </p>
                <form onSubmit={onTrack} className="mt-4 flex gap-2">
                  <Input
                    value={trackRef}
                    onChange={(e) => setTrackRef(e.target.value)}
                    placeholder="e.g. GLS241006-AB12"
                    className="border-white/20 bg-white/10 text-white placeholder:text-white/40"
                  />
                  <Button
                    type="submit"
                    disabled={tracking}
                    className="bg-brand text-white hover:bg-brand-600"
                  >
                    {tracking ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Search className="size-4" />
                    )}
                  </Button>
                </form>
                {trackError && (
                  <p className="mt-2 text-xs text-red-300">{trackError}</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-navy">
                  Why book with us?
                </h3>
                <ul className="mt-4 space-y-3 text-sm">
                  {[
                    "Reliable vehicle arrangement",
                    "Timely pickup & safe delivery",
                    "Competitive market rates",
                    "Updates throughout the movement",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
                      <span className="text-navy/80">{t}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 rounded-lg bg-secondary p-4 text-sm">
                  <p className="font-semibold text-navy">Prefer to talk?</p>
                  <p className="mt-1 text-muted-foreground">
                    Call us at{" "}
                    <a
                      href={`tel:${COMPANY.phonePrimaryRaw}`}
                      className="font-semibold text-brand"
                    >
                      {COMPANY.phonePrimary}
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Success dialog */}
      <Dialog open={!!success} onOpenChange={(o) => !o && setSuccess(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand/10">
              <CheckCircle2 className="size-8 text-brand" />
            </div>
            <DialogTitle className="text-center text-2xl text-navy">
              Request Submitted!
            </DialogTitle>
            <DialogDescription className="text-center">
              Thank you {success?.name?.split(" ")[0]}. We&apos;ve received your
              transport request.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <div className="rounded-lg border border-dashed border-brand/40 bg-brand/5 p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your Booking Reference
              </p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight text-navy">
                {success?.reference}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Save this to track your request anytime.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                className="bg-brand text-white hover:bg-brand-600"
                onClick={() => {
                  if (success) {
                    setTrackRef(success.reference);
                    setSuccess(null);
                    setTimeout(() => {
                      document
                        .getElementById("book")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }
                }}
              >
                Track this booking <ArrowRight className="size-4" />
              </Button>
              <Button variant="outline" onClick={() => setSuccess(null)}>
                <X className="size-4" /> Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Track result dialog */}
      <Dialog
        open={!!trackResult}
        onOpenChange={(o) => !o && setTrackResult(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-navy">Booking Status</DialogTitle>
            <DialogDescription>
              Reference {trackResult?.reference}
            </DialogDescription>
          </DialogHeader>
          {trackResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                <span className="text-sm font-medium text-muted-foreground">
                  Current Status
                </span>
                <StatusBadge status={trackResult.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Pickup" value={trackResult.pickupLocation} />
                <Info label="Delivery" value={trackResult.deliveryLocation} />
                <Info label="Vehicle" value={trackResult.vehicleType} />
                <Info label="Pickup Date" value={trackResult.pickupDate} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Status Timeline
                </p>
                <ol className="mt-3 space-y-3 border-l-2 border-brand/30 pl-4">
                  {trackResult.history.map((h, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-brand" />
                      <div className="flex items-center gap-2">
                        <StatusBadge status={h.toStatus} />
                        <span className="text-xs text-muted-foreground">
                          {new Date(h.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {h.note && (
                        <p className="mt-0.5 text-sm text-navy/80">{h.note}</p>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Field({
  label,
  icon: Icon,
  error,
  required,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-sm font-medium text-navy">
        <Icon className="size-3.5 text-brand" />
        {label}
        {required && <span className="text-brand">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-white p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-navy">{value}</p>
    </div>
  );
}
