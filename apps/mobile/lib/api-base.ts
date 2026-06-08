/** API origin without /api/v1 — for legal pages, health checks */
export function getApiOrigin(): string {
  const base = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
  return base.replace(/\/api\/v1\/?$/, '');
}

export function legalUrl(path: 'terms' | 'privacy'): string {
  return `${getApiOrigin()}/legal/${path}`;
}
