"use client";

import { useState } from 'react';
import { useAppContext } from './AppContext';
import { apiGet, apiPost } from './api';
import { idbMetaSet, idbSavePhoto, IDB_TEKS_KEY } from './idb';
import { fmtExifTime } from './exif-parser';

interface DraftItem {
  draftId: string;
  timestamp: string;
  jumlahFoto: number;
  danru: string;
  teksPreview: string;
}

export function useDraftHandler() {
  const {
    photos, setPhotos,
    reportText, setReportText,
    activeDraftId, setActiveDraftId,
    showAlert,
    showLoadingOverlay, hideLoadingOverlay, setLoadingProgress
  } = useAppContext();

  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [draftList, setDraftList] = useState<DraftItem[]>([]);
  const [draftLoading, setSubDraftLoading] = useState(false); // local only for list loading
  const [savingDraft, setSavingDraft] = useState(false);       // Transfer button spinner
  const [draftLoadingMsg, setDraftLoadingMsg] = useState('');  // descriptive loading message

  const MAX = 10;

  /* ── Helper: hitung ukuran base64 ─────────────────────────── */
  function b64sz(d: string) {
    return Math.ceil(((d.split(',')[1] || '').length) * 3 / 4);
  }

  /* ── Helper: rebuild exif dari metadata draft ──────────────── */
  function rebuildExifFromMeta(meta: any) {
    if (!meta) return null;
    const exif: any = {};
    if (meta.hasGps && meta.lat && meta.lng)
      exif.gps = { lat: parseFloat(meta.lat), lng: parseFloat(meta.lng) };
    if (meta.datetime) exif.dto = meta.datetime;
    return Object.keys(exif).length ? exif : null;
  }

  /* ════════════════════════════════════════════════════════════
     SIMPAN DRAFT
  ════════════════════════════════════════════════════════════ */
  const saveDraft = async () => {
    const draftFotos = photos.filter(f => !f.processing);
    if (!draftFotos.length) {
      showAlert('warn', 'Tidak Ada Foto',
        'Draft mewajibkan minimal 1 foto.<br>Tambahkan minimal 1 foto terlebih dahulu.');
      return;
    }
    if (photos.some(f => f.processing)) {
      showAlert('warn', 'Foto Masih Diproses', 'Tunggu sebentar hingga semua foto selesai diproses.');
      return;
    }

    setSavingDraft(true);
    showLoadingOverlay('draft_save', 'Transfer Draft...', 'Mempersiapkan data...');
    setLoadingProgress(0, 15, 'Mempersiapkan metadata...');

    const exifMeta = draftFotos.map(f => {
      if (!f.exif) return { hasGps: false, lat: null, lng: null, datetime: null, address: null, source: f.source };
      return {
        hasGps: !!(f.exif && f.exif.gps),
        lat: f.exif?.gps?.lat ?? null,
        lng: f.exif?.gps?.lng ?? null,
        datetime: fmtExifTime(f.exif),
        address: f.exifAddr?.full ?? null,
        source: f.source
      };
    });

    const payloadInit = {
      laporan: (reportText || '').trim(),
      draftId: activeDraftId
    };

    try {
      const total = draftFotos.length;
      let progress = 10;
      setLoadingProgress(1, progress, `Mempersiapkan data teks...`);

      // 1. Inisiasi baris draft di server
      const reqSeed = Date.now();
      const resInit = await apiPost('saveDraft', { data: payloadInit, requestId: `save-draft-init-${reqSeed}` });
      if (!resInit.success) throw new Error(resInit.message || 'Gagal mempersiapkan draft server.');
      
      const newDraftId = resInit.draftId;
      setActiveDraftId(newDraftId);
      
      // 2. Upload setiap foto secara terpisah (chunked) untuk menghindari PayloadTooLarge
      for (let i = 0; i < total; i++) {
        const foto = draftFotos[i];
        
        // Update progress per foto
        progress = 15 + Math.round((i / total) * 75);
        setLoadingProgress(1, progress, `Transfer foto ${i + 1} dari ${total}...`);
        
        const payloadAppend = {
          draftId: newDraftId,
          foto: { data: foto.data, mime: foto.mime, source: foto.source },
          exifMeta: exifMeta[i] || {}
        };
        
        const resAppend = await apiPost('appendDraftFoto', { data: payloadAppend, requestId: `append-${newDraftId}-${i}` });
        if (!resAppend.success) throw new Error(resAppend.message || `Gagal transfer foto ${i + 1}`);
      }
      
      setLoadingProgress(2, 95, 'Finalisasi Database...');
      setLoadingProgress(3, 100, 'Berhasil!');
      await new Promise(r => setTimeout(r, 600));
      hideLoadingOverlay();
      setSavingDraft(false);

      showAlert('success', 'Transfer Berhasil! 🚀',
        `<b>${total}</b> foto berhasil ditransfer ke server.<br>` +
        `<small style="color:var(--muted)">ID: ${newDraftId}<br>Gunakan <b>Load & Hapus</b> untuk memuat sekaligus menghapus permanen dari server.</small>`);
    } catch (err: any) {
      setSavingDraft(false);
      hideLoadingOverlay();
      showAlert('error', 'Gagal Simpan Draft', err.message || 'Periksa koneksi dan coba lagi. (Catatan: batas maksimal 4.5MB per foto)');
    }
  };

  /* ════════════════════════════════════════════════════════════
     LOAD DRAFT LIST — buka modal & ambil daftar draft
  ════════════════════════════════════════════════════════════ */
  const loadDraftList = async () => {
    setDraftList([]);
    setDraftModalOpen(true);
    setSubDraftLoading(true);
    setDraftLoadingMsg('Menghubungi server...');

    try {
      const res = await apiGet('listDrafts');
      if (!res.success) throw new Error(res.message || 'Gagal memuat daftar draft.');
      const mapped = Array.isArray(res.drafts) ? res.drafts.map((d: any) => ({
        draftId: String(d?.draftId || ''),
        timestamp: String(d?.timestamp || '-'),
        jumlahFoto: Number(d?.jumlahFoto || 0),
        danru: String(d?.danru || '—'),
        teksPreview: String(d?.teksPreview || '(Belum ada teks laporan)')
      })).filter((d: DraftItem) => d.draftId) : [];
      setDraftList(mapped);
      setDraftLoadingMsg('');
    } catch (err: any) {
      showAlert('error', 'Gagal Memuat Draft list', err.message || 'Periksa koneksi dan coba lagi.');
      setDraftModalOpen(false);
    } finally {
      setSubDraftLoading(false);
    }
  };

  /* ════════════════════════════════════════════════════════════
     LOAD SATU DRAFT — muat foto + teks dari server
  ════════════════════════════════════════════════════════════ */
  const doLoadDraft = async (draftId: string) => {
    setDraftModalOpen(false);
    showLoadingOverlay('draft_load', 'Memuat Draft...', 'Menghubungi server...');
    setLoadingProgress(0, 20, 'Otentikasi data...');

    try {
      let progress = 20;
      let fileIdx = 1;
      const pid = setInterval(() => {
        progress += (85 - progress) * 0.1;
        fileIdx = fileIdx > 15 ? 15 : fileIdx + (Math.random() > 0.5 ? 1 : 0);
        setLoadingProgress(1, progress, `Mengunduh foto ${fileIdx}...`);
      }, 500);
      setLoadingProgress(1, progress, `Mengunduh foto ${fileIdx}...`);

      const res = await apiPost('loadDraft', { draftId, requestId: `load-draft-${draftId}-${Date.now()}` });
      clearInterval(pid);
      if (!res.success) throw new Error(res.message || 'Gagal memuat draft.');
      if (!res.fotos || !res.fotos.length) {
        showAlert('warn', 'Draft Kosong', 'Tidak ada foto yang bisa dimuat dari draft ini.');
        hideLoadingOverlay();
        return;
      }

      setLoadingProgress(2, 85, 'Memuat teks laporan...');
      if (res.teks) {
        setReportText(res.teks);
        idbMetaSet(IDB_TEKS_KEY, res.teks);
      }

      // Draft langsung dihapus permanen di server saat load, jadi tidak lagi aktif.
      setActiveDraftId(null);
      setDraftList(prev => prev.filter(d => d.draftId !== draftId));

      const hadFoto = photos.length > 0;
      const newFotos = res.fotos
        .slice(0, MAX - photos.length)
        .map((f: any, i: number) => {
          const meta = res.exifMeta?.[i] || {};
          const isGal = meta.source === 'gallery';
          return {
            ...f,
            source: meta.source || 'camera',
            fromDraft: true,
            compressed: isGal,
            processing: false,
            procLabel: '',
            sizeKB: Math.round(b64sz(f.data) / 1024),
            exif: rebuildExifFromMeta(meta),
            exifAddr: meta.address
              ? { full: meta.address, road: '', parts: [] }
              : null,
            idbKey: null,
            id: 'p-' + Date.now() + '-' + Math.floor(Math.random() * 10000) + '-' + i,
          };
        });

      // Simpan ke IDB & update state
      setPhotos(prev => {
        const combined = [...prev, ...newFotos].slice(0, MAX);
        // Simpan ke IDB (async, tidak blocking)
        newFotos.forEach(f => {
          idbSavePhoto(f).then(key => {
            if (key !== null && key !== undefined) f.idbKey = key;
          });
        });
        return combined;
      });

      setLoadingProgress(3, 100, 'Selesai!');
      await new Promise(r => setTimeout(r, 600));
      hideLoadingOverlay();

      showAlert('success', 'Transfer Dimuat! 🌐',
        `<b>${res.jumlahFoto}</b> foto + teks laporan berhasil dimuat dari server.<br><small style="color:var(--muted)">Data draft sudah dihapus permanen dari server (folder + sheet).</small>` +
        (hadFoto ? '<br><small style="color:var(--muted)">Foto yang ada sebelumnya tetap dipertahankan.</small>' : ''));
    } catch (err: any) {
      hideLoadingOverlay();
      showAlert('error', 'Gagal Muat Draft', err.message || 'Periksa koneksi dan coba lagi.');
    }
  };

  /* ════════════════════════════════════════════════════════════
     HAPUS DRAFT dari server
  ════════════════════════════════════════════════════════════ */
  const deleteDraft = async (draftId: string) => {
    setDraftList(prev => prev.map(d => d.draftId === draftId ? { ...d, _deleting: true } as any : d));
    try {
      const res = await apiPost('deleteDraft', { draftId, requestId: `delete-draft-${draftId}-${Date.now()}` });
      if (!res.success) throw new Error(res.message || 'Gagal menghapus draft.');

      setDraftList(prev => prev.filter(d => d.draftId !== draftId));
      if (activeDraftId === draftId) {
        setActiveDraftId(null);
      }
    } catch (err: any) {
      setDraftList(prev => prev.map(d => d.draftId === draftId ? { ...d, _deleting: false } as any : d));
      showAlert('error', 'Gagal Hapus Draft', err.message || 'Coba lagi.');
    }
  };

  return {
    draftModalOpen,
    setDraftModalOpen,
    draftList,
    draftLoading,
    draftLoadingMsg,
    savingDraft,
    saveDraft,
    loadDraftList,
    doLoadDraft,
    deleteDraft,
  };
}
