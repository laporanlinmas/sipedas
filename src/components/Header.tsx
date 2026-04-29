"use client";

import React from 'react';
import Link from 'next/link';
import { useAppContext } from '../lib/AppContext';

export default function Header() {
  const { setShowSettings, state } = useAppContext();
  
  const showDot = !!(state.loc.jalan || state.loc.desa || state.lat);

  return (
    <div className="header">
      <div className="hdr-bar">
        <span className="app-ver">SI-PEDAS v4.4.0</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Link
            href="/cctv"
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 11px', borderRadius: '20px',
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171', fontSize: '0.7rem', fontWeight: 700,
              textDecoration: 'none', letterSpacing: '0.03em',
              transition: 'all 0.18s',
            }}
          >
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#ef4444',
              boxShadow: '0 0 6px rgba(239,68,68,0.8)',
              animation: 'spin .8s linear infinite',
              display: 'inline-block',
            }} />
            CCTV
          </Link>
          <button className="gear-btn" id="gear-btn" onClick={() => setShowSettings(true)}>
            <i className="fas fa-gear"></i>
            {showDot && <span className="gear-dot show" id="gear-dot"></span>}
          </button>
        </div>
      </div>
      <div className="logos-row">
        <div className="logo-wrap">
          <img src="/assets/sipedas.png" alt="LINMAS" />
        </div>
        <div className="sipedas-wrap">
          <div className="sipedas-title">SI-PEDAS</div>
          <div className="sipedas-badge"><i className="fas fa-mobile-screen-button"></i> Mobile</div>
        </div>
      </div>
      <p className="hdr-sub">Sistem Informasi Pedestrian Satlinmas</p>
      <div className="hdr-div"></div>
    </div>
  );
}

