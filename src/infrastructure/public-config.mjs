export const DEFAULT_API_ORIGIN = 'https://shorx402.netlify.app';
export function resolveApiEndpoint(endpoint, apiBase = '') {
  if (typeof endpoint !== 'string' || !endpoint) throw new Error('API endpoint is required');
  if (!endpoint.startsWith('/')) {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('External APIs require HTTPS');
    return url.toString();
  }
  if (endpoint.startsWith('//')) throw new Error('Protocol-relative endpoints are not allowed');
  if (!apiBase) return endpoint;
  const base = new URL(apiBase);
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash ||
      (base.pathname !== '/' && base.pathname !== '')) throw new Error('API base must be an HTTPS origin');
  return new URL(endpoint, base).toString();
}
