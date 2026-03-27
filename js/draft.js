/* ═══════════════════════════════════════════════════════════
   SI-PEDAS Mobile — draft.js
   Draft save/load/delete functionality
═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   SIMPAN DRAFT
═══════════════════════════════════════════════════════════ */
function saveDraft() {
  var camFotos = fotos.filter(function(f){ return f.source === 'camera' && !f.processing; });
  if (!camFotos.length) {
    showAlert('warn','Tidak Ada Foto Kamera',
      'Draft hanya menyimpan foto dari <b>kamera</b>.<br>Tambahkan minimal 1 foto dari kamera terlebih dahulu.');
    return;
  }
  if (fotos.some(function(f){ return f.processing; })) {
    showAlert('warn','Foto Masih Diproses','Tunggu sebentar hingga semua foto selesai diproses.');
    return;
  }

  var btn = document.getElementById('btn-save-draft');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...'; }

  var exifMeta = camFotos.map(function(f) {
    if (!f.exif) return null;
    return {
      hasGps  : !!(f.exif && f.exif.gps),
      lat     : f.exif && f.exif.gps ? f.exif.gps.lat  : null,
      lng     : f.exif && f.exif.gps ? f.exif.gps.lng  : null,
      datetime: fmtExifTime(f.exif),
      address : f.exifAddr ? f.exifAddr.full : null,
      source  : 'camera'
    };
  });

  var payload = {
    laporan : (document.getElementById('laporan').value || '').trim(),
    fotos   : camFotos.map(function(f){ return { data:f.data, mime:f.mime, source:'camera' }; }),
    exifMeta: exifMeta,
    draftId : _activeDraftId
  };

  // ── [FIX] action 'saveDraft', payload dibungkus dalam { data: payload }
  apiPost('saveDraft', { data: payload })
    .then(function(res) {
      // ── [FIX] GAS mengembalikan langsung res.draftId, bukan res.data.draftId
      if (!res.success) throw new Error(res.message || 'Gagal menyimpan draft.');
      _activeDraftId = res.draftId;
      try { sessionStorage.setItem('sip_draftId', res.draftId); } catch(e) {}
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Simpan Draft'; }
      _updateDraftBadge();
      showAlert('success', 'Draft Tersimpan! 💾',
        '<b>' + res.jumlahFoto + '</b> foto kamera berhasil disimpan ke server.<br>' +
        '<small style="color:var(--muted)">ID: ' + res.draftId + '<br>' +
        'Draft dapat dimuat kembali kapan saja melalui <b>Load Draft</b>.</small>');
    })
    .catch(function(err) {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Simpan Draft'; }
      showAlert('error','Gagal Simpan Draft', err.message||'Periksa koneksi dan coba lagi.');
    });
}

/* ═══════════════════════════════════════════════════════════
   LOAD DRAFT — Modal Pilih Draft
═══════════════════════════════════════════════════════════ */
function loadDraftList() {
  var modal = document.getElementById('draft-modal');
  var body  = document.getElementById('draft-modal-body');
  if (!modal || !body) return;

  body.innerHTML = '<div style="text-align:center;padding:24px;color:var(--muted)"><i class="fas fa-spinner fa-spin" style="font-size:1.4rem"></i><br><br>Memuat daftar draft...</div>';
  modal.classList.add('show');

  // ── [FIX] action 'listDrafts' via GET
  apiGet('listDrafts')
    .then(function(res) {
      // ── [FIX] GAS mengembalikan res.drafts langsung, bukan res.data.drafts
      if (!res.success) throw new Error(res.message || 'Gagal memuat daftar draft.');
      var drafts = res.drafts || [];
      if (!drafts.length) {
        body.innerHTML = '<div style="text-align:center;padding:32px;color:var(--muted)"><i class="fas fa-inbox" style="font-size:2rem;opacity:.25;display:block;margin-bottom:12px"></i>Belum ada draft tersimpan di server.</div>';
        return;
      }
      body.innerHTML = drafts.map(function(d) {
        return '<div class="draft-item" id="di-' + d.draftId + '">' +
          '<div class="draft-item-top">' +
            '<span class="draft-badge"><i class="fas fa-clock"></i> ' + d.timestamp + '</span>' +
            '<span class="draft-badge draft-badge-cam"><i class="fas fa-camera"></i> ' + d.jumlahFoto + ' foto</span>' +
            (d.danru && d.danru !== '—' ? '<span class="draft-badge draft-badge-danru"><i class="fas fa-user-shield"></i> ' + esc(d.danru) + '</span>' : '') +
          '</div>' +
          '<div class="draft-item-teks">' + esc(d.teksPreview || '(Belum ada teks laporan)') + '</div>' +
          '<div class="draft-item-acts">' +
            '<button class="draft-btn-load" onclick="doLoadDraft(\'' + d.draftId + '\')"><i class="fas fa-cloud-download-alt"></i> Muat</button>' +
            '<button class="draft-btn-del"  onclick="deleteDraftUI(\'' + d.draftId + '\')"><i class="fas fa-trash"></i> Hapus</button>' +
          '</div>' +
        '</div>';
      }).join('');
    })
    .catch(function(err) {
      body.innerHTML = '<div style="text-align:center;padding:24px;color:var(--red)"><i class="fas fa-circle-xmark"></i> Gagal memuat draft: ' + esc(err.message||'Error') + '</div>';
    });
}

function closeDraftModal() {
  var modal = document.getElementById('draft-modal');
  if (modal) modal.classList.remove('show');
}

