import { db } from "@/db";
import { queueEntries } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// POST /api/queue/next — admin picks the next waiting person (skips any leftover "called" state)
export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Admin authentication required." }, { status: 401 });
  }

  // If someone is already "called"/"serving", keep them. Otherwise pick the first "waiting".
  const active = await db
    .select()
    .from(queueEntries)
    .where(eq(queueEntries.status, "serving"))
    .orderBy(asc(queueEntries.ticketNumber))
    .limit(1);

  if (active.length > 0) {
    return Response.json({
      entry: active[0],
      message: "Someone is already being served.",
    });
  }

  const next = await db
    .select()
    .from(queueEntries)
    .where(eq(queueEntries.status, "waiting"))
    .orderBy(asc(queueEntries.ticketNumber))
    .limit(1);

  if (next.length === 0) {
    return Response.json({ entry: null, message: "Queue is empty." });
  }

  const [called] = await db
    .update(queueEntries)
    .set({ status: "serving" })
    .where(eq(queueEntries.id, next[0].id))
    .returning();

  return Response.json({ entry: called });
}
