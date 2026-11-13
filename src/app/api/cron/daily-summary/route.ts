import { timingSafeEqual } from "node:crypto";
import { summaryMessages, summaryWindow } from "@/lib/daily-summary";
import { env } from "@/lib/env";
import { adminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram";

/**
 * Posts yesterday's song requests to Telegram. Vercel calls this once a day
 * on the schedule in vercel.json, sending CRON_SECRET as a bearer token; the
 * address is public, so without that secret nobody gets a summary sent.
 */
function allowed(request: Request): boolean {
  const secret = env.cronSecret();
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  if (!allowed(request)) {
    return Response.json({ error: "Not allowed." }, { status: 401 });
  }

  const telegram = env.telegram();
  if (!telegram) {
    return Response.json({ sent: false, reason: "Telegram is not set up." });
  }

  const window = summaryWindow(new Date());
  const { data, error } = await adminClient()
    .from("song_requests")
    .select("song, came_from, created_at")
    .gte("created_at", window.start.toISOString())
    .lt("created_at", window.end.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Could not read song requests for the daily summary:", error.message);
    return Response.json({ error: "Could not read the requests." }, { status: 500 });
  }

  // One at a time, so a long night's messages arrive in order.
  for (const text of summaryMessages(window, data)) {
    const sent = await sendTelegramMessage(telegram, text, { linkPreview: false });
    if (!sent) {
      return Response.json({ error: "Telegram did not take the summary." }, { status: 502 });
    }
  }

  return Response.json({ sent: true, requests: data.length });
}
