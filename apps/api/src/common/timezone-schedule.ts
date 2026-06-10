import { DateTime } from 'luxon';

/** Validate IANA timezone (e.g. America/New_York). */
export function isValidTimezone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Given a UTC instant, return the UTC instant for hour:minute on that
 * calendar day in the user's timezone.
 */
export function atLocalTimeOnSameDay(
  referenceUtc: Date,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const zone = isValidTimezone(timeZone) ? timeZone : 'America/New_York';
  const local = DateTime.fromJSDate(referenceUtc, { zone }).set({
    hour,
    minute,
    second: 0,
    millisecond: 0,
  });
  return local.toUTC().toJSDate();
}
