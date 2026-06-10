export interface LinkedEmailSyncInfo {
  email_address?: string;
  status: string;
  last_sync_at?: string | null;
  last_error?: string | null;
}

export type SyncHealthLevel = 'error' | 'warning';

export interface SyncHealthIssue {
  level: SyncHealthLevel;
  title: string;
  detail: string;
}

/** Scheduler runs every ~15 min when the API is awake. */
const STALE_SYNC_MS = 20 * 60 * 1000;

export function getSyncHealth(
  emails: LinkedEmailSyncInfo[],
  inboxSyncing: boolean,
): SyncHealthIssue | null {
  if (emails.length === 0 || inboxSyncing) return null;

  const withError = emails.filter(
    (e) => e.status === 'error' || Boolean(e.last_error?.trim()),
  );
  if (withError.length > 0) {
    const first = withError[0];
    const errDetail = first.last_error?.trim();
    return {
      level: 'error',
      title: 'Email sync failed',
      detail:
        withError.length === 1 && first.email_address
          ? `${first.email_address}${errDetail ? `: ${errDetail}` : ''} — tap Sync now below`
          : `${withError.length} inbox${withError.length === 1 ? '' : 'es'} need attention`,
    };
  }

  const stale = emails.filter((e) => {
    if (e.status === 'syncing') return false;
    if (!e.last_sync_at) return true;
    return Date.now() - new Date(e.last_sync_at).getTime() > STALE_SYNC_MS;
  });

  if (stale.length > 0) {
    return {
      level: 'warning',
      title: 'Inbox sync is behind',
      detail:
        'The API may have been asleep (free hosting). Pull to refresh or tap Sync now below.',
    };
  }

  return null;
}
