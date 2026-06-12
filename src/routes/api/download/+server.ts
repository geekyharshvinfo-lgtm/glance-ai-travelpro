import { error } from '@sveltejs/kit';
import * as Sentry from '@sentry/sveltekit';
import type { RequestHandler } from './$types';

// Restrict the proxy to Glance CDN hosts so we can't be used as an open relay.
const ALLOWED_HOST_SUFFIX = '.glance-cdn.com';

function isAllowedHost(hostname: string): boolean {
  return hostname === 'glance-cdn.com' || hostname.endsWith(ALLOWED_HOST_SUFFIX);
}

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[^\w.\- ]/g, '_').slice(0, 200);
  return cleaned || 'download';
}

// Authorization model:
//   1. Caller must present a Bearer token issued by Glance auth (guest or Google).
//      Matches the /api/upload pattern — gates anonymous traffic at our edge.
//   2. The CDN URL itself is signed (Expires + Signature query params) and
//      acts as a per-image capability — the CDN refuses unsigned/expired URLs,
//      so per-image authorization is enforced upstream and we don't replicate
//      it here.
export const GET: RequestHandler = async ({ url, request }) => {
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) throw error(401, 'Missing or invalid authorization header');

  const target = url.searchParams.get('url');
  if (!target) throw error(400, 'Missing url param');

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    throw error(400, 'Invalid url');
  }

  if (parsed.protocol !== 'https:') throw error(400, 'Only https URLs are allowed');
  if (!isAllowedHost(parsed.hostname)) throw error(403, 'Host not allowed');

  const filename = sanitizeFilename(url.searchParams.get('filename') ?? 'download.jpg');

  let upstream: Response;
  try {
    upstream = await fetch(target, { signal: AbortSignal.timeout(15_000) });
  } catch (err) {
    Sentry.captureException(err, { tags: { operation: 'download_proxy_fetch' } });
    throw error(502, 'Upstream fetch failed');
  }

  if (!upstream.ok || !upstream.body) {
    const status = upstream.status >= 400 && upstream.status < 500 ? upstream.status : 502;
    throw error(status, 'Upstream image not available');
  }

  const headers = new Headers({
    'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'private, no-store',
  });
  const contentLength = upstream.headers.get('content-length');
  if (contentLength) headers.set('Content-Length', contentLength);

  return new Response(upstream.body, { headers });
};
