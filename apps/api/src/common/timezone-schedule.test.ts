import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { atLocalTimeOnSameDay, isValidTimezone } from './timezone-schedule';

describe('timezone-schedule', () => {
  it('validates IANA timezones', () => {
    assert.equal(isValidTimezone('America/New_York'), true);
    assert.equal(isValidTimezone('Europe/London'), true);
    assert.equal(isValidTimezone('Not/A/Zone'), false);
  });

  it('schedules at 9:00 local on the trigger day', () => {
    const reference = new Date('2025-06-15T18:00:00.000Z');
    const scheduled = atLocalTimeOnSameDay(reference, 9, 0, 'America/New_York');
    const hourInNy = Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        hour12: false,
      }).format(scheduled),
    );
    assert.equal(hourInNy, 9);
  });
});
