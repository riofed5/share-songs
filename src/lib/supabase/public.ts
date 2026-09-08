import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Client for the public side of the app. Uses the anon key, which is safe to
 * expose. Row level security limits it to inserting a song request; it cannot
 * read the queue.
 */
export function publicClient() {
  return createClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    auth: { persistSession: false },
  });
}
