"use client";

import React from 'react';

interface DraftItem {
  draftId: string;
  timestamp: string;
  jumlahFoto: number;
  danru?: string;
  teksPreview?: string;
  _deleting?: boolean;
}

function esc(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default function DraftModalContent({
  loading,
  loadingMsg,
  drafts,
  onLoad,
  onDelete,
}: {
  loading: boolean;
  loadingMsg: string;
  drafts: DraftItem[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.4rem' }}></i>
        <br /><br />
        {loadingMsg || 'Memuat daftar draft...'}
      </div>
    );
  }

  if (!drafts.length) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)' }}>
        <i className="fas fa-inbox" style={{ fontSize: '2rem', opacity: .25, display: 'block', marginBottom: '12px' }}></i>
        Belum ada draft tersimpan di server.
      </div>
    );
  }

  return (
    <>
      {drafts.map(d => (
        <div
          key={d.draftId}
          className="draft-item"
          id={`di-${d.draftId}`}
          style={{ opacity: d._deleting ? 0.4 : 1, pointerEvents: d._deleting ? 'none' : 'auto' }}
        >
          <div className="draft-item-top">
            <span className="draft-badge">
              <i className="fas fa-clock"></i> {d.timestamp}
            </span>
            <span className="draft-badge draft-badge-cam">
              <i className="fas fa-camera"></i> {d.jumlahFoto} foto
            </span>
            {d.danru && d.danru !== '—' && (
              <span className="draft-badge draft-badge-danru">
                <i className="fas fa-user-shield"></i> {esc(d.danru)}
              </span>
            )}
          </div>
          <div className="draft-item-teks">
            {d.teksPreview || '(Belum ada teks laporan)'}
          </div>
          <div className="draft-item-acts">
            <button className="draft-btn-load" onClick={() => onLoad(d.draftId)}>
              <i className="fas fa-cloud-download-alt"></i> Load & Hapus
            </button>
            <button className="draft-btn-del" onClick={() => {
              if (window.confirm('Yakin ingin menghapus draf ini secara permanen?')) {
                onDelete(d.draftId);
              }
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
}
