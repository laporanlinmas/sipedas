/* ═══════════════════════════════════════════════════════════
   SI-PEDAS Mobile — ui.js
   UI rendering functions for grid, viewer, modals, alerts
═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   RENDER GRID FOTO
═══════════════════════════════════════════════════════════ */
function renderGrid() {
  var grid = document.getElementById('foto-grid');
  var hd   = document.getElementById('foto-cnt-hd');
  var ctr  = document.getElementById('foto-ctr');
  hd.textContent = fotos.length + ' / ' + MAX;
  if (!fotos.length) {
    grid.innerHTML = '<div class="empty-foto"><i class="fas fa-photo-film"></i>Foto yang dipilih muncul di sini</div>';
    ctr.innerHTML  = 'Belum ada foto — <b>Wajib</b> minimal 1 foto';
    return;
  }
  ctr.innerHTML = '<b>' + fotos.length + '</b> foto dipilih' + (fotos.length >= MAX ? ' <span style="color:#fbbf24">(maks)</span>' : '');
  grid.innerHTML = '';

  fotos.forEach(function (f, i) {
    var div = document.createElement('div');
    div.className = 'foto-item';

    if (f.processing) {
      div.innerHTML = '<div class="foto-proc"><i class="fas fa-cog"></i><span class="plabel">' + esc(f.procLabel||'Memproses...') + '</span></div>';
    } else {
      var img = document.createElement('img');
      img.src = f.data; img.alt = 'Foto ' + (i+1);

      var hov = document.createElement('div'); hov.className = 'foto-hover';
      hov.innerHTML = '<i class="fas fa-expand-alt"></i>';

      var del = document.createElement('button'); del.className = 'foto-del';
      del.innerHTML = '<i class="fas fa-times"></i>';
      del.addEventListener('click', (function(x){ return function(e){ e.stopPropagation(); hapus(x); }; })(i));

      var num = document.createElement('div'); num.className = 'foto-num';
      num.textContent = i + 1;

      var sz = document.createElement('div'); sz.className = 'foto-sz';
      sz.textContent = f.sizeKB > 1024 ? (f.sizeKB/1024).toFixed(1)+'MB' : f.sizeKB+'KB';

      div.appendChild(img); div.appendChild(hov); div.appendChild(del);
      div.appendChild(num); div.appendChild(sz);

      var tag = document.createElement('div'); tag.className = 'foto-tag';
      if (f.fromDraft) {
        tag.className += ' tag-draft';
        tag.textContent = '🌐DRAFT';
      } else if (f.source === 'camera' && f.exif && f.exif.gps) {
        tag.className += ' tag-exif';
        tag.textContent = f.idbKey ? '💾EXIF+QR' : 'EXIF+QR';
      } else if (f.source === 'camera') {
        tag.className += ' tag-cam';
        tag.textContent = f.idbKey ? '💾📷WM' : '📷WM';
      } else if (f.compressed) {
        tag.className += ' tag-comp';
        tag.textContent = '↓1MB';
      } else {
        tag.className += ' tag-gal';
        tag.textContent = '🖼WM';
      }
      div.appendChild(tag);

      if (f.source === 'camera') {
        var dlBtn = document.createElement('button');
        dlBtn.className = 'foto-dl-btn';
        dlBtn.title     = 'Unduh foto ini ke HP';
        dlBtn.innerHTML = '<i class="fas fa-download"></i>';
        dlBtn.addEventListener('click', (function(x){ return function(e){ e.stopPropagation(); downloadFoto(x); }; })(i));
        div.appendChild(dlBtn);
      }

      if (f.source === 'camera' && f.exif && f.exif.gps && S.minimap) {
        var mapBtn = document.createElement('button');
        mapBtn.className = 'foto-map-btn';
        mapBtn.innerHTML = '<i class="fas fa-map-location-dot"></i>';
        mapBtn.title     = 'Lihat di peta';
        mapBtn.addEventListener('click', (function(x){ return function(e){ e.stopPropagation(); openMapModal(x); }; })(i));
        div.appendChild(mapBtn);
      }

      div.addEventListener('click', (function(x){
        return function(e){
          if (e.target.closest('.foto-del')||e.target.closest('.foto-map-btn')||e.target.closest('.foto-dl-btn')) return;
          openViewer(x);
        };
      })(i));
    }
    grid.appendChild(div);
  });
}

