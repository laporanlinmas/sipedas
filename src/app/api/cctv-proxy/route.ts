/**
 * CCTV PROXY — Dahua DVR dengan Digest Authentication
 * - Nonce di-cache sehingga hanya 1 HTTP round-trip per snapshot
 * - Jika nonce stale (401), otomatis refresh dan coba ulang
 */

import { createHash } from 'crypto';
import { NextRequest } from 'next/server';

export const dynamic   = 'force-dynamic';
export const maxDuration = 20;

// ─── KONFIGURASI DVR ─────────────────────────────────────────────────
const DVR_IP   = process.env.CCTV_IP          || '103.109.206.38';
const DVR_PORT = process.env.CCTV_HTTP_PORT   || '80';
const DVR_USER = process.env.CCTV_USER        || 'publik';
const DVR_PASS = process.env.CCTV_PASS        || 'publik123';
// ─────────────────────────────────────────────────────────────────────

// Cache nonce per-channel agar tidak perlu double round-trip setiap saat
interface DigestCache {
  realm: string;
  nonce: string;
  qop: string;
  opaque: string;
}
const digestCache: Record<number, DigestCache> = {};

function md5(input: string): string {
  return createHash('md5').update(input).digest('hex');
}

function parseWwwAuth(header: string): DigestCache {
  return {
    realm:  header.match(/realm="([^"]+)"/)?.[1]  || '',
    nonce:  header.match(/nonce="([^"]+)"/)?.[1]  || '',
    qop:    header.match(/qop="?([^",\s]+)"?/)?.[1] || '',
    opaque: header.match(/opaque="([^"]+)"/)?.[1] || '',
  };
}

function buildDigestHeader(uri: string, cache: DigestCache): string {
  const { realm, nonce, qop, opaque } = cache;
  const nc     = '00000001';
  const cnonce = Math.random().toString(36).substring(2, 10);
  const ha1    = md5(`${DVR_USER}:${realm}:${DVR_PASS}`);
  const ha2    = md5(`GET:${uri}`);
  const resp   = qop
    ? md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`)
    : md5(`${ha1}:${nonce}:${ha2}`);

  let h = `Digest username="${DVR_USER}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${resp}"`;
  if (qop)    h += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;
  if (opaque) h += `, opaque="${opaque}"`;
  return h;
}

async function fetchSnapshot(ch: number, signal: AbortSignal): Promise<Response> {
  const uri  = `/cgi-bin/snapshot.cgi?channel=${ch}`;
  const full = `http://${DVR_IP}:${DVR_PORT}${uri}`;

  // ── Try with cached nonce first (skip challenge round-trip) ──────────
  if (digestCache[ch]) {
    const authHeader = buildDigestHeader(uri, digestCache[ch]);
    const r = await fetch(full, {
      method: 'GET',
      headers: { 'Authorization': authHeader, 'User-Agent': 'Mozilla/5.0' },
      signal,
    });
    if (r.ok) return r;
    // Nonce expired → fall through to re-auth
    delete digestCache[ch];
  }

  // ── Challenge step: get fresh nonce ──────────────────────────────────
  const challenge = await fetch(full, {
    method: 'GET',
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal,
  });

  if (challenge.ok) return challenge; // No auth needed

  if (challenge.status !== 401) {
    throw new Error(`DVR error ${challenge.status}`);
  }

  const wwwAuth = challenge.headers.get('www-authenticate') || '';
  if (!wwwAuth.toLowerCase().includes('digest')) {
    // Fallback Basic Auth
    const basic = Buffer.from(`${DVR_USER}:${DVR_PASS}`).toString('base64');
    return fetch(full, {
      method: 'GET',
      headers: { 'Authorization': `Basic ${basic}`, 'User-Agent': 'Mozilla/5.0' },
      signal,
    });
  }

  // Cache the nonce & do authenticated request
  const cache = parseWwwAuth(wwwAuth);
  digestCache[ch] = cache;

  const authHeader = buildDigestHeader(uri, cache);
  return fetch(full, {
    method: 'GET',
    headers: { 'Authorization': authHeader, 'User-Agent': 'Mozilla/5.0' },
    signal,
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ch = Math.min(Math.max(parseInt(searchParams.get('ch') || '1'), 1), 16);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const r = await fetchSnapshot(ch, controller.signal);
    clearTimeout(timer);

    if (!r.ok) throw new Error(`DVR responded ${r.status}`);

    const buf = await r.arrayBuffer();
    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': r.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (e: any) {
    clearTimeout(timer);
    const msg = String(e?.message || e).slice(0, 100);
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
        <rect width="640" height="360" fill="#07111e"/>
        <text x="320" y="165" text-anchor="middle" fill="#ee4444" font-family="monospace" font-size="36">⚠</text>
        <text x="320" y="205" text-anchor="middle" fill="#aaa" font-family="monospace" font-size="13">CH ${ch} — Tidak dapat terhubung</text>
        <text x="320" y="225" text-anchor="middle" fill="#555" font-family="monospace" font-size="10">${msg}</text>
      </svg>`,
      {
        status: 502,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
