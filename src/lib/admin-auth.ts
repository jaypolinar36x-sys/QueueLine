import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const cookieName = "queueline_admin";

function sessionToken() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD is required");
  return createHmac("sha256", password).update("admin-session").digest("hex");
}

export async function isAdminAuthenticated() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return false;

  const expected = sessionToken();
  const actualBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export function getAdminSessionCookie() {
  return {
    name: cookieName,
    value: sessionToken(),
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  };
}

export function getClearedAdminSessionCookie() {
  return { ...getAdminSessionCookie(), value: "", maxAge: 0 };
}