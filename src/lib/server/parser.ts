/**
 * Cleaning text from special characters (markdown-like)
 */
export function cleanText(text: string): string {
  return text.replace(/[\*\_\~]/g, '').trim();
}

/**
 * Ported parsing logic from GAS to TypeScript
 */
export function parseLaporan(text: string) {
  const clean = cleanText(text);

  function extract(pattern: string, str: string): string {
    const r = new RegExp(pattern, 'is').exec(str);
    return r && r[1] ? r[1].trim() : '';
  }

  // Handle Danru
  let danru = extract('(Danru\\s*\\d+)', clean);
  if (!danru) {
    const dm = /Danru\s*\d+/i.exec(clean);
    danru = dm ? dm[0].trim() : '';
  }

  // Handle Nama Danru
  let namaDanru = extract('Danru\\s*\\d+\\s*\\(\\s*(.*?)\\s*\\)', clean);
  if (!namaDanru) {
    namaDanru = extract('Danru\\s+(?:\\d+\\s*)?([A-Za-z\\s\\.]+)', clean);
  }

  const keterangan = extract('(?:Pelaksanaan|Keterangan)\\s*:\\s*(.*?)\\s*(?=Demikian)', clean);

  return {
    nomorSPT: extract('Nomor\\s*SPT\\s*([\\s\\S]*?)\\s*Hari\\s*Pelaksanaan', clean),
    lokasi: extract('Patroli\\s*Linmas\\s*Pedestrian\\s*di\\s+(.*?)\\s+Sebagai', clean),
    hari: extract('Hari\\s*:\\s*(.*?)\\s+Tanggal', clean),
    tanggal: extract('Tanggal\\s*:\\s*(.*?)\\s+Identitas', clean),
    identitas: extract('Identitas\\s*\\/\\s*Nama\\s*Pelanggaran\\s*(.*?)\\s+Personil', clean),
    personil: extract('Personil\\s*yang\\s*terlibat\\s*:\\s*\\((.*?)\\)\\s*(?:Pelaksanaan|Keterangan)', clean),
    danru: danru,
    namaDanru: namaDanru,
    keterangan: keterangan,
  };
}

/**
 * Ported Date Indonesia parser
 */
export function parseIndonesianDate(str: string): Date | null {
  if (!str) return null;
  const MONTHS: Record<string, number> = {
    januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6,
    juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12
  };

  const clean = str.replace(/^[A-Za-z]+,?\s*/i, '').trim().toLowerCase();
  const m = /(\d{1,2})\s+([a-z]+)\s+(\d{4})/.exec(clean);
  if (m) {
    const bln = MONTHS[m[2]];
    if (bln) {
      const d = new Date(parseInt(m[3], 10), bln - 1, parseInt(m[1], 10));
      if (!isNaN(d.getTime())) return d;
    }
  }

  const m2 = /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/.exec(str);
  if (m2) {
    const d2 = new Date(parseInt(m2[3], 10), parseInt(m2[2], 10) - 1, parseInt(m2[1], 10));
    if (!isNaN(d2.getTime())) return d2;
  }

  return null;
}

export function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/heic": ".heic",
    "image/heif": ".heif",
    "image/bmp": ".bmp"
  };
  return map[(mime || '').toLowerCase()] || ".jpg";
}
