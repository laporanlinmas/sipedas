import QRCode from 'qrcode'
import { ExifData, fmtExifTime, nowFull } from './exif-parser'
import { AddrResult } from './geocoding'

interface AppState {
  wmCam: boolean;
  wmGal: boolean;
  minimap: boolean;
  loc: { jalan: string, nodukuh: string, desa: string, kec: string, kab: string, prov: string };
  lat: string;
  lng: string;
}

export function getManualLoc(S: AppState): string {
  var p = [];
  if (S.loc.jalan) {
    var j = S.loc.jalan;
    if (S.loc.nodukuh) j += ' / ' + S.loc.nodukuh;
    p.push(j);
  } else if (S.loc.nodukuh) { p.push(S.loc.nodukuh); }
  if (S.loc.desa) p.push(S.loc.desa);
  if (S.loc.kec) p.push('Kec. ' + S.loc.kec);
  if (S.loc.kab) p.push(S.loc.kab);
  if (S.loc.prov) p.push(S.loc.prov);
  p.push('Indonesia');
  return p.length > 1 ? p.join(', ') : 'Ponorogo, Jawa Timur, Indonesia';
}

/**
 * getDanru — identik dengan sistem lama (ui.js)
 * Parse nama Danru dari teks laporan, contoh:
 *   "Danru 2 (Ahmad Basith)" → "Ahmad Basith"
 *   "Danru Suyitno"          → "Suyitno"
 */
