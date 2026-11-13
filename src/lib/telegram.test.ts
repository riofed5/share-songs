import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import {
  notifySongRequest,
  sendTelegramMessage,
  songRequestMessage,
} from "./telegram.ts";

const SONG = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
const TARGET = { botToken: "123:secret", chatId: "-1001234" };

function fakeSend(response: Response | Error) {
  const calls: { url: string; init: RequestInit }[] = [];
  const send = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    if (response instanceof Error) throw response;
    return response;
  }) as typeof fetch;
  return { send, calls };
}

describe("the notification text", () => {
  it("shows the song link", () => {
    assert.equal(
      songRequestMessage({ song: SONG, cameFrom: null }),
      `🎵 New song request\n${SONG}`,
    );
  });

  it("adds where the guest came from when they said", () => {
    assert.equal(
      songRequestMessage({ song: SONG, cameFrom: "Finland" }),
      `🎵 New song request\n${SONG}\nFrom: Finland`,
    );
  });
});

describe("sending the notification", () => {
  it("posts the text to the chosen chat through the bot", async () => {
    const { send, calls } = fakeSend(Response.json({ ok: true }));
    const sent = await notifySongRequest(
      TARGET,
      { song: SONG, cameFrom: "Finland" },
      send,
    );

    assert.equal(sent, true);
    assert.equal(calls.length, 1);
    assert.equal(
      calls[0].url,
      "https://api.telegram.org/bot123:secret/sendMessage",
    );
    assert.equal(calls[0].init.method, "POST");
    assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
      chat_id: "-1001234",
      text: `🎵 New song request\n${SONG}\nFrom: Finland`,
    });
  });

  it("turns the link preview off when asked", async () => {
    const { send, calls } = fakeSend(Response.json({ ok: true }));
    const sent = await sendTelegramMessage(
      TARGET,
      `1. ${SONG}`,
      { linkPreview: false },
      send,
    );

    assert.equal(sent, true);
    assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
      chat_id: "-1001234",
      text: `1. ${SONG}`,
      link_preview_options: { is_disabled: true },
    });
  });

  it("reports failure, without throwing, when Telegram refuses", async () => {
    const logged = mock.method(console, "error", () => {});
    const { send } = fakeSend(
      Response.json(
        { ok: false, description: "Bad Request: chat not found" },
        { status: 400 },
      ),
    );
    const sent = await notifySongRequest(
      TARGET,
      { song: SONG, cameFrom: null },
      send,
    );

    assert.equal(sent, false);
    assert.match(String(logged.mock.calls[0].arguments[1]), /chat not found/);
    logged.mock.restore();
  });

  it("reports failure, without throwing or leaking the token, when Telegram cannot be reached", async () => {
    const logged = mock.method(console, "error", () => {});
    const { send } = fakeSend(
      new TypeError("fetch failed for https://api.telegram.org/bot123:secret/"),
    );
    const sent = await notifySongRequest(
      TARGET,
      { song: SONG, cameFrom: null },
      send,
    );

    assert.equal(sent, false);
    const output = logged.mock.calls
      .flatMap((call) => call.arguments)
      .join(" ");
    assert.doesNotMatch(output, /secret/);
    logged.mock.restore();
  });
});
