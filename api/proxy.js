// ================================================================
//  api/proxy.js — Vercel Serverless Function
//  Fungsi: forward semua request dari frontend ke GAS backend
//  Cara kerja: Browser → Vercel (proxy ini) → GAS → balik ke browser
//  CORS tidak jadi masalah karena request ke GAS dilakukan server-side
// ================================================================

const GAS_URL = process.env.GAS_URL;    // set di Vercel Dashboard
const API_KEY  = process.env.API_KEY;   // set di Vercel Dashboard

export default async function handler(req, res) {
  // Izinkan semua origin (karena ini proxy internal)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let gasResponse;

    if (req.method === 'GET') {
      // Forward GET request — tambahkan API key
      const params = new URLSearchParams(req.query);
      params.set('key', API_KEY);
      const url = `${GAS_URL}?${params.toString()}`;
      gasResponse = await fetch(url);

    } else if (req.method === 'POST') {
      // Forward POST request — tambahkan API key ke body
      const body = typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body;

      gasResponse = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, key: API_KEY })
      });

    } else {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const data = await gasResponse.json();
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Proxy error: ' + err.message
    });
  }
}
