"use client";

import '@/styles/cctv.css';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

// ───────────────────────────────────────────────────────────
//  CHANNEL CONFIGURATION — Dahua DVR via Next.js Proxy
//  IP: 103.109.206.38 | User: publik | Pass: publik123
// ───────────────────────────────────────────────────────────

// Nama lokasi per-channel (sesuaikan dengan posisi kamera fisik)
const CHANNEL_LOCATIONS = [
  'Gerbang Utama',    // CH 1
  'Parkir Depan',     // CH 2
  'Lobby',            // CH 3
  'Koridor Kiri',     // CH 4
  'Koridor Kanan',    // CH 5
  'Tangga Utama',     // CH 6
  'Ruang Server',     // CH 7
  'Gudang',           // CH 8
  'Parkir Belakang',  // CH 9
  'Gerbang Belakang', // CH 10
  'Pos Satpam',       // CH 11
  'Area Publik',      // CH 12
];

const DEFAULT_CHANNELS: Channel[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `CH ${i + 1} — ${CHANNEL_LOCATIONS[i] || 'Channel ' + (i + 1)}`,
  url: `http://103.109.206.38:80/cgi-bin/snapshot.cgi?channel=${i + 1}`,
  type: 'snapshot-fast' as StreamType,
  location: CHANNEL_LOCATIONS[i] || `Lokasi ${i + 1}`,
  active: true,
}));

type StreamType = 'snapshot-fast' | 'hls' | 'dahua-proxy';

interface Channel {
  id: number;
  name: string;
  url: string;
  type: StreamType;
  location: string;
  active: boolean;
}

const STORAGE_KEY = 'sipedas_cctv_channels_v3';

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
//  Helpers: menentukan cara render stream berdasarkan URL
// ───────────────────────────────────────────────────────────
function detectType(url: string): StreamType {
  if (!url) return 'snapshot-fast';
  if (url.includes('m3u8')) return 'hls';
  if (url.includes('cctv-proxy')) return 'dahua-proxy';
  return 'snapshot-fast';
}


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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imgKey, setImgKey] = useState(Date.now());

  // Refresh intervals
  let refreshMs = 200; // Default fast snapshot 200ms (5 FPS)
  if (ch.type === 'dahua-proxy') refreshMs = 2000;

  useEffect(() => {
    if (ch.type === 'snapshot-fast' || ch.type === 'dahua-proxy') {
      setErr(false);
      setLoading(true);
      const iv = setInterval(() => setImgKey(Date.now()), refreshMs);
      return () => clearInterval(iv);
    }
  }, [ch.type, ch.url, refreshMs]);

  useEffect(() => {
    setErr(false);
    setLoading(true);
    // HLS via native <video> | require hls.js for full support
    if (ch.url && ch.type === 'hls') {
      const vid = videoRef.current;
      if (!vid) return;
      if (vid.canPlayType('application/vnd.apple.mpegurl')) {
        vid.src = ch.url;
        vid.play().catch(() => { });
      } else {
        // Dynamically load hls.js from CDN
        if ((window as any).Hls) {
          const Hls = (window as any).Hls;
          if (Hls.isSupported()) {
            const hls = new Hls({ enableWorker: false });
            hls.loadSource(ch.url);
            hls.attachMedia(vid);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              vid.play().catch(() => { });
            });
            hls.on(Hls.Events.ERROR, () => setErr(true));
            return () => hls.destroy();
          }
        } else {
          // Fallback: load hls.js script
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js';
          s.onload = () => {
            const Hls = (window as any).Hls;
            if (Hls && Hls.isSupported() && vid) {
              const hls = new Hls({ enableWorker: false });
              hls.loadSource(ch.url);
              hls.attachMedia(vid);
              hls.on(Hls.Events.MANIFEST_PARSED, () => vid.play().catch(() => { }));
              hls.on(Hls.Events.ERROR, () => setErr(true));
            }
          };
          document.head.appendChild(s);
        }
      }
    }
  }, [ch.url, ch.type]);

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
          <button onClick={(e) => { e.stopPropagation(); setErr(false); setLoading(true); }}>
            <i className="fas fa-redo" /> Retry
          </button>
        </div>
      );
    }

    const type = ch.type === 'hls' ? (detectType(ch.url) !== 'hls' ? detectType(ch.url) : 'hls') : ch.type;

    // DIRECT SNAPSHOT FAST (seperti script setInterval dari user)
    if (type === 'snapshot-fast') {
      const snapUrl = ch.url.includes('?') ? `${ch.url}&t=${imgKey}` : `${ch.url}?t=${imgKey}`;
      return (
        <img
          key={imgKey}
          src={snapUrl}
          alt={ch.name}
          style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000', display: 'block' }}
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setErr(true); }}
        />
      );
    }

    // DAHUA PROXY — snapshot via /api/cctv-proxy
    if (type === 'dahua-proxy') {
      const proxyUrl = ch.url.includes('?') ? `${ch.url}&_t=${imgKey}` : `${ch.url}?_t=${imgKey}`;
      return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <img
            key={imgKey}
            src={proxyUrl}
            alt={ch.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#07111e' }}
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setErr(true); }}
          />
          {/* Timestamp overlay */}
          <span style={{
            position: 'absolute', bottom: '28px', right: '6px',
            fontFamily: 'monospace', fontSize: '0.55rem',
            color: 'rgba(255,255,0,0.7)', letterSpacing: '0.04em',
            textShadow: '0 1px 3px rgba(0,0,0,0.9)',
            pointerEvents: 'none',
          }}>
            {new Date().toLocaleTimeString('id-ID')}
          </span>
        </div>
      );
    }

    // HLS / native video
    return (
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#000' }}
        onCanPlay={() => setLoading(false)}
        onError={() => setErr(true)}
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
              onChange={e => setForm(p => ({ ...p, url: e.target.value, type: detectType(e.target.value) }))}
              placeholder="https://... (.m3u8 / .mp4 / YouTube / IP cam URL)"
            />
          </div>
          <div className="cctv-field">
            <label>Tipe Stream</label>
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as StreamType }))}>
              <option value="snapshot-fast">Direct Snapshot (Default) — Refresh Cepat (200ms)</option>
              <option value="hls">HLS (.m3u8) — Opsi Cadangan Video Asli</option>
              <option value="dahua-proxy">Dahua Proxy — Gunakan ini jika error CORS/HTTPS</option>
            </select>
            <div className="cctv-field-hint">
              {form.type === 'snapshot-fast' && '⚡ Mode ringan & cepat. Refresh 5 kali per detik. Sangat responsif langsung dari DVR.'}
              {form.type === 'hls' && '🎥 Video HLS Cadangan. Hemat data tapi mungkin beda 10 detik dari aslinya.'}
              {form.type === 'dahua-proxy' && '🛡️ Bypass server. Resolusi sama tapi difilter Next.js agar tidak diblokir browser.'}
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
          <CameraCell
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

      {/* MULTI-CHANNEL SELECTOR BAR */}
      <div className="cctv-ch-bar" style={{ padding: '12px 10px', justifyContent: 'center' }}>
        {channels.map(ch => (
          <button
            key={ch.id}
            className={`cctv-ch-btn${activeChannelId === ch.id ? ' active' : ''}${ch.active && ch.url ? ' live' : ''}`}
            onClick={() => setActiveChannelId(ch.id)}
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
