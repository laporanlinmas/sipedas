"use client";

import '@/styles/cctv.css';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

// ───────────────────────────────────────────────────────────
//  CHANNEL CONFIGURATION — Dahua DVR via Next.js Proxy
//  IP: 103.109.206.38 | User: publik | Pass: publik123
// ───────────────────────────────────────────────────────────

const DEFAULT_CHANNELS: Channel[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `Kamera ${i + 1}`,
  url: `/api/cctv-proxy?ch=${i + 1}`,
  type: 'snapshot' as StreamType,
  location: `Lokasi ${i + 1}`,
  active: true,
}));

type StreamType = 'snapshot';

interface Channel {
  id: number;
  name: string;
  url: string;
  type: StreamType;
  location: string;
  active: boolean;
}

const STORAGE_KEY = 'sipedas_cctv_channels_v11';

function loadChannels(): Channel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved: Partial<Channel>[] = JSON.parse(raw);
      return DEFAULT_CHANNELS.map((def, i) => ({
        ...def,
        ...(saved[i] || {}),
        id: i + 1,
      }));
    }
  } catch { }
  return DEFAULT_CHANNELS;
}

function saveChannels(channels: Channel[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(channels));
  } catch { }
}

// ───────────────────────────────────────────────────────────
//  Single Camera Cell
// ───────────────────────────────────────────────────────────
function CameraCell({
  ch,
  isFocused,
  onClick,
  showOverlay,
}: {
  ch: Channel;
  isFocused: boolean;
  onClick: () => void;
  showOverlay: boolean;
}) {
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);
  const loadingRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setUrl = () => {
    if (imgRef.current && ch.url) {
      const sep = ch.url.includes('?') ? '&' : '?';
      imgRef.current.src = `${ch.url}${sep}_t=${Date.now()}`;
    }
  };

  useEffect(() => {
    loadingRef.current = true;
    setLoading(true);
    setErr(false);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (!ch.url || !ch.active) {
      setLoading(false);
      return;
    }

    setUrl();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ch.url, ch.active]);

  const handleLoad = () => {
    if (loadingRef.current) {
      loadingRef.current = false;
      setLoading(false);
    }
    // Schedule NEXT frame only AFTER current finishes loading
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(setUrl, 333);
  };

  const handleError = () => {
    if (loadingRef.current) {
      loadingRef.current = false;
      setLoading(false);
      setErr(true);
    } else {
      // Jika nyangkut saat sudah berjalan, coba refresh pelan-pelan tanpa error layarnya
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(setUrl, 2000);
    }
  };

  const renderStream = () => {
    if (!ch.url || !ch.active) {
      return (
        <div className="cctv-offline">
          <i className="fas fa-video-slash" />
          <span>{ch.active ? 'URL kosong' : 'Channel Nonaktif'}</span>
          <span className="cctv-offline-hint">Klik ⚙ untuk konfigurasi</span>
        </div>
      );
    }

    if (err) {
      return (
        <div className="cctv-error">
          <i className="fas fa-exclamation-triangle" />
          <span>Gagal memuat stream</span>
          <button onClick={(e) => {
            e.stopPropagation();
            loadingRef.current = true;
            setErr(false);
            setLoading(true);
            if (imgRef.current) {
              const sep = ch.url.includes('?') ? '&' : '?';
              imgRef.current.src = `${ch.url}${sep}_t=${Date.now()}`;
            }
          }}>
            <i className="fas fa-redo" /> Retry
          </button>
        </div>
      );
    }

    return (
      <img
        ref={imgRef}
        alt={ch.name}
        style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000', display: 'block' }}
        onLoad={handleLoad}
        onError={handleError}
      />
    );
  };

  return (
    <div
      className={`cctv-cell${isFocused ? ' focused' : ''}${ch.active && ch.url ? ' live' : ''}`}
      onClick={onClick}
    >
      {loading && ch.active && ch.url && !err && (
        <div className="cctv-loading">
          <div className="cctv-spinner" />
        </div>
      )}
      {renderStream()}
      {showOverlay && (
        <div className="cctv-cell-overlay">
          <div className="cctv-cell-badge">
            {ch.active && ch.url && <span className="cctv-live-dot" />}
            <span>CH {ch.id}</span>
          </div>
          <div className="cctv-cell-name">{ch.name}</div>
          <div className="cctv-cell-loc">
            <i className="fas fa-map-marker-alt" /> {ch.location}
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────
//  Settings Modal per-Channel
// ───────────────────────────────────────────────────────────
function ChannelSettings({
  ch,
  onSave,
  onClose,
}: {
  ch: Channel;
  onSave: (updated: Channel) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Channel>({ ...ch });

  return (
    <div className="cctv-modal-bg" onClick={(e) => { if ((e.target as HTMLElement).classList.contains('cctv-modal-bg')) onClose(); }}>
      <div className="cctv-modal">
        <div className="cctv-modal-head">
          <div className="cctv-modal-title">
            <i className="fas fa-video" /> Konfigurasi Channel {ch.id}
          </div>
          <button className="cctv-modal-close" onClick={onClose}><i className="fas fa-times" /></button>
        </div>
        <div className="cctv-modal-body">
          <div className="cctv-field">
            <label>Nama Channel</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Contoh: Gerbang Utama" />
          </div>
          <div className="cctv-field">
            <label>Lokasi</label>
            <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Contoh: Jl. Merdeka No. 1" />
          </div>
          <div className="cctv-field">
            <label>URL Stream / Sumber Video</label>
            <input
              value={form.url}
              onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
              placeholder="https://... (.m3u8 / .mp4 / YouTube / IP cam URL)"
            />
          </div>
          <div className="cctv-field">
            <label>Tipe Stream</label>
            <div style={{ padding: '10px', background: 'rgba(41, 121, 245, 0.1)', border: '1px solid var(--blue)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.85rem' }}>
              <strong><i className="fas fa-camera"></i> Direct Snapshot (3 FPS)</strong>
              <div style={{ color: 'var(--green)', marginTop: '4px', fontSize: '0.75rem' }}>✓ Gambar Langsung dari DVR</div>
            </div>
            <div className="cctv-field-hint" style={{ marginTop: '8px' }}>
              Sistem akan memanggil gambar langsung dari IP CCTV setiap 333ms.
            </div>
          </div>
          <div className="cctv-field-toggle">
            <span>Channel Aktif</span>
            <label className="cctv-toggle">
              <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} />
              <span className="cctv-toggle-track"><span className="cctv-toggle-knob" /></span>
            </label>
          </div>
          {form.url && (
            <div className="cctv-url-preview">
              <i className="fas fa-link" /> <span>{form.url.length > 60 ? form.url.slice(0, 60) + '…' : form.url}</span>
              <span className="cctv-type-badge">{form.type.toUpperCase()}</span>
            </div>
          )}
        </div>
        <div className="cctv-modal-foot">
          <button className="cctv-btn-cancel" onClick={onClose}>Batal</button>
          <button className="cctv-btn-save" onClick={() => { onSave(form); onClose(); }}>
            <i className="fas fa-save" /> Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
//  MAIN CCTV PAGE
// ───────────────────────────────────────────────────────────
export default function CCTVPage() {
  const [channels, setChannels] = useState<Channel[]>(DEFAULT_CHANNELS);
  const [activeChannelId, setActiveChannelId] = useState<number>(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [clock, setClock] = useState('');

  // Load from localStorage
  useEffect(() => {
    setChannels(loadChannels());
  }, []);

  // Live clock
  useEffect(() => {
    const tick = () => {
      setClock(new Date().toLocaleString('id-ID', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }));
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  const saveChannel = (updated: Channel) => {
    setChannels(prev => {
      const next = prev.map(c => c.id === updated.id ? updated : c);
      saveChannels(next);
      return next;
    });
  };

  const toggleFocus = () => {
    // Legacy support, now we strictly use activeChannelId
  };

  const nextChannel = () => {
    setActiveChannelId(prev => (prev % channels.length) + 1);
  };

  const prevChannel = () => {
    setActiveChannelId(prev => prev === 1 ? channels.length : prev - 1);
  };

  const activeCount = channels.filter(c => c.active && c.url).length;
  const editingChannel = editingId !== null ? channels.find(c => c.id === editingId) : null;
  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];

  return (
    <div className="cctv-page">
      {/* TOP BAR */}
      <div className="cctv-topbar">
        <div className="cctv-topbar-left">
          <Link href="/" className="cctv-back-btn">
            <i className="fas fa-arrow-left" />
          </Link>
          <div className="cctv-topbar-brand">
            <i className="fas fa-tv" />
            <div>
              <div className="cctv-topbar-title">CCTV Monitor</div>
              <div className="cctv-topbar-sub">SI-PEDAS Satlinmas</div>
            </div>
          </div>
        </div>
        <div className="cctv-topbar-right">
          <div className="cctv-clock">{clock}</div>
          <div className="cctv-status-badge">
            <span className={`cctv-status-dot ${activeCount > 0 ? 'online' : 'offline'}`} />
            {activeCount}/{channels.length} Live
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="cctv-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="cctv-nav-btn" onClick={prevChannel}>
            <i className="fas fa-chevron-left" /> Prev
          </button>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#e2e8f0', margin: '0 5px' }}>
            {activeChannel.name}
          </span>
          <button className="cctv-nav-btn" onClick={nextChannel}>
            Next <i className="fas fa-chevron-right" />
          </button>
        </div>
        <div className="cctv-toolbar-right">
          <button
            className={`cctv-overlay-btn${showOverlay ? ' active' : ''}`}
            onClick={() => setShowOverlay(p => !p)}
            title="Toggle Info Overlay"
          >
            <i className={`fas ${showOverlay ? 'fa-eye' : 'fa-eye-slash'}`} /> Info
          </button>
        </div>
      </div>

      {/* SINGLE CHANNEL VIEWER */}
      <div className="cctv-grid cctv-grid-1">
        <div className="cctv-cell-wrap">
          {/* key=activeChannelId: force remount saat channel berganti agar gambar ikut berganti */}
          <CameraCell
            key={activeChannelId}
            ch={activeChannel}
            isFocused={true}
            onClick={() => { }}
            showOverlay={showOverlay}
          />
          <button
            className="cctv-config-btn"
            onClick={e => { e.stopPropagation(); setEditingId(activeChannel.id); }}
            title="Konfigurasi Channel"
          >
            <i className="fas fa-gear" />
          </button>
          {activeChannel.active && activeChannel.url && (
            <div className="cctv-live-badge">
              <span className="cctv-live-dot" /> LIVE
            </div>
          )}
        </div>
      </div>

      {/* MULTI-CHANNEL SELECTOR BAR — horizontal scroll untuk mobile */}
      <div className="cctv-ch-bar" style={{
        padding: '10px 8px',
        overflowX: 'auto',
        flexWrap: 'nowrap',
        justifyContent: 'flex-start',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        gap: '6px',
      }}>
        {channels.map(ch => (
          <button
            key={ch.id}
            className={`cctv-ch-btn${activeChannelId === ch.id ? ' active' : ''}${ch.active && ch.url ? ' live' : ''}`}
            onClick={() => setActiveChannelId(ch.id)}
            style={{ flexShrink: 0 }}
          >
            {ch.active && ch.url && <span className="cctv-live-dot-sm" />}
            CH {ch.id}
          </button>
        ))}
      </div>

      {/* SETTINGS MODAL */}
      {editingChannel && (
        <ChannelSettings
          ch={editingChannel}
          onSave={saveChannel}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
