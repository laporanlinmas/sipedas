import { NextResponse } from 'next/server';
import { parseLaporan, cleanText, mimeToExt as parserMimeToExt } from '@/lib/server/parser';
import {
  getOrCreateFolder,
  uploadFileFromBase64,
  FOLDER_UTAMA_ID,
  downloadFileAsBase64,
  formatBulanTahun,
  formatTanggalPanjang,
  deleteFolder,
  mimeToExt
} from '@/lib/server/google-drive';
import {
  saveLaporan,
  appendDetailFoto
} from '@/lib/server/google-sheets';
import {
  saveDraftPg,
  appendDraftFotoPg,
  listDraftsPg,
  getDraftPg,
  deleteDraftPg
} from '@/lib/server/db';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const TZ = 'Asia/Jakarta';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'uploadFoto':
        return await handleUploadFoto(data);
      case 'submitLaporan':
        return await handleSubmitLaporan(data);
      case 'saveDraft':
        return await handleSaveDraft(data);
      case 'appendDraftFoto':
        return await handleAppendDraftFoto(data);
      case 'loadDraft':
        return await handleLoadDraft(body.draftId);
      case 'deleteDraft':
        return await handleDeleteDraft(body.draftId);
      case 'ping':
        return NextResponse.json({ success: true, message: 'pong' });
      default:
        return NextResponse.json({ success: false, message: 'Action not recognized: ' + action }, { status: 400 });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'listDrafts':
        const drafts = await listDraftsPg();
        return NextResponse.json({ success: true, drafts });
      case 'ping':
        return NextResponse.json({ success: true, message: 'pong' });
      default:
        return NextResponse.json({ success: false, message: 'Action not recognized: ' + action }, { status: 400 });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// --- Handler Functions ---

async function handleUploadFoto(data: any) {
  try {
    const { foto, meta, noFoto, jumlahTotal, laporan } = data;
    const teksAsli = (laporan || '').trim();
    const parsed = teksAsli ? parseLaporan(cleanText(teksAsli)) : {} as any;

    const now = new Date();
    const folderDate = parsed.tanggal ? parseTanggalIndonesia(parsed.tanggal) || now : now;

    const labelBulan = formatBulanTahun(folderDate);
    const labelTanggal = formatTanggalPanjang(folderDate);

    let linkFile = '';
    let folderTanggalId = '';
    let remoteFolderUrl = '';

    const prefix = foto.source === 'camera' ? '[KAMERA]' : '[GALERI]';
    const danruSlug = parsed.namaDanru ? '_' + parsed.namaDanru.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20) : '';
    const noSuffix = jumlahTotal === 1 ? '' : '_' + noFoto;
    const fileName = `${prefix}_${labelTanggal}${danruSlug}${noSuffix}${mimeToExt(foto.mime)}`;

    if (process.env.APPS_SCRIPT_URL) {
      // FULL PROXY: Apps Script handles Bulan & Tanggal folders under Utama
      const rawData = foto.data.split(',')[1];
      try {
        const resp = await fetch(process.env.APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'upload',
            folderId: FOLDER_UTAMA_ID,
            folderBulan: labelBulan,
            folderName: labelTanggal,
            fileData: { content: rawData, mimeType: foto.mime, name: fileName }
          })
        });
        if (!resp.ok) throw new Error('Failed to upload via Apps Script (Status ' + resp.status + ')');
        const rs = await resp.json();
        if (rs?.success === false) throw new Error(rs.message || 'Upload via Apps Script gagal');
        linkFile = rs.url || rs.linkFile || '';
        remoteFolderUrl = rs.folderUrl || '';
        if (!linkFile) throw new Error('Apps Script tidak mengembalikan URL file.');
        if (!remoteFolderUrl) throw new Error('Apps Script tidak mengembalikan URL folder.');
      } catch (appsScriptErr: any) {
        const message = String(appsScriptErr?.message || appsScriptErr || '');
        const quotaError = /Service Accounts do not have storage quota|storage quota/i.test(message);
        if (!quotaError) throw appsScriptErr;
        // Fallback otomatis ke backend Next.js (OAuth2 jika tersedia).
        console.warn('Apps Script upload quota error, switching to Next.js Drive uploader.');
        const folderBulanId = await getOrCreateFolder(FOLDER_UTAMA_ID, labelBulan);
        folderTanggalId = await getOrCreateFolder(folderBulanId, labelTanggal);
        linkFile = await uploadFileFromBase64(folderTanggalId, foto.data, foto.mime, fileName);
        remoteFolderUrl = `https://drive.google.com/drive/folders/${folderTanggalId}`;
      }
    } else {
      // SERVICE ACCOUNT fallback
      const folderBulanId = await getOrCreateFolder(FOLDER_UTAMA_ID, labelBulan);
      folderTanggalId = await getOrCreateFolder(folderBulanId, labelTanggal);
      linkFile = await uploadFileFromBase64(folderTanggalId, foto.data, foto.mime, fileName);
      remoteFolderUrl = `https://drive.google.com/drive/folders/${folderTanggalId}`;
    }

    // Log to Detail Foto (Mirroring Monitor Pattern)
    const detailData = {
      tanggal: parsed.tanggal || '-',
      danru: parsed.namaDanru || '-',
      namaFile: fileName,
      sumber: foto.source === 'camera' ? 'KAMERA' : 'GALERI',
      meta: meta,
      linkDrive: linkFile,
      ket: foto.source === 'camera' && meta?.hasGps
        ? 'Foto kamera dengan GPS. Koordinat terverifikasi.'
        : (foto.source === 'camera' ? 'Foto kamera tanpa data GPS EXIF.' : (meta?.hasGps ? 'Foto galeri dengan deteksi lokasi otomatis via OCR.' : 'Foto dari galeri. Lokasi dari input manual.'))
    };

    await appendDetailFoto(detailData);

    return NextResponse.json({
      success: true,
      linkFile,
      namaFile: fileName,
      folderUrl: remoteFolderUrl,
      noFoto
    });
  } catch (err: any) {
    console.error('Error in handleUploadFoto:', err.message);
    throw new Error('Gagal Upload Foto: ' + err.message);
  }
}

