"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueue } from "@/hooks/useQueue";
import type { QueueEntry } from "@/lib/queue";
import Link from "next/link";

export default function AdminPage() {
  const { entries, loading, refresh } = useQueue(2500);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((res) => res.json())
      .then((data) => setAuthenticated(data.authenticated === true))
      .catch(() => setAuthenticated(false));
  }, []);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setAuthenticated(true);
      setPassword("");
      refresh();
    } else {
      setLoginError(data.error ?? "Unable to sign in.");
    }
    setLoggingIn(false);
  }

  const call = useCallback(
    async (action: string, path: string, body?: object) => {
      setBusy(action);
      setError(null);
      try {
        const res = await fetch(path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Request failed");
        }
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setBusy(null);
      }
    },
    [refresh]
  );

  if (authenticated !== true) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 text-slate-900">
        <form onSubmit={login} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-2xl font-semibold tracking-tight">Admin Panel</h1>
          <p className="mt-2 text-sm text-slate-500">Enter the admin password to continue.</p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Admin password"
            className="mt-6 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            autoFocus
          />
          {loginError && <p className="mt-3 text-sm text-rose-600">{loginError}</p>}
          <button
            type="submit"
            disabled={loggingIn || !password}
            className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {loggingIn ? "Signing in..." : "Sign in"}
          </button>
          <Link href="/" className="mt-4 block text-center text-sm text-slate-500 hover:text-slate-700">
            Back to queue
          </Link>
        </form>
      </main>
    );
  }

  const serving = entries.find((e) => e.status === "serving");
  const waiting = entries.filter((e) => e.status === "waiting");
  const done = entries.filter((e) => e.status === "done");

  const nextPerson = waiting[0];

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Admin Panel</h1>
            <p className="text-sm text-slate-500">Manage the queue</p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
          >
            ← Back to queue
          </Link>
        </header>

        {error && (
          <div className="mt-4 rounded-lg bg-rose-100 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Now serving */}
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
              Currently serving
            </p>
            {serving ? (
              <>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-4xl font-bold">#{serving.ticketNumber}</span>
                  <span className="text-xl">{serving.name}</span>
                </div>
                <button
                  onClick={() => call(`done-${serving.id}`, "/api/queue/done", { id: serving.id })}
                  disabled={busy !== null}
                  className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
                >
                  {busy === `done-${serving.id}` ? "Completing…" : "✓ Mark as complete"}
                </button>
              </>
            ) : (
              <p className="mt-2 text-slate-400">No one is being served.</p>
            )}
          </section>

          {/* Next up */}
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
              Next in line
            </p>
            {nextPerson ? (
              <>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-4xl font-bold">#{nextPerson.ticketNumber}</span>
                  <span className="text-xl">{nextPerson.name}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {waiting.length} waiting in line
                </p>
                <button
                  onClick={() => call("call", "/api/queue/next")}
                  disabled={busy !== null || !!serving}
                  className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {busy === "call"
                    ? "Calling…"
                    : serving
                    ? "Complete current first"
                    : "📣 Call next person"}
                </button>
              </>
            ) : (
              <p className="mt-2 text-slate-400">
                {serving ? "Queue is drained (finish current)." : "Queue is empty."}
              </p>
            )}
          </section>
        </div>

        {/* Waiting list */}
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Waiting ({waiting.length})
            </h2>
            <button
              onClick={() => {
                if (confirm("Remove everyone from the queue? This cannot be undone.")) {
                  call("reset", "/api/queue/reset");
                }
              }}
              disabled={busy !== null}
              className="rounded-lg border border-rose-300 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
            >
              Reset queue
            </button>
          </div>

          {loading && entries.length === 0 ? (
            <p className="mt-4 text-slate-400">Loading…</p>
          ) : waiting.length === 0 ? (
            <p className="mt-4 text-slate-400">No one is waiting.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {waiting.map((entry) => (
                <WaitingRow
                  key={entry.id}
                  entry={entry}
                  onRemove={() => call(`remove-${entry.id}`, "/api/queue/remove", { id: entry.id })}
                  disabled={busy !== null}
                />
              ))}
            </ul>
          )}
        </section>

        {/* Completed */}
        {done.length > 0 && (
          <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-500">
              Completed ({done.length})
            </h2>
            <ul className="mt-4 divide-y divide-slate-100">
              {done.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-400">#{entry.ticketNumber}</span>
                    <span className="text-slate-500">{entry.name}</span>
                  </div>
                  <span className="text-sm text-slate-400">✓ Done</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

function WaitingRow({
  entry,
  onRemove,
  disabled,
}: {
  entry: QueueEntry;
  onRemove: () => void;
  disabled: boolean;
}) {
  const waited = formatWait(entry.createdAt);
  return (
    <li className="flex items-center justify-between py-3">
      <div>
        <span className="font-bold">#{entry.ticketNumber}</span>{" "}
        <span className="font-medium">{entry.name}</span>
        <span className="ml-2 text-xs text-slate-400">{waited}</span>
      </div>
      <button
        onClick={onRemove}
        disabled={disabled}
        className="text-sm font-medium text-rose-500 transition hover:text-rose-600 disabled:opacity-50"
      >
        Remove
      </button>
    </li>
  );
}

function formatWait(createdAt: string) {
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  return `waiting ${mins}m`;
}
