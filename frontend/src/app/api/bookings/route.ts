import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookingSchema, generateReference } from "@/lib/validators";
import { getAdminFromRequest } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { BOOKING_STATUSES } from "@/lib/constants";

// POST /api/bookings — public: create a booking request
export async function POST(request: NextRequest) {
  // Rate limit: 10 bookings per IP per 10 minutes
  const ip = getClientIp(request);
  const rl = rateLimit(`booking:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((rl.resetAt - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 422 }
    );
  }

  const data = parsed.data;
  const reference = generateReference();

  try {
    const booking = await db.booking.create({
      data: {
        reference,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        pickupLocation: data.pickupLocation,
        deliveryLocation: data.deliveryLocation,
        materialType: data.materialType,
        quantity: data.quantity,
        vehicleType: data.vehicleType,
        pickupDate: data.pickupDate,
        notes: data.notes || null,
        status: "New",
      },
    });

    // Write the first status history row
    await db.statusHistory.create({
      data: {
        bookingId: booking.id,
        fromStatus: null,
        toStatus: "New",
        note: "Booking request received.",
        adminId: null,
      },
    });

    return NextResponse.json(
      {
        id: booking.id,
        reference: booking.reference,
        status: booking.status,
        name: booking.name,
        phone: booking.phone,
        pickupLocation: booking.pickupLocation,
        deliveryLocation: booking.deliveryLocation,
        createdAt: booking.createdAt,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Booking creation failed", err);
    return NextResponse.json(
      { error: "Could not create booking. Please try again." },
      { status: 500 }
    );
  }
}

// GET /api/bookings — admin: list bookings with search/filter/pagination
export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search")?.trim() || undefined;
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || "10")));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status && status !== "all") {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { reference: { contains: search } },
      { name: { contains: search } },
      { phone: { contains: search } },
      { pickupLocation: { contains: search } },
      { deliveryLocation: { contains: search } },
    ];
  }

  const [total, bookings] = await Promise.all([
    db.booking.count({ where }),
    db.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    data: bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    statuses: BOOKING_STATUSES,
  });
}