async function handleSubmitLaporan(data: any) {
  try {
    const { laporan, linkFoto, folderUrl, draftId } = data;
    const now = new Date();
    const parsed = parseLaporan(cleanText(laporan));
    const timestamp = now.toLocaleString('en-US', { timeZone: TZ });

    const fotoCols = Array(10).fill('');
    linkFoto.forEach((item: any, i: number) => {
      if (i < 10) fotoCols[i] = item.link;
    });

    const mainRow = [
      timestamp, parsed.nomorSPT || '-', parsed.lokasi, parsed.hari, parsed.tanggal,
      parsed.identitas || 'NIHIL', parsed.personil, parsed.danru, parsed.namaDanru,
      parsed.keterangan || '', folderUrl || '', linkFoto.length,
      ...fotoCols
    ];

    await saveLaporan(mainRow);

    if (draftId) await handleDeleteDraft(draftId);
    return NextResponse.json({ success: true, parsed });
  } catch (err: any) {
    console.error('Error in handleSubmitLaporan:', err.message);
    throw new Error('Gagal Submit Laporan: ' + err.message);
  }
}

async function handleSaveDraft(data: any) {
  try {
    const { laporan, draftId: existingDraftId } = data;
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', { timeZone: TZ });
    const draftId = existingDraftId || `DRAFT-${now.getTime()}`;
    
    console.log('[saveDraft] PG start init row', { draftId });

    const parsed = parseLaporan(cleanText(laporan || ''));
    const danruNama = parsed.namaDanru || '—';
    
    // Create draft row with empty fotos and exifMeta
    await saveDraftPg(draftId, timestamp, danruNama, laporan || '', [], []);
    
    console.log('[saveDraft] PG initialized row', { draftId });

    return NextResponse.json({ success: true, draftId, jumlahFoto: 0 });
  } catch (err: any) {
    console.error('Error in handleSaveDraft:', err.message);
    throw new Error('Gagal Inisiasi Draft: ' + err.message);
  }
}

async function handleAppendDraftFoto(data: any) {
  try {
    const { draftId, foto, exifMeta } = data;
    if (!draftId) throw new Error('Missing draftId');
    if (!foto) throw new Error('Missing foto payload');
    
    await appendDraftFotoPg(draftId, foto, exifMeta || {});
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in handleAppendDraftFoto:', err.message);
    throw new Error('Gagal menambah foto ke draf: ' + err.message);
  }
}

async function handleLoadDraft(draftId: string) {
  try {
    if (!draftId) throw new Error('Draft ID kosong');
    
    const draft = await getDraftPg(draftId);
    console.log('[loadDraft] PG lookup', { draftId, found: !!draft });
    if (!draft) throw new Error('Draft not found');
    
    const fotosData = draft.fotos.map((f: any) => ({
      data: f.data,
      mime: f.mime || 'image/jpeg',
      source: f.source || 'camera',
      fromDraft: true
    }));

    await deleteDraftPg(draftId);
    console.log('[loadDraft] PG cleaned', { draftId });

    return NextResponse.json({
      success: true,
      draftId,
      teks: draft.laporan,
      danru: draft.danru,
      fotos: fotosData,
      jumlahFoto: draft.jumlah_foto,
      exifMeta: draft.exif_meta
    });
  } catch (err: any) {
    console.error('Error in handleLoadDraft:', err.message);
    throw new Error('Gagal Load Draft: ' + err.message);
  }
}

async function handleDeleteDraft(draftId: string) {
  try {
    if (!draftId) throw new Error('Draft ID kosong');
    await deleteDraftPg(draftId);
    console.log('[deleteDraft] PG cleaned', { draftId });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in handleDeleteDraft:', err.message);
    // Kembalikan success true dengan warning agar UI tidak stuck
    return NextResponse.json({ success: true, warning: err.message });
  }
}

// Helpers
function parseTanggalIndonesia(str: string) {
  const months: Record<string, number> = { januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5, juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11 };
  const cleaned = str.replace(/^[A-Za-z]+,?\s*/i, '').trim().toLowerCase();
  const m = /(\d{1,2})\s+([a-z]+)\s+(\d{4})/.exec(cleaned);
  if (m && months[m[2]] !== undefined) {
    return new Date(parseInt(m[3]), months[m[2]], parseInt(m[1]));
  }
  return null;
}