export function getDanru(reportText: string): string {
  if (!reportText) return '—';
  const t = reportText.replace(/[*_~`]/g, '').trim();
  let nama = '';
  // 1. Danru N (Nama)
  const m1 = /Danru\s*\d*\s*\(\s*(.*?)\s*\)/i.exec(t);
  if (m1) nama = m1[1];
  // 2. Danru Nama / Danru N Nama
  if (!nama) {
    const m2 = /Danru\s+(?:\d+\s*)?([A-Za-z\s\.]+)/i.exec(t);
    if (m2) nama = m2[1];
  }
  if (!nama.trim()) return '—';
  return nama.trim().replace(/\b\w/g, c => c.toUpperCase());
}

function wrapTxt(ctx: CanvasRenderingContext2D, txt: string, maxW: number): string[] {
  if (!txt) return [];
  if (ctx.measureText(txt).width <= maxW) return [txt];
  var words = txt.split(/\s+/), lines = [], cur = '';
  words.forEach(w => {
    var t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && cur) {
      lines.push(cur); cur = w;
    } else cur = t;
  });
  if (cur) lines.push(cur);
  return lines.slice(0, 5);
}

export async function makeQRCanvas(lat: number, lng: number, size: number): Promise<HTMLCanvasElement | null> {
  try {
    const url = 'https://www.google.com/maps?q=' + lat.toFixed(6) + ',' + lng.toFixed(6);
    const cvs = document.createElement('canvas');
    cvs.width = size;
    cvs.height = size;
    await QRCode.toCanvas(cvs, url, { width: size, margin: 0, color: { dark: '#000000', light: '#ffffff' } });
    return cvs;
  } catch (e) {
    return null;
  }
}

export function drawWM(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  photo: any,
  S: AppState,
  qrCvs: HTMLCanvasElement | null,
  danruStr: string,
  logoImg: HTMLImageElement | null
) {
  var isCam = photo.source === 'camera';
  var exif: ExifData = photo.exif;
  var lat: number | null = null, lng: number | null = null;

  if (exif && exif.gps) {
    lat = exif.gps.lat; lng = exif.gps.lng;
  } else if (S.lat && S.lng) {
    lat = parseFloat(S.lat); lng = parseFloat(S.lng);
  }

  var coordStr = (lat !== null && lng !== null) ? '📡 Lat ' + lat.toFixed(6) + ' , Long ' + lng.toFixed(6) : 'Koordinat tidak tersedia';
  var addrFull = (photo.exifAddr && photo.exifAddr.full) ? photo.exifAddr.full : getManualLoc(S);
  var timeStr = isCam ? fmtExifTime(exif) : (nowFull() + ' WIB');
  var danru = danruStr || '—';

  var BAR = Math.max(3, Math.round(w * 0.006)), PAD = Math.round(w * 0.022), PADV = 8;
  var LOGO = Math.round(Math.min(w, h) * 0.10);
  var QR = qrCvs ? Math.max(75, Math.min(200, Math.round(Math.min(w, h) * 0.14))) : 0;
  var QR_PAD = qrCvs ? Math.round(PAD * 0.6) : 0;
  var fT = Math.max(11, Math.round(LOGO * 0.35)), fB = Math.max(9, Math.round(LOGO * 0.30)), fS = Math.max(7, Math.round(fB * 0.70));
  var LH = Math.round(fB * 1.5), TX = BAR + Math.round(PAD * 0.35) + LOGO + Math.round(PAD * 0.45);
  var TW = w - TX - PAD - (qrCvs ? QR + QR_PAD * 2 : 0);

  ctx.font = fB + 'px Arial,sans-serif';
  var addrLines = wrapTxt(ctx, addrFull, TW);
  var nLines = 1 + 1 + 1 + addrLines.length + 1;
  var CONTH = PADV + Math.round(fT * 1.45) + nLines * LH + PADV;
  var STRPH = Math.max(Math.round(h * 0.10), CONTH * 0.8, qrCvs ? QR + PADV * 2 : 0);
  var SY = h - STRPH;

  ctx.save();
  var gr = ctx.createLinearGradient(0, SY, 0, h);
  gr.addColorStop(0, 'rgba(2,6,18,0.42)');
  gr.addColorStop(0.6, 'rgba(2,6,18,0.65)');
  gr.addColorStop(1, 'rgba(2,6,18,0.80)');
  ctx.fillStyle = gr;
  ctx.fillRect(0, SY, w, STRPH);

  var bg = ctx.createLinearGradient(0, SY, 0, h);
  bg.addColorStop(0, 'rgba(26,101,214,0.65)');
  bg.addColorStop(1, 'rgba(26,80,184,0.90)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, SY, BAR, STRPH);

  var lx = BAR + Math.round(PAD * 0.35), ly = SY + Math.round((STRPH - LOGO) / 2);

  if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
    try {
      ctx.globalAlpha = 0.65;
      ctx.drawImage(logoImg, lx, ly, LOGO, LOGO);
      ctx.globalAlpha = 1;
    } catch (e) { }
  }

  if (qrCvs && QR > 0) {
    var qx = w - QR - QR_PAD, qy = SY + Math.round((STRPH - QR) / 2) - 25;
    ctx.fillStyle = '#ffffff';
    var qPad = 4;
    ctx.fillRect(qx - qPad, qy - qPad, QR + qPad * 2, QR + qPad * 2);
    try { ctx.drawImage(qrCvs, qx, qy, QR, QR); } catch (e) { }
    ctx.font = 'bold ' + Math.max(7, Math.round(fS * 0.65)) + 'px Arial,sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.70)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('LIHAT LOKASI', qx + QR / 2, qy - 5);
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  var tx = TX, ty = SY + PADV;

  ctx.font = '800 ' + fT + 'px Arial,sans-serif';
  ctx.fillStyle = 'rgba(255,210,0,0.90)';
  ctx.fillText('SATLINMAS PEDESTRIAN', tx, ty, TW);
  ty += Math.round(fT * 1.45);

  ctx.font = '700 ' + fB + 'px Arial,sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.90)';
  ctx.fillText('Danru: ' + danru, tx, ty, TW);
  ty += LH;

  ctx.font = '400 ' + fB + 'px Arial,sans-serif';
  ctx.fillStyle = 'rgba(160,210,255,0.90)';
  ctx.fillText(timeStr, tx, ty, TW);
  ty += LH;

  ctx.font = '500 ' + fB + 'px Arial,sans-serif';
  ctx.fillStyle = (isCam && photo.exifAddr && photo.exifAddr.road) ? 'rgba(180,248,200,0.90)' : 'rgba(160,240,200,0.80)';
  addrLines.forEach(ln => { ctx.fillText(ln, tx, ty, TW); ty += LH; });

  ctx.font = '400 ' + fS + 'px Arial,sans-serif';
  ctx.fillStyle = 'rgba(140,180,220,0.85)';
  ctx.fillText(coordStr, tx, ty, TW);

  var spF = Math.max(8, Math.round(w * 0.024));
  ctx.font = '900 ' + spF + 'px Arial,sans-serif';
  ctx.fillStyle = 'rgba(255,205,0,0.55)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('SI-PEDAS', w - Math.round(PAD * 0.5), h - Math.round(PAD * 0.3), Math.round(w * 0.22));

  ctx.font = '400 ' + Math.round(spF * 0.72) + 'px Arial,sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText('mobile', w - Math.round(PAD * 0.5), h - Math.round(PAD * 0.3) - spF - 2, Math.round(w * 0.18));

  ctx.restore();
}

function b64sz(b: string) { return Math.max(0, b.length - (b.indexOf(',') + 1) - (b.endsWith('==') ? 2 : b.endsWith('=') ? 1 : 0)) * 0.75; }

export async function processImage(dataUrl: string, file: File, idx: number, source: string, photo: any, S: AppState, danruStr: string, MAX_B: number): Promise<any> {
  return new Promise((resolve) => {
    var img = new Image();
    img.onload = async () => {
      var cvs = document.createElement('canvas');
      var ctx = cvs.getContext('2d');
      if (!ctx) { resolve(null); return; }

      var w = img.naturalWidth, h = img.naturalHeight, mx = 2500;
      if (w > mx || h > mx) {
        if (w > h) { h = Math.round(h * mx / w); w = mx; }
        else { w = Math.round(w * mx / h); h = mx; }
      }
      cvs.width = w; cvs.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      const finalize = async (qrCvs: HTMLCanvasElement | null) => {
        let useWM = source === 'camera' ? S.wmCam : S.wmGal;
        let logoImg: HTMLImageElement | null = null;
        
        if (useWM) {
          const cached = (window as any)._linmasLogo as HTMLImageElement;
          if (cached && cached.complete && cached.naturalWidth > 0) {
            logoImg = cached;
          } else {
            logoImg = document.getElementById('img-linmas') as HTMLImageElement;
            if (!logoImg || !logoImg.complete || logoImg.naturalWidth === 0) {
              logoImg = await new Promise<HTMLImageElement | null>((res) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => { (window as any)._linmasLogo = img; res(img); };
                img.onerror = () => res(null);
                img.src = '/assets/icon-full.png';
              });
            } else {
              (window as any)._linmasLogo = logoImg;
            }
          }
        }

        if (useWM) drawWM(ctx, w, h, photo, S, qrCvs, danruStr, logoImg);

        var outMime = 'image/jpeg', q = 0.92, raw = cvs.toDataURL(outMime, q), sz = b64sz(raw), comp = false, out = raw;
        if (sz > MAX_B) {
          comp = true;
          var lo = 0.10, hi = q, best = raw;
          for (var it = 0; it < 14; it++) {
            var mid = (lo + hi) / 2, trial = cvs.toDataURL(outMime, mid), tsz = b64sz(trial);
            if (tsz <= MAX_B) { best = trial; lo = mid; } else hi = mid;
            if (hi - lo < 0.006) break;
          }
          out = best;
        }
        resolve({
          data: out,
          mime: outMime,
          sizeKB: Math.round(b64sz(out) / 1024),
          compressed: comp,
          ts: photo.ts,
          watermarked: useWM
        });
      };

      if (photo.source === 'camera' && photo.exif && photo.exif.gps && S.wmCam) {
        var qrSz = Math.max(90, Math.min(240, Math.round(Math.min(w, h) * 0.16)));
        const qrCvs = await makeQRCanvas(photo.exif.gps.lat, photo.exif.gps.lng, qrSz);
        await finalize(qrCvs);
      } else {
        await finalize(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}
