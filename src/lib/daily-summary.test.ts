import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { summaryMessages, summaryWindow } from "./daily-summary.ts";

const SONG = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

// 05:00 in Vietnam (UTC+7) is 22:00 UTC the day before.
const START = new Date("2026-11-12T22:00:00Z"); // 05:00 13 Nov, pub time
const END = new Date("2026-11-13T22:00:00Z"); // 05:00 14 Nov, pub time

describe("the day a summary covers", () => {
  it("runs from 05:00 yesterday to 05:00 today when fired exactly at 05:00", () => {
    assert.deepEqual(summaryWindow(END), { start: START, end: END });
  });

  it("is the same day when the scheduler fires late", () => {
    const late = new Date("2026-11-13T22:59:59Z");
    assert.deepEqual(summaryWindow(late), { start: START, end: END });
  });

  it("is still the previous day one second before 05:00", () => {
    const early = new Date("2026-11-13T21:59:59Z");
    assert.deepEqual(summaryWindow(early), {
      start: new Date("2026-11-11T22:00:00Z"),
      end: START,
    });
  });
});

describe("the summary text", () => {
  const window = { start: START, end: END };

  it("lists each request with its pub-time clock, oldest first as given", () => {
    const [message, ...rest] = summaryMessages(window, [
      { song: SONG, came_from: "Finland", created_at: "2026-11-13T14:05:00Z" },
      { song: SONG, came_from: null, created_at: "2026-11-13T18:30:00Z" },
    ]);

    assert.equal(rest.length, 0);
    assert.equal(
      message,
      [
        "📋 Song requests",
        "05:00 13 Nov → 05:00 14 Nov",
        "2 requests",
        "",
        `1. 21:05 · ${SONG} · From: Finland`,
        `2. 01:30 · ${SONG}`,
      ].join("\n"),
    );
  });

  it("says so when nobody asked for a song", () => {
    assert.deepEqual(summaryMessages(window, []), [
      "📋 Song requests\n05:00 13 Nov → 05:00 14 Nov\n\nNo song requests.",
    ]);
  });

  it("splits a long night into messages Telegram will accept, losing nothing", () => {
    const requests = Array.from({ length: 150 }, () => ({
      song: SONG,
      came_from: "a table by the window",
      created_at: "2026-11-13T14:05:00Z",
    }));
    const messages = summaryMessages(window, requests);

    assert.ok(messages.length > 1);
    for (const message of messages) assert.ok(message.length <= 4096);
    const lines = messages.join("\n").split("\n");
    assert.equal(lines.filter((line) => /^\d+\. /.test(line)).length, 150);
    assert.match(messages.at(-1) ?? "", /^150\. /m);
  });
});