/* ── Loading overlay untuk load draft ─────────────────── */
function showDraftLoading(jumlah) {
  var ov = document.getElementById('draft-ld-ov');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'draft-ld-ov';
    ov.style.cssText = [
      'position:fixed','inset:0','z-index:9999',
      'background:rgba(2,6,18,0.82)','backdrop-filter:blur(6px)',
      'display:flex','align-items:center','justify-content:center',
      'flex-direction:column','gap:16px'
    ].join(';');
    ov.innerHTML =
      '<div id="dld-spinner" style="width:52px;height:52px;border:4px solid rgba(255,255,255,.15);border-top-color:#3b82f6;border-radius:50%;animation:spin .8s linear infinite"></div>' +
      '<div style="color:#fff;font-size:1rem;font-weight:600;letter-spacing:.02em" id="dld-title">Memuat Draft...</div>' +
      '<div style="color:#94a3b8;font-size:.82rem;text-align:center;max-width:260px;line-height:1.5" id="dld-sub">Menghubungi server...</div>' +
      '<style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
    document.body.appendChild(ov);
  }
  if (jumlah !== undefined)
    document.getElementById('dld-sub').textContent = 'Mengunduh ' + jumlah + ' foto dari server Drive...';
  ov.style.display = 'flex';
}
function updateDraftLoading(sub) {
  var el = document.getElementById('dld-sub');
  if (el) el.textContent = sub;
}
function hideDraftLoading() {
  var ov = document.getElementById('draft-ld-ov');
  if (ov) ov.style.display = 'none';
}

// ── [FIX] loadDraft pakai POST bukan GET (karena ada di doPost di GAS)
function doLoadDraft(draftId) {
  closeDraftModal();
  showDraftLoading();

  apiPost('loadDraft', { draftId: draftId })
    .then(function(res) {
      hideDraftLoading();
      // ── [FIX] GAS mengembalikan langsung res.fotos, bukan res.data.fotos
      if (!res.success) throw new Error(res.message || 'Gagal memuat draft.');
      if (!res.fotos || !res.fotos.length) {
        showAlert('warn','Draft Kosong','Tidak ada foto yang bisa dimuat dari draft ini.');
        return;
      }
      if (res.teks) {
        document.getElementById('laporan').value = res.teks;
        idbMetaSet(IDB_TEKS_KEY, res.teks);
        updateChar();
      }
      _activeDraftId = draftId;
      try { sessionStorage.setItem('sip_draftId', draftId); } catch(e) {}
      var hadFoto = fotos.length > 0;
      res.fotos.forEach(function(f, i) {
        f.fromDraft  = true;
        f.processing = false;
        f.sizeKB     = Math.round(b64sz(f.data) / 1024);
        f.exif       = res.exifMeta && res.exifMeta[i] ? _rebuildExifFromMeta(res.exifMeta[i]) : null;
        f.exifAddr   = res.exifMeta && res.exifMeta[i] && res.exifMeta[i].address
          ? { full: res.exifMeta[i].address, road: '', parts: [] } : null;
        f.ts         = nowFull();
        f.idbKey     = null;
        if (fotos.length < MAX) {
          fotos.push(f);
          idbSavePhoto(f, function(key) {
            if (key !== null && key !== undefined) f.idbKey = key;
          });
        }
      });
      renderGrid();
      updateChar();
      _updateDraftBadge();
      showAlert('success','Draft Dimuat! 🌐',
        '<b>' + res.jumlahFoto + '</b> foto + teks laporan berhasil dimuat dari server.' +
        (hadFoto ? '<br><small style="color:var(--muted)">Foto yang ada sebelumnya tetap dipertahankan.</small>' : ''));
    })
    .catch(function(err) {
      hideDraftLoading();
      showAlert('error','Gagal Muat Draft', err.message || 'Periksa koneksi dan coba lagi.');
    });
}

// ── [FIX] deleteDraft pakai { draftId } langsung (bukan { data: ... })
function deleteDraftUI(draftId) {
  var item = document.getElementById('di-' + draftId);
  if (item) { item.style.opacity = '0.4'; item.style.pointerEvents = 'none'; }

  apiPost('deleteDraft', { draftId: draftId })
    .then(function(res) {
      if (!res.success) throw new Error(res.message || 'Gagal menghapus draft.');
      if (item && item.parentElement) item.parentElement.removeChild(item);
      if (_activeDraftId === draftId) {
        _activeDraftId = null;
        try { sessionStorage.removeItem('sip_draftId'); } catch(e) {}
        _updateDraftBadge();
      }
      var body = document.getElementById('draft-modal-body');
      if (body && !body.querySelector('.draft-item'))
        body.innerHTML = '<div style="text-align:center;padding:32px;color:var(--muted)"><i class="fas fa-inbox" style="font-size:2rem;opacity:.25;display:block;margin-bottom:12px"></i>Semua draft telah dihapus.</div>';
    })
    .catch(function(err) {
      if (item) { item.style.opacity = '1'; item.style.pointerEvents = ''; }
      showAlert('error','Gagal Hapus Draft', err.message||'Coba lagi.');
    });
}

function _rebuildExifFromMeta(meta) {
  if (!meta) return null;
  var exif = {};
  if (meta.hasGps && meta.lat && meta.lng)
    exif.gps = { lat: parseFloat(meta.lat), lng: parseFloat(meta.lng) };
  if (meta.datetime) exif.dto = meta.datetime;
  return Object.keys(exif).length ? exif : null;
}

function _updateDraftBadge() {
  var badge = document.getElementById('draft-active-badge');
  if (!badge) return;
  if (_activeDraftId) {
    badge.style.display = 'inline-flex';
    badge.title = 'Draft aktif: ' + _activeDraftId;
  } else {
    badge.style.display = 'none';
  }
}

/* Modal draft backdrop click */
document.addEventListener('DOMContentLoaded', function() {
  var dm = document.getElementById('draft-modal');
  if (dm) dm.addEventListener('click', function(e){ if(e.target===this) closeDraftModal(); });
});