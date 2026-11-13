/**
 * The once-a-day Telegram summary: every song requested during one "pub day".
 *
 * A pub day runs from 05:00 to 05:00 the next morning, pub time, so a night
 * that runs past midnight stays in one summary.
 *
 * Kept free of path aliases and server-only imports so the tests can load it.
 */

/** The pub's clock, as hours ahead of UTC. Vietnam: +7, no summer time. */
export const PUB_UTC_OFFSET_HOURS = 7;
/** The hour, pub time, at which one day ends and the next begins. */
export const DAY_STARTS_AT_HOUR = 5;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
/** Telegram refuses a message longer than 4096 characters. */
const MAX_MESSAGE_LENGTH = 4096;
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export type SummaryWindow = { start: Date; end: Date };

export type SummaryRequest = {
  song: string;
  came_from: string | null;
  created_at: string;
};

/**
 * The pub day that most recently finished: it ends at the latest 05:00 at or
 * before `now`. Worked out from the clock rather than "the last 24 hours" so
 * a scheduler that fires late, or twice, still reports exactly one whole day.
 */
export function summaryWindow(now: Date): SummaryWindow {
  const shift = (PUB_UTC_OFFSET_HOURS - DAY_STARTS_AT_HOUR) * HOUR_MS;
  const end = Math.floor((now.getTime() + shift) / DAY_MS) * DAY_MS - shift;
  return { start: new Date(end - DAY_MS), end: new Date(end) };
}

/** A moment shifted so its UTC fields read as the pub's clock. */
function pubClock(moment: Date): Date {
  return new Date(moment.getTime() + PUB_UTC_OFFSET_HOURS * HOUR_MS);
}

function two(value: number): string {
  return String(value).padStart(2, "0");
}

function time(moment: Date): string {
  const clock = pubClock(moment);
  return `${two(clock.getUTCHours())}:${two(clock.getUTCMinutes())}`;
}

function dateAndTime(moment: Date): string {
  const clock = pubClock(moment);
  return `${time(moment)} ${clock.getUTCDate()} ${MONTHS[clock.getUTCMonth()]}`;
}

/**
 * The summary as one or more messages, oldest request first. A long night is
 * split between requests so no message goes over Telegram's length limit.
 */
export function summaryMessages(
  window: SummaryWindow,
  requests: SummaryRequest[],
): string[] {
  const heading = `📋 Song requests\n${dateAndTime(window.start)} → ${dateAndTime(window.end)}`;
  if (requests.length === 0) {
    return [`${heading}\n\nNo song requests.`];
  }

  const total = `${requests.length} ${requests.length === 1 ? "request" : "requests"}`;
  const messages: string[] = [];
  let current = `${heading}\n${total}\n`;
  requests.forEach((request, index) => {
    const from = request.came_from ? ` · From: ${request.came_from}` : "";
    const line = `${index + 1}. ${time(new Date(request.created_at))} · ${request.song}${from}`;
    if (current.length + 1 + line.length > MAX_MESSAGE_LENGTH) {
      messages.push(current);
      current = line;
    } else {
      current += `\n${line}`;
    }
  });
  messages.push(current);
  return messages;
}
