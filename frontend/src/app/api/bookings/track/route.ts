import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// GET /api/bookings/track?reference=GLS... — public: track a booking by reference
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`track:${ip}`, 30, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference")?.trim().toUpperCase();

  if (!reference) {
    return NextResponse.json(
      { error: "Please provide a booking reference." },
      { status: 400 }
    );
  }

  const booking = await db.booking.findUnique({
    where: { reference },
    select: {
      reference: true,
      status: true,
      pickupLocation: true,
      deliveryLocation: true,
      vehicleType: true,
      pickupDate: true,
      createdAt: true,
      history: {
        orderBy: { createdAt: "asc" },
        select: {
          toStatus: true,
          note: true,
          createdAt: true,
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json(
      { error: "No booking found with that reference." },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: booking });
}