function hapus(idx) {
  var f = fotos[idx];
  if (f && f.source === 'camera' && f.idbKey !== null && f.idbKey !== undefined)
    idbDeletePhoto(f.idbKey);
  fotos.splice(idx, 1);
  renderGrid();
}

/* ═══════════════════════════════════════════════════════════
   VIEWER LIGHTBOX
═══════════════════════════════════════════════════════════ */
function openViewer(idx) { viewIdx = idx; refreshVW(); document.getElementById('vw-ov').classList.add('show'); }
function refreshVW() {
  var f = fotos[viewIdx];
  if (!f || f.processing || !f.data) return;
  document.getElementById('vw-img').src   = f.data;
  document.getElementById('vw-title').textContent = 'Foto '+(viewIdx+1)+' / '+fotos.length+(f.source==='camera'?' [Kamera]':' [Galeri]');
  var info = (f.sizeKB>1024?(f.sizeKB/1024).toFixed(1)+'MB':f.sizeKB+'KB');
  if (f.compressed) info += ' · dikompres';
  if (f.source==='camera'&&f.exif&&f.exif.gps) info += ' · GPS ✓ · QR ✓';
  if (getWM(f.source)) info += ' · WM ✓';
  if (f.source==='camera'&&f.idbKey!==null&&f.idbKey!==undefined) info += ' · 💾 Tersimpan';
  if (f.fromDraft) info += ' · 🌐 Dari Draft';
  document.getElementById('vw-info').textContent = info;
  document.getElementById('vw-prev').disabled = viewIdx <= 0;
  document.getElementById('vw-next').disabled = viewIdx >= fotos.length - 1;
  var dl = document.getElementById('vw-dl');
  if (f.source === 'camera') {
    dl.href = f.data;
    dl.download = 'SIPEDAS_Foto'+(viewIdx+1)+'_'+nowFull().replace(/[\/\s:]/g,'-')+'.jpg';
    dl.style.display = 'flex';
  } else { dl.style.display = 'none'; }
  var mapBtn = document.getElementById('vw-map');
  mapBtn.style.display = (f.source==='camera'&&f.exif&&f.exif.gps&&S.minimap) ? 'flex' : 'none';
}
function viewerOpenMap() { openMapModal(viewIdx); }
function viewerNav(d) {
  var n = viewIdx + d;
  if (n >= 0 && n < fotos.length && !fotos[n].processing) { viewIdx = n; refreshVW(); }
}
function closeViewer() { document.getElementById('vw-ov').classList.remove('show'); }
(function(){
  var sx=0,ov=document.getElementById('vw-ov');
  ov.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;},{passive:true});
  ov.addEventListener('touchend',function(e){var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50)viewerNav(dx<0?1:-1);},{passive:true});
})();

/* ═══════════════════════════════════════════════════════════
   KARAKTER COUNTER
═══════════════════════════════════════════════════════════ */
function updateChar() {
  var l = document.getElementById('laporan').value.length;
  var el = document.getElementById('char-cnt');
  el.textContent = l.toLocaleString('id') + ' karakter';
  el.style.color = l > 0 ? '#34d399' : 'var(--muted)';
}

/* ═══════════════════════════════════════════════════════════
   ALERT MODAL
═══════════════════════════════════════════════════════════ */
var _onClose = null;
function showAlert(t, title, msg, onClose) {
  var im = { success:'fa-circle-check', error:'fa-circle-xmark', warn:'fa-triangle-exclamation' };
  document.getElementById('al-ico').className = 'al-ico ' + t;
  document.getElementById('al-ico-i').className = 'fas ' + (im[t]||'fa-info-circle');
  document.getElementById('al-btn').className = 'al-btn ' + t;
  document.getElementById('al-title').textContent = title;
  document.getElementById('al-msg').innerHTML = msg;
  _onClose = onClose || null;
  document.getElementById('al-ov').classList.add('show');
}
function closeAlert() { document.getElementById('al-ov').classList.remove('show'); if (_onClose) { _onClose(); _onClose = null; } }
document.getElementById('al-ov').addEventListener('click', function(e){ if(e.target===this)closeAlert(); });

