/**
 * Display formatting. Everything here takes an ISO-8601 UTC string (how the API
 * returns timestamps, requirements §3) and renders it in the device's locale and
 * timezone.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "3 hours ago" — FR-BB-2, FR-PREF-6. */
export function relativeTime(iso: string): string {
  const elapsed = Date.now() - new Date(iso).getTime();
  if (elapsed < 0) return 'just now';
  if (elapsed < MINUTE) return 'just now';
  if (elapsed < HOUR) return plural(Math.floor(elapsed / MINUTE), 'minute');
  if (elapsed < DAY) return plural(Math.floor(elapsed / HOUR), 'hour');
  if (elapsed < 7 * DAY) return plural(Math.floor(elapsed / DAY), 'day');
  if (elapsed < 30 * DAY) return plural(Math.floor(elapsed / (7 * DAY)), 'week');
  if (elapsed < 365 * DAY) return plural(Math.floor(elapsed / (30 * DAY)), 'month');
  return plural(Math.floor(elapsed / (365 * DAY)), 'year');
}

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? '' : 's'} ago`;
}

/** Absolute date and time — required verbatim by FR-PREF-8. */
export function absoluteDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function dateLong(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function dateMedium(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function timeOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** "Mar 4, 9:00 AM – 11:30 AM", collapsing the date when the span is one day. */
export function eventWhen(startsAt: string, endsAt: string | null, isAllDay: boolean): string {
  const start = new Date(startsAt);
  if (isAllDay) {
    if (!endsAt || isSameDay(start, new Date(endsAt))) return `${dateMedium(startsAt)} · All day`;
    return `${dateMedium(startsAt)} – ${dateMedium(endsAt)} · All day`;
  }
  if (!endsAt) return `${dateMedium(startsAt)}, ${timeOnly(startsAt)}`;
  const end = new Date(endsAt);
  if (isSameDay(start, end)) {
    return `${dateMedium(startsAt)}, ${timeOnly(startsAt)} – ${timeOnly(endsAt)}`;
  }
  return `${dateMedium(startsAt)}, ${timeOnly(startsAt)} – ${dateMedium(endsAt)}, ${timeOnly(endsAt)}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** FR-DOC-12 — file size in the list row. */
export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}
