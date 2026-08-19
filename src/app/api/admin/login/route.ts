import { getAdminSessionCookie } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";

  if (!process.env.ADMIN_PASSWORD) {
    return Response.json({ error: "Admin password is not configured." }, { status: 503 });
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: "Incorrect password." }, { status: 401 });
  }

  const response = Response.json({ ok: true });
  response.headers.append("Set-Cookie", serializeCookie(getAdminSessionCookie()));
  return response;
}

function serializeCookie(cookie: ReturnType<typeof getAdminSessionCookie>) {
  return `${cookie.name}=${cookie.value}; Max-Age=${cookie.maxAge}; Path=${cookie.path}; HttpOnly; SameSite=${cookie.sameSite === "strict" ? "Strict" : "Lax"}${cookie.secure ? "; Secure" : ""}`;
}