/* ═══════════════════════════════════════════════════════════
   LOADING OVERLAY (untuk kirim laporan)
═══════════════════════════════════════════════════════════ */
function showLoading(title,sub) {
  document.getElementById('ld-title').textContent = title||'Mengirim...';
  document.getElementById('ld-sub').textContent   = sub||'Mohon tunggu...';
  setBar(0);
  ['ls0','ls1','ls2','ls3'].forEach(function(id){ document.getElementById(id).className='ls'; });
  document.getElementById('ld-ov').classList.add('show');
}
function hideLoading() { document.getElementById('ld-ov').classList.remove('show'); }
function setBar(p) { document.getElementById('ld-bar').style.width = Math.min(100,p)+'%'; }
function stepProg(si,p,sub) {
  ['ls0','ls1','ls2','ls3'].forEach(function(id,i){
    document.getElementById(id).className = 'ls'+(i<si?' done':i===si?' active':'');
  });
  setBar(p);
  if (sub) document.getElementById('ld-sub').textContent = sub;
}

/* ═══════════════════════════════════════════════════════════
   MAP MODAL
═══════════════════════════════════════════════════════════ */
var _mapCoords = null;
function openMapModal(idx){
  var f=fotos[idx];if(!f||!f.exif||!f.exif.gps)return;
  _mapCoords={lat:f.exif.gps.lat,lng:f.exif.gps.lng};
  var info='Foto '+(idx+1);
  if(f.exifAddr&&f.exifAddr.full)info+=': <b>'+esc(f.exifAddr.full)+'</b>';
  info+='<br><span style="font-family:var(--m);font-size:.72rem">'+_mapCoords.lat.toFixed(6)+', '+_mapCoords.lng.toFixed(6)+'</span>';
  document.getElementById('map-info-text').innerHTML=info;
  document.getElementById('map-iframe').src='https://www.google.com/maps?q='+_mapCoords.lat+','+_mapCoords.lng+'&output=embed&z=17';
  document.getElementById('map-gmaps-btn').onclick=function(){window.open('https://www.google.com/maps?q='+_mapCoords.lat+','+_mapCoords.lng,'_blank');};
  document.getElementById('map-modal').classList.add('show');
}
function closeMapModal(){
  document.getElementById('map-modal').classList.remove('show');
  document.getElementById('map-iframe').src='about:blank';
}
document.getElementById('map-modal').addEventListener('click',function(e){if(e.target===this)closeMapModal();});

/* ═══════════════════════════════════════════════════════════
   HELPER UMUM
═══════════════════════════════════════════════════════════ */
function pad(n){return n<10?'0'+n:''+n;}
function nowFull(){var n=new Date();return pad(n.getDate())+'/'+pad(n.getMonth()+1)+'/'+n.getFullYear()+' '+pad(n.getHours())+':'+pad(n.getMinutes())+':'+pad(n.getSeconds());}
function b64sz(d){return Math.ceil(((d.split(',')[1]||'').length)*3/4);}
function getDanru(){var t=document.getElementById('laporan').value.replace(/[\*\_\~]/g,'');var m=/Danru\s*\d+\s*\(\s*(.*?)\s*\)/i.exec(t);return m?m[1].trim():'';}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function downloadFoto(idx) {
  var f = fotos[idx];
  if (!f || !f.data) return;
  var a = document.createElement('a');
  a.href = f.data;
  a.download = 'SIPEDAS_Foto' + (idx+1) + '_' + nowFull().replace(/[\/\s:]/g,'-') + '.jpg';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}