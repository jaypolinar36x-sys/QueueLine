import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET() {
  try {
    return Response.json({ authenticated: await isAdminAuthenticated() });
  } catch {
    return Response.json({ authenticated: false });
  }
}