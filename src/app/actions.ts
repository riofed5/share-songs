"use server";

import { publicClient } from "@/lib/supabase/public";
import { parseSongLink, songLinkMessage } from "@/lib/song-link";

export type SubmitState = {
  status: "idle" | "success" | "error";
  error: string | null;
};

const MAX_SONG_LENGTH = 200;
const MAX_PASTE_LENGTH = 2000;
const MAX_CAME_FROM_LENGTH = 100;
const RESOLVE_TIMEOUT_MS = 3000;

/**
 * Spotify's short share links only say which song they are once followed.
 * Follow one to catch a playlist; if the lookup fails or lands somewhere
 * unexpected, keep the short link rather than turn a guest away.
 */
async function resolveSpotifyShortLink(
  shortUrl: string,
): Promise<{ url: string } | { error: string }> {
  try {
    const response = await fetch(shortUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(RESOLVE_TIMEOUT_MS),
    });
    await response.body?.cancel();
    const landed = parseSongLink(response.url);
    if (landed.ok && !landed.needsResolve) return { url: landed.url };
    if (!landed.ok && landed.reason === "no-song" && landed.what !== "page") {
      return { error: songLinkMessage(landed) };
    }
  } catch (error) {
    console.warn(
      "Could not look up a Spotify short link:",
      error instanceof Error ? error.message : error,
    );
  }
  return { url: shortUrl };
}

export async function submitRequest(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const pasted = String(formData.get("song") ?? "").slice(0, MAX_PASTE_LENGTH);
  const cameFromRaw = String(formData.get("cameFrom") ?? "").trim();
  const cameFrom = cameFromRaw === "" ? null : cameFromRaw;

  const link = parseSongLink(pasted);
  if (!link.ok) {
    return { status: "error", error: songLinkMessage(link) };
  }

  let song = link.url;
  if (link.needsResolve) {
    const resolved = await resolveSpotifyShortLink(link.url);
    if ("error" in resolved) return { status: "error", error: resolved.error };
    song = resolved.url;
  }

  if (song.length > MAX_SONG_LENGTH) {
    return {
      status: "error",
      error: "That link is too long. Copy the song's link from YouTube or Spotify and paste it here.",
    };
  }

  if (cameFrom && cameFrom.length > MAX_CAME_FROM_LENGTH) {
    return {
      status: "error",
      error: `That answer is a bit long. Please keep it under ${MAX_CAME_FROM_LENGTH} characters.`,
    };
  }

  const supabase = publicClient();
  const { error } = await supabase
    .from("song_requests")
    .insert({ song, came_from: cameFrom });

  if (error) {
    // The customer gets a friendly message; this is what lets anyone work out
    // why, since a wrong key or a missing table looks identical from outside.
    console.error("Could not save a song request:", error.message);
    return {
      status: "error",
      error: "Something went wrong sending your request. Please try again.",
    };
  }

  return { status: "success", error: null };
}
