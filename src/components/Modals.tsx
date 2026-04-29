"use client";

import React, { useEffect, useRef } from 'react';
import { useAppContext } from '../lib/AppContext';

/* ═══════════════════════════════════════════════════════
   ALERT MODAL
═══════════════════════════════════════════════════════ */
function AlertModal() {
  const { alertConfig, closeAlert } = useAppContext();
  if (!alertConfig?.show) return null;

  const iconMap: Record<string, string> = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    warn: 'fa-triangle-exclamation',
  };

  return (
    <div id="al-ov" className="show" onClick={(e) => { if ((e.target as HTMLElement).id === 'al-ov') closeAlert(); }}>
      <div className="al-box">
        <button className="al-close" onClick={closeAlert}><i className="fas fa-times"></i></button>
        <div className={`al-ico ${alertConfig.type}`} id="al-ico">
          <i id="al-ico-i" className={`fas ${iconMap[alertConfig.type] || 'fa-info-circle'}`}></i>
        </div>
        <div className="al-title" id="al-title">{alertConfig.title}</div>
        <div className="al-msg" id="al-msg" dangerouslySetInnerHTML={{ __html: alertConfig.msg }}></div>
        <button className={`al-btn ${alertConfig.type}`} id="al-btn" onClick={closeAlert}>OK</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CONFIRM MODAL
═══════════════════════════════════════════════════════ */
function ConfirmModal() {
  const { confirmConfig, closeConfirm } = useAppContext();
  if (!confirmConfig?.show) return null;

  return (
    <div id="cf-ov" className="show" onClick={(e) => { if ((e.target as HTMLElement).id === 'cf-ov') closeConfirm(); }}>
      <div className="cf-box">
        <button className="cf-close" onClick={closeConfirm}><i className="fas fa-times"></i></button>
        <div className="al-ico warn"><i className="fas fa-triangle-exclamation"></i></div>
        <div className="al-title">{confirmConfig.title}</div>
        <div className="al-msg" dangerouslySetInnerHTML={{ __html: confirmConfig.msg }}></div>
        <div className="cf-acts">
          <button className="cf-btn batal" onClick={closeConfirm}>Batal</button>
          <button className="cf-btn hapus" onClick={() => {
            confirmConfig.onConfirm();
            closeConfirm();
          }}>Ya, Hapus</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   INITIAL LOADING OVERLAY (app startup)
═══════════════════════════════════════════════════════ */
function InitLoadingOverlay() {
  const { isLoading } = useAppContext();
  if (!isLoading) return null;
  return (
    <div id="ld-ov" style={{ display: 'flex' }}>
      <div className="ld-ring"><div className="ld-ico"><img src="/assets/icon-192.png" alt="" /></div></div>
      <div className="ld-body">
        <div id="ld-title">Menyiapkan Aplikasi...</div>
        <div id="ld-sub">Memuat data dari local storage...</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SUBMIT LOADING OVERLAY (multi-step progress bar)
═══════════════════════════════════════════════════════ */
function LoadingOverlay() {
  const { loadingOverlay } = useAppContext();
  if (!loadingOverlay.show) return null;

  const stepsMap = {
    submit: [
      { id: 'ls0', icon: 'fa-file-lines', label: 'Parse teks laporan' },
      { id: 'ls1', icon: 'fa-cloud-arrow-up', label: 'Transfer foto ke Drive' },
      { id: 'ls2', icon: 'fa-table-list', label: 'Tulis ke Spreadsheet' },
      { id: 'ls3', icon: 'fa-circle-check', label: 'Selesai' },
    ],
    draft_save: [
      { id: 'ds0', icon: 'fa-box-archive', label: 'Persiapan draft' },
      { id: 'ds1', icon: 'fa-cloud-arrow-up', label: 'Upload ke server' },
      { id: 'ds2', icon: 'fa-clipboard-check', label: 'Simpan ke sheet' },
      { id: 'ds3', icon: 'fa-check-double', label: 'Selesai' },
    ],
    draft_load: [
      { id: 'dl0', icon: 'fa-magnifying-glass', label: 'Mencari data draft' },
      { id: 'dl1', icon: 'fa-download', label: 'Mengunduh foto' },
      { id: 'dl2', icon: 'fa-receipt', label: 'Memuai teks laporan' },
      { id: 'dl3', icon: 'fa-folder-open', label: 'Selesai' },
    ]
  };

  const steps = stepsMap[loadingOverlay.type] || stepsMap.submit;

  return (
    <div id="ld-ov" className="show">
      <div className="ld-ring">
        <div className="ld-ico"><img src="/assets/icon-192.png" alt="" /></div>
      </div>
      <div className="ld-body">
        <div id="ld-title">
          {loadingOverlay.title}
          {loadingOverlay.progress > 0 && <span style={{fontSize:'0.8rem', marginLeft:'8px', color:'var(--blueb)'}}>{Math.round(loadingOverlay.progress)}%</span>}
        </div>
        <div id="ld-sub">{loadingOverlay.sub}</div>
        <div className="ld-bar">
          <div className="ld-fill" style={{ width: `${loadingOverlay.progress}%` }}></div>
        </div>
        <div className="ld-steps">
          {steps.map((s, i) => (
            <div
              key={s.id}
              className={`ls${i < loadingOverlay.step ? ' done' : i === loadingOverlay.step ? ' active' : ''}`}
            >
              <i className={`fas ${s.icon}`}></i>
              {s.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LIGHTBOX VIEWER
═══════════════════════════════════════════════════════ */
function LightboxViewer() {
  const { photos, viewerIdx, closeViewer, navigateViewer, openMapModal, state } = useAppContext();
  const touchStartX = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (viewerIdx === null) return;
      if (e.key === 'ArrowLeft') navigateViewer(-1);
      if (e.key === 'ArrowRight') navigateViewer(1);
      if (e.key === 'Escape') closeViewer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewerIdx]);

  if (viewerIdx === null) return null;

  const f = photos[viewerIdx];
  if (!f || f.processing || !f.data) return null;

  const pad = (n: number) => n < 10 ? '0' + n : String(n);
  const nowFull = () => {
    const n = new Date();
    return `${pad(n.getDate())}/${pad(n.getMonth() + 1)}/${n.getFullYear()} ${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`;
  };

  const title = `Foto ${viewerIdx + 1} / ${photos.length}${f.source === 'camera' ? ' [Kamera]' : ' [Galeri]'}`;
  const infoParts: string[] = [`${f.sizeKB > 1024 ? (f.sizeKB / 1024).toFixed(1) + 'MB' : f.sizeKB + 'KB'}`];
  if (f.compressed) infoParts.push('dikompres');
  if (f.source === 'camera' && f.exif?.gps) infoParts.push('GPS ✓ · QR ✓');
  const hasWM = f.source === 'camera' ? state.wmCam : state.wmGal;
  if (hasWM) infoParts.push('WM ✓');
  if (f.source === 'camera' && f.idbKey !== null && f.idbKey !== undefined) infoParts.push('💾 Tersimpan');
  if (f.fromDraft) infoParts.push('🌐 Dari Draft');
  const infoStr = infoParts.join(' · ');

  const hasMap = f.exif?.gps && state.minimap;
  const dlName = `SIPEDAS_Foto${viewerIdx + 1}_${nowFull().replace(/[\/\s:]/g, '-')}.jpg`;

  return (
    <div
      id="vw-ov"
      className="show"
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 50) navigateViewer(dx < 0 ? 1 : -1);
      }}
    >
      {/* Top bar */}
      <div className="vw-top">
        <span className="vw-ttl" id="vw-title">{title}</span>
        <button className="vw-close" onClick={closeViewer}><i className="fas fa-times"></i></button>
      </div>

      {/* Image */}
      <div className="vw-img-wrap">
        <img id="vw-img" src={f.data as string} alt={`Foto ${viewerIdx + 1}`} />
      </div>

      {/* Bottom bar */}
      <div className="vw-bot">
        <div className="vw-info" id="vw-info">
          {infoStr}
          {f.source === 'gallery' && f.exif?.gps && (
            <div style={{ fontSize: '0.75rem', marginTop: '6px', color: '#ffb84d' }}>
              <div style={{ marginBottom: '2px' }}>
                <i className="fas fa-location-crosshairs"></i> Lat {f.exif.gps.lat.toFixed(6)}, Long {f.exif.gps.lng.toFixed(6)}
              </div>
              {f.exifAddr?.full && (
                <div><i className="fas fa-map-location-dot"></i> {f.exifAddr.full}</div>
              )}
            </div>
          )}
        </div>
        <div className="vw-nav">
          {hasMap && (
            <button
              id="vw-map"
              className="vw-map-btn"
              title="Lihat di peta"
              onClick={() => openMapModal(viewerIdx)}
            >
              <i className="fas fa-map-location-dot"></i>
            </button>
          )}
          {!f.processing && (f.source === 'camera' || f.watermarked) && (
            <a
              id="vw-dl"
              className="vw-dl-btn"
              href={f.data as string}
              download={dlName}
              title="Download foto"
            >
              <i className="fas fa-download"></i>
            </a>
          )}
          <button
            id="vw-prev"
            onClick={() => navigateViewer(-1)}
            disabled={viewerIdx <= 0}
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <button
            id="vw-next"
            onClick={() => navigateViewer(1)}
            disabled={viewerIdx >= photos.length - 1}
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAP MODAL
═══════════════════════════════════════════════════════ */
function MapModal() {
  const { mapCoords, closeMapModal } = useAppContext();

  if (!mapCoords) return null;

  const { lat, lng, info } = mapCoords;
  const embedUrl = `https://www.google.com/maps?q=${lat},${lng}&output=embed&z=17`;
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <div
      id="map-modal"
      className="show"
      onClick={(e) => { if ((e.target as HTMLElement).id === 'map-modal') closeMapModal(); }}
    >
      <div className="map-box">
        <div className="map-head">
          <h3><i className="fas fa-map-location-dot"></i> Peta Lokasi Foto</h3>
          <button className="map-close" onClick={closeMapModal}><i className="fas fa-times"></i></button>
        </div>
        <div className="map-info-text" id="map-info-text" dangerouslySetInnerHTML={{ __html: info }}></div>
        <div className="map-iframe-wrap">
          <iframe id="map-iframe" src={embedUrl} allowFullScreen loading="lazy"></iframe>
        </div>
        <div className="map-footer">
          <button className="map-btn secondary" onClick={closeMapModal}>
            <i className="fas fa-times"></i> Tutup
          </button>
          <button
            className="map-btn primary"
            id="map-gmaps-btn"
            onClick={() => window.open(mapsUrl, '_blank')}
          >
            <i className="fas fa-external-link-alt"></i> Google Maps
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DRAFT MODAL — menerima semua props langsung
═══════════════════════════════════════════════════════ */
interface DraftItem {
  draftId: string;
  timestamp: string;
  jumlahFoto: number;
  danru?: string;
  teksPreview?: string;
  _deleting?: boolean;
}

function esc(s: string) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function DraftModal({
  show,
  onClose,
  draftLoading,
  draftLoadingMsg,
  draftList,
  onLoadDraft,
  onDeleteDraft,
}: {
  show: boolean;
  onClose: () => void;
  draftLoading: boolean;
  draftLoadingMsg: string;
  draftList: DraftItem[];
  onLoadDraft: (id: string) => void;
  onDeleteDraft: (id: string) => void;
}) {
  const { showConfirm } = useAppContext();

  const renderBody = () => {
    if (draftLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.4rem' }}></i>
          <br /><br />
          {draftLoadingMsg || 'Memuat daftar draft...'}
        </div>
      );
    }
    if (!draftList.length) {
      return (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)' }}>
          <i className="fas fa-inbox" style={{ fontSize: '2rem', opacity: .25, display: 'block', marginBottom: '12px' }}></i>
          Belum ada draft tersimpan di server.
        </div>
      );
    }
    return (
      <>
        {draftList.map(d => (
          <div
            key={d.draftId}
            className="draft-item"
            id={`di-${d.draftId}`}
            style={{ opacity: d._deleting ? 0.4 : 1, pointerEvents: d._deleting ? 'none' : 'auto' }}
          >
            <div className="draft-item-top">
              <span className="draft-badge"><i className="fas fa-clock"></i> {d.timestamp}</span>
              <span className="draft-badge draft-badge-cam"><i className="fas fa-camera"></i> {d.jumlahFoto} foto</span>
              {d.danru && d.danru !== '—' && (
                <span className="draft-badge draft-badge-danru">
                  <i className="fas fa-user-shield"></i> {esc(d.danru)}
                </span>
              )}
            </div>
            <div className="draft-item-teks">{d.teksPreview || '(Belum ada teks laporan)'}</div>
            <div className="draft-item-acts">
              <button className="draft-btn-load" onClick={() => onLoadDraft(d.draftId)}>
                <i className="fas fa-cloud-download-alt"></i> Load
              </button>
              <button className="draft-btn-del" onClick={() => {
                showConfirm(
                  'Hapus Draft',
                  'Yakin ingin menghapus draf ini secara permanen dari server?',
                  () => onDeleteDraft(d.draftId)
                );
              }}>
                {d._deleting
                  ? <><i className="fas fa-spinner fa-spin"></i> Menghapus...</>
                  : <><i className="fas fa-trash"></i> Hapus</>
                }
              </button>
            </div>
          </div>
        ))}
      </>
    );
  };

  return (
    <div
      id="draft-modal"
      className={show ? 'show' : ''}
      onClick={(e) => { if ((e.target as HTMLElement).id === 'draft-modal') onClose(); }}
    >
      <div className="draft-sheet">
        <div className="draft-sheet-handle"></div>
        <div className="draft-sheet-hd">
          <div className="draft-sheet-title">
            <i className="fas fa-cloud-download-alt"></i>
            Pilih Draft Tersimpan
          </div>
          <button className="draft-sheet-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="draft-sheet-body" id="draft-modal-body">
          {renderBody()}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MODALS ROOT — semua overlay di satu tempat
═══════════════════════════════════════════════════════ */
export default function Modals() {
  return (
    <>
      <InitLoadingOverlay />
      <LoadingOverlay />
      <AlertModal />
      <ConfirmModal />
      <LightboxViewer />
      <MapModal />
    </>
  );
}
