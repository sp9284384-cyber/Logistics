// Frontend API client for Ganraj Logistics Service.
// Connects the Next.js React frontend to the FastAPI backend at /api/v1

export interface Booking {
  id: string;
  reference: string;
  name: string;
  phone: string;
  email: string | null;
  pickupLocation: string;
  deliveryLocation: string;
  materialType: string;
  quantity: string;
  vehicleType: string;
  pickupDate: string;
  notes: string | null;
  status: string;

  // Invoice & Quotation fields
  totalAmount?: number | null;
  invoiceNotes?: string | null;
  invoiceSentAt?: string | null;

  // Driver Assignment fields
  driverName?: string | null;
  driverPhone?: string | null;
  vehicleNumber?: string | null;
  driverNotes?: string | null;
  assignedAt?: string | null;

  // Real-time Automated Tracking fields
  currentLocation?: string | null;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  lastLocationUpdate?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface StatusHistoryEntry {
  id: string;
  bookingId: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  adminId: string | null;
  admin: { name: string } | null;
  createdAt: string;
}

export interface BookingWithHistory extends Booking {
  history: StatusHistoryEntry[];
}

export interface BookingInput {
  name: string;
  phone: string;
  email?: string;
  pickupLocation: string;
  deliveryLocation: string;
  materialType: string;
  quantity: string;
  vehicleType: string;
  pickupDate: string;
  notes?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  username?: string;
}

export interface DriverProfile {
  id: number;
  name: string;
  phone: string;
  vehicleNumber: string;
  vehicleType: string;
  capacityTons: number;
  status: string; // "Available" | "On Trip" | "Off Duty"
  licenseNumber?: string | null;
  notes?: string | null;
  currentLocation?: string | null;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  lastLocationUpdate?: string | null;
  createdAt?: string;
  activeOrdersCount: number;
  currentLoadTons: number;
  remainingCapacityTons: number;
}

export interface FieldErrors {
  [key: string]: string[];
}

export class ApiError extends Error {
  status: number;
  issues?: FieldErrors;
  constructor(message: string, status: number, issues?: FieldErrors) {
    super(message);
    this.status = status;
    this.issues = issues;
  }
}

// Configurable API URL: reads NEXT_PUBLIC_API_URL or defaults to local /api/v1 (proxied to FastAPI)
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && window.location.origin
    ? `${window.location.origin}/api/v1`
    : "http://127.0.0.1:8000/api/v1");

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("admin_token");
  } catch {
    return null;
  }
}

function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      localStorage.setItem("admin_token", token);
    } else {
      localStorage.removeItem("admin_token");
    }
  } catch {
    // ignore storage errors
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let message = "Something went wrong. Please try again.";
  let issues: FieldErrors | undefined;
  try {
    const data = await res.json();
    if (typeof data.error === "string") {
      message = data.error;
    } else if (typeof data.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data.detail)) {
      issues = {};
      const msgs: string[] = [];
      for (const item of data.detail) {
        const field = item.loc ? item.loc[item.loc.length - 1] : "general";
        if (!issues[field]) issues[field] = [];
        issues[field].push(item.msg);
        msgs.push(`${field}: ${item.msg}`);
      }
      message = msgs.join(" | ") || "Validation failed";
    }
    if (data.issues) issues = data.issues;
  } catch {
    // ignore
  }
  return new ApiError(message, res.status, issues);
}

