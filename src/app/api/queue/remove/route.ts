import { db } from "@/db";
import { queueEntries } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// POST /api/queue/remove — admin removes an entry from the queue { id }
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);

  if (!Number.isInteger(id)) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  await db.delete(queueEntries).where(eq(queueEntries.id, id));

  return Response.json({ ok: true });
}
