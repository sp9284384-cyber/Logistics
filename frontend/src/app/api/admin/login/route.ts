import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, signAdminToken, setAdminCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// POST /api/admin/login — admin: verify credentials and set httpOnly cookie
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`login:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const admin = await db.admin.findUnique({ where: { email: parsed.data.email } });
  if (!admin || !verifyPassword(parsed.data.password, admin.passwordHash)) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  const token = signAdminToken({
    id: admin.id,
    email: admin.email,
    name: admin.name,
  });
  await setAdminCookie(token);

  return NextResponse.json({
    admin: { id: admin.id, email: admin.email, name: admin.name },
  });
}
