import { db } from "@/db";
import { queueEntries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// POST /api/queue/remove — admin removes an entry from the queue { id }
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Admin authentication required." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);

  if (!Number.isInteger(id)) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  await db.delete(queueEntries).where(eq(queueEntries.id, id));

  return Response.json({ ok: true });
}
