"use server";

import { publicClient } from "@/lib/supabase/public";

export type SubmitState = {
  status: "idle" | "success" | "error";
  error: string | null;
};

const MAX_SONG_LENGTH = 200;
const MAX_CAME_FROM_LENGTH = 100;

export async function submitRequest(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const song = String(formData.get("song") ?? "").trim();
  const cameFromRaw = String(formData.get("cameFrom") ?? "").trim();
  const cameFrom = cameFromRaw === "" ? null : cameFromRaw;

  if (song === "") {
    return {
      status: "error",
      error: "Please tell us what song you would like to hear.",
    };
  }

  if (song.length > MAX_SONG_LENGTH) {
    return {
      status: "error",
      error: `That song title is a bit long. Please keep it under ${MAX_SONG_LENGTH} characters.`,
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
