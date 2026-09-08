import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Client for the admin side. Uses the service role key, which bypasses row
 * level security and must never reach the browser. The "server-only" import
 * above turns any client-side import of this file into a build error.
 */
export function adminClient() {
  return createClient(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: { persistSession: false },
  });
}
