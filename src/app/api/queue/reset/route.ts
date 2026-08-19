import { db } from "@/db";
import { queueEntries } from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// POST /api/queue/reset — admin clears the entire queue
export async function POST() {
  await db.delete(queueEntries);
  // Reset the serial sequence so ticket numbers restart from 1
  await db.execute(
    sql`ALTER SEQUENCE queue_entries_id_seq RESTART WITH 1`
  );

  return Response.json({ ok: true });
}
