"use client";

import React, { useRef, useState } from 'react';
import { useAppContext } from '../lib/AppContext';
import { useFileHandler } from '../lib/useFileHandler';
import { idbDeletePhoto } from '../lib/idb';

export default function PhotoManager({
  onSaveDraft,
  onLoadDraft,
  savingDraft,
}: {
  onSaveDraft: () => void;
  onLoadDraft: () => void;
  savingDraft: boolean;
}) {
  const { photos, setPhotos, state, activeDraftId, openViewer, openMapModal, showConfirm, resetApp } = useAppContext();
  const fileHandler = useFileHandler();

  const fgRef = useRef<HTMLInputElement>(null);
  const fcRef = useRef<HTMLInputElement>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const MAX = 10;

  const handleDelete = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const f = photos[idx];
    if (f && f.idbKey !== null && f.idbKey !== undefined) {
      idbDeletePhoto(f.idbKey);
    }
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  // ───────────────────────────────────────────────────────────
  //  DRAG & DROP HANDLERS
  // ───────────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, idx: number) => {
    if (photos[idx].processing) {
      e.preventDefault();
      return;
    }
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent ghost image fix for some browsers
    const target = e.currentTarget as HTMLElement;
    target.classList.add('is-dragging');
  };

  const handleDragEnter = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) return;
    
    const newPhotos = [...photos];
    const draggedItem = newPhotos[draggedIdx];
    newPhotos.splice(draggedIdx, 1);
    newPhotos.splice(idx, 0, draggedItem);
    
    setDraggedIdx(idx);
    setPhotos(newPhotos);
  };

  const handleDragEnd = async (e: React.DragEvent) => {
    setDraggedIdx(null);
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('is-dragging');

    // Persist new order
    const { idbUpdatePhoto } = await import('../lib/idb');
    const updated = photos.map((p, i) => ({ ...p, order: i }));
    setPhotos(updated);
    for (const p of updated) {
      if (p.idbKey !== null) await idbUpdatePhoto(p);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDownload = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const f = photos[idx];
    if (!f?.data) return;
    const pad = (n: number) => n < 10 ? '0' + n : String(n);
    const d = new Date();
    const ts = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
    const a = document.createElement('a');
    a.href = f.data as string;
    a.download = `SIPEDAS_Foto${idx + 1}_${ts}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleMapClick = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    openMapModal(idx);
  };

  const getTag = (f: ReturnType<typeof useAppContext>['photos'][number]) => {
    if (f.fromDraft) return { cls: 'foto-tag tag-draft', label: '🌐DRAFT' };
    if (f.source === 'camera' && f.exif?.gps) return { cls: 'foto-tag tag-exif', label: f.idbKey != null ? '💾EXIF+QR' : 'EXIF+QR' };
    if (f.source === 'camera') return { cls: 'foto-tag tag-cam', label: f.idbKey != null ? '💾📷WM' : '📷WM' };
    if (f.source === 'gallery' && f.exif?.gps) return { cls: 'foto-tag tag-exif', label: '🖼WM(OCR)' };
    if (f.compressed) return { cls: 'foto-tag tag-comp', label: '↓400KB' };
    return { cls: 'foto-tag tag-gal', label: '🖼WM' };
  };

  return (
    <div className="card">
      <div className="card-head">
        <div className="ci ci-gold"><i className="fas fa-camera"></i></div>
        <h3>Dokumentasi Foto</h3>
        <span className="badge-cnt" id="foto-cnt-hd">{photos.length} / {MAX}</span>
      </div>
      <div className="card-body">

        {/* Tombol pilih foto */}
        <div className="upload-zone">
          <button className="up-btn gal" onClick={() => fgRef.current?.click()}>
            <i className="fas fa-images"></i>
            <span className="up-main">Galeri</span>
            <span className="up-note">Kompres + WM Manual</span>
          </button>
          <button className="up-btn cam" onClick={() => fcRef.current?.click()}>
            <i className="fas fa-camera"></i>
            <span className="up-main">Kamera</span>
            <span className="up-note">EXIF + QR + WM Jalan</span>
          </button>
        </div>

        <input
          type="file" id="fg" ref={fgRef} accept="image/*" multiple
          onChange={(e) => { if (e.target.files) fileHandler.handleFiles(e.target.files, 'gallery'); e.target.value = ''; }}
          style={{ display: 'none' }}
        />
        <input
          type="file" id="fc" ref={fcRef} accept="image/*" capture="environment"
          onChange={(e) => { if (e.target.files) fileHandler.handleFiles(e.target.files, 'camera'); e.target.value = ''; }}
          style={{ display: 'none' }}
        />

        {/* Info bar */}
        <div className="info-bar">
          <i className="fas fa-circle-info"></i>
          <span>Kamera: EXIF GPS + QR · Galeri: Kompres + Watermark · &gt;400KB dikompres · Kamera: bisa Transfer ke server</span>
        </div>

        {/* Counter */}
        <div className="foto-ctr" id="foto-ctr">
          {photos.length === 0
            ? <span>Belum ada foto — <b>Wajib</b> minimal 1 foto</span>
            : <span><b>{photos.length}</b> foto dipilih{photos.length >= MAX ? <span style={{ color: '#fbbf24' }}> (maks)</span> : null}</span>
          }
        </div>

        {/* Grid foto */}
        <div className="foto-grid" id="foto-grid">
          {photos.length === 0 && (
            <div className="empty-foto">
              <i className="fas fa-photo-film"></i>
              Foto yang dipilih muncul di sini
            </div>
          )}
          {photos.map((f, i) => {
            const tag = getTag(f);
            const hasMap = f.exif?.gps && state.minimap;
            return (
              <div
                key={f.id}
                className={`foto-item${draggedIdx === i ? ' dragging' : ''}`}
                draggable={!f.processing}
                onDragStart={(e) => handleDragStart(e, i)}
                onDragEnter={() => handleDragEnter(i)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onClick={() => { if (!f.processing) openViewer(i); }}
              >
                {f.processing ? (
                  <div className="foto-proc">
                    <i className="fas fa-spinner fa-spin"></i>
                    <span className="plabel">{f.procLabel || 'Memproses...'}</span>
                  </div>
                ) : (
                  <>
                    <img src={f.data as string} alt={`Foto ${i + 1}`} />
                    <div className="foto-hover"><i className="fas fa-expand-alt"></i></div>

                    {/* Badge tag pojok kiri atas */}
                    <div className={tag.cls}>{tag.label}</div>

                    {/* Hapus / Batal (Hanya muncul setelah selesai proses) */}
                    <button
                      className="foto-del"
                      onClick={(e) => {
                        e.stopPropagation();
                        showConfirm(
                          'Hapus Foto',
                          'Yakin ingin menghapus foto ini secara permanen dari daftar?',
                          () => {
                            if (f.idbKey !== null && f.idbKey !== undefined) idbDeletePhoto(f.idbKey);
                            setPhotos(prev => prev.filter(p => p.id !== f.id));
                          }
                        );
                      }}
                      title="Hapus foto"
                    >
                      <i className="fas fa-times"></i>
                    </button>

                    {/* Nomor urut */}
                    <div className="foto-num">{i + 1}</div>

                    {/* Ukuran file */}
                    <div className="foto-sz">
                      {f.sizeKB > 1024 ? (f.sizeKB / 1024).toFixed(1) + 'MB' : f.sizeKB + 'KB'}
                    </div>

                    {/* Tombol download (kamera / galeri berwatermark) */}
                    {!f.processing && (f.source === 'camera' || f.watermarked) && (
                      <button className="foto-dl-btn" title="Unduh foto ini" onClick={(e) => handleDownload(i, e)}>
                        <i className="fas fa-download"></i>
                      </button>
                    )}

                    {/* Tombol peta (kamera + GPS + minimap on) */}
                    {hasMap && (
                      <button className="foto-map-btn" title="Lihat di peta" onClick={(e) => handleMapClick(i, e)}>
                        <i className="fas fa-map-location-dot"></i>
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Draft Action Row */}
        <div className="draft-action-row">
          <button
            className="btn-draft-save"
            id="btn-save-draft"
            onClick={onSaveDraft}
            disabled={savingDraft}
          >
            {savingDraft
              ? <><i className="fas fa-spinner fa-spin"></i> Transfer...</>
              : <><i className="fas fa-right-left"></i> Transfer</>
            }
          </button>
          
          <button 
            className="btn-draft-reset" 
            onClick={() => showConfirm('Reset Laporan', 'Hapus semua foto dan teks laporan ini?', resetApp)}
          >
             <i className="fas fa-trash-can"></i> Reset
          </button>

          <button className="btn-draft-load" onClick={onLoadDraft}>
            <i className="fas fa-cloud-download-alt"></i> Load
          </button>
        </div>

      </div>
    </div>
  );
}
