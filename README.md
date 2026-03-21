# 🛡️ SI-PEDAS
### Sistem Informasi Pedestrian Satlinmas

> Dashboard monitoring resmi untuk kegiatan patroli pedestrian Satuan Perlindungan Masyarakat (Satlinmas) — Bidang SDA dan Linmas.

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 📊 **Dashboard** | Statistik & grafik data patroli real-time |
| 📋 **Rekap Laporan** | Tabel rekap seluruh laporan kegiatan |
| ✏️ **Input & Edit Laporan** | Form input dan edit data laporan patroli |
| 👥 **Data Satlinmas** | Manajemen data anggota Satlinmas |
| 🗺️ **Peta Pedestrian** | Visualisasi peta area patroli dengan layer interaktif |
| 🖨️ **Cetak Laporan** | Generate PDF laporan individual & kolektif dengan kop surat resmi |

---

## ⚙️ Konfigurasi Environment Variables

Sebelum deploy, buka **Vercel Dashboard → Project → Settings → Environment Variables** dan tambahkan dua variabel berikut:

### 1. `GAS_URL`
URL deploy dari Google Apps Script yang menjadi backend/API.

```
GAS_URL = https://script.google.com/macros/s/XXXXX.../exec
```

> Cara mendapatkan: buka project Google Apps Script → **Deploy → Manage deployments → Copy URL**

---

### 2. `API_KEY`
Kunci autentikasi untuk keamanan request ke GAS backend.

```
API_KEY = BASITH
```

> ⚠️ Jangan pernah hard-code nilai ini langsung di kode. Selalu gunakan environment variable.

---

### Cara Menambahkan di Vercel

1. Buka [vercel.com](https://vercel.com) → login → pilih project **SI-PEDAS**
2. Klik tab **Settings**
3. Klik menu **Environment Variables** di sidebar kiri
4. Klik **Add New**
5. Isi **Key** dan **Value** sesuai tabel di atas
6. Centang environment: ✅ Production &nbsp; ✅ Preview &nbsp; ✅ Development
7. Klik **Save**
8. **Redeploy** project agar perubahan aktif

```
Settings → Environment Variables → Add New
┌─────────────┬──────────────────────────────────────────────┐
│ Key         │ Value                                        │
├─────────────┼──────────────────────────────────────────────┤
│ GAS_URL     │ https://script.google.com/macros/s/xxx/exec  │
│ API_KEY     │ BASITH                                       │
└─────────────┴──────────────────────────────────────────────┘
```

---

## 🗂️ Struktur Project

```
si-pedas/
├── index.html          # Halaman utama (SPA)
├── vercel.json         # Konfigurasi Vercel (routing + security headers)
├── css/
│   └── style.css       # Stylesheet utama
├── js/
│   ├── api.js          # Handler komunikasi ke GAS backend
│   ├── ui.js           # Komponen UI & helper
│   ├── laporan.js      # Logika laporan (input, edit, cetak PDF)
│   └── peta.js         # Logika peta Leaflet & layer management
└── assets/
    ├── icon-32.png     # Favicon
    ├── icon-192.png    # PWA icon
    └── icon-full.png   # Logo sidebar & login
```

---

## 🚀 Deploy ke Vercel

```bash
# 1. Clone / download project
git clone https://github.com/username/si-pedas.git
cd si-pedas

# 2. Install Vercel CLI (opsional)
npm install -g vercel

# 3. Deploy
vercel --prod
```

Atau cukup **drag & drop** folder project ke [vercel.com/new](https://vercel.com/new).

---

## 🔐 Keamanan

Project ini dilengkapi security headers lengkap via `vercel.json`:

- `Strict-Transport-Security` — paksa HTTPS
- `X-Frame-Options: SAMEORIGIN` — cegah clickjacking
- `X-Content-Type-Options: nosniff` — cegah MIME sniffing
- `Content-Security-Policy` — batasi sumber resource yang diizinkan
- `Referrer-Policy` — kontrol data referrer
- `Permissions-Policy` — batasi akses kamera/mikrofon

---

## 🛠️ Teknologi

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Charts**: [Chart.js](https://www.chartjs.org/) v4.4
- **Icons**: [Font Awesome](https://fontawesome.com/) 6.5
- **Fonts**: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) + JetBrains Mono
- **Maps**: Leaflet.js
- **Backend**: Google Apps Script (GAS)
- **Hosting**: [Vercel](https://vercel.com)

---

## 👤 Hak Akses

| Role | Akses |
|---|---|
| **Admin** | Semua fitur termasuk edit & hapus data |
| **Operator** | Input laporan & lihat data |
| **Viewer** | Hanya lihat dashboard & rekap |

---

## 📄 Lisensi

© 2026 **Bidang SDA dan Linmas**. Sistem ini dikembangkan untuk keperluan internal instansi. Dilarang menggunakan, mendistribusikan, atau memodifikasi tanpa izin.

---

<p align="center">
  Dikembangkan dengan ❤️ untuk Satlinmas
</p>
