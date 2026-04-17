"use client";

import { useAppContext } from './AppContext';
import { apiPost, apiGet, parallelLimit } from './api';
import { idbMetaDel, IDB_TEKS_KEY, idbDeletePhoto } from './idb';
import { fmtExifTime } from './exif-parser';

const UPLOAD_MAX_RETRIES = 1   // retry secukupnya agar tidak menambah antrian panjang
const RETRY_DELAY_MS     = 300 // jeda retry ringan

function getAdaptiveConcurrency() {
  const nav: any = navigator as any;
  const mem = nav?.deviceMemory || 4;
  const et = nav?.connection?.effectiveType || '';
  if (et === '2g' || et === 'slow-2g') return 2;
  if (et === '3g') return 3;
  if (mem <= 2) return 3;
  if (mem <= 4) return 5;
  return 7;
}

export function useSubmitHandler() {
  const {
    photos, reportText, activeDraftId,
    setActiveDraftId, setPhotos, setReportText,
    showAlert, showLoadingOverlay, hideLoadingOverlay, setLoadingProgress
  } = useAppContext();

  const submitData = async () => {
    if (!reportText.trim()) {
      showAlert('error', 'Laporan Kosong', 'Isi teks laporan terlebih dahulu.<br><small style="color:var(--muted)">Tempel dari WhatsApp.</small>');
      return;
    }
    if (!photos.length) {
      showAlert('warn', 'Foto Belum Ada', 'Lampirkan minimal <b>1 foto</b> dokumentasi.');
      return;
    }
    if (photos.some(f => f.processing)) {
      showAlert('warn', 'Foto Masih Diproses', 'Tunggu sebentar, semua foto selesai diproses.');
      return;
    }

    const btn = document.getElementById('sub-btn') as HTMLButtonElement | null;
    if (btn) btn.disabled = true;

    const totalFoto = photos.length;
    showLoadingOverlay('submit', 'Mengirim Laporan...', `Mempersiapkan ${totalFoto} foto...`);
    setLoadingProgress(0, 5, `Siap upload ${totalFoto} foto...`);
    apiGet('ping', {}).catch(() => {}); // Warm-up GAS


    // ── Siapkan metadata EXIF
    const exifMetas = photos.map(f => {
      if (!f.exif) return null;
      return {
        hasGps   : !!(f.exif?.gps),
        lat      : f.exif?.gps?.lat ?? null,
        lng      : f.exif?.gps?.lng ?? null,
        datetime : fmtExifTime(f.exif),
        address  : f.exifAddr?.full ?? null,
        source   : f.source,
      };
    });

    // ── Upload setiap foto secara PARALEL (max 3 sekaligus) ──────────────
    // Tracking hasil upload per-index
    const linkFoto: (any | null)[] = new Array(totalFoto).fill(null);
    let   folderUrl = '';

    // Progress yang nampak seolah berurutan 1-2-3 padahal paralel
    let uploadedCount = 0;
    const updateUploadProgress = () => {
      uploadedCount++;
      const pct = 10 + Math.round((uploadedCount / totalFoto) * 70);
      if (uploadedCount < totalFoto) {
        setLoadingProgress(1, pct, `Mengupload foto ${uploadedCount + 1} dari ${totalFoto}...`);
      } else {
        setLoadingProgress(1, pct, `Semua ${totalFoto} foto berhasil diupload...`);
      }
    };

    setLoadingProgress(1, 10, `Mengupload foto 1 dari ${totalFoto}...`);

  const uploadConcurrency = getAdaptiveConcurrency();
    const uploadResults = await parallelLimit(
      photos,
      async (i: number, f: import('./types').PhotoData) => {
        // Retry per foto
        let lastErr: any = null;
        for (let retry = 0; retry <= UPLOAD_MAX_RETRIES; retry++) {
          if (retry > 0) {
            await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
          }
          try {
            const res = await apiPost('uploadFoto', {
              data: {
                foto       : { data: f.data, mime: f.mime, source: f.source },
                meta       : exifMetas[i] || null,
                laporan    : reportText,
                noFoto     : i + 1,
                jumlahTotal: totalFoto,
              },
              requestId: `upload-${Date.now()}-${i}`,
            });
            if (res?.success) {
              if (!folderUrl && res.folderUrl) folderUrl = res.folderUrl;
              updateUploadProgress();
              return { link: res.linkFile, namaFile: res.namaFile, source: f.source, meta: exifMetas[i] || null };
            }
            lastErr = new Error(res?.message || `Foto ${i + 1} gagal diupload.`);
          } catch (e: any) {
            lastErr = e;
          }
        }
        throw lastErr || new Error(`Gagal upload foto ${i + 1} setelah ${UPLOAD_MAX_RETRIES} retry.`);
      },
      uploadConcurrency
    );

    // Cek apakah ada foto yang gagal
    const failedIdx = uploadResults.findIndex(r => r instanceof Error);
    if (failedIdx !== -1) {
      const failErr = uploadResults[failedIdx] as Error;
      hideLoadingOverlay();
      if (btn) btn.disabled = false;
      showAlert('error', `Gagal Upload Foto ${failedIdx + 1}`, failErr.message + '<br><small>Periksa koneksi dan coba lagi.</small>');
      return;
    }
    uploadResults.forEach((r, i) => { linkFoto[i] = r; });

    // ── Kirim data laporan ke Spreadsheet ────────────────────────────────
    setLoadingProgress(2, 85, 'Menyimpan ke Spreadsheet...');
    try {
      const res = await apiPost('submitLaporan', {
        data: {
          laporan  : reportText,
          linkFoto : linkFoto.filter(Boolean),
          folderUrl,
          jumlahFoto: linkFoto.filter(Boolean).length,
          draftId  : activeDraftId,
        },
        requestId: `submit-${Date.now()}`,
      });
      if (!res.success) throw new Error(res.message || 'Server error.');

      setLoadingProgress(3, 100, 'Selesai!');
      await new Promise(r => setTimeout(r, 500));

      hideLoadingOverlay();
      if (btn) btn.disabled = false;

      // Bersihkan state
      setReportText('');
      idbMetaDel(IDB_TEKS_KEY);
      for (const f of photos) {
        if (f.source === 'camera' && f.idbKey !== null && f.idbKey !== undefined) {
          idbDeletePhoto(f.idbKey);
        }
      }
      setPhotos([]);
      setActiveDraftId(null);

      showAlert('success', 'Laporan Terkirim! 🎉',
        `Laporan beserta <b>${totalFoto}</b> foto berhasil disimpan ke sistem.`);

    } catch (err: any) {
      hideLoadingOverlay();
      if (btn) btn.disabled = false;
      showAlert('error', 'Gagal Simpan Laporan', err.message || 'Periksa koneksi dan coba lagi.');
    }
  };

  return { submitData };
}
