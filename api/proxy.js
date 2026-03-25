// ================================================================
//  api/proxy.js — Vercel Serverless Function
//  Fungsi: forward semua request dari frontend ke GAS backend
//  Cara kerja: Browser → Vercel (proxy ini) → GAS → balik ke browser
//  CORS tidak jadi masalah karena request ke GAS dilakukan server-side
// ================================================================

const GAS_URL = process.env.GAS_URL;   // set di Vercel Dashboard → Settings → Environment Variables
const API_KEY = process.env.API_KEY;   // set di Vercel Dashboard → Settings → Environment Variables

export default async function handler(req, res) {

  // Izinkan semua origin (karena ini proxy internal)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ── Validasi env var sebelum dipakai ──────────────────
  if (!GAS_URL) {
    console.error('[proxy] GAS_URL env var tidak terset!');
    return res.status(500).json({
      success: false,
      message: 'Konfigurasi server belum lengkap: GAS_URL tidak terset di Vercel Environment Variables.'
    });
  }
  if (!API_KEY) {
    console.error('[proxy] API_KEY env var tidak terset!');
    return res.status(500).json({
      success: false,
      message: 'Konfigurasi server belum lengkap: API_KEY tidak terset di Vercel Environment Variables.'
    });
  }

  // ── Debug log ───────────────
  console.log('[proxy] method:', req.method);
  console.log('[proxy] GAS_URL ada:', !!GAS_URL);
  console.log('[proxy] API_KEY ada:', !!API_KEY);

  try {
    let gasResponse;

    if (req.method === 'GET') {
      // Forward GET request — tambahkan API key ke query params
      const params = new URLSearchParams(req.query);
      params.set('key', API_KEY);
      const url = `${GAS_URL}?${params.toString()}`;

      console.log('[proxy] GET ke GAS, action:', req.query.action);

      gasResponse = await fetch(url, {
        method: 'GET',
        // ── Ikuti redirect GAS (penting!) ──────────────
        redirect: 'follow',
      });

    } else if (req.method === 'POST') {
      // Forward POST request — tambahkan API key ke body

      // ── Pastikan req.body sudah ter-parse ───────────
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          return res.status(400).json({ success: false, message: 'Request body bukan JSON valid.' });
        }
      }
      if (!body || typeof body !== 'object') {
        body = {};
      }

      console.log('[proxy] POST ke GAS, action:', body.action);

      gasResponse = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ── Ikuti redirect GAS ─────────────────────────
        redirect: 'follow',
        body: JSON.stringify({ ...body, key: API_KEY }),
      });

    } else {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // ── Baca sebagai teks dulu, baru parse JSON ────────
    //    GAS kadang mengembalikan HTML (halaman error/redirect login)
    //    jika langsung .json() → crash dengan SyntaxError
    const rawText = await gasResponse.text();
    console.log('[proxy] GAS status:', gasResponse.status);
    console.log('[proxy] GAS response (100 char):', rawText.slice(0, 100));

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      // GAS mengembalikan HTML, bukan JSON
      // Kemungkinan: redirect ke login, GAS belum di-deploy, atau error di GAS
      console.error('[proxy] GAS tidak mengembalikan JSON. Raw:', rawText.slice(0, 500));
      return res.status(502).json({
        success: false,
        message: 'Server GAS tidak mengembalikan JSON. Pastikan GAS sudah di-deploy dengan akses "Anyone".',
        // hint hanya muncul bukan di production supaya tidak expose info sensitif
        ...(process.env.NODE_ENV !== 'production' && { gasPreview: rawText.slice(0, 300) })
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('[proxy] Fetch error:', err);
    return res.status(500).json({
      success: false,
      message: 'Proxy error: ' + err.message
    });
  }
}
