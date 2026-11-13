/**
 * Posts to a Telegram chat through a bot: a note for each new song request,
 * and the daily summary.
 *
 * Never throws and never takes long: a guest's request is already saved by
 * the time this runs, so a Telegram problem is logged and nothing more.
 *
 * Kept free of path aliases and server-only imports so the tests can load it;
 * the bot token is handed in by the caller, never read here.
 */

const SEND_TIMEOUT_MS = 5000;

export type TelegramTarget = {
  /** The bot's token from @BotFather. */
  botToken: string;
  /** The chat, group or channel the bot posts to. */
  chatId: string;
};

export type SongRequestNotice = {
  song: string;
  cameFrom: string | null;
};

/** The text of the notification. Plain text, so nothing needs escaping. */
export function songRequestMessage(request: SongRequestNotice): string {
  const lines = ["🎵 New song request", request.song];
  if (request.cameFrom) lines.push(`From: ${request.cameFrom}`);
  return lines.join("\n");
}

/** Sends the notification. Resolves to whether Telegram accepted it. */
export function notifySongRequest(
  target: TelegramTarget,
  request: SongRequestNotice,
  send: typeof fetch = fetch,
): Promise<boolean> {
  return sendTelegramMessage(target, songRequestMessage(request), {}, send);
}

/**
 * Sends one plain-text message. Resolves to whether Telegram accepted it.
 * Telegram shows a preview card for the first link in a message unless
 * `linkPreview` is false.
 */
export async function sendTelegramMessage(
  target: TelegramTarget,
  text: string,
  options: { linkPreview?: boolean } = {},
  send: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const response = await send(
      `https://api.telegram.org/bot${target.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: target.chatId,
          text,
          ...(options.linkPreview === false && {
            link_preview_options: { is_disabled: true },
          }),
        }),
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      },
    );
    if (response.ok) return true;

    // Telegram explains itself in the body ("chat not found", "bot was
    // blocked"), which is what tells a wrong chat number from a wrong token.
    const body = (await response.json().catch(() => null)) as {
      description?: string;
    } | null;
    console.error(
      "Telegram refused a message:",
      body?.description ?? `HTTP ${response.status}`,
    );
  } catch (error) {
    // Only the error's name: a network error's message can carry the request
    // address, and the address contains the bot token.
    console.error(
      "Could not reach Telegram to send a message:",
      error instanceof Error ? error.name : "unknown error",
    );
  }
  return false;
}
