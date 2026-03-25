# SI-PEDAS Mobile 📱

**Sistem Informasi Pedestrian Satlinmas** — Aplikasi web mobile untuk Pelaporan patroli pedestrian Satlinmas, dilengkapi watermark otomatis, GPS EXIF, QR Code, dan integrasi Google Drive + Spreadsheet.

[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![GAS](https://img.shields.io/badge/Backend-Google_Apps_Script-4285F4?logo=google)](https://script.google.com)
[![Version](https://img.shields.io/badge/Versi-1.0-blue)]()

---

## Daftar Isi

- [Fitur](#fitur)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Struktur File](#struktur-file)
- [Prasyarat](#prasyarat)
- [Setup Backend — Google Apps Script](#setup-backend--google-apps-script)
- [Setup Frontend — Vercel](#setup-frontend--vercel)
- [Konfigurasi Environment Variables](#konfigurasi-environment-variables)
- [Cara Penggunaan](#cara-penggunaan)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## Fitur

| Fitur | Keterangan |
|-------|-----------|
| 📷 **Watermark Kamera** | Cap otomatis: nama jalan (geocode), waktu EXIF, koordinat GPS, QR Code Google Maps, logo Satlinmas |
| 🖼️ **Watermark Galeri** | Cap otomatis menggunakan lokasi manual dari pengaturan |
| 📡 **GPS EXIF** | Baca koordinat langsung dari metadata foto kamera |
| 🗺️ **Geocoding** | Konversi koordinat GPS → nama jalan via Nominatim + Overpass API |
| 📦 **Kompresi Otomatis** | Foto > 1 MB dikompres otomatis hingga ≤ 1 MB |
| 💾 **Simpan Draft** | Upload foto kamera ke Google Drive sementara, bisa dimuat ulang kapan saja |
| ☁️ **Load Draft** | Pulihkan foto + teks laporan dari sesi sebelumnya |
| 📊 **Spreadsheet** | Data laporan tersimpan otomatis ke Google Sheets |
| 🔒 **API Key Auth** | Autentikasi via Script Properties GAS — tidak hardcode di kode |
| 📱 **Mobile-first** | Dioptimalkan untuk HP Android/iOS, PWA-ready |

---

## Arsitektur Sistem

```
Browser (Vercel)
      │
      │  fetch('/api/proxy')
      ▼
Vercel Serverless Function
  api/proxy.js
      │
      │  POST/GET + API Key
      │  redirect: manual → follow (handle GAS 302)
      ▼
Google Apps Script
  Code.gs — doGet / doPost
      │
      ├── Google Drive  (upload foto, folder per tanggal)
      └── Google Sheets (INPUT, DETAIL_FOTO, DRAFT_TEMP)
```

> **Kenapa pakai proxy?** Google Apps Script mengembalikan redirect 302 yang mengubah POST menjadi GET jika diakses langsung dari browser (CORS). Proxy Vercel menangani redirect secara manual sehingga `doPost()` di GAS selalu terpanggil dengan benar.

---

## Struktur File

```
/
├── index.html              # UI utama (mobile-first)
├── vercel.json             # Konfigurasi Vercel (routing + headers keamanan)
├── css/
│   └── style.css           # Semua styling
├── js/
│   ├── api.js              # Helper fetch ke proxy (/api/proxy)
│   └── mobile.js           # Logika utama: EXIF, watermark, draft, submit
└── api/
    └── proxy.js            # Vercel Serverless Function — forward ke GAS
```

---

## Prasyarat

- Akun **Google** (untuk GAS, Drive, Sheets)
- Akun **Vercel** (gratis, untuk hosting frontend + proxy)
- Akun **GitHub** (untuk deploy ke Vercel)
- Google Drive folder & Spreadsheet yang sudah disiapkan (lihat bagian Setup)

---

## Setup Backend — Google Apps Script

### 1. Buat Google Apps Script Project

Buka [script.google.com](https://script.google.com) → **New project** → ganti nama project menjadi `SI-PEDAS`.

### 2. Upload `Code.gs`

Hapus isi default, tempel seluruh isi `Code.gs` dari repository ini.

### 3. Sesuaikan konstanta di `Code.gs`

```javascript
const FOLDER_UTAMA_ID      = "ID_FOLDER_DRIVE_ANDA";
const SPREADSHEET_UTAMA_ID = "ID_SPREADSHEET_UTAMA_ANDA";
const SPREADSHEET_DRAFT_ID = "ID_SPREADSHEET_DRAFT_ANDA";
```

Cara mendapatkan ID:
- **Folder Drive**: buka folder di browser → ambil bagian terakhir URL: `drive.google.com/drive/folders/`**`INI_ID_NYA`**
- **Spreadsheet**: buka spreadsheet → ambil dari URL: `docs.google.com/spreadsheets/d/`**`INI_ID_NYA`**`/edit`

### 4. Set API Key di Script Properties

Di GAS Editor:
1. Klik ikon ⚙️ **Project Settings** (sidebar kiri)
2. Scroll ke bawah → **Script Properties**
3. Klik **Add row**
4. Property: `API_KEY` | Value: kata sandi bebas (contoh: `sipedas2025`)
5. Klik **Save script properties**

> ⚠️ Catat nilai `API_KEY` ini — akan dipakai di Vercel Environment Variables.

### 5. Setup Sheet (opsional)

Buka spreadsheet utama → menu **⚙️ LINMAS App** → **🛠️ Setup Sheet INPUT**

### 6. Deploy sebagai Web App

1. Klik **Deploy** → **New deployment**
2. Pilih type: **Web app**
3. Konfigurasi:
   - **Execute as**: Me
   - **Who has access**: **Anyone** *(wajib, bukan "Anyone with Google account")*
4. Klik **Deploy** → **Authorize access** → copy **URL deployment**

> ⚠️ Setiap kali `Code.gs` diubah, **buat deployment baru** (bukan edit yang lama). URL deployment baru berbeda dari yang lama.

---

## Setup Frontend — Vercel

### 1. Fork / Clone Repository

```bash
git clone https://github.com/username/si-pedas.git
cd si-pedas
```

### 2. Push ke GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 3. Import ke Vercel

1. Buka [vercel.com](https://vercel.com) → **Add New Project**
2. Import repository dari GitHub
3. Biarkan semua setting default → **Deploy**

### 4. Set Environment Variables

Di Vercel Dashboard → project → **Settings** → **Environment Variables**:

| Key | Value |
|-----|-------|
| `GAS_URL` | URL deployment GAS dari langkah 6 di atas |
| `API_KEY` | Nilai yang sama dengan Script Properties GAS |

Setelah menambah env var → **Deployments** → klik deployment terbaru → **Redeploy**.

---

## Konfigurasi Environment Variables

| Variable | Wajib | Keterangan |
|----------|-------|-----------|
| `GAS_URL` | ✅ | URL Web App deployment GAS (`https://script.google.com/macros/s/.../exec`) |
| `API_KEY` | ✅ | Kata sandi yang sama dengan Script Properties GAS |

---

## Cara Penggunaan

### Kirim Laporan

1. **Isi teks laporan** — tempel dari WhatsApp. Format yang dikenali:
   ```
   Patroli Jl. Basuki Rahmat Sebagai
   Hari    : Senin
   Tanggal : 10 Maret 2025
   Identitas / Nama Pelanggaran
   NIHIL
   Personil yang terlibat : Budi, Andi
   Pelaksanaan: 08.00 - 10.00
   Danru 1 (Ahmad Fauzi)
   ```
2. **Ambil foto** via tombol **Kamera** (EXIF GPS + QR) atau **Galeri** (watermark manual)
3. Tekan **KIRIM LAPORAN**

### Simpan & Load Draft

- Tekan **Simpan Draft** → foto kamera diupload ke Drive sementara
- Tekan **Load Draft** → pilih draft dari daftar → foto + teks dipulihkan
- Draft otomatis terhapus setelah laporan berhasil dikirim

### Pengaturan

Tekan ikon ⚙️ di kanan atas untuk:
- Toggle watermark kamera / galeri
- Toggle mini map lokasi
- Input lokasi manual (fallback jika GPS tidak tersedia)

---

## API Reference

Semua request dari frontend melalui `/api/proxy` (Vercel). Format:

### GET — `listDrafts`

```
GET /api/proxy?action=listDrafts
```

### POST — `submitLaporan`

```json
POST /api/proxy
{
  "action": "submitLaporan",
  "data": {
    "laporan": "Teks laporan...",
    "fotos": [{ "data": "base64...", "mime": "image/jpeg", "source": "camera" }],
    "exifMeta": [{ "hasGps": true, "lat": -7.8659, "lng": 111.4649, ... }],
    "draftId": "DRAFT-20250321-ABCD"
  }
}
```

### POST — `saveDraft`

```json
POST /api/proxy
{
  "action": "saveDraft",
  "data": {
    "laporan": "...",
    "fotos": [...],
    "exifMeta": [...],
    "draftId": null
  }
}
```

### POST — `loadDraft`

```json
POST /api/proxy
{ "action": "loadDraft", "draftId": "DRAFT-20250321-ABCD" }
```

### POST — `deleteDraft`

```json
POST /api/proxy
{ "action": "deleteDraft", "draftId": "DRAFT-20250321-ABCD" }
```

> `API_KEY` ditambahkan otomatis oleh `proxy.js` — tidak perlu disertakan dari frontend.

---

## Troubleshooting

### `API key tidak valid`

- Pastikan nilai `API_KEY` di Vercel **sama persis** dengan Script Properties GAS
- Tidak ada spasi tersembunyi — jalankan fungsi debug di GAS Editor:
  ```javascript
  function debugApiKey() {
    var key = PropertiesService.getScriptProperties().getProperty("API_KEY");
    Logger.log("[" + key + "] panjang: " + key.length);
  }
  ```
- Setelah edit env var di Vercel, wajib **Redeploy**

### GAS tidak mengembalikan JSON

- Pastikan deployment GAS menggunakan **Who has access: Anyone** (bukan "Anyone with Google account")
- Pastikan menggunakan **deployment baru** setelah ubah `Code.gs`
- Cek Vercel Function Logs: Dashboard → Functions → Logs → lihat `[proxy] GAS response:`

### `undefined` di alert setelah simpan draft

- Pastikan `mobile.js` versi terbaru (v1.0) sudah dipakai
- Verifikasi: response GAS harus `{ success: true, draftId: "...", ... }` tanpa wrapper `.data`

### Foto tidak muncul watermark nama jalan

- Pastikan kamera HP mengaktifkan GPS sebelum foto
- Pastikan izin lokasi diberikan ke browser
- Geocoding membutuhkan koneksi internet — jika timeout (5 detik), fallback ke koordinat

### Timeout saat submit laporan banyak foto

- Batas waktu Vercel Function adalah 30 detik (sudah dikonfigurasi di `vercel.json`)
- GAS juga memiliki batas 6 menit per eksekusi
- Kurangi jumlah foto atau pastikan koneksi internet stabil

---

## Informasi Aplikasi

| | |
|---|---|
| **Versi** | 1.0 |
| **Satuan** | Satlinmas Pedestrian |
| **Wilayah** | Ponorogo, Jawa Timur |
| **Author** | Ahmad Abdul Basith, S.Tr.I.P |
| **Kontak** | [085159686554](https://wa.me/6285159686554) |

---

## Lisensi

Hak cipta © 2025 Ahmad Abdul Basith. Dibuat untuk keperluan internal Satlinmas Pedestrian Ponorogo.
