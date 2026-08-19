import { db } from "@/db";
import { queueEntries } from "@/db/schema";
import { sql } from "drizzle-orm";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// POST /api/queue/reset — admin clears the entire queue
export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Admin authentication required." }, { status: 401 });
  }

  await db.delete(queueEntries);
  // Reset the serial sequence so ticket numbers restart from 1
  await db.execute(
    sql`ALTER SEQUENCE queue_entries_id_seq RESTART WITH 1`
  );

  return Response.json({ ok: true });
}
