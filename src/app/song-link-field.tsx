"use client";

import { useRef, useState } from "react";
import { parseSongLink, songLinkMessage, type SongSource } from "@/lib/song-link";

const BRAND: Record<SongSource, { name: string; ring: string }> = {
  youtube: {
    name: "YouTube",
    ring: "border-[#ff0033] shadow-[0_0_0_3px_rgba(255,0,51,0.2)]",
  },
  spotify: {
    name: "Spotify",
    ring: "border-[#1ed760] shadow-[0_0_0_3px_rgba(30,215,96,0.25)]",
  },
};

function BrandLogo({ source }: { source: SongSource }) {
  if (source === "youtube") {
    return (
      <svg viewBox="0 0 28 20" className="h-5 w-7" aria-hidden="true">
        <rect width="28" height="20" rx="5" fill="#ff0033" />
        <path d="M11.5 5.5v9l7.5-4.5z" fill="#fff" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#1ed760" />
      <g fill="none" stroke="#000" strokeLinecap="round">
        <path d="M6.3 9.1c3.9-1.2 8.3-.9 11.5 1" strokeWidth="1.9" />
        <path d="M7 12.4c3.2-.9 6.6-.6 9.4.9" strokeWidth="1.6" />
        <path d="M7.6 15.5c2.6-.7 5.2-.5 7.4.7" strokeWidth="1.3" />
      </g>
    </svg>
  );
}

/**
 * The song link input. A recognised link pops its service's logo into the
 * field; a pasted or finished entry that isn't a song is reported through
 * `onProblem` so the page can show it. Typing alone never reports, so a
 * guest isn't scolded halfway through a link.
 */
export function SongLinkField({
  onProblem,
}: {
  onProblem: (message: string) => void;
}) {
  const [value, setValue] = useState("");
  const pasted = useRef(false);
  const lastChecked = useRef("");

  const parsed = parseSongLink(value);
  const source = parsed.ok ? parsed.source : null;

  /** Reports a problem once per entry; swaps share text for the clean link. */
  function check(text: string) {
    lastChecked.current = text;
    const result = parseSongLink(text);
    if (result.ok) {
      setValue(result.url);
      lastChecked.current = result.url;
    } else if (result.reason !== "empty") {
      onProblem(songLinkMessage(result));
    }
  }

  async function pasteFromClipboard() {
    let text: string;
    try {
      text = await navigator.clipboard.readText();
    } catch {
      onProblem("Couldn't reach your clipboard — press and hold the box, then tap Paste.");
      return;
    }
    if (text.trim() === "") {
      onProblem("Nothing to paste yet — copy the song's link in YouTube or Spotify first.");
      return;
    }
    setValue(text);
    check(text);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="song-link" className="text-sm font-medium">
        Song link
      </label>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            id="song-link"
            name="song"
            required
            maxLength={2000}
            value={value}
            placeholder="YouTube or Spotify link"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            onPaste={() => {
              pasted.current = true;
            }}
            onChange={(event) => {
              setValue(event.target.value);
              if (pasted.current) {
                pasted.current = false;
                check(event.target.value);
              }
            }}
            onBlur={() => {
              if (value !== lastChecked.current) check(value);
            }}
            className={`w-full rounded-md border bg-white px-3 py-2 outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-black/35 dark:bg-white/5 dark:placeholder:text-white/35 ${
              source
                ? `pr-12 ${BRAND[source].ring}`
                : "border-black/15 focus:border-black/40 dark:border-white/20"
            }`}
          />
          {source ? (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <span key={source} className="logo-pop">
                <BrandLogo source={source} />
              </span>
              <span className="sr-only">{BRAND[source].name} link</span>
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={pasteFromClipboard}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-black/15 px-3.5 font-medium transition-colors active:bg-black/5 dark:border-white/20 dark:active:bg-white/10"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <rect x="8" y="3" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
            <path
              d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Paste
        </button>
      </div>
    </div>
  );
}
