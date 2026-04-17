"use client";

import { useAppContext } from './AppContext';
import { readExif } from './exif-parser';
import { reverseGeocodeForceStreet } from './geocoding';
import { processImage, getDanru } from './watermark';
import { extractOcrCoordinates } from './ocr';
import { idbSavePhoto } from './idb';
import { PhotoData } from './types';

const MAX = 10;
const MAX_B = 400 * 1024; // Kompres maksimal 400KB

export function useFileHandler() {
  const { photos, setPhotos, state, showAlert, reportText } = useAppContext();

  const handleFiles = async (files: FileList | null, source: 'camera' | 'gallery') => {
    if (!files || files.length === 0) return;

    let rem = MAX - photos.length;
    if (rem <= 0) { showAlert('warn', 'Batas Foto', `Maksimal ${MAX} foto.`); return; }

    let toAdd = Math.min(files.length, rem);
    if (files.length > rem) {
      showAlert('warn', 'Batas Terlampaui', `${files.length} foto dipilih, hanya ${rem} slot tersisa.`);
    }

    const t = new Date();
    const pad = (n: number) => n < 10 ? '0' + n : n;
    const ts = pad(t.getDate()) + '/' + pad(t.getMonth() + 1) + '/' + t.getFullYear() + ' ' + pad(t.getHours()) + ':' + pad(t.getMinutes()) + ':' + pad(t.getSeconds());

    const newPhotos: PhotoData[] = [];
    const ids: string[] = [];
    for (let i = 0; i < toAdd; i++) {
      const id = 'p-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      ids.push(id);
      newPhotos.push({
        id, data: null, mime: files[i].type, sizeKB: 0, compressed: false,
        processing: true, procLabel: 'Menunggu...', source,
        exif: null, exifAddr: null, ts, idbKey: null
      });
    }

    setPhotos(prev => [...prev, ...newPhotos]);

    Array.from(files).slice(0, toAdd).forEach(async (file, i) => {
      const id = ids[i];
      try {
        if (source === 'camera') {
          updatePhotoById(id, { procLabel: 'Membaca EXIF...' });
          const exif = await readExif(file);

          let addr = null;
          if (exif && exif.gps) {
            updatePhotoById(id, { procLabel: 'Geocoding...' });
            addr = await reverseGeocodeForceStreet(exif.gps.lat, exif.gps.lng);
          }

          updatePhotoById(id, { exif, exifAddr: addr, procLabel: 'Mengerjakan cap...' });
          await doProcessById(file, id, source, { exif, exifAddr: addr, ts, source });
        } else {
          let addr = null;
          let exifData = null;
          const ocrEnabled = !!state.ocrGal;
          const wmEnabled = !!state.wmGal;

          if (ocrEnabled) {
            updatePhotoById(id, { procLabel: 'Optimasi OCR...' });
            const optimizedForOcr = await new Promise<string | File>((resolve) => {
              const img = new Image();
              img.onload = () => {
                const cvs = document.createElement('canvas');
                const ctx = cvs.getContext('2d');
                if (!ctx) { resolve(file); return; }
                let w = img.naturalWidth, h = img.naturalHeight, mx = 1200;
                if (w > mx || h > mx) {
                  if (w > h) { h = Math.round(h * mx / w); w = mx; }
                  else { w = Math.round(w * mx / h); h = mx; }
                }
                cvs.width = w; cvs.height = h;
                ctx.drawImage(img, 0, 0, w, h);
                resolve(cvs.toDataURL('image/jpeg', 0.85));
              };
              img.onerror = () => resolve(file);
              img.src = URL.createObjectURL(file);
            });

            updatePhotoById(id, { procLabel: 'OCR Kordinat...' });
            const ocrResult = await extractOcrCoordinates(optimizedForOcr);

            if (ocrResult) {
              if (!ocrResult.address) {
                updatePhotoById(id, { procLabel: 'Geocoding (OCR)...' });
                addr = await reverseGeocodeForceStreet(ocrResult.lat, ocrResult.lng);
              }
              exifData = { gps: { lat: ocrResult.lat, lng: ocrResult.lng } };
            }
          }

          const procLabel = wmEnabled ? 'Berikan cap...' : 'Sedang kompres...';
          updatePhotoById(id, { exif: exifData || null, exifAddr: addr, procLabel });
          await doProcessById(file, id, source, { exif: exifData || null, exifAddr: addr, ts, source });
        }
      } catch (err: any) {
        console.error('Processing error:', err.message);
        setPhotos(prev => prev.filter(p => p.id !== id));
      }
    });
  };

  const updatePhotoById = (id: string, updates: Partial<PhotoData>) => {
    setPhotos(prev => {
      const arr = [...prev];
      const idx = arr.findIndex(p => p.id === id);
      if (idx !== -1) arr[idx] = { ...arr[idx], ...updates };
      return arr;
    });
  };

  const doProcessById = async (file: File, id: string, source: string, photoMeta: any) => {
    return new Promise((resolve) => {
      const rdr = new FileReader();
      rdr.onload = async (ev) => {
        if (!ev.target || !ev.target.result) { resolve(null); return; }
        const danruStr = getDanru(reportText);
        const res = await processImage(ev.target.result as string, file, 0, source, photoMeta, state, danruStr, MAX_B);

        setPhotos(prev => {
          const arr = [...prev];
          const idx = arr.findIndex(p => p.id === id);
          if (idx !== -1) {
            arr[idx] = { ...arr[idx], ...res, processing: false };
            idbSavePhoto(arr[idx]).then(key => {
              if (key !== null && key !== undefined) {
                setPhotos(p => {
                  const r = [...p];
                  const idx2 = r.findIndex(it => it.id === id);
                  if (idx2 !== -1) r[idx2].idbKey = key;
                  return r;
                });
              }
            });
          }
          return arr;
        });
        resolve(res);
      };
      rdr.onerror = () => {
        console.error("FileReader failed");
        setPhotos(prev => prev.filter(p => p.id !== id));
        resolve(null);
      };
      rdr.readAsDataURL(file);
    });
  };

  return { handleFiles };
}
