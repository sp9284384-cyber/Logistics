// Frontend API client for Ganraj Logistics Service.
// All requests are same-origin so the httpOnly admin cookie is sent automatically.

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

async function parseError(res: Response): Promise<ApiError> {
  let message = "Something went wrong. Please try again.";
  let issues: FieldErrors | undefined;
  try {
    const data = await res.json();
    if (typeof data.error === "string") message = data.error;
    if (data.issues) issues = data.issues;
  } catch {
    // ignore
  }
  return new ApiError(message, res.status, issues);
}

export async function createBooking(
  input: BookingInput
): Promise<{
  id: string;
  reference: string;
  status: string;
  name: string;
}> {
  const res = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function trackBooking(reference: string) {
  const res = await fetch(
    `/api/bookings/track?reference=${encodeURIComponent(reference)}`
  );
  if (!res.ok) throw await parseError(res);
  const json = await res.json();
  return json.data as {
    reference: string;
    status: string;
    pickupLocation: string;
    deliveryLocation: string;
    vehicleType: string;
    pickupDate: string;
    createdAt: string;
    history: { toStatus: string; note: string | null; createdAt: string }[];
  };
}

export async function loginAdmin(
  email: string,
  password: string
): Promise<AdminUser> {
  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await parseError(res);
  const json = await res.json();
  return json.admin;
}

export async function logoutAdmin(): Promise<void> {
  await fetch("/api/admin/logout", { method: "POST" });
}

export async function getMe(): Promise<AdminUser | null> {
  try {
    const res = await fetch("/api/admin/me");
    if (!res.ok) return null;
    const json = await res.json();
    return json.admin as AdminUser;
  } catch {
    return null;
  }
}

export async function listBookings(params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
} = {}): Promise<{
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
  if (params.status) qs.set("status", params.status);
  if (params.search) qs.set("search", params.search);
  const res = await fetch(`/api/bookings?${qs.toString()}`);
  if (!res.ok) throw await parseError(res);
  const json = await res.json();
  return { data: json.data, pagination: json.pagination };
}

export async function getBooking(id: string): Promise<{
  data: BookingWithHistory;
}> {
  const res = await fetch(`/api/bookings/${id}`);
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function updateBookingStatus(
  id: string,
  status: string,
  note?: string
): Promise<{ data: BookingWithHistory }> {
  const res = await fetch(`/api/bookings/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, note }),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}
