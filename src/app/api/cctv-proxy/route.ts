/**
 * CCTV PROXY — Dahua DVR (DMSS)
 * Handles Digest Authentication yang dipakai Dahua secara native.
 * Browser tidak bisa kirim Digest Auth dalam <img>, proxy inilah solusinya.
 */

import { createHash } from 'crypto';
import { NextRequest } from 'next/server';

export const dynamic  = 'force-dynamic';
export const maxDuration = 30;

// ─── KONFIGURASI DVR ─────────────────────────────────────────────────
const DVR_IP   = process.env.CCTV_IP   || '103.109.206.38';
const DVR_PORT = process.env.CCTV_HTTP_PORT || '80';
const DVR_USER = process.env.CCTV_USER || 'publik';
const DVR_PASS = process.env.CCTV_PASS || 'publik123';
// ─────────────────────────────────────────────────────────────────────

function md5(input: string): string {
  return createHash('md5').update(input).digest('hex');
}

function buildDigestHeader(
  method: string,
  uri: string,
  wwwAuth: string
): string {
  const realm   = wwwAuth.match(/realm="([^"]+)"/)?.[1] || '';
  const nonce   = wwwAuth.match(/nonce="([^"]+)"/)?.[1] || '';
  const qop     = wwwAuth.match(/qop="?([^",\s]+)"?/)?.[1] || '';
  const opaque  = wwwAuth.match(/opaque="([^"]+)"/)?.[1] || '';

  const nc      = '00000001';
  const cnonce  = Math.random().toString(36).substring(2, 10);

  const ha1 = md5(`${DVR_USER}:${realm}:${DVR_PASS}`);
  const ha2 = md5(`${method}:${uri}`);

  let response: string;
  if (qop === 'auth' || qop === 'auth-int') {
    response = md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`);
  } else {
    response = md5(`${ha1}:${nonce}:${ha2}`);
  }

  let header =
    `Digest username="${DVR_USER}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${response}"`;

  if (qop)    header += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;
  if (opaque) header += `, opaque="${opaque}"`;

  return header;
}

// Build the snapshot CGI URL for a given channel
function snapshotUrl(ch: number): { path: string; full: string } {
  const path = `/cgi-bin/snapshot.cgi?channel=${ch}`;
  const full = `http://${DVR_IP}:${DVR_PORT}${path}`;
  return { path, full };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ch = Math.min(Math.max(parseInt(searchParams.get('ch') || '1'), 1), 16);

  const { path, full } = snapshotUrl(ch);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    // ── Step 1: request tanpa auth → Dahua kirim 401 + WWW-Authenticate ──
    const r1 = await fetch(full, {
      method: 'GET',
      signal: controller.signal,
    });

    if (r1.status !== 401) {
      // Tidak butuh auth (jarang), langsung return
      clearTimeout(timer);
      const buf = await r1.arrayBuffer();
      return new Response(buf, {
        status: 200,
        headers: {
          'Content-Type': r1.headers.get('content-type') || 'image/jpeg',
          'Cache-Control': 'no-cache, no-store',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const wwwAuth = r1.headers.get('www-authenticate') || '';
    if (!wwwAuth.toLowerCase().includes('digest')) {
      // Fallback Basic Auth
      const basicCred = Buffer.from(`${DVR_USER}:${DVR_PASS}`).toString('base64');
      const r2b = await fetch(full, {
        method: 'GET',
        headers: { 'Authorization': `Basic ${basicCred}` },
        signal: controller.signal,
      });
      clearTimeout(timer);
      const buf = await r2b.arrayBuffer();
      return new Response(buf, {
        status: r2b.ok ? 200 : 502,
        headers: {
          'Content-Type': r2b.headers.get('content-type') || 'image/jpeg',
          'Cache-Control': 'no-cache, no-store',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // ── Step 2: request dengan Digest Auth ──────────────────────────────
    const digestHeader = buildDigestHeader('GET', path, wwwAuth);

    const r2 = await fetch(full, {
      method: 'GET',
      headers: {
        'Authorization': digestHeader,
        'User-Agent': 'Mozilla/5.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!r2.ok) {
      throw new Error(`DVR responded ${r2.status}`);
    }

    const buf = await r2.arrayBuffer();
    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': r2.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (e: any) {
    clearTimeout(timer);
    // Return placeholder error image
    const errMsg = String(e?.message || e).slice(0, 100);
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
        <rect width="640" height="360" fill="#07111e"/>
        <text x="320" y="160" text-anchor="middle" fill="#ee4444" font-family="monospace" font-size="36">⚠</text>
        <text x="320" y="200" text-anchor="middle" fill="#aaa" font-family="monospace" font-size="13">CH ${ch} — Tidak dapat terhubung</text>
        <text x="320" y="222" text-anchor="middle" fill="#555" font-family="monospace" font-size="10">${errMsg}</text>
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
