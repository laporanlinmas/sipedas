"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, defaultState, PhotoData } from './types';
import { idbMetaGet, idbLoadAll, IDB_TEKS_KEY } from './idb';

interface LoadingOverlayState {
  show: boolean;
  type: 'submit' | 'draft_save' | 'draft_load';
  title: string;
  sub: string;
  progress: number; // 0-100
  step: number;     // 0-3
}

interface AppContextType {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  photos: PhotoData[];
  setPhotos: React.Dispatch<React.SetStateAction<PhotoData[]>>;
  reportText: string;
  setReportText: (text: string) => void;
  activeDraftId: string | null;
  setActiveDraftId: (id: string | null) => void;
  isLoading: boolean;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  alertConfig: { show: boolean, type: string, title: string, msg: string } | null;
  showAlert: (type: string, title: string, msg: string) => void;
  closeAlert: () => void;
  confirmConfig: { show: boolean, title: string, msg: string, onConfirm: () => void } | null;
  showConfirm: (title: string, msg: string, onConfirm: () => void) => void;
  closeConfirm: () => void;
  // Lightbox viewer
  viewerIdx: number | null;
  openViewer: (idx: number) => void;
  closeViewer: () => void;
  navigateViewer: (dir: -1 | 1) => void;
  // Map modal
  mapCoords: { lat: number; lng: number; info: string } | null;
  openMapModal: (idx: number) => void;
  closeMapModal: () => void;
  // Loading overlay (Submit & Draft)
  loadingOverlay: LoadingOverlayState;
  showLoadingOverlay: (type: LoadingOverlayState['type'], title: string, sub: string) => void;
  hideLoadingOverlay: () => void;
  setLoadingProgress: (step: number, progress: number, sub?: string) => void;
  resetApp: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [reportText, setReportTextState] = useState('');
  const [activeDraftId, setActiveDraftIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ show: boolean, type: string, title: string, msg: string } | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ show: boolean, title: string, msg: string, onConfirm: () => void } | null>(null);
  const [viewerIdx, setViewerIdx] = useState<number | null>(null);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number; info: string } | null>(null);
  const [loadingOverlay, setLoadingOverlay] = useState<LoadingOverlayState>({
    show: false, type: 'submit', title: '', sub: '', progress: 0, step: -1
  });

  useEffect(() => {
    // Load state from sessionStorage
    try {
      const r = sessionStorage.getItem('sip_s2');
      if (r) {
        const parsed = JSON.parse(r);
        if (parsed.wm !== undefined && parsed.wmCam === undefined) {
          parsed.wmCam = parsed.wm; parsed.wmGal = false;
        }
        if (parsed.ocrGal === undefined) parsed.ocrGal = false;
        if (parsed.wmGal === undefined) parsed.wmGal = false;
        setState(prev => ({ ...prev, ...parsed }));
      }
      const storedDraftId = sessionStorage.getItem('sip_draftId');
      if (storedDraftId) setActiveDraftIdState(storedDraftId);
    } catch (e) {}

    // Load indexedDB data
    idbMetaGet(IDB_TEKS_KEY).then(savedTeks => {
      if (savedTeks && typeof savedTeks === 'string' && savedTeks.trim()) {
        setReportTextState(savedTeks);
      }
      idbLoadAll().then(saved => {
        if (saved && saved.length) {
          const toLoad = saved.slice(0, 10).map(f => ({ ...f, processing: false }));
          setPhotos(toLoad);
          showAlert('success', 'Data Dipulihkan 📸', 'Foto dari sesi sebelumnya dimuat otomatis.');
        } else if (savedTeks) {
          showAlert('success', 'Teks Dipulihkan 📝', 'Teks laporan dimuat otomatis.');
        }
        setIsLoading(false);
      });
    });
  }, []);

  useEffect(() => {
    if (!isLoading) {
      sessionStorage.setItem('sip_s2', JSON.stringify(state));
      // Apply theme
      if (state.theme === 'light') {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
      } else {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
      }
    }
  }, [state.theme, state, isLoading]);

  const setReportText = (text: string) => setReportTextState(text);

  const setActiveDraftId = (id: string | null) => {
    setActiveDraftIdState(id);
    if (id) sessionStorage.setItem('sip_draftId', id);
    else sessionStorage.removeItem('sip_draftId');
  };

  const showAlert = (type: string, title: string, msg: string) =>
    setAlertConfig({ show: true, type, title, msg });
  const closeAlert = () => setAlertConfig(null);

  const showConfirm = (title: string, msg: string, onConfirm: () => void) =>
    setConfirmConfig({ show: true, title, msg, onConfirm });
  const closeConfirm = () => setConfirmConfig(null);

  // Lightbox
  const openViewer = (idx: number) => setViewerIdx(idx);
  const closeViewer = () => setViewerIdx(null);
  const navigateViewer = (dir: -1 | 1) => {
    setViewerIdx(prev => {
      if (prev === null) return null;
      const next = prev + dir;
      if (next < 0 || next >= photos.length) return prev;
      if (photos[next]?.processing) return prev;
      return next;
    });
  };

  // Map modal
  const openMapModal = (idx: number) => {
    const f = photos[idx];
    if (!f || !f.exif || !f.exif.gps) return;
    const lat = f.exif.gps.lat as number;
    const lng = f.exif.gps.lng as number;
    let info = `Foto ${idx + 1}`;
    if (f.exifAddr?.full) info += `: <b>${f.exifAddr.full}</b>`;
    info += `<br><span style="font-family:var(--m);font-size:.72rem">${lat.toFixed(6)}, ${lng.toFixed(6)}</span>`;
    setMapCoords({ lat, lng, info });
  };
  const closeMapModal = () => setMapCoords(null);

  // Generic loading overlay
  const showLoadingOverlay = (type: LoadingOverlayState['type'], title: string, sub: string) =>
    setLoadingOverlay({ show: true, type, title, sub, progress: 0, step: 0 });
  const hideLoadingOverlay = () =>
    setLoadingOverlay(prev => ({ ...prev, show: false }));
  const setLoadingProgress = (step: number, progress: number, sub?: string) =>
    setLoadingOverlay(prev => ({ ...prev, step, progress, sub: sub ?? prev.sub }));

  const resetApp = async () => {
    const { idbClearEverything } = await import('./idb');
    await idbClearEverything();
    setPhotos([]);
    setReportTextState('');
    setActiveDraftId(null);
    showAlert('success', 'Laporan Direset', 'Semua data laporan telah dikosongkan.');
  };

  return (
    <AppContext.Provider value={{
      state, setState,
      photos, setPhotos,
      reportText, setReportText,
      activeDraftId, setActiveDraftId,
      isLoading,
      showSettings, setShowSettings,
      alertConfig, showAlert, closeAlert,
      confirmConfig, showConfirm, closeConfirm,
      viewerIdx, openViewer, closeViewer, navigateViewer,
      mapCoords, openMapModal, closeMapModal,
      loadingOverlay, showLoadingOverlay, hideLoadingOverlay, setLoadingProgress,
      resetApp,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
