"use client";

import React from 'react';
import { AppProvider, useAppContext } from '../lib/AppContext';
import Header from '../components/Header';
import ReportForm from '../components/ReportForm';
import PhotoManager from '../components/PhotoManager';
import SettingsSheet from '../components/SettingsSheet';
import Modals, { DraftModal } from '../components/Modals';
import { useSubmitHandler } from '../lib/submitHandler';
import { useDraftHandler } from '../lib/useDraftHandler';

function MainApp() {
  const { submitData } = useSubmitHandler();
  const draft = useDraftHandler();

  return (
    <>
      <div className="wrap">
        <Header />
        <div className="form-area">
          <ReportForm />
          <PhotoManager
            onSaveDraft={draft.saveDraft}
            onLoadDraft={draft.loadDraftList}
            savingDraft={draft.savingDraft}
          />
        </div>
        <div className="submit-wrap">
          <button className="sub-btn" id="sub-btn" onClick={submitData}>
            <i className="fas fa-paper-plane"></i> KIRIM LAPORAN
          </button>
        </div>
      </div>

      <SettingsSheet />
      <Modals />

      {/* Draft bottom sheet */}
      <DraftModal
        show={draft.draftModalOpen}
        onClose={() => draft.setDraftModalOpen(false)}
        draftLoading={draft.draftLoading}
        draftLoadingMsg={draft.draftLoadingMsg}
        draftList={draft.draftList}
        onLoadDraft={draft.doLoadDraft}
        onDeleteDraft={draft.deleteDraft}
      />

      {/* Draft list loading overlay — shown when fetching draft list from server */}
      {draft.draftLoading && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: 'rgba(var(--ld-bg, 2,6,18),0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '16px'
          }}
        >
          <div style={{
            width: '52px', height: '52px',
            border: '4px solid var(--bdr2)',
            borderTopColor: 'var(--blueb)',
            borderRadius: '50%',
            animation: 'spin .8s linear infinite'
          }}></div>
          <div style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 600, letterSpacing: '.02em' }}>
            Memuat Daftar Draft...
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '.82rem', textAlign: 'center', maxWidth: '260px', lineHeight: 1.5 }}>
            {draft.draftLoadingMsg || 'Menghubungi server...'}
          </div>
        </div>
      )}

      {/* Logo tersembunyi untuk watermark */}
      <img
        id="img-linmas"
        src="/assets/icon-full.png"
        crossOrigin="anonymous"
        alt=""
        style={{ display: 'none' }}
      />
    </>
  );
}

export default function Page() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