export async function request<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const url = `${API_BASE.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    throw await parseError(res);
  }
  return res.json();
}

export async function createBooking(
  input: BookingInput
): Promise<{
  id: string;
  reference: string;
  status: string;
  name: string;
}> {
  const res = await request<any>("/bookings", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return {
    id: String(res.id),
    reference: res.reference || res.ref_code,
    status: res.status,
    name: res.name || res.contact_person || res.company_name,
  };
}

export async function trackBooking(reference: string) {
  const res = await request<any>(
    `/bookings/track?reference=${encodeURIComponent(reference.trim())}`
  );
  return res.data as {
    id: number;
    reference: string;
    status: string;
    customerName?: string;
    phone?: string;
    pickupLocation: string;
    deliveryLocation: string;
    pickupCity?: string | null;
    pickupAddress?: string | null;
    deliveryCity?: string | null;
    deliveryAddress?: string | null;
    customerNotes?: string | null;
    driverNotes?: string | null;
    materialType?: string;
    quantity?: string;
    vehicleType: string;
    pickupDate: string;
    totalAmount?: number | null;
    driverName?: string | null;
    driverPhone?: string | null;
    vehicleNumber?: string | null;
    currentLocation?: string | null;
    lastLocationUpdate?: string | null;
    createdAt: string;
    history: { toStatus: string; note: string | null; createdAt: string }[];
  };
}

export async function loginAdmin(
  email: string,
  password: string
): Promise<AdminUser> {
  const res = await request<any>("/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, username: email, password }),
  });
  if (res.access_token) {
    setAuthToken(res.access_token);
  }
  const admin: AdminUser = res.admin || {
    id: "1",
    email,
    name: email.split("@")[0],
    username: email.split("@")[0],
  };
  return admin;
}

export async function logoutAdmin(): Promise<void> {
  try {
    await request("/admin/logout", { method: "POST" });
  } catch {
    // Ignore network error on logout
  } finally {
    setAuthToken(null);
  }
}

export async function getMe(): Promise<AdminUser | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await request<any>("/admin/me");
    return (res.admin || res) as AdminUser;
  } catch {
    setAuthToken(null);
    return null;
  }
}

export async function listBookings(
  params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}
): Promise<{
  data: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.search) qs.set("search", params.search);

  const res = await request<any>(`/admin/bookings?${qs.toString()}`);

  if (Array.isArray(res)) {
    return {
      data: res.map(formatBookingItem),
      pagination: {
        page: params.page || 1,
        limit: params.limit || res.length,
        total: res.length,
        totalPages: 1,
      },
    };
  }

  const list = Array.isArray(res.data) ? res.data : [];
  return {
    data: list.map(formatBookingItem),
    pagination: res.pagination || {
      page: params.page || 1,
      limit: params.limit || 10,
      total: list.length,
      totalPages: 1,
    },
  };
}

export async function getBooking(id: string): Promise<{
  data: BookingWithHistory;
}> {
  const res = await request<any>(`/admin/bookings/${id}`);
  const b = formatBookingItem(res.data || res);
  const rawHistory = res.history || (res.data && res.data.history) || [];
  const history: StatusHistoryEntry[] = rawHistory.map((h: any) => ({
    id: String(h.id),
    bookingId: String(b.id),
    fromStatus: h.fromStatus || h.old_status || null,
    toStatus: h.toStatus || h.new_status,
    note: h.note || null,
    adminId: h.adminId || null,
    admin: h.admin || (h.changed_by ? { name: h.changed_by } : null),
    createdAt: h.createdAt || h.created_at,
  }));

  return {
    data: {
      ...b,
      history,
    },
  };
}

export async function updateBookingStatus(
  id: string,
  status: string,
  note?: string
): Promise<{ data: BookingWithHistory }> {
  await request<any>(`/admin/bookings/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note: note || undefined }),
  });
  return getBooking(id);
}

