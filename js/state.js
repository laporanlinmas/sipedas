/* ═══════════════════════════════════════════════════════════
   SI-PEDAS Mobile — state.js
   Global state, settings, and session storage
═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   STATE GLOBAL
═══════════════════════════════════════════════════════════ */
var fotos = [], MAX = 10, MAX_B = 512 * 1024, viewIdx = 0;
var S = {
  wmCam: true, wmGal: true, minimap: true,
  loc: { jalan: '', nodukuh: '', desa: '', kec: '', kab: 'Ponorogo', prov: 'Jawa Timur' },
  lat: '', lng: ''
};

var _activeDraftId = null;

/* ═══════════════════════════════════════════════════════════
   SETTINGS
═══════════════════════════════════════════════════════════ */
function loadSets() {
  try {
    var r = sessionStorage.getItem('sip_s2');
    if (r) {
      var parsed = JSON.parse(r);
      if (parsed.wm !== undefined && parsed.wmCam === undefined) {
        parsed.wmCam = parsed.wm; parsed.wmGal = false;
      }
      S = Object.assign({}, S, parsed);
    }
  } catch (e) {}
  applyUI(); updateDot();
}
function saveSets() {
  S.wmCam = document.getElementById('t-wm-cam').checked;
  S.wmGal = document.getElementById('t-wm-gal').checked;
  S.minimap = document.getElementById('t-map').checked;
  S.loc.jalan   = document.getElementById('lc-jalan').value;
  S.loc.nodukuh = document.getElementById('lc-nodukuh').value;
  S.loc.desa    = document.getElementById('lc-desa').value;
  S.loc.kec     = document.getElementById('lc-kec').value;
  S.loc.kab     = document.getElementById('lc-kab').value;
  S.loc.prov    = document.getElementById('lc-prov').value;
  S.lat = document.getElementById('lc-lat').value;
  S.lng = document.getElementById('lc-lng').value;
  try { sessionStorage.setItem('sip_s2', JSON.stringify(S)); } catch (e) {}
  updateDot();
}
function applyUI() {
  document.getElementById('t-wm-cam').checked = S.wmCam;
  document.getElementById('t-wm-gal').checked = S.wmGal;
  document.getElementById('t-map').checked    = S.minimap;
  document.getElementById('lc-jalan').value   = S.loc.jalan;
  document.getElementById('lc-nodukuh').value = S.loc.nodukuh;
  document.getElementById('lc-desa').value    = S.loc.desa;
  document.getElementById('lc-kec').value     = S.loc.kec;
  document.getElementById('lc-kab').value     = S.loc.kab  || 'Ponorogo';
  document.getElementById('lc-prov').value    = S.loc.prov || 'Jawa Timur';
  document.getElementById('lc-lat').value     = S.lat;
  document.getElementById('lc-lng').value     = S.lng;
}
function updateDot() {
  document.getElementById('gear-dot').classList.toggle('show', !!(S.loc.jalan || S.loc.desa || S.lat));
}
function resetLoc() {
  ['lc-jalan','lc-nodukuh','lc-desa','lc-kec','lc-lat','lc-lng'].forEach(function(id){
    document.getElementById(id).value = '';
  });
  document.getElementById('lc-kab').value  = 'Ponorogo';
  document.getElementById('lc-prov').value = 'Jawa Timur';
  saveSets();
}
function openSet() { document.getElementById('set-ov').classList.add('show'); }
function closeSet() { document.getElementById('set-ov').classList.remove('show'); }
function setOvClick(e) { if (e.target === document.getElementById('set-ov')) closeSet(); }
function togColl(id) {
  document.getElementById(id + '-body').classList.toggle('open');
  document.getElementById(id + '-hdr').classList.toggle('open');
}
function getManualLoc() {
  var p = [];
  if (S.loc.jalan) {
    var j = S.loc.jalan;
    if (S.loc.nodukuh) j += ' / ' + S.loc.nodukuh;
    p.push(j);
  } else if (S.loc.nodukuh) { p.push(S.loc.nodukuh); }
  if (S.loc.desa) p.push(S.loc.desa);
  if (S.loc.kec)  p.push('Kec. ' + S.loc.kec);
  if (S.loc.kab)  p.push(S.loc.kab);
  if (S.loc.prov) p.push(S.loc.prov);
  p.push('Indonesia');
  return p.length > 1 ? p.join(', ') : 'Ponorogo, Jawa Timur, Indonesia';
}

/* ═══════════════════════════════════════════════════════════
   HELPER WM
═══════════════════════════════════════════════════════════ */
function getWM(source) { return source === 'camera' ? S.wmCam : S.wmGal; }