/**
 * Every setting the app needs, read lazily.
 *
 * These are functions, not constants, on purpose: importing this file must
 * never throw. `next build` runs without a filled-in .env.local, and a
 * top-level throw would break the build instead of the one page that needs
 * the value.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing setting ${name}. Open share-songs/.env.local and paste the value next to ${name}. See share-songs/README.md for where to find it.`,
    );
  }
  return value.trim();
}

export const env = {
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  adminUser: () => required("ADMIN_USER"),
  adminPassword: () => required("ADMIN_PASSWORD"),
  sessionSecret: () => required("SESSION_SECRET"),
};
