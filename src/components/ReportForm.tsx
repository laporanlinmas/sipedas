"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../lib/AppContext';
import { idbMetaSet, IDB_TEKS_KEY } from '../lib/idb';

export default function ReportForm() {
  const { reportText, setReportText } = useAppContext();
  const [charCount, setCharCount] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCharCount(reportText.length);
  }, [reportText]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setReportText(val);
    // Debounce 600ms — identik sistem lama (_teksSaveTimer)
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      idbMetaSet(IDB_TEKS_KEY, val);
    }, 600);
  };

  return (
    <div className="card">
      <div className="card-head">
        <div className="ci ci-blue"><i className="fas fa-file-lines"></i></div>
        <h3>Isi Laporan</h3>
        <span className="badge-req">Wajib</span>
      </div>
      <div className="card-body">
        <textarea
          id="laporan"
          className="lap-input"
          placeholder="Tempel teks laporan Patroli Pedestrian dari WhatsApp"
          value={reportText}
          onChange={handleChange}
        />
        <div className="char-row">
          <span className="char-cnt" id="char-cnt" style={{ color: charCount > 0 ? '#34d399' : 'var(--muted)' }}>
            {charCount.toLocaleString('id')} karakter
          </span>
        </div>
      </div>
    </div>
  );
}
