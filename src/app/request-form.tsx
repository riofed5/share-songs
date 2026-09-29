"use client";

import { useActionState } from "react";
import { parseSongLink, songLinkMessage } from "@/lib/song-link";
import { submitRequest, type SubmitState } from "./actions";
import { SongLinkField } from "./song-link-field";
import { Toast, useToast } from "./toast";

const initial: SubmitState = { status: "idle", error: null };

const CONFETTI = [
  { left: "10%", delay: "0ms", rotate: "-20deg" },
  { left: "25%", delay: "60ms", rotate: "15deg" },
  { left: "40%", delay: "120ms", rotate: "-8deg" },
  { left: "55%", delay: "40ms", rotate: "25deg" },
  { left: "70%", delay: "100ms", rotate: "-15deg" },
  { left: "85%", delay: "20ms", rotate: "10deg" },
];

function SongForm({ googleReviewUrl }: { googleReviewUrl: string | null }) {
  const { toast, show, dismiss } = useToast();
  const [state, formAction, pending] = useActionState(
    async (previous: SubmitState, formData: FormData) => {
      const next = await submitRequest(previous, formData);
      if (next.status === "error" && next.error) show(next.error);
      return next;
    },
    initial,
  );

  if (state.status === "success") {
    return (
      <div
        role="status"
        className="celebration relative flex flex-col items-center gap-4 overflow-hidden py-8 text-center"
      >
        <span className="confetti-field" aria-hidden="true">
          {CONFETTI.map((piece, index) => (
            <span
              key={index}
              className="confetti-piece"
              style={{
                left: piece.left,
                animationDelay: piece.delay,
                ["--confetti-rotate" as string]: piece.rotate,
              }}
            />
          ))}
        </span>
        <span className="check-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Thank you!
          </h1>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            We have got your song request.
          </p>
        </div>
        {googleReviewUrl ? (
          <a
            href={googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-black px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            Rate us on Google
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Request a song
        </h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Found it on YouTube or Spotify? Drop the link here.
        </p>
      </div>
      <Toast toast={toast} onDismiss={dismiss} />
      <form
        action={formAction}
        onSubmit={(event) => {
          const song = new FormData(event.currentTarget).get("song");
          const link = parseSongLink(String(song ?? ""));
          if (!link.ok) {
            event.preventDefault();
            show(songLinkMessage(link));
          }
        }}
        className="flex flex-col gap-4"
      >
        <SongLinkField onProblem={show} />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">
            Where have you come from? (optional)
          </span>
          <input
            name="cameFrom"
            maxLength={100}
            autoComplete="off"
            className="rounded-md border border-black/15 bg-white px-3 py-2 outline-none focus:border-black/40 dark:border-white/20 dark:bg-white/5"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-black px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {pending ? "Sending…" : "Send song request"}
        </button>
      </form>
    </div>
  );
}

export function RequestForm({
  googleReviewUrl,
}: {
  googleReviewUrl: string | null;
}) {
  return <SongForm googleReviewUrl={googleReviewUrl} />;
}
