import { createWorker, Worker } from 'tesseract.js';

export interface OcrResult {
  lat: number;
  lng: number;
  address?: string;
}

let sharedWorker: Worker | null = null;
let workerInitPromise: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (sharedWorker) return sharedWorker;
  if (!workerInitPromise) {
    workerInitPromise = createWorker('eng').then(worker => {
      sharedWorker = worker;
      return worker;
    });
  }
  return workerInitPromise;
}

/**
 * Membaca teks di atas gambar menggunakan Tesseract dan mencari pola Lat / Long
 * @param imageInput File atau Base64
 */
export async function extractOcrCoordinates(imageInput: File | string): Promise<OcrResult | null> {
  try {
    const worker = await getWorker();
    const { data: { text } } = await worker.recognize(imageInput);

    if (!text) return null;

    const txtLower = text.toLowerCase();
    let lat = NaN;
    let lng = NaN;
    
    // 1. Coba cari dengan prefix "lat" dan "long" (Lebih robust dengan koma dan spasi)
    const latMatch = txtLower.match(/lat(?:itude)?\s*[:=]?\s*([-+]?\d{1,3}(?:\.\d+)?)/);
    const lngMatch = txtLower.match(/lon(?:g)?(?:itude)?\s*[:=]?\s*([-+]?\d{1,3}(?:\.\d+)?)/);

    if (latMatch && lngMatch) {
      lat = parseFloat(latMatch[1]);
      lng = parseFloat(lngMatch[1]);
    } else {
      // 2. Fallback: Cari sepasang angka koordinat (contoh: "-7.865, 111.464" atau "-7.865 111.464")
      const coordinatePair = text.match(/([-+]?\d+\.\d+)\s*[,]?\s*(\d+\.\d+)/);
      if (coordinatePair) {
        lat = parseFloat(coordinatePair[1]);
        lng = parseFloat(coordinatePair[2]);
      } else {
        const allNumbers = text.match(/[-+]?\d+\.\d+/g);
        if (allNumbers && allNumbers.length >= 2) {
          const n1 = parseFloat(allNumbers[0]);
          const n2 = parseFloat(allNumbers[1]);
          if (Math.abs(n1) <= 90 && Math.abs(n2) <= 180) {
            lat = n1;
            lng = n2;
          }
        }
      }
    }

    if (!isNaN(lat) && !isNaN(lng)) {
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
    
    return null;
  } catch (err) {
    console.error('OCR Extraction Error:', err);
    return null;
  }
}