// Admin: Forward Invoice / Quote Email
export async function sendInvoiceToCustomer(
  bookingId: string,
  data: {
    total_amount: number;
    advance_amount?: number;
    tax_percent?: number;
    invoice_notes?: string;
    payment_terms?: string;
  }
): Promise<{ success: boolean; message: string; booking: Booking; email_info: any }> {
  const res = await request<any>(`/admin/bookings/${bookingId}/send-invoice`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return {
    ...res,
    booking: formatBookingItem(res.booking),
  };
}

// Admin: Assign Driver Details
export async function assignDriverToBooking(
  bookingId: string,
  data: {
    driver_name: string;
    driver_phone: string;
    vehicle_number: string;
    driver_notes?: string;
  }
): Promise<{ success: boolean; message: string; booking: Booking }> {
  const res = await request<any>(`/admin/bookings/${bookingId}/assign-driver`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return {
    ...res,
    booking: formatBookingItem(res.booking),
  };
}

// Driver: Login with registered phone number
export async function loginDriver(phone: string): Promise<{
  success: boolean;
  phone: string;
  driverName: string;
  trips: Booking[];
}> {
  const res = await request<any>("/bookings/driver/login", {
    method: "POST",
    body: JSON.stringify({ phone: phone.trim() }),
  });
  return {
    ...res,
    trips: (res.trips || []).map(formatBookingItem),
  };
}

// Driver: Fetch assigned trips by phone
export async function getDriverTrips(phone: string): Promise<Booking[]> {
  const res = await request<any>(`/bookings/driver/trips?phone=${encodeURIComponent(phone.trim())}`);
  return (res.trips || []).map(formatBookingItem);
}

// Driver: Update location and status (automated checkpoints)
export async function updateDriverLocationAndStatus(payload: {
  phone: string;
  booking_id_or_ref?: string;
  location: string;
  status?: "In Transit" | "Delivered";
  note?: string;
  latitude?: number;
  longitude?: number;
}): Promise<{ success: boolean; message: string; booking: Booking }> {
  const res = await request<any>("/bookings/driver/update-location", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return {
    ...res,
    booking: formatBookingItem(res.booking),
  };
}

function formatBookingItem(b: any): Booking {
  return {
    id: String(b.id),
    reference: b.reference || b.ref_code || `GLS-${b.id}`,
    name: b.name || b.contact_person || b.company_name || "Customer",
    phone: b.phone || "",
    email: b.email || null,
    pickupLocation: b.pickupLocation || b.pickup_city || "",
    deliveryLocation: b.deliveryLocation || b.delivery_city || "",
    materialType: b.materialType || b.material || "General Goods",
    quantity:
      b.quantity ||
      (b.weight_tons ? `${b.weight_tons} Tons` : "Standard Load"),
    vehicleType: b.vehicleType || b.vehicle_type || b.load_type || "Truck",
    pickupDate:
      b.pickupDate ||
      (b.pickup_date ? String(b.pickup_date).slice(0, 10) : "") ||
      String(b.created_at || "").slice(0, 10),
    notes: b.notes || null,
    status: b.status || "New",

    totalAmount: b.totalAmount ?? (b.total_amount ? Number(b.total_amount) : null),
    invoiceNotes: b.invoiceNotes || b.invoice_notes || null,
    invoiceSentAt: b.invoiceSentAt || b.invoice_sent_at || null,

    driverName: b.driverName || b.driver_name || null,
    driverPhone: b.driverPhone || b.driver_phone || null,
    vehicleNumber: b.vehicleNumber || b.vehicle_number || null,
    driverNotes: b.driverNotes || b.driver_notes || null,
    assignedAt: b.assignedAt || b.assigned_at || null,

    currentLocation: b.currentLocation || b.current_location || null,
    currentLatitude: b.currentLatitude ?? (b.current_latitude ? Number(b.current_latitude) : null),
    currentLongitude: b.currentLongitude ?? (b.current_longitude ? Number(b.current_longitude) : null),
    lastLocationUpdate: b.lastLocationUpdate || b.last_location_update || null,

    createdAt: b.createdAt || b.created_at || new Date().toISOString(),
    updatedAt:
      b.updatedAt || b.updated_at || b.createdAt || new Date().toISOString(),
  };
}

function formatDriverProfile(d: any): DriverProfile {
  return {
    id: Number(d.id),
    name: d.name || "",
    phone: d.phone || "",
    vehicleNumber: d.vehicle_number || d.vehicleNumber || "",
    vehicleType: d.vehicle_type || d.vehicleType || "Truck",
    capacityTons: Number(d.capacity_tons ?? d.capacityTons ?? 15),
    status: d.status || "Available",
    licenseNumber: d.license_number || d.licenseNumber || null,
    notes: d.notes || null,
    currentLocation: d.current_location || d.currentLocation || null,
    currentLatitude: d.current_latitude ? Number(d.current_latitude) : null,
    currentLongitude: d.current_longitude ? Number(d.current_longitude) : null,
    lastLocationUpdate: d.last_location_update || d.lastLocationUpdate || null,
    createdAt: d.created_at || d.createdAt || "",
    activeOrdersCount: Number(d.active_orders_count ?? d.activeOrdersCount ?? 0),
    currentLoadTons: Number(d.current_load_tons ?? d.currentLoadTons ?? 0),
    remainingCapacityTons: Number(d.remaining_capacity_tons ?? d.remainingCapacityTons ?? 15),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// FLEET / DRIVER MANAGEMENT — Admin APIs
// ──────────────────────────────────────────────────────────────────────────────

export async function listFleetDrivers(status?: string): Promise<DriverProfile[]> {
  const qs = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  const res = await request<any>(`/admin/drivers${qs}`);
  return (res.drivers || []).map(formatDriverProfile);
}

export async function createFleetDriver(data: {
  name: string;
  phone: string;
  vehicle_number: string;
  vehicle_type: string;
  capacity_tons: number;
  status?: string;
  license_number?: string;
  notes?: string;
}): Promise<{ success: boolean; message: string; driver: DriverProfile }> {
  const res = await request<any>("/admin/drivers", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return { ...res, driver: formatDriverProfile(res.driver) };
}

export async function updateFleetDriver(
  driverId: number,
  data: Partial<{
    name: string;
    phone: string;
    vehicle_number: string;
    vehicle_type: string;
    capacity_tons: number;
    status: string;
    license_number: string;
    notes: string;
  }>
): Promise<{ success: boolean; message: string; driver: DriverProfile }> {
  const res = await request<any>(`/admin/drivers/${driverId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return { ...res, driver: formatDriverProfile(res.driver) };
}

export async function deleteFleetDriver(driverId: number): Promise<{ success: boolean; message: string }> {
  return request<any>(`/admin/drivers/${driverId}`, { method: "DELETE" });
}

// ──────────────────────────────────────────────────────────────────────────────
// DRIVER PORTAL — Capacity-aware order claiming
// ──────────────────────────────────────────────────────────────────────────────

export async function getDriverAvailableOrders(phone: string): Promise<{
  remainingCapacityTons: number;
  orders: Booking[];
}> {
  const res = await request<any>(`/bookings/driver/available-orders?phone=${encodeURIComponent(phone)}`);
  return {
    remainingCapacityTons: Number(res.remaining_capacity_tons ?? 15),
    orders: (res.orders || []).map(formatBookingItem),
  };
}

export async function claimOrder(payload: {
  phone: string;
  booking_id_or_ref: string;
  note?: string;
}): Promise<{ success: boolean; message: string; booking: Booking }> {
  const res = await request<any>("/bookings/driver/claim-order", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return { ...res, booking: formatBookingItem(res.booking) };
}
