import { getSheets } from './google-auth';
import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.SPREADSHEET_UTAMA_ID || process.env.GOOGLE_SHEET_ID || '';
const TZ = 'Asia/Jakarta';
const MAX_FOTO = 10;

// ================================================================
//  CONSTANTS (Mirroring Monitor Sipedas)
// ================================================================
export const SHEET_INPUT = 'INPUT';
export const SHEET_INPUT_FOTO = 'Detail Foto';
export const SHEET_DRAFT = 'Draft Temp';

// Column index constants (0-based)
export const C = { TS: 0, LOK: 1, HARI: 2, TGL: 3, IDN: 4, PER: 5, DAN: 6, NDAN: 7, KET: 8, URL: 9, JML: 10, F0: 11 };
export const CDF = { TS_UPLOAD: 0, TANGGAL: 1, DANRU: 2, NAMA_FILE: 3, SUMBER: 4, ADA_GPS: 5, LAT: 6, LNG: 7, LINK_GMAPS: 8, WAKTU_EXIF: 9, ALAMAT: 10, KET: 11, LINK_DRIVE: 12 };

/**
 * Append rows
 */
export async function appendRows(sheetName: string, rows: any[][]) {
  const sheets = await getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:A`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: rows }
  } as any);
}

/**
 * Get values
 */
export async function getSheetValues(sheetName: string) {
  const sheets = await getSheets();
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:ZZ`
    });
    return res.data.values || [];
  } catch (e: any) {
    console.error(`Gagal membaca sheet "${sheetName}":`, e.message);
    throw new Error(`Gagal membaca data dari Google Sheet [${sheetName}]: ${e.message}. Pastikan Service Account sudah jadi Editor di Spreadsheet.`);
  }
}

/**
 * Update row
 */
export async function updateRow(sheetName: string, rowNum: number, values: any[], colStart = 'A') {
  const sheets = await getSheets();
  const colLetter = columnToLetter(values.length + (colStart === 'B' ? 1 : 0));
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${colStart}${rowNum}:${colLetter}${rowNum}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [values] }
  } as any);
}

/**
 * Helper: Column index to letter
 */
function columnToLetter(col: number): string {
  let letter = '';
  while (col > 0) {
    const rem = (col - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

/**
 * Log detail foto (Mirroring Monitor Pattern)
 */
export async function appendDetailFoto(opts: any) {
  const meta = opts.meta || null;
  const adaGps = (meta && meta.hasGps) ? 'Ya' : 'Tidak';
  const lat = (meta && meta.lat) ? meta.lat : '-';
  const lng = (meta && meta.lng) ? meta.lng : '-';
  const linkMaps = (meta && meta.lat && meta.lng)
    ? `https://www.google.com/maps?q=${meta.lat},${meta.lng}`
    : '-';
  
  const now = new Date();
  const tsStr = now.toLocaleString('en-US', { timeZone: TZ });

  await appendRows(SHEET_INPUT_FOTO, [[
    tsStr,
    opts.tanggal || '-',
    opts.danru || '-',
    opts.namaFile || '-',
    opts.sumber || 'MOBILE',
    adaGps, lat, lng, linkMaps,
    meta?.datetime || '-',
    meta?.address || '-',
    opts.ket || '-',
    opts.linkDrive || ''
  ]]);
}

/**
 * Management functions
 */
export async function saveLaporan(rowData: any[]) {
  await appendRows(SHEET_INPUT, [rowData]);
}

export async function saveDraft(draftData: any[]) {
  const draftId = draftData?.[0];
  if (draftId) {
    await deleteDraft(String(draftId));
  }
  await appendRows(SHEET_DRAFT, [draftData]);
}

export async function listDrafts() {
  return await getSheetValues(SHEET_DRAFT);
}

export async function getDraftById(draftId: string) {
  const values = await listDrafts();
  const target = String(draftId || '').trim();
  return values.filter((row, i) => {
    if (i === 0) {
      const h = String(row?.[0] || '').toLowerCase();
      if (h.includes('draft')) return false;
    }
    return String(row?.[0] || '').trim() === target;
  });
}

export async function deleteDraft(draftId: string) {
  const sheets = await getSheets();
  const values = await listDrafts();
  const rowIndex = values.findIndex(row => row[0] === draftId);
  if (rowIndex === -1) return;

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheet = meta.data.sheets?.find(s => s.properties?.title === SHEET_DRAFT);
  if (!sheet || !sheet.properties) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: sheet.properties.sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex,
            endIndex: rowIndex + 1
          }
        }
      }]
    }
  } as any);
}
