export interface LocState {
  jalan: string;
  nodukuh: string;
  desa: string;
  kec: string;
  kab: string;
  prov: string;
}

export interface AppState {
  wmCam: boolean;
  wmGal: boolean;
  ocrGal: boolean;
  minimap: boolean;
  loc: LocState;
  lat: string;
  lng: string;
  theme: 'light' | 'dark';
}

export const defaultState: AppState = {
  wmCam: true,
  wmGal: false,
  ocrGal: false,
  minimap: true,
  loc: { jalan: '', nodukuh: '', desa: '', kec: '', kab: 'Ponorogo', prov: 'Jawa Timur' },
  lat: '',
  lng: '',
  theme: 'dark'
};

export interface PhotoData {
  id: string;
  data: string | null;
  mime: string;
  sizeKB: number;
  compressed: boolean;
  processing: boolean;
  procLabel: string;
  source: 'camera' | 'gallery';
  exif: any;
  exifAddr: any;
  ts: string;
  idbKey: number | null;
  fromDraft?: boolean;
  watermarked?: boolean;
  order?: number;
}
