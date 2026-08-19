import { db } from "@/db";
import { queueEntries } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/queue — list all entries ordered by ticket number
export async function GET() {
  try {
    const entries = await db
      .select()
      .from(queueEntries)
      .orderBy(asc(queueEntries.ticketNumber));

    return Response.json({ entries });
  } catch {
    return Response.json(
      { error: "Database unavailable. Start PostgreSQL and try again." },
      { status: 503 }
    );
  }
}

// POST /api/queue — join the queue { name: string }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    // Compute the next ticket number as max + 1
    const currentMax = await db
      .select({ max: sql<number>`coalesce(max(${queueEntries.ticketNumber}), 0)` })
      .from(queueEntries);

    const nextTicket = Number(currentMax[0]?.max ?? 0) + 1;

    const [entry] = await db
      .insert(queueEntries)
      .values({ ticketNumber: nextTicket, name })
      .returning();

    return Response.json({ entry }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Database unavailable. Start PostgreSQL and try again." },
      { status: 503 }
    );
  }
}
