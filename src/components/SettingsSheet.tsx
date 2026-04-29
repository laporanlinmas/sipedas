"use client";

import React, { useState } from 'react';
import { useAppContext } from '../lib/AppContext';
import { defaultState } from '../lib/types';

export default function SettingsSheet() {
  const { showSettings, setShowSettings, state, setState } = useAppContext();
  const [openSection, setOpenSection] = useState<string | null>(null);

  const togColl = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const handleToggle = (key: 'wmCam' | 'wmGal' | 'minimap' | 'ocrGal') => {
    setState(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLocChange = (field: keyof typeof state.loc, value: string) => {
    setState(prev => ({ ...prev, loc: { ...prev.loc, [field]: value } }));
  };

  const handleCoordChange = (field: 'lat' | 'lng', value: string) => {
    setState(prev => ({ ...prev, [field]: value }));
  };

  const resetLoc = () => {
    setState(prev => ({
      ...prev,
      loc: { ...prev.loc, jalan: '', nodukuh: '', desa: '', kec: '', kab: 'Ponorogo', prov: 'Jawa Timur' },
      lat: '', lng: ''
    }));
  };

  return (
    <div id="set-ov" className={showSettings ? 'show' : ''} onClick={(e) => {
      if ((e.target as HTMLElement).id === 'set-ov') setShowSettings(false);
    }}>
      <div className="set-sheet">
        <div className="set-handle"></div>
        <div className="set-hdr">
          <h2><i className="fas fa-gear"></i> Pengaturan</h2>
          <button className="set-close" onClick={() => setShowSettings(false)}><i className="fas fa-times"></i></button>
        </div>
        <div className="set-body">

          {/* ── Tampilan Toggle ── */}
          <div className="set-sec">
            <div className="set-sec-ttl">Tampilan</div>
            <div className="tog-row">
              <div className="tog-left">
                <i className={`fas ${state.theme === 'dark' ? 'fa-moon' : 'fa-sun'}`} style={{ color: state.theme === 'dark' ? '#ffd43b' : '#ff9500' }}></i>
                <div className="tog-info">
                  <div className="tl">Mode {state.theme === 'dark' ? 'Gelap' : 'Terang'}</div>
                  <div className="ts">Ganti tema aplikasi</div>
                </div>
              </div>
              <label className="tog-sw">
                <input 
                  type="checkbox" 
                  checked={state.theme === 'light'} 
                  onChange={() => setState(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }))} 
                />
                <div className="ts-track"><div className="ts-knob"></div></div>
              </label>
            </div>
          </div>

          {/* ── Fitur Toggle ── */}
          <div className="set-sec">
            <div className="set-sec-ttl">Fitur</div>

            <div className="tog-row">
              <div className="tog-left">
                <i className="fas fa-camera" style={{ color: 'var(--gold)' }}></i>
                <div className="tog-info">
                  <div className="tl">Watermark Foto Kamera</div>
                  <div className="ts">Cap otomatis + QR pada foto kamera</div>
                </div>
              </div>
              <label className="tog-sw">
                <input type="checkbox" checked={state.wmCam} onChange={() => handleToggle('wmCam')} />
                <div className="ts-track"><div className="ts-knob"></div></div>
              </label>
            </div>

            <div className="tog-row">
              <div className="tog-left">
                <i className="fas fa-images" style={{ color: '#7ab3ff' }}></i>
                <div className="tog-info">
                  <div className="tl">Watermark Foto Galeri</div>
                  <div className="ts">Cap otomatis pada foto dari galeri</div>
                </div>
              </div>
              <label className="tog-sw">
                <input type="checkbox" checked={state.wmGal} onChange={() => handleToggle('wmGal')} />
                <div className="ts-track"><div className="ts-knob"></div></div>
              </label>
            </div>

            <div className="tog-row">
              <div className="tog-left">
                <i className="fas fa-search-location" style={{ color: '#ffb84d' }}></i>
                <div className="tog-info">
                  <div className="tl">Deteksi Lokasi (OCR) Galeri</div>
                  <div className="ts">Ekstrak kordinat dari teks gambar</div>
                </div>
              </div>
              <label className="tog-sw">
                <input type="checkbox" checked={state.ocrGal} onChange={() => handleToggle('ocrGal')} />
                <div className="ts-track"><div className="ts-knob"></div></div>
              </label>
            </div>

            <div className="tog-row">
              <div className="tog-left">
                <i className="fas fa-map-location-dot" style={{ color: 'var(--green)' }}></i>
                <div className="tog-info">
                  <div className="tl">Mini Map Lokasi</div>
                  <div className="ts">Tampilkan peta dari koordinat EXIF</div>
                </div>
              </div>
              <label className="tog-sw">
                <input type="checkbox" checked={state.minimap} onChange={() => handleToggle('minimap')} />
                <div className="ts-track"><div className="ts-knob"></div></div>
              </label>
            </div>
          </div>

          {/* ── Lokasi Manual ── */}
          <div className="set-sec">
            <div className="set-sec-ttl">Lokasi Manual (Fallback Kamera &amp; Galeri)</div>
            <div className={`coll-hdr ${openSection === 'loc' ? 'open' : ''}`} onClick={() => togColl('loc')}>
              <div className="coll-ttl"><i className="fas fa-map-pin"></i> Input Lokasi Manual</div>
              <i className="fas fa-chevron-down coll-arr"></i>
            </div>
            <div className={`coll-body ${openSection === 'loc' ? 'open' : ''}`}>
              <div className="loc-grid">
                <div className="loc-row"><span className="loc-lbl">Jalan</span><input className="loc-inp" type="text" placeholder="Nama jalan / gang" value={state.loc.jalan} onChange={e => handleLocChange('jalan', e.target.value)} /></div>
                <div className="loc-row"><span className="loc-lbl">No/Dukuh</span><input className="loc-inp" type="text" placeholder="No.xx / Dukuh xx" value={state.loc.nodukuh} onChange={e => handleLocChange('nodukuh', e.target.value)} /></div>
                <div className="loc-row"><span className="loc-lbl">Desa/Kel</span><input className="loc-inp" type="text" placeholder="Desa / Kelurahan" value={state.loc.desa} onChange={e => handleLocChange('desa', e.target.value)} /></div>
                <div className="loc-row"><span className="loc-lbl">Kecamatan</span><input className="loc-inp" type="text" placeholder="Kecamatan" value={state.loc.kec} onChange={e => handleLocChange('kec', e.target.value)} /></div>
                <div className="loc-row"><span className="loc-lbl">Kabupaten</span><input className="loc-inp" type="text" value={state.loc.kab} onChange={e => handleLocChange('kab', e.target.value)} /></div>
                <div className="loc-row"><span className="loc-lbl">Provinsi</span><input className="loc-inp" type="text" value={state.loc.prov} onChange={e => handleLocChange('prov', e.target.value)} /></div>
                <div className="loc-row"><span className="loc-lbl">Negara</span><span className="loc-flag">🇮🇩</span><input className="loc-inp" type="text" value="Indonesia" disabled /></div>
              </div>
              <div className="coord-row">
                <div className="coord-box"><span className="coord-lbl">Lat Manual</span><input type="text" placeholder="-7.8659..." value={state.lat} onChange={e => handleCoordChange('lat', e.target.value)} /></div>
                <div className="coord-box"><span className="coord-lbl">Lng Manual</span><input type="text" placeholder="111.4649..." value={state.lng} onChange={e => handleCoordChange('lng', e.target.value)} /></div>
              </div>
              <button className="btn-reset" onClick={resetLoc}>
                <i className="fas fa-rotate-left"></i> Reset Semua Field Lokasi
              </button>
            </div>
          </div>

          {/* ── Panduan Penggunaan ── */}
          <div className="set-sec">
            <div className="set-sec-ttl">Panduan</div>
            <div className={`coll-hdr ${openSection === 'guide' ? 'open' : ''}`} onClick={() => togColl('guide')}>
              <div className="coll-ttl"><i className="fas fa-book-open"></i> Panduan Penggunaan</div>
              <i className="fas fa-chevron-down coll-arr"></i>
            </div>
            <div className={`coll-body ${openSection === 'guide' ? 'open' : ''}`}>
              <div className="guide-wrap">
                {[
                  {
                    n: 1, title: 'Isi Teks Laporan',
                    desc: 'Salin & tempel teks laporan dari WhatsApp. Wajib memuat: <b>Patroli</b>, <b>Hari</b>, <b>Tanggal</b>, <b>Identitas Pelanggaran</b>, <b>Personil</b>, dan <b>Danru</b>.'
                  },
                  {
                    n: 2, title: 'Foto via <span class="chip y">📷 Kamera</span>',
                    desc: 'Pastikan GPS aktif. Sistem otomatis membaca EXIF → geocode nama jalan → watermark memuat <b>nama jalan, waktu, koordinat, dan QR Code</b> ke Google Maps.'
                  },
                  {
                    n: 3, title: 'Foto via <span class="chip b">🖼 Galeri</span>',
                    desc: 'Tidak membaca EXIF GPS. Watermark menggunakan <b>lokasi manual</b> dari form pengaturan. Isi lokasi manual terlebih dahulu agar watermark akurat.'
                  },
                  {
                    n: 4, title: 'Kompresi Otomatis',
                    desc: 'Foto <b>&gt; 1 MB</b> dikompres otomatis ke ≤ 1 MB. Badge <span class="chip b">↓1MB</span> muncul di thumbnail bila dikompres.'
                  },
                  {
                    n: 5, title: 'Aksi di Thumbnail & Preview',
                    desc: 'Tap <span class="chip g"><i class="fas fa-map-location-dot"></i> peta</span> untuk melihat lokasi EXIF.<br>Tap <span class="chip b"><i class="fas fa-download"></i></span> untuk unduh foto ke HP.<br>Tap foto untuk buka preview penuh — tombol <span class="chip b"><i class="fas fa-download"></i> unduh</span> dan peta ada di panel bawah.'
                  },
                  {
                    n: 6, title: '<span class="chip p"><i class="fas fa-right-left"></i> Transfer Draft</span>',
                    desc: 'Tekan <b>Transfer</b> untuk memindahkan foto kamera sementara ke Google Drive.<br>Data tersimpan pada folder DRAFT agar bisa dilanjutkan dari perangkat yang sama.'
                  },
                  {
                    n: 7, title: '<span class="chip p"><i class="fas fa-cloud-download-alt"></i> Load & Hapus</span>',
                    desc: 'Tekan <b>Load</b> untuk memuat ulang foto dari sesi sebelumnya.<br>Pilih draft tersimpan → foto & teks laporan dipulihkan otomatis.<br>Setelah berhasil dimuat, draft di server <b>dihapus permanen</b>.'
                  },
                  {
                    n: 8, title: 'Kirim Laporan',
                    desc: 'Tekan <b>KIRIM LAPORAN</b>. Foto diupload ke <b>Google Drive</b> dan data tersimpan ke <b>Spreadsheet</b>. Pastikan koneksi internet stabil.'
                  },
                ].map(step => (
                  <div key={step.n} className="guide-step">
                    <div className="guide-num">{step.n}</div>
                    <div className="guide-content">
                      <div className="guide-title" dangerouslySetInnerHTML={{ __html: step.title }}></div>
                      <div className="guide-desc" dangerouslySetInnerHTML={{ __html: step.desc }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Info Sistem ── */}
          <div className="set-sec">
            <div className="set-sec-ttl">Info Sistem</div>
            <div className={`coll-hdr ${openSection === 'about' ? 'open' : ''}`} onClick={() => togColl('about')}>
              <div className="coll-ttl"><i className="fas fa-circle-info"></i> Info Aplikasi</div>
              <i className="fas fa-chevron-down coll-arr"></i>
            </div>
            <div className={`coll-body ${openSection === 'about' ? 'open' : ''}`}>
              <div className="app-info">
                <div className="ai-row"><span className="k">Aplikasi</span><span className="v">SI-PEDAS Next.js</span></div>
                <div className="ai-row"><span className="k">Versi</span><span className="v">4.4.0</span></div>
                <div className="ai-row"><span className="k">Satuan</span><span className="v">Satlinmas Pedestrian</span></div>
                <div className="ai-row"><span className="k">Wilayah</span><span className="v">Ponorogo, Jawa Timur</span></div>
                <div className="ai-row">
                  <span className="k">Kontak Aduan</span>
                  <a href="https://wa.me/6285159686554" target="_blank" className="wa-btn" rel="noreferrer">
                    <i className="fab fa-whatsapp"></i> Hubungi Whatsapp
                  </a>
                </div>
              </div>
              <div className="author-box" style={{ marginTop: '12px' }}>
                <img src="/assets/basith.jpeg" alt="Developer" className="author-img" />
                <div className="author-info">
                  <div className="author-name">Ahmad Abdul Basith, S.Tr.I.P</div>
                  <div className="author-title">Developer & Author SI-PEDAS</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
