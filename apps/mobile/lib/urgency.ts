import { colors } from './theme';

export type UrgencyLevel = 'overdue' | 'critical' | 'warning' | 'ok' | 'none';

export function getUrgencyLevel(daysRemaining: number | null | undefined): UrgencyLevel {
  if (daysRemaining == null) return 'none';
  if (daysRemaining < 0) return 'overdue';
  if (daysRemaining <= 3) return 'critical';
  if (daysRemaining <= 7) return 'warning';
  return 'ok';
}

export function getUrgencyColor(daysRemaining: number | null | undefined): string {
  const level = getUrgencyLevel(daysRemaining);
  switch (level) {
    case 'overdue':
      return colors.textDim;
    case 'critical':
      return colors.accent;
    case 'warning':
      return '#f5a623';
    case 'ok':
      return colors.success;
    default:
      return colors.border;
  }
}

export function formatDaysRemaining(daysRemaining: number | null | undefined): string {
  if (daysRemaining == null) return 'No deadline set';
  if (daysRemaining < 0) return 'Past deadline';
  if (daysRemaining === 0) return 'Due today';
  if (daysRemaining === 1) return '1 day left';
  return `${daysRemaining} days left`;
}
