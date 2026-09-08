import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import { SESSION_COOKIE, verifyToken } from "@/lib/session";
import { logout } from "./login/actions";
import { AutoRefresh } from "./auto-refresh";

export const metadata: Metadata = { title: "Song requests" };

// This page reads request-time data (the session cookie and the live
// queue), so it must never be cached: every load or refresh should reflect
// the current database, not a stale snapshot.
export const dynamic = "force-dynamic";

const TEN_MINUTES_MS = 10 * 60 * 1000;

type SongRequestRow = {
  id: string;
  song: string;
  came_from: string | null;
  created_at: string;
};

/** "3 minutes ago", "yesterday", etc. */
function formatRelativeTime(iso: string): string {
  const diffSeconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);

  const divisions: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
    { amount: 60, unit: "seconds" },
    { amount: 60, unit: "minutes" },
    { amount: 24, unit: "hours" },
    { amount: 7, unit: "days" },
    { amount: 4.34524, unit: "weeks" },
    { amount: 12, unit: "months" },
    { amount: Number.POSITIVE_INFINITY, unit: "years" },
  ];

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  let duration = diffSeconds;
  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return formatter.format(Math.round(duration), "years");
}

export default async function AdminPage() {
  const store = await cookies();
  if (!verifyToken(store.get(SESSION_COOKIE)?.value)) {
    redirect("/admin/login");
  }

  const { data, error } = await adminClient()
    .from("song_requests")
    .select("id, song, came_from, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    // Without this, a wrong key or a missing table shows the owner a generic
    // message and leaves nothing to diagnose it with.
    console.error("Could not read song_requests:", error.message);
  }

  const requests = (data ?? []) as SongRequestRow[];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Song requests</h1>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            Newest first. Refreshes on its own every 10 minutes.
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium text-black/70 transition-colors hover:bg-black/5 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10"
          >
            Sign out
          </button>
        </form>
      </div>

      <AutoRefresh intervalMs={TEN_MINUTES_MS} />

      {error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          Couldn&apos;t load requests right now. Try refreshing.
        </p>
      ) : requests.length === 0 ? (
        <p className="rounded-md border border-black/10 bg-black/[.02] px-4 py-8 text-center text-sm text-black/60 dark:border-white/10 dark:bg-white/[.03] dark:text-white/60">
          Nothing yet — requests will show up here as people send them.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((request) => (
            <li
              key={request.id}
              className="rounded-md border border-black/15 px-4 py-3 dark:border-white/20"
            >
              <p className="font-medium">{request.song}</p>
              <p className="mt-0.5 text-sm text-black/60 dark:text-white/60">
                {request.came_from ? `From ${request.came_from} · ` : ""}
                {formatRelativeTime(request.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
