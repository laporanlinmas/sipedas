/* ═══════════════════════════════════════════════════════════
   SI-PEDAS Mobile — submit.js
   Submit laporan functionality
═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   SUBMIT LAPORAN — v4.3
   Alur: upload foto SATU PER SATU dulu ke Drive via
   action uploadFoto, baru kirim laporan tanpa base64.
   Solusi batas payload 4.5MB Vercel.
═══════════════════════════════════════════════════════════ */
function submitData() {
  var lap = document.getElementById('laporan').value.trim();
  if (!lap)          { showAlert('error','Laporan Kosong','Isi teks laporan terlebih dahulu.<br><small style="color:var(--muted)">Tempel dari WhatsApp.</small>'); return; }
  if (!fotos.length) { showAlert('warn','Foto Belum Ada','Lampirkan minimal <b>1 foto</b> dokumentasi.'); return; }
  if (fotos.some(function(f){ return f.processing; })) { showAlert('warn','Foto Masih Diproses','Tunggu sebentar, semua foto selesai diproses.'); return; }

  var btn = document.getElementById('sub-btn');
  btn.disabled = true;
  var totalFoto = fotos.length;
  showLoading('Mengirim Laporan...', 'Mempersiapkan ' + totalFoto + ' foto...');
  stepProg(0, 5, 'Siap upload ' + totalFoto + ' foto...');

  // Kumpulkan exifMeta per foto
  var exifMetas = fotos.map(function(f) {
    if (!f.exif) return null;
    return {
      hasGps  : !!(f.exif && f.exif.gps),
      lat     : f.exif && f.exif.gps ? f.exif.gps.lat : null,
      lng     : f.exif && f.exif.gps ? f.exif.gps.lng : null,
      datetime: fmtExifTime(f.exif),
      address : f.exifAddr ? f.exifAddr.full : null,
      source  : f.source
    };
  });

  var linkFoto  = [];  // [{link, namaFile, source, meta}]
  var folderUrl = '';
  var uploadIdx = 0;

  function uploadNext() {
    if (uploadIdx >= totalFoto) {
      // ── Semua foto terupload → kirim laporan (tanpa base64) ──
      stepProg(2, 85, 'Menyimpan ke Spreadsheet...');
      apiPost('submitLaporan', {
        data: {
          laporan   : lap,
          linkFoto  : linkFoto,
          folderUrl : folderUrl,
          jumlahFoto: linkFoto.length,
          draftId   : _activeDraftId
        }
      })
      .then(function(res) {
        if (!res.success) throw new Error(res.message || 'Server error.');
        stepProg(3, 100, 'Selesai!');
        setTimeout(function() {
          hideLoading(); btn.disabled = false;
          document.getElementById('laporan').value = '';
          idbMetaDel(IDB_TEKS_KEY);
          fotos.forEach(function(f) {
            if (f.source === 'camera' && f.idbKey !== null && f.idbKey !== undefined)
              idbDeletePhoto(f.idbKey);
          });
          fotos = []; renderGrid(); updateChar();
          _activeDraftId = null;
          try { sessionStorage.removeItem('sip_draftId'); } catch(e) {}
          _updateDraftBadge();
          showAlert('success', 'Laporan Terkirim! 🎉',
            'Laporan beserta <b>' + totalFoto + '</b> foto berhasil disimpan ke sistem.');
        }, 600);
      })
      .catch(function(err) {
        hideLoading(); btn.disabled = false;
        showAlert('error', 'Gagal Simpan Laporan', err.message || 'Periksa koneksi dan coba lagi.');
      });
      return;
    }

    // Upload satu foto dengan retry logic
    var f   = fotos[uploadIdx];
    var pct = 10 + Math.round((uploadIdx / totalFoto) * 70);
    stepProg(1, pct, 'Upload foto ' + (uploadIdx + 1) + ' / ' + totalFoto + '...');

    function uploadPhotoWithRetry(retryAttempt) {
      retryAttempt = retryAttempt || 0;
      
      apiPost('uploadFoto', {
        data: {
          foto       : { data: f.data, mime: f.mime, source: f.source },
          meta       : exifMetas[uploadIdx] || null,
          laporan    : lap,
          noFoto     : uploadIdx + 1,
          jumlahTotal: totalFoto
        }
      })
      .then(function(res) {
        if (!res.success) throw new Error('Foto ' + (uploadIdx + 1) + ' gagal: ' + (res.message || 'Error'));
        linkFoto.push({ link: res.linkFile, namaFile: res.namaFile, source: f.source, meta: exifMetas[uploadIdx] || null });
        if (!folderUrl && res.folderUrl) folderUrl = res.folderUrl;
        uploadIdx++;
        uploadNext();
      })
      .catch(function(err) {
        // Retry hingga 2x jika gagal
        if (retryAttempt < 2) {
          var delayMs = 1000 * Math.pow(2, retryAttempt);  // 1s, 2s exponential backoff
          console.log('Retry foto ' + (uploadIdx + 1) + ' attempt ' + (retryAttempt + 1) + ' setelah ' + delayMs + 'ms');
          stepProg(1, pct, 'Retry upload foto ' + (uploadIdx + 1) + ' (' + (retryAttempt + 1) + '/2)...');
          setTimeout(function() {
            uploadPhotoWithRetry(retryAttempt + 1);
          }, delayMs);
        } else {
          // Sudah retry 2x, gagal total
          hideLoading(); btn.disabled = false;
          showAlert('error', 'Gagal Upload Foto ' + (uploadIdx + 1), err.message || 'Periksa koneksi dan coba lagi.');
        }
      });
    }

    uploadPhotoWithRetry(0);
  }

  setTimeout(uploadNext, 300);
}
