/**
 * Reads whatever a guest pasted and finds the one song in it.
 *
 * Guests paste share text, links opened from inside a playlist, links with
 * tracking bits or without "https://". The rule is "is there a specific song
 * in here?", not "is this a clean link": a song played from a playlist is
 * accepted as just that song, and only a link with no song in it is refused.
 *
 * Kept free of path aliases and server-only imports so the form, the server
 * action, the admin page and the tests can all share it.
 */

export type SongSource = "youtube" | "spotify";

export type SongLinkProblem =
  | { reason: "empty" }
  | { reason: "not-a-link" }
  | { reason: "wrong-site" }
  | { reason: "no-song"; what: string };

export type SongLinkResult =
  | {
      ok: true;
      /** The cleaned link: the song only, no playlist or tracking bits. */
      url: string;
      source: SongSource;
      /** A short link whose target is only known after following it. */
      needsResolve: boolean;
    }
  | ({ ok: false } & SongLinkProblem);

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const SPOTIFY_ID = /^[A-Za-z0-9]{22}$/;

const KNOWN_HOSTS =
  /(?:^|[\s(])((?:[\w-]+\.)*(?:youtube\.com|youtu\.be|spotify\.com|spotify\.link)\/\S*)/i;
const ANY_URL = /https?:\/\/\S+/i;
const SPOTIFY_URI = /spotify:track:([A-Za-z0-9]{22})/;

/** Pulls the first link out of pasted text, adding "https://" if missing. */
function extractUrl(text: string): string | null {
  const uri = text.match(SPOTIFY_URI);
  if (uri) return `https://open.spotify.com/track/${uri[1]}`;

  const withScheme = text.match(ANY_URL);
  const found = withScheme
    ? withScheme[0]
    : (() => {
        const bare = text.match(KNOWN_HOSTS);
        return bare ? `https://${bare[1]}` : null;
      })();
  if (!found) return null;

  // Share text often wraps the link in brackets or ends a sentence with it.
  return found.replace(/[)\]}>.,;:!?"'’”]+$/, "");
}

function hostOf(url: URL): string {
  return url.hostname.toLowerCase().replace(/^(?:www\.|m\.)/, "");
}

function readYouTube(url: URL, host: string): SongLinkResult {
  const segments = url.pathname.split("/").filter(Boolean);
  let id: string | null = null;

  if (host === "youtu.be") {
    id = segments[0] ?? null;
  } else if (segments[0] === "watch") {
    id = url.searchParams.get("v");
  } else if (["shorts", "live", "embed", "v"].includes(segments[0] ?? "")) {
    id = segments[1] ?? null;
  }

  if (id && YOUTUBE_ID.test(id)) {
    const base =
      host === "music.youtube.com"
        ? "https://music.youtube.com"
        : "https://www.youtube.com";
    return {
      ok: true,
      url: `${base}/watch?v=${id}`,
      source: "youtube",
      needsResolve: false,
    };
  }

  const first = segments[0] ?? "";
  const what =
    first === "playlist" || url.searchParams.has("list")
      ? "playlist"
      : first.startsWith("@") || ["channel", "c", "user"].includes(first)
        ? "channel"
        : "page";
  return { ok: false, reason: "no-song", what };
}

function readSpotify(url: URL, host: string): SongLinkResult {
  if (host === "spotify.link") {
    const code = url.pathname.split("/").filter(Boolean)[0];
    if (!code) return { ok: false, reason: "no-song", what: "page" };
    return {
      ok: true,
      url: `https://spotify.link/${code}`,
      source: "spotify",
      needsResolve: true,
    };
  }

  if (host !== "open.spotify.com" && host !== "play.spotify.com") {
    return { ok: false, reason: "no-song", what: "page" };
  }

  // Links shared outside the US carry a region folder: /intl-de/track/…
  const segments = url.pathname
    .split("/")
    .filter((s) => s !== "" && !s.startsWith("intl-"));
  const [kind, id] = segments;

  if (kind === "track" && id && SPOTIFY_ID.test(id)) {
    return {
      ok: true,
      url: `https://open.spotify.com/track/${id}`,
      source: "spotify",
      needsResolve: false,
    };
  }

  // An album link can point at one song on it.
  const highlighted = url.searchParams.get("highlight")?.match(SPOTIFY_URI);
  if (highlighted) {
    return {
      ok: true,
      url: `https://open.spotify.com/track/${highlighted[1]}`,
      source: "spotify",
      needsResolve: false,
    };
  }

  const names: Record<string, string> = {
    playlist: "playlist",
    album: "album",
    artist: "artist page",
    show: "podcast",
    episode: "podcast",
  };
  return { ok: false, reason: "no-song", what: names[kind ?? ""] ?? "page" };
}

export function parseSongLink(input: string): SongLinkResult {
  const text = input.trim();
  if (text === "") return { ok: false, reason: "empty" };

  const raw = extractUrl(text);
  if (!raw) return { ok: false, reason: "not-a-link" };

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "not-a-link" };
  }

  const host = hostOf(url);
  if (host === "youtu.be" || host === "youtube.com" || host === "music.youtube.com") {
    return readYouTube(url, host);
  }
  if (host === "spotify.link" || host === "spotify.com" || host.endsWith(".spotify.com")) {
    return readSpotify(url, host);
  }
  return { ok: false, reason: "wrong-site" };
}

/** The one-line message a guest sees for each problem. */
export function songLinkMessage(problem: SongLinkProblem): string {
  switch (problem.reason) {
    case "empty":
      return "Paste a YouTube or Spotify link to your song.";
    case "not-a-link":
      return "That doesn't look like a link. Copy the song's link from YouTube or Spotify and paste it here.";
    case "wrong-site":
      return "Only YouTube or Spotify links, please.";
    case "no-song": {
      const lead =
        problem.what === "page"
          ? "That link isn't a single song"
          : `That's a whole ${problem.what}`;
      return `${lead} — open the song you want, tap Share, then Copy link.`;
    }
  }
}
