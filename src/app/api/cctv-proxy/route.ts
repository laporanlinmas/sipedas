/**
 * CCTV PROXY — Dahua DVR (DMSS)
 * Proxies snapshot/MJPEG dari Dahua DVR ke browser
 * Menghindari CORS, Mixed-Content, dan Basic/Digest auth masalah.
 *
 * Usage:
 *   /api/cctv-proxy?ch=1&type=snapshot   → JPEG gambar
 *   /api/cctv-proxy?ch=1&type=stream     → MJPEG stream
 */

import { NextResponse } from 'next/server';

export const dynamic  = 'force-dynamic';
export const maxDuration = 60; // detik maks per request (for Vercel)

// ─── KONFIGURASI DVR ─────────────────────────────────────────────────
const DVR_IP   = process.env.CCTV_IP   || '103.109.206.38';
const DVR_HTTP = process.env.CCTV_HTTP_PORT || '80';   // Port HTTP DVR (biasanya 80)
const DVR_USER = process.env.CCTV_USER || 'publik';
const DVR_PASS = process.env.CCTV_PASS || 'publik123';
// ─────────────────────────────────────────────────────────────────────

function basicAuth() {
  return 'Basic ' + Buffer.from(`${DVR_USER}:${DVR_PASS}`).toString('base64');
}

/** Coba berbagai format URL Dahua */
function buildUrls(ch: number, type: string): string[] {
  const base = `http://${DVR_IP}:${DVR_HTTP}`;
  const ch0  = ch - 1; // Beberapa DVR index dari 0

  if (type === 'stream') {
    return [
      `${base}/cgi-bin/mjpg/video.cgi?channel=${ch}&subtype=1`,
      `${base}/cgi-bin/snapshot.cgi?channel=${ch}`,              // fallback ke snapshot
      `${base}/video${ch}.mjpg`,
      `${base}/mjpg/video.cgi?channel=${ch}&subtype=1`,
    ];
  }

  // Snapshot URLs (Dahua berbagai firmware)
  return [
    `${base}/cgi-bin/snapshot.cgi?channel=${ch}`,
    `${base}/cgi-bin/snapshot.cgi?chn=${ch0}&type=4`,
    `${base}/cgi-bin/snapshot.cgi?chn=${ch}&type=4`,
    `${base}/cgi-bin/snapshot.cgi?channel=${ch0}`,
    `${base}/ISAPI/Streaming/channels/${ch}01/picture`,
    `${base}/onvif-http/snapshot?cam=${ch}`,
    `${base}/snap.jpg?cam=${ch}&user=${DVR_USER}&pwd=${DVR_PASS}`,
  ];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ch   = Math.min(Math.max(parseInt(searchParams.get('ch') || '1'), 1), 16);
  const type = searchParams.get('type') === 'stream' ? 'stream' : 'snapshot';

  const urls = buildUrls(ch, type);
  const authHeader = basicAuth();

  let lastErr = '';

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const resp = await fetch(url, {
        headers: {
          'Authorization': authHeader,
          'User-Agent': 'Mozilla/5.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!resp.ok) {
        lastErr = `HTTP ${resp.status} from ${url}`;
        continue;
      }

      const contentType = resp.headers.get('content-type') || 'image/jpeg';

      // Streaming: pipe langsung ke client
      if (type === 'stream' && resp.body) {
        return new Response(resp.body, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Access-Control-Allow-Origin': '*',
            'X-DVR-URL': url,
          },
        });
      }

      // Snapshot: buffer, kirim sebagai image
      const buf = await resp.arrayBuffer();
      return new Response(buf, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Access-Control-Allow-Origin': '*',
          'X-DVR-URL': url,
        },
      });

    } catch (e: any) {
      lastErr = e.message || String(e);
      continue;
    }
  }

  // Semua URL gagal — kembalikan error image
  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
      <rect width="640" height="360" fill="#07111e"/>
      <text x="320" y="155" text-anchor="middle" fill="#2d4263" font-family="monospace" font-size="48">⚠</text>
      <text x="320" y="200" text-anchor="middle" fill="#2d4263" font-family="monospace" font-size="14">CH ${ch} — Tidak dapat terhubung ke DVR</text>
      <text x="320" y="224" text-anchor="middle" fill="#1a2d45" font-family="monospace" font-size="11">${lastErr.slice(0, 80)}</text>
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
