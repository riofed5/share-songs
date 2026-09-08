"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Keeps the admin list current without a full page reload: a manual button
 * plus a background refresh every `intervalMs`. `router.refresh()` re-runs
 * the server component, so it picks up new rows and re-renders "time ago".
 */
export function AutoRefresh({ intervalMs }: { intervalMs: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="self-start rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium text-black/70 transition-colors hover:bg-black/5 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10"
    >
      Refresh
    </button>
  );
}
