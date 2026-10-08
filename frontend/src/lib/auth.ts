import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "ganraj-logistics-dev-secret-change-me-in-production-9f3k2";
const TOKEN_TTL_SECONDS = 60 * 60 * 12; // 12 hours

/* ---------------- Password hashing (scrypt) ---------------- */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hash] = parts;
  const testHash = scryptSync(password, salt, 64).toString("hex");
  try {
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(testHash, "hex"));
  } catch {
    return false;
  }
}

/* ---------------- JWT (HMAC-SHA256) ---------------- */

function base64Url(input: string | Buffer): string {
  return Buffer.from(input as any)
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function sign(data: string): string {
  return createHmac("sha256", JWT_SECRET)
    .update(data)
    .digest("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export interface AdminTokenPayload {
  sub: string; // admin id
  email: string;
  name: string;
  exp: number;
}

export function signAdminToken(admin: { id: string; email: string; name: string }): string {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      sub: admin.id,
      email: admin.email,
      name: admin.name,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    } as AdminTokenPayload)
  );
  const signingInput = `${header}.${payload}`;
  const signature = sign(signingInput);
  return `${signingInput}.${signature}`;
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const expected = sign(`${header}.${payload}`);
  try {
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }
  } catch {
    return null;
  }
  let decoded: AdminTokenPayload;
  try {
    const json = Buffer.from(payload, "base64").toString("utf8");
    decoded = JSON.parse(json);
  } catch {
    return null;
  }
  if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) return null;
  return decoded;
}

/* ---------------- Next.js helpers ---------------- */

const TOKEN_COOKIE = "gls_admin_token";

export async function setAdminCookie(token: string) {
  const store = await cookies();
  store.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
}

export async function getAdminFromRequest(): Promise<{
  id: string;
  email: string;
  name: string;
} | null> {
  const store = await cookies();
  const token = store.get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyAdminToken(token);
  if (!payload) return null;
  // Confirm admin still exists
  const admin = await db.admin.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true },
  });
  return admin;
}

export function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  return match ? match[1] : null;
}
