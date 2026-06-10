/** Minimal luxon types for API build (luxon ships without bundled .d.ts in some installs). */
declare module 'luxon' {
  export class DateTime {
    static now(): DateTime;
    static fromJSDate(date: Date, opts?: { zone?: string }): DateTime;
    setZone(zone: string): DateTime;
    set(values: {
      year?: number;
      month?: number;
      day?: number;
      hour?: number;
      minute?: number;
      second?: number;
      millisecond?: number;
    }): DateTime;
    toUTC(): DateTime;
    toJSDate(): Date;
    readonly isValid: boolean;
  }
}
