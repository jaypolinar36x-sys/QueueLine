export type QueueEntryStatus =
  | "waiting"
  | "called"
  | "serving"
  | "done"
  | "skipped";

export interface QueueEntry {
  id: number;
  ticketNumber: number;
  name: string;
  status: QueueEntryStatus;
  createdAt: string;
  servedAt: string | null;
}

export interface QueueState {
  entries: QueueEntry[];
}

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    throw new Error(`Request failed (${res.status}) with an empty response`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Request failed (${res.status}) with an invalid response`);
  }
}

export async function fetchQueue(): Promise<QueueEntry[]> {
  const res = await fetch("/api/queue", { cache: "no-store" });
  const data = await readJson<QueueState & { error?: string }>(res);
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch queue");
  return data.entries;
}
