import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseSongLink, songLinkMessage } from "./song-link.ts";

const YT = "dQw4w9WgXcQ";
const SP = "4uLU6hMCjMI75M1A2tKUQC";

function accepted(input: string) {
  const result = parseSongLink(input);
  assert.equal(result.ok, true, `expected "${input}" to be accepted`);
  return result as Extract<typeof result, { ok: true }>;
}

function refused(input: string) {
  const result = parseSongLink(input);
  assert.equal(result.ok, false, `expected "${input}" to be refused`);
  return result as Extract<typeof result, { ok: false }>;
}

describe("YouTube songs are accepted and cleaned", () => {
  it("a normal watch link", () => {
    const r = accepted(`https://www.youtube.com/watch?v=${YT}`);
    assert.equal(r.url, `https://www.youtube.com/watch?v=${YT}`);
    assert.equal(r.source, "youtube");
  });

  it("the app's short share link, dropping the tracking bit", () => {
    assert.equal(
      accepted(`https://youtu.be/${YT}?si=AbCdEfGh123`).url,
      `https://www.youtube.com/watch?v=${YT}`,
    );
  });

  it("a song opened from inside a playlist keeps only the song", () => {
    assert.equal(
      accepted(`https://www.youtube.com/watch?v=${YT}&list=PLabc123&index=4`).url,
      `https://www.youtube.com/watch?v=${YT}`,
    );
  });

  it("a song opened from a Mix keeps only the song", () => {
    assert.equal(
      accepted(`https://m.youtube.com/watch?v=${YT}&list=RD${YT}&start_radio=1`).url,
      `https://www.youtube.com/watch?v=${YT}`,
    );
  });

  it("a Short", () => {
    assert.equal(
      accepted(`https://youtube.com/shorts/${YT}?feature=share`).url,
      `https://www.youtube.com/watch?v=${YT}`,
    );
  });

  it("a YouTube Music song stays on YouTube Music", () => {
    assert.equal(
      accepted(`https://music.youtube.com/watch?v=${YT}&list=RDAMVM${YT}`).url,
      `https://music.youtube.com/watch?v=${YT}`,
    );
  });
});

describe("Spotify songs are accepted and cleaned", () => {
  it("a song link, dropping the tracking bit", () => {
    const r = accepted(`https://open.spotify.com/track/${SP}?si=abc123`);
    assert.equal(r.url, `https://open.spotify.com/track/${SP}`);
    assert.equal(r.source, "spotify");
    assert.equal(r.needsResolve, false);
  });

  it("a song link shared from another country", () => {
    assert.equal(
      accepted(`https://open.spotify.com/intl-de/track/${SP}`).url,
      `https://open.spotify.com/track/${SP}`,
    );
  });

  it("an album link pointing at one song on it", () => {
    assert.equal(
      accepted(
        `https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3?highlight=spotify:track:${SP}`,
      ).url,
      `https://open.spotify.com/track/${SP}`,
    );
  });

  it("a Spotify song address copied from the desktop app", () => {
    assert.equal(
      accepted(`spotify:track:${SP}`).url,
      `https://open.spotify.com/track/${SP}`,
    );
  });

  it("the app's short share link is accepted but flagged to look up", () => {
    const r = accepted("https://spotify.link/AbC123xyz");
    assert.equal(r.url, "https://spotify.link/AbC123xyz");
    assert.equal(r.needsResolve, true);
  });
});

describe("messy pastes are forgiven", () => {
  it("share text with the link inside", () => {
    assert.equal(
      accepted(`Check out this song on Spotify! https://open.spotify.com/track/${SP}?si=x`).url,
      `https://open.spotify.com/track/${SP}`,
    );
  });

  it("a link missing https://", () => {
    assert.equal(accepted(`youtu.be/${YT}`).url, `https://www.youtube.com/watch?v=${YT}`);
  });

  it("spaces around it and capitals in the site name", () => {
    assert.equal(
      accepted(`   HTTPS://WWW.YOUTUBE.COM/watch?v=${YT}  `).url,
      `https://www.youtube.com/watch?v=${YT}`,
    );
  });

  it("a link wrapped in brackets or ending a sentence", () => {
    assert.equal(
      accepted(`(https://youtu.be/${YT}).`).url,
      `https://www.youtube.com/watch?v=${YT}`,
    );
  });
});

describe("links with no song in them are refused with the right word", () => {
  const cases: [string, string][] = [
    ["https://www.youtube.com/playlist?list=PLabc123", "playlist"],
    ["https://www.youtube.com/@SomeArtist", "channel"],
    ["https://www.youtube.com/channel/UCabc", "channel"],
    ["https://www.youtube.com/", "page"],
    ["https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M", "playlist"],
    ["https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3", "album"],
    ["https://open.spotify.com/artist/0OdUWJ0sBjDrqHygGUXeCF", "artist page"],
    ["https://open.spotify.com/episode/abc", "podcast"],
  ];
  for (const [input, what] of cases) {
    it(input, () => {
      const r = refused(input);
      assert.equal(r.reason, "no-song");
      assert.equal(r.reason === "no-song" && r.what, what);
    });
  }
});

describe("everything else is refused", () => {
  it("empty", () => assert.equal(refused("   ").reason, "empty"));
  it("plain words", () => assert.equal(refused("Dancing Queen ABBA").reason, "not-a-link"));
  it("another site", () =>
    assert.equal(refused("https://soundcloud.com/artist/song").reason, "wrong-site"));
  it("a look-alike site name", () =>
    assert.equal(refused(`https://notyoutube.com/watch?v=${YT}`).reason, "wrong-site"));
  it("a look-alike Spotify name", () =>
    assert.equal(refused(`https://fakespotify.com/track/${SP}`).reason, "wrong-site"));
});

describe("messages", () => {
  it("names the thing that isn't a song", () => {
    assert.equal(
      songLinkMessage({ reason: "no-song", what: "playlist" }),
      "That's a whole playlist — open the song you want, tap Share, then Copy link.",
    );
  });

  it("falls back to a general line when it can't name it", () => {
    assert.match(songLinkMessage({ reason: "no-song", what: "page" }), /^That link isn't a single song/);
  });
});
