"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useQueue } from "@/hooks/useQueue";
import type { QueueEntry } from "@/lib/queue";
import Link from "next/link";

function statusColor(status: QueueEntry["status"]) {
  switch (status) {
    case "serving":
      return "bg-emerald-100 text-emerald-700 ring-emerald-200";
    case "done":
      return "bg-slate-100 text-slate-500 ring-slate-200";
    case "called":
      return "bg-amber-100 text-amber-700 ring-amber-200";
    default:
      return "bg-sky-100 text-sky-700 ring-sky-200";
  }
}

function statusLabel(status: QueueEntry["status"]) {
  switch (status) {
    case "serving":
      return "Now serving";
    case "done":
      return "Done";
    case "called":
      return "Called";
    default:
      return "Waiting";
  }
}

export default function HomePage() {
  const { entries, loading, refresh } = useQueue(3000);
  const [name, setName] = useState("");
  const [myTicket, setMyTicket] = useState<QueueEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const waiting = entries.filter((e) => e.status === "waiting");
  const serving = entries.find((e) => e.status === "serving");

  // Keep myTicket in sync with live data (status may change to serving/done)
  useEffect(() => {
    if (myTicket) {
      const updated = entries.find((e) => e.id === myTicket.id);
      if (updated) setMyTicket(updated);
    }
  }, [entries, myTicket?.id]);

  const playTurnSound = useCallback(() => {
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;

    const audioContext = audioContextRef.current ?? new AudioContextClass();
    audioContextRef.current = audioContext;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = 880;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.45);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.45);
  }, []);

  useEffect(() => {
    if (myTicket?.status === "serving" && soundEnabled) {
      playTurnSound();
    }
  }, [myTicket?.status, soundEnabled, playTurnSound]);

  const prepareTurnSound = useCallback(async () => {
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;

    const audioContext = audioContextRef.current ?? new AudioContextClass();
    audioContextRef.current = audioContext;
    await audioContext.resume();
    setSoundEnabled(true);
  }, []);

  const joinQueue = useCallback(async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await prepareTurnSound();
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.error ?? "Failed to join");
      setMyTicket(data.entry);
      setName("");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }, [name, prepareTurnSound, refresh]);

  const waitingAhead = myTicket
    ? waiting.filter((e) => e.ticketNumber < myTicket.ticketNumber).length
    : 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              QueueLine
            </h1>
            <p className="text-sm text-slate-400">Join the line. We&apos;ll call you.</p>
          </div>
          <Link
            href="/admin"
            className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            Admin panel
          </Link>
        </header>

        {/* Now serving banner */}
        <section className="mt-8 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
          <p className="text-xs font-medium uppercase tracking-widest text-indigo-300">
            Now serving
          </p>
          {serving ? (
            <div className="mt-2 flex items-baseline gap-4">
              <span className="text-5xl font-bold text-white">
                #{serving.ticketNumber}
              </span>
              <span className="text-xl text-slate-200">{serving.name}</span>
            </div>
          ) : (
            <p className="mt-2 text-xl text-slate-400">
              Waiting for admin to call the next person…
            </p>
          )}
        </section>

        {/* Join form */}
        <section className="mt-6 rounded-2xl bg-white p-4 shadow-xl sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Join the queue</h2>
            {soundEnabled && <span className="text-sm text-emerald-700">Sound ready</span>}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              joinQueue();
            }}
            className="mt-4 flex flex-col gap-3 sm:flex-row"
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="min-w-0 w-full flex-1 rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:shrink-0"
            >
              {submitting ? "Joining…" : "Join"}
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        </section>

        {/* My ticket */}
        {myTicket && (
          <section className="mt-6 rounded-2xl bg-indigo-600 p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-indigo-200">
                  Your ticket
                </p>
                <p className="mt-1 text-4xl font-bold">#{myTicket.ticketNumber}</p>
                <p className="mt-1 text-indigo-100">{myTicket.name}</p>
              </div>
              <div className="text-right">
                {myTicket.status === "serving" ? (
                  <span className="inline-block rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-700">
                    It&apos;s your turn!
                  </span>
                ) : myTicket.status === "done" ? (
                  <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold">
                    Completed
                  </span>
                ) : (
                  <div className="text-right">
                    <p className="text-sm text-indigo-200">People ahead of you</p>
                    <p className="text-3xl font-bold">{waitingAhead}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Queue list */}
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Queue</h2>
            <span className="text-sm text-slate-400">
              {waiting.length} waiting
            </span>
          </div>

          {loading && entries.length === 0 ? (
            <p className="text-slate-400">Loading…</p>
          ) : entries.length === 0 ? (
            <div className="rounded-2xl bg-white/5 p-10 text-center ring-1 ring-white/10">
              <p className="text-3xl">🕐</p>
              <p className="mt-2 text-slate-400">
                The queue is empty. Be the first to join!
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className={`flex items-center justify-between rounded-xl px-5 py-4 ring-1 ring-white/10 ${
                    entry.status === "serving"
                      ? "bg-emerald-500/20"
                      : entry.status === "done"
                      ? "bg-white/5 opacity-60"
                      : "bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-lg font-bold ${
                        entry.id === myTicket?.id ? "text-indigo-300" : "text-slate-200"
                      }`}
                    >
                      #{entry.ticketNumber}
                    </span>
                    <span className="font-medium text-slate-100">{entry.name}</span>
                    {entry.id === myTicket?.id && (
                      <span className="text-xs text-indigo-300">(you)</span>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusColor(
                      entry.status
                    )}`}
                  >
                    {statusLabel(entry.status)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
