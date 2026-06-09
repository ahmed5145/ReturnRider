/** Shared fetch helpers — Render free tier can take 30–90s to wake. */

const DEFAULT_TIMEOUT_MS = 45_000;
const RETRY_TIMEOUT_MS = 90_000;

export function isTimeoutError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return (
    err.name === 'AbortError' ||
    /timed out|timeout|network request failed/i.test(err.message)
  );
}

export function formatNetworkError(err: unknown): string {
  if (isTimeoutError(err)) {
    return 'Server slow to respond (staging may be waking up). Wait ~30s and pull to refresh.';
  }
  if (err instanceof Error && err.message) return err.message;
  return 'Network error';
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (isTimeoutError(err)) {
      throw new Error(formatNetworkError(err));
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** One retry with a longer timeout — helps Render cold starts. */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  try {
    return await fetchWithTimeout(url, options, DEFAULT_TIMEOUT_MS);
  } catch (first) {
    if (!isTimeoutError(first)) throw first;
    return fetchWithTimeout(url, options, RETRY_TIMEOUT_MS);
  }
}
