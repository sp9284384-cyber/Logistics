import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { statusUpdateSchema } from "@/lib/validators";

// PATCH /api/bookings/[id]/status — admin: change status and write a history row
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = statusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const booking = await db.booking.findUnique({ where: { id } });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const fromStatus = booking.status;
  const toStatus = parsed.data.status;

  if (fromStatus === toStatus) {
    return NextResponse.json(
      { error: "Status is already " + toStatus },
      { status: 400 }
    );
  }

  // Single transaction: update status + insert history row
  const [updated] = await db.$transaction([
    db.booking.update({
      where: { id },
      data: { status: toStatus },
    }),
    db.statusHistory.create({
      data: {
        bookingId: id,
        fromStatus,
        toStatus,
        note: parsed.data.note || null,
        adminId: admin.id,
      },
    }),
  ]);

  const refreshed = await db.booking.findUnique({
    where: { id },
    include: {
      history: {
        orderBy: { createdAt: "asc" },
        include: { admin: { select: { name: true } } },
      },
    },
  });

  return NextResponse.json({ data: refreshed });
}
