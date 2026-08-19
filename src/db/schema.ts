import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";

export const queueEntries = pgTable(
  "queue_entries",
  {
    id: serial("id").primaryKey(),
    ticketNumber: integer("ticket_number").notNull(),
    name: text("name").notNull(),
    status: text("status", {
      enum: ["waiting", "called", "serving", "done", "skipped"],
    })
      .notNull()
      .default("waiting"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    servedAt: timestamp("served_at", { withTimezone: true }),
  },
  (table) => [index("queue_status_idx").on(table.status)]
);

export type QueueEntry = typeof queueEntries.$inferSelect;
export type QueueEntryStatus = QueueEntry["status"];
