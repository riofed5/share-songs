import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";

export const SESSION_COOKIE = "admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

function sign(payload: string): string {
  return createHmac("sha256", env.sessionSecret()).update(payload).digest("hex");
}

/** Compare two strings without leaking their contents through timing. */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** A token is "<expiry ms>.<hmac of that expiry>". Nothing secret is inside it. */
export function makeToken(): string {
  const payload = String(Date.now() + MAX_AGE_SECONDS * 1000);
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined | null): boolean {
  if (!token) return false;
  try {
    const dot = token.lastIndexOf(".");
    if (dot <= 0) return false;
    const payload = token.slice(0, dot);
    if (!safeEqual(token.slice(dot + 1), sign(payload))) return false;
    const expiresAt = Number(payload);
    return Number.isFinite(expiresAt) && expiresAt > Date.now();
  } catch {
    // A missing SESSION_SECRET lands here. Treat it as "not logged in" rather
    // than crashing every admin request; the login action reports it properly.
    return false;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
