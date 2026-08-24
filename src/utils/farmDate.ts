import { TASK_DUE_TIME_HOUR } from '@/utils/taskConstants';

export const FARM_TIME_ZONE = 'Asia/Kolkata';
export const FARM_DEFAULT_LOCALE = 'en-IN';

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const keyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: FARM_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function parseDateKey(key: string): { year: number; month: number; day: number } | null {
  const match = DATE_KEY_PATTERN.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function partsToKey(parts: Intl.DateTimeFormatPart[]): string | null {
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return year && month && day ? `${year}-${month}-${day}` : null;
}

/** Calendar date of a timestamp in the farm's Tamil Nadu timezone. */
export function farmDateKey(value: Date | string | number): string | null {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return partsToKey(keyFormatter.formatToParts(date));
}

/** Calendar date selected by the user. Date objects from calendar cells are wall dates. */
export function calendarDateKey(date: Date): string | null {
  if (Number.isNaN(date.getTime())) return null;
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Local-noon Date used to render a farm date without crossing a device timezone boundary. */
export function calendarDateFromKey(key: string): Date | null {
  const parsed = parseDateKey(key);
  if (!parsed) return null;
  const date = new Date(parsed.year, parsed.month - 1, parsed.day, 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function farmToday(now: Date = new Date()): Date {
  return calendarDateFromKey(farmDateKey(now) ?? '') ?? new Date(now);
}

export function addDaysToDateKey(key: string, days: number): string | null {
  const parsed = parseDateKey(key);
  if (!parsed || !Number.isFinite(days)) return null;
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  date.setUTCDate(date.getUTCDate() + Math.trunc(days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
    date.getUTCDate()
  ).padStart(2, '0')}`;
}

export function addCalendarDays(date: Date, days: number): Date {
  const key = calendarDateKey(date);
  const nextKey = key ? addDaysToDateKey(key, days) : null;
  return (nextKey ? calendarDateFromKey(nextKey) : null) ?? new Date(date);
}

/** Converts a farm wall-clock date/time to an absolute timestamp. India has no DST. */
export function farmDateTimeFromKey(
  key: string,
  hour: number = TASK_DUE_TIME_HOUR,
  minute = 0
): Date | null {
  const parsed = parseDateKey(key);
  if (!parsed || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  const timestamp = Date.UTC(parsed.year, parsed.month - 1, parsed.day, hour - 5, minute - 30);
  const date = new Date(timestamp);
  return farmDateKey(date) === key ? date : null;
}

export function calendarDaysBetweenKeys(earlierKey: string, laterKey: string): number | null {
  const earlier = parseDateKey(earlierKey);
  const later = parseDateKey(laterKey);
  if (!earlier || !later) return null;
  const earlierUtc = Date.UTC(earlier.year, earlier.month - 1, earlier.day);
  const laterUtc = Date.UTC(later.year, later.month - 1, later.day);
  return Math.round((laterUtc - earlierUtc) / 86_400_000);
}

export function formatFarmDate(
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions,
  locale: string = FARM_DEFAULT_LOCALE
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale, { ...options, timeZone: FARM_TIME_ZONE });
}
