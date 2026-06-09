export type SnoozeMode = '24h' | 'weekend';

export function getSnoozeSuggestion(daysRemaining: number | null): {
  mode: SnoozeMode;
  label: string;
} | null {
  if (daysRemaining == null || daysRemaining > 5) return null;
  if (daysRemaining <= 2) {
    return { mode: 'weekend', label: 'Snooze until Saturday' };
  }
  return { mode: '24h', label: 'Snooze 24 hours' };
}
