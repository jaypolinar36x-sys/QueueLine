import { db } from "@/db";
import { queueEntries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// POST /api/queue/done — mark the currently serving person as done { id: number }
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Admin authentication required." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);

  if (!Number.isInteger(id)) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  const [entry] = await db
    .update(queueEntries)
    .set({ status: "done", servedAt: new Date() })
    .where(eq(queueEntries.id, id))
    .returning();

  if (!entry) {
    return Response.json({ error: "Entry not found" }, { status: 404 });
  }

  return Response.json({ entry });
}
