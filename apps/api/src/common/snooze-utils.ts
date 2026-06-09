export function computeSnoozeDeadline(
  currentDeadline: Date | null,
  mode: '24h' | 'weekend' = '24h',
): Date {
  if (mode === '24h') {
    const base = currentDeadline ?? new Date();
    return new Date(base.getTime() + 24 * 60 * 60 * 1000);
  }

  const base = currentDeadline ?? new Date();
  const target = new Date(base);
  const day = target.getDay();
  const daysUntilSaturday = day === 6 ? 7 : (6 - day + 7) % 7 || 7;
  target.setDate(target.getDate() + daysUntilSaturday);
  target.setHours(23, 59, 0, 0);
  if (target.getTime() <= base.getTime()) {
    target.setDate(target.getDate() + 7);
  }
  return target;
}
