/**
 * Analytics-ready event hooks. Logs in __DEV__; swap body for Amplitude/PostHog later.
 */
export type AnalyticsEvent =
  | 'onboarding_started'
  | 'gmail_connected'
  | 'first_return_visible'
  | 'onboarding_completed'
  | 'parse_review_confirmed'
  | 'refund_confirmed'
  | 'manual_return_added'
  | 'parse_misparsed_reported'
  | 'merchant_portal_opened'
  | 'dashboard_snooze'
  | 'referral_applied'
  | 'theme_changed';

export function trackEvent(
  event: AnalyticsEvent,
  properties?: Record<string, string | number | boolean>,
): void {
  if (__DEV__) {
    console.log('[analytics]', event, properties ?? {});
  }
}
