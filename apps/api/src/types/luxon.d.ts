/** Fallback if @types/luxon is not yet in node_modules (CI uses package-lock). */
declare module 'luxon' {
  export class DateTime {
    static now(): DateTime;
    static fromJSDate(date: Date, opts?: { zone?: string }): DateTime;
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
