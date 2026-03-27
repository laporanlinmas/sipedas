/* ═══════════════════════════════════════════════════════════
   SI-PEDAS Mobile — helpers.js
   Utility helper functions
═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   INISIALISASI APLIKASI
═══════════════════════════════════════════════════════════ */
window.addEventListener('load', function () {
  loadSets();
  var el = document.getElementById('img-linmas');
  if (!el.complete) el.onload = function(){};

  var lapoEl = document.getElementById('laporan');
  if (lapoEl) {
    lapoEl.addEventListener('input', onTeksChange);
  }

  try {
    var storedDraftId = sessionStorage.getItem('sip_draftId');
    if (storedDraftId) {
      _activeDraftId = storedDraftId;
      _updateDraftBadge();
    }
  } catch(e) {}

  idbMetaGet(IDB_TEKS_KEY, function(savedTeks) {
    if (savedTeks && savedTeks.trim()) {
      document.getElementById('laporan').value = savedTeks;
      updateChar();
    }

    idbLoadAll(function(saved) {
      if (!saved || !saved.length) return;
      var toLoad = saved.slice(0, MAX);
      toLoad.forEach(function(f) {
        f.processing = false;
        fotos.push(f);
      });
      if (toLoad.length) {
        renderGrid();
        var pesanTeks = savedTeks && savedTeks.trim()
          ? '<br><small style="color:#86efac">Teks laporan juga dipulihkan otomatis.</small>'
          : '';
        showAlert('success','Data Dipulihkan 📸',
          '<b>'+toLoad.length+'</b> foto kamera dari sesi sebelumnya otomatis dimuat kembali.' +
          pesanTeks +
          (saved.length > MAX ? '<br><small style="color:var(--muted)">('+( saved.length-MAX)+' foto lainnya melebihi batas '+MAX+')</small>' : '') +
          (_activeDraftId ? '<br><small style="color:#a78bfa">Draft server aktif — klik <b>Load Draft</b> jika ingin muat ulang dari server.</small>' : ''));
      } else if (savedTeks && savedTeks.trim()) {
        showAlert('success','Teks Dipulihkan 📝',
          'Teks laporan dari sesi sebelumnya otomatis dimuat kembali.' +
          (_activeDraftId ? '<br><small style="color:#a78bfa">Draft server aktif — klik <b>Load Draft</b> untuk memuat foto dari server.</small>' : ''));
      }
    });
  });
});