# SI-PEDAS Mobile 📱

**Sistem Informasi Pedestrian Satlinmas** — Aplikasi Next.js App Router untuk Pelaporan patroli pedestrian Satlinmas, dilengkapi watermark otomatis, GPS EXIF, QR Code, dan integrasi Google Drive + Spreadsheet tingkat lanjut.

[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![Next.js](https://img.shields.io/badge/Backend-Next.js_Native-000000?logo=nextdotjs)](https://nextjs.org)
[![Version](https://img.shields.io/badge/Versi-2.0-green)]()

---

## Daftar Isi

- [Fitur](#fitur)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Struktur File](#struktur-file)
- [Prasyarat](#prasyarat)
- [Setup Backend — Google Cloud SDK](#setup-backend--google-cloud-sdk)
- [Setup Frontend & API — Vercel](#setup-frontend--api--vercel)
- [Konfigurasi Environment Variables](#konfigurasi-environment-variables)
- [Cara Penggunaan](#cara-penggunaan)
- [Troubleshooting](#troubleshooting)

---

## Fitur

| Fitur | Keterangan |
|-------|-----------|
| 📷 **Watermark Kamera** | Cap otomatis: nama jalan (geocode), waktu EXIF, koordinat GPS, QR Code Google Maps, logo Satlinmas |
| 🖼️ **Watermark Galeri** | Cap otomatis menggunakan lokasi manual dari pengaturan |
| 📡 **GPS EXIF** | Baca koordinat langsung dari metadata foto kamera |
| 🗺️ **Geocoding** | Konversi koordinat GPS → nama jalan via Nominatim + Overpass API |
| 📦 **Kompresi Otomatis** | Foto dioptimalkan secara otomatis sebelum upload |
| 💾 **Simpan Draft** | Upload foto kamera ke Google Drive sementara, bisa dimuat ulang kapan saja |
| ☁️ **Load Draft** | Pulihkan foto + teks laporan dari sesi sebelumnya (Full TypeScript) |
| 📊 **Spreadsheet** | Data laporan tersimpan otomatis ke Google Sheets (Single Spreadsheet Mode) |
| 🔒 **Service Account** | Autentikasi aman via Google Cloud Service Account JSON |
| 📱 **Next.js 14+** | Dibangun dengan Next.js App Router yang super cepat dan modern |

---

## Arsitektur Sistem

```
Browser (Frontend)
      │
      │  fetch('/api/proxy') -> Interal Backend
      ▼
Next.js API Route (Server)
  src/app/api/proxy/route.ts
      │
      │  Google Auth (Service Account)
      │  Google APIs Node.js Client
      ▼
Google Cloud Services
      │
      ├── Google Drive  (upload foto, folder per tanggal)
      └── Google Sheets (INPUT, Detail Foto, Draft Temp, Teks Laporan)
```

> **Catatan Migration**: Sekarang backend berjalan langsung di dalam Next.js menggunakan library `googleapis`. Tidak lagi memerlukan *deployment* Google Apps Script (GAS) secara terpisah.

---

## Struktur File

```
/
├── src/
│   ├── app/
│   │   └── api/proxy/route.ts   # Endpoint tunggal untuk semua aksi backend
│   ├── lib/
│   │   ├── server/              # Modul backend (Auth, Drive, Sheets, Parser)
│   │   └── ...                  # Modul frontend (watermark, exif, idb)
│   └── components/              # React components
├── public/                      # Aset statis & logo
└── package.json                 # Dependensi (googleapis, next, react)
```

---

## Prasyarat

- **Google Cloud Project**: Untuk membuat Service Account.
- **Service Account JSON**: Kunci akses untuk Drive & Sheets.
- **Node.js 18+**: Untuk menjalankan project secara lokal.
- **Vercel Account**: Untuk hosting produksi.

---

## Setup Backend — Google Cloud SDK

### 1. Buat Service Account
1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Aktifkan **Google Drive API** dan **Google Sheets API**.
3. Buka **IAM & Admin** -> **Service Accounts**.
4. Klik **Create Service Account**, beri nama (misal: `sipedas-backend`).
5. Klik akun tersebut -> Tab **Keys** -> **Add Key** -> **Create new key** (pilih **JSON**).
6. Simpan file JSON tersebut.

### 2. Beri Izin Akses (PENTING!)
1. Buka Spreadsheet Utama dan Folder Drive Utama Anda.
2. Klik tombol **Share**.
3. Tambahkan email Service Account Anda (misal: `...-backend@...iam.gserviceaccount.com`) sebagai **Editor**.

---

## Setup Frontend & API — Vercel

### 1. Konfigurasi Environment Variables
Di Vercel Dashboard atau file `.env.local`, masukkan variabel berikut:

| Key | Value |
|-----|-------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Salin seluruh isi file JSON Service Account Anda |
| `GOOGLE_CLIENT_ID` | OAuth2 Client ID (Untuk solusi kuota Drive) |
| `GOOGLE_CLIENT_SECRET` | OAuth2 Client Secret |
| `GOOGLE_REFRESH_TOKEN` | OAuth2 Refresh Token |
| `SPREADSHEET_UTAMA_ID` | ID Spreadsheet Utama (ambil dari URL) |
| `FOLDER_UTAMA_ID` | ID Folder Drive Utama (ambil dari URL) |

### 2. Pilihan Autentikasi
Aplikasi ini mendukung dua metode:
- **OAuth2 (Direkomendasikan)**: Menghindari error "Storage Quota Exceeded" karena menggunakan kuota akun pribadi (15GB+).
- **Service Account**: Cocok jika Anda menggunakan Shared Drive (Team Drive).

### 3. Instalasi Dependensi
Jalankan perintah berikut di terminal lokal Anda:
```bash
npm install
npm install googleapis google-auth-library
```

---

## Konfigurasi Spreadsheet
Aplikasi ini sekarang menggunakan satu spreadsheet tunggal dengan tab-tab berikut:
- **`INPUT`**: Untuk data utama laporan.
- **`Detail Foto`**: Untuk log detail per foto (GPS, EXIF, Alamat).
- **`Draft Temp`**: Untuk menyimpan data draft sementara.
- **`Teks Laporan`**: Untuk backup teks laporan asli.

---

## Cara Penggunaan

### Kirim Laporan
1. **Isi teks laporan** — tempel dari WhatsApp.
2. **Ambil foto** — Klik Tombol Kamera (Watermark otomatis + GPS).
3. **Submit** — Tekan tombol Kirim. Laporan akan masuk ke Sheets dan Foto ke Drive.

### Simpan & Load Draft
- **Simpan**: Tekan "Simpan Draft" untuk mengunggah foto kamera ke folder `DRAFT` di Google Drive.
- **Load**: Pilih draft dari daftar untuk memulihkan foto dan teks.

---

## Troubleshooting

### `Missing GOOGLE_SERVICE_ACCOUNT_JSON`
- Pastikan variabel lingkungan sudah diatur dengan benar di Vercel atau `.env.local`.
- Jika menggunakan Vercel, pastikan sudah melakukan *Redeploy* setelah mengubah *Environment Variables*.

### `Permission Denied` (403)
- Pastikan email Service Account sudah di-share ke Folder Drive dan Spreadsheet sebagai **Editor**.

### Error saat Upload Foto Besar
- Vercel Hobby plan memiliki batas waktu eksekusi (timeout) 10-60 detik. Gunakan foto yang sudah dikompres atau tingkatkan ke plan Pro jika diperlukan.

---

## Informasi Aplikasi

| | |
|---|---|
| **Versi** | 2.0 (Native TypeScript) |
| **Satuan** | Satlinmas Pedestrian |
| **Wilayah** | Ponorogo, Jawa Timur |
| **Author** | Ahmad Abdul Basith, S.Tr.I.P |

---

## Lisensi

Hak cipta © 2026 Ahmad Abdul Basith. Dibuat untuk keperluan internal Satlinmas Pedestrian Ponorogo.
orogo, Jawa Timur |
| **Author** | Ahmad Abdul Basith, S.Tr.I.P |
| **Kontak** | [085159686554](https://wa.me/6285159686554) |

---

## Lisensi

Hak cipta © 2025 Ahmad Abdul Basith. Dibuat untuk keperluan internal Satlinmas Pedestrian Ponorogo.
