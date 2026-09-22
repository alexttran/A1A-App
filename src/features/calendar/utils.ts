import type { CalendarEvent } from '@/lib/mock/types';

/** Local midnight for `date`, so day comparisons ignore the time component. */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function monthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/** Sunday-first weekday initials, from the device locale. */
export const WEEKDAY_INITIALS = Array.from({ length: 7 }, (_, index) =>
  new Date(2024, 8, 1 + index).toLocaleDateString(undefined, { weekday: 'narrow' }),
);

/**
 * The month grid as six weeks of seven days, padded with the surrounding months
 * so every row is full. Six rows always, so the grid does not change height as
 * the user pages through months.
 */
export function monthGrid(monthDate: Date): Date[][] {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = addDays(first, -first.getDay());

  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(gridStart, week * 7 + day)),
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function isToday(date: Date): boolean {
  return startOfDay(date).getTime() === startOfDay(new Date()).getTime();
}

/** True when the event covers more than one calendar day — FR-CAL-10. */
export function isMultiDay(event: CalendarEvent): boolean {
  if (!event.endsAt) return false;
  return (
    startOfDay(new Date(event.startsAt)).getTime() !== startOfDay(new Date(event.endsAt)).getTime()
  );
}

export function coversDay(event: CalendarEvent, day: Date): boolean {
  const dayStart = startOfDay(day);
  const dayEnd = addDays(dayStart, 1);
  const start = new Date(event.startsAt);
  const end = event.endsAt ? new Date(event.endsAt) : start;
  return start < dayEnd && end >= dayStart;
}

export function isFirstDayOf(event: CalendarEvent, day: Date): boolean {
  return startOfDay(new Date(event.startsAt)).getTime() === startOfDay(day).getTime();
}

export function isLastDayOf(event: CalendarEvent, day: Date): boolean {
  const end = event.endsAt ? new Date(event.endsAt) : new Date(event.startsAt);
  return startOfDay(end).getTime() === startOfDay(day).getTime();
}

/** Groups events by local calendar day, for the agenda view. */
export function groupByDay(events: CalendarEvent[]): { day: Date; events: CalendarEvent[] }[] {
  const buckets = new Map<number, CalendarEvent[]>();

  for (const event of events) {
    const key = startOfDay(new Date(event.startsAt)).getTime();
    const bucket = buckets.get(key);
    if (bucket) bucket.push(event);
    else buckets.set(key, [event]);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([time, dayEvents]) => ({ day: new Date(time), events: dayEvents }));
}
