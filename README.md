# SI-PEDAS Frontend — Panduan Deploy ke Vercel

## Struktur Folder

```
si-pedas/
├── index.html          ← halaman utama (sudah dikonversi)
├── vercel.json         ← konfigurasi Vercel
├── css/
│   └── style.css       ← salin dari file CSS kamu (isi antara <style>...</style>)
└── js/
    ├── api.js          ← helper fetch (ISI URL GAS DULU!)
    ├── ui.js           ← logic UI utama (sudah dikonversi)
    ├── laporan.js      ← logic laporan/rekap (sudah dikonversi)
    ├── peta-patch.js   ← fungsi peta yang sudah dikonversi
    └── peta.js         ← salin dari js-peta.js ASLI, lalu:
                           HAPUS 7 fungsi lama, GANTI dengan isi peta-patch.js
```

---

## Langkah 1 — Siapkan js/peta.js

File `js-peta.js` aslimu sangat panjang dan hanya 7 fungsi yang perlu diganti.
Cara termudah:

1. Salin seluruh isi `js-peta.js` asli → buat file baru `js/peta.js`
2. Di dalam file tersebut, **HAPUS** 7 fungsi berikut:
   - `refreshLeaflet`
   - `saveDrawings`
   - `loadDrawings`
   - `_loadLayerList`
   - `toggleLayerAktifUI`
   - `doHapusLayer`
   - `submitLayerForm`
3. **SALIN** semua isi `peta-patch.js` dan **TEMPEL** di akhir file `peta.js`
4. Hapus file `peta-patch.js` (sudah tidak diperlukan)

---

## Langkah 2 — Siapkan css/style.css

1. Buka file CSS kamu
2. Salin semua isi di antara tag `<style>` dan `</style>`
3. Simpan sebagai `css/style.css`

---

## Langkah 3 — Set URL GAS di api.js

Buka `js/api.js`, cari baris:
```js
var API_BASE_URL = 'GANTI_DENGAN_URL_GAS_KAMU';
```
Ganti dengan URL GAS yang sudah kamu deploy, contoh:
```js
var API_BASE_URL = 'https://script.google.com/macros/s/AKfycbXXXXX/exec';
```

---

## Langkah 4 — Deploy ke Vercel

### Cara A: Drag & Drop (paling mudah)
1. Buka https://vercel.com → New Project
2. Drag folder `si-pedas/` ke halaman Vercel
3. Klik Deploy

### Cara B: Via GitHub
1. Push folder ke GitHub repo
2. Import repo di Vercel
3. Klik Deploy

---

## Langkah 5 — Test

Buka URL Vercel yang diberikan, lalu test:
- Login dengan username `admin` / password `admin`
- Dashboard, Rekap, Peta

---

## ⚠️ Masalah CORS

Jika browser menolak request ke GAS (error CORS), ada 2 solusi:

**Solusi A (Mudah):** Tambahkan parameter `mode: 'no-cors'` — tapi response tidak bisa dibaca.

**Solusi B (Benar):** GAS Web App secara default mengirim header CORS untuk request sederhana.
Pastikan GAS kamu di-deploy dengan setting:
- Execute as: **Me**
- Who has access: **Anyone**

Jika masih error, gunakan proxy Vercel seperti yang dijelaskan di panduan sebelumnya.

---

## Ringkasan Perubahan

| File GAS (Lama) | File Vercel (Baru) | Perubahan |
|---|---|---|
| `index.html` (GAS template) | `index.html` | Hapus `<?!= include() ?>`, ganti dengan `<link>` dan `<script src="">` |
| Embedded dalam HTML | `css/style.css` | Pisah jadi file sendiri |
| `js-ui.js` | `js/ui.js` | Ganti `google.script.run` → `apiPost/apiGet` |
| `js-laporan.js` | `js/laporan.js` | Ganti `google.script.run` → `apiPost/apiGet` |
| `js-peta.js` | `js/peta.js` | Ganti 7 fungsi saja |
| _(tidak ada)_ | `js/api.js` | File baru: helper `fetch()` |
| _(tidak ada)_ | `vercel.json` | Konfigurasi routing Vercel |
