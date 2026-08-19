import { getClearedAdminSessionCookie } from "@/lib/admin-auth";

export async function POST() {
  const cookie = getClearedAdminSessionCookie();
  const response = Response.json({ ok: true });
  response.headers.append(
    "Set-Cookie",
    `${cookie.name}=${cookie.value}; Max-Age=${cookie.maxAge}; Path=${cookie.path}; HttpOnly; SameSite=Strict${cookie.secure ? "; Secure" : ""}`
  );
  return response;
}