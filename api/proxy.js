// ================================================================
//  api/proxy.js — Vercel Serverless Function
//  Fungsi: forward semua request dari frontend ke GAS backend
//  Cara kerja: Browser → Vercel (proxy ini) → GAS → balik ke browser
//  CORS tidak jadi masalah karena request ke GAS dilakukan server-side
// ================================================================

const GAS_URL = process.env.GAS_URL;   // set di Vercel Dashboard → Settings → Environment Variables
const API_KEY = process.env.API_KEY;   // set di Vercel Dashboard → Settings → Environment Variables

// ── Retry config ──────────────────────────────────────────
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;  // 1 detik
const FETCH_TIMEOUT_MS = 60000;    // 60 detik (GAS bisa lambat)

/** Exponential backoff retry helper */
async function fetchWithRetry(url, options, attempt = 0) {
  let timeoutId;
  try {
    // Tambah abort controller untuk timeout
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    
    const gasResponse = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return gasResponse;
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    
    // Jika timeout atau network error, retry dengan exponential backoff
    if ((err.name === 'AbortError' || err.message.includes('ECONNREFUSED') || err.message.includes('ETIMEDOUT')) && attempt < MAX_RETRIES) {
      const delayMs = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
      console.log(`[proxy] Retry attempt ${attempt + 1}/${MAX_RETRIES} setelah ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return fetchWithRetry(url, options, attempt + 1);
    }
    
    throw err;
  }
}

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
  console.log('[proxy] action:', req.method === 'GET' ? req.query.action : req.body?.action);

  try {
    let gasResponse;

    if (req.method === 'GET') {
      // Forward GET request — tambahkan API key ke query params
      const params = new URLSearchParams(req.query);
      params.set('key', API_KEY);
      const url = `${GAS_URL}?${params.toString()}`;

      console.log(`[proxy] GET ke GAS dengan retry (max ${MAX_RETRIES} kali)`);

      gasResponse = await fetchWithRetry(url, {
        method: 'GET',
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

      console.log(`[proxy] POST ke GAS dengan retry (max ${MAX_RETRIES} kali)`);

      const postBody = JSON.stringify({ ...body, key: API_KEY });

      gasResponse = await fetchWithRetry(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'follow',
        body: postBody,
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
    console.error('[proxy] Fetch error setelah retries:', err.message);
    
    // Bedakan antara timeout dan error lain
    if (err.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        message: `Server GAS timeout (>60 detik). Coba lagi dalam beberapa saat.`
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Proxy error: ' + err.message
    });
  }
}
