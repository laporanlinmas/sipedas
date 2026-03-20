// ================================================================
//  api.js — Helper fetch ke GAS Backend
//  Ganti: google.script.run.withSuccessHandler(fn).namaFungsi(payload)
//  Jadi : apiGet('action', params).then(fn) / apiPost('action', payload).then(fn)
// ================================================================

var API_BASE_URL = 'https://script.google.com/macros/s/AKfycbzAEfh3QcfsgGVgRSiq7QVXwDCP0ATzRcsyuMjbyE5t7zJUquk4Ms_bc3Mc0MLRf8NZ/exec';
var API_KEY      = 'BASITH';

// Titik akhir proxy — jalan di server Vercel, tidak kena CORS
var PROXY_URL = '/api/proxy';

/**
 * GET request via proxy
 * Contoh: apiGet('getDashboard').then(function(data){ ... })
 */
function apiGet(action, params) {
  params = params || {};
  var query = new URLSearchParams({ action: action });
  Object.keys(params).forEach(function(k) {
    if (params[k] !== undefined && params[k] !== null) {
      query.set(k, params[k]);
    }
  });
  return fetch(PROXY_URL + '?' + query.toString())
    .then(function(res) { return res.json(); })
    .catch(function(e) {
      console.error('apiGet error:', e);
      return { success: false, message: e.message };
    });
}

/**
 * POST request via proxy
 * Contoh: apiPost('login', { username: 'admin', password: 'admin' }).then(fn)
 */
function apiPost(action, payload) {
  payload = payload || {};
  return fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ action: action }, payload))
  })
    .then(function(res) { return res.json(); })
    .catch(function(e) {
      console.error('apiPost error:', e);
      return { success: false, message: e.message };
    });
}

