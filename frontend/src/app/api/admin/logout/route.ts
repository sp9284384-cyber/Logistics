import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/auth";

// POST /api/admin/logout — clear the admin session cookie
export async function POST() {
  await clearAdminCookie();
  return NextResponse.json({ ok: true });
}
