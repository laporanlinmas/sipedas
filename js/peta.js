// ══════════════════════════════════════════════════════════════════════════════
//  PETA PEDESTRIAN + PDF PRINT SYSTEM v4.1 — SI-PEDAS Dashboard
// ══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
//  KONSTANTA PETA
// ─────────────────────────────────────────────────────────────────────────────
var PETA_EMBED_URL  = 'https://www.google.com/maps/d/embed?mid=1edjOT5eZe4rAm3kqse2DE22xXgo6gqs&ehbc=2E312F&z=16&ll=-7.87148,111.47032';
var PETA_MYMAPS_URL = 'https://www.google.com/maps/d/viewer?mid=1edjOT5eZe4rAm3kqse2DE22xXgo6gqs';
var PETA_CENTER     = [-7.87148, 111.47032];
var PETA_ZOOM       = 13;

// ─────────────────────────────────────────────────────────────────────────────
//  STATE PETA
// ─────────────────────────────────────────────────────────────────────────────
var _petaMode           = 'leaflet';
var _petaFullscreen     = false;
var _lfMap              = null;
var _lfMarkersLP        = [];
var _lfMarkersDF        = [];
var _lfLayerGroupDF     = null;
var _lfLocateMarker     = null;
var _lfLocateCircle     = null;
var _layerData          = [];
var _layerFormRow       = null;
var _layerDelRi         = null;
var _selectedSimbol     = 'rute';
var _selectedWarna      = '#1e6fd9';
var _dfVisible          = false;
var _dfRawData          = [];
var _dfGroupFilter      = null;
var _dfStreetPanelOpen  = false;
var _lyrPhotoOpen       = false;
var _currentLayerCenter = null;
var _drawnItems         = null;
var _drawControl        = null;
var _activeDrawHandler  = null;
var _activeDrawMode     = null;
var _drawPanelOpen      = false;
var _drawnMeta          = {};
var _pendingLayer       = null;
var _pendingLayerType   = null;
var _metaWarna          = '#1e6fd9';
var _pickCoordMode      = false;
var _pickTempMarker     = null;
var _currentBaseLayer   = null;
var _navPanelOpen       = false;

// ─────────────────────────────────────────────────────────────────────────────
//  STATE PDF
// ─────────────────────────────────────────────────────────────────────────────
var _pdfMap          = null;
var _pdfMapLayers    = {};
var _pdfModalOpen    = false;
var _pdfRenderBusy   = false;
var _pdfLegendRows   = [];
var _logoCacheB64    = null;
var _simbolIconCache = {}; // cache base64 SVG ikon per "faIco_warna"

var _pdfOpts = {
  mapMode:     'osm',
  orientation: 'landscape',
  paperSize:   'a4',
  showLayers:  true,
  showDraw:    true,
  showFoto:    false,
  dpi:         3
};

// ─────────────────────────────────────────────────────────────────────────────
//  UKURAN KERTAS (mm)
// ─────────────────────────────────────────────────────────────────────────────
var PAPER_SIZES = {
  a1:    { label: 'A1',         w: 594,   h: 841   },
  a2:    { label: 'A2',         w: 420,   h: 594   },
  a3:    { label: 'A3',         w: 297,   h: 420   },
  a4:    { label: 'A4',         w: 210,   h: 297   },
  legal: { label: 'Legal',      w: 215.9, h: 355.6 },
  f4:    { label: 'F4 (Folio)', w: 215.9, h: 330.2 }
};

// ─────────────────────────────────────────────────────────────────────────────
//  DATA STATIS
// ─────────────────────────────────────────────────────────────────────────────
var JALAN_GROUPS = [
  { id: 'jenderal_soedirman', label: 'Jl. Jenderal Soedirman', ico: 'fa-road',             warna: '#607d8b' },
  { id: 'hos_cokroaminoto',   label: 'Jl. HOS Cokroaminoto',   ico: 'fa-road',             warna: '#0d9268' },
  { id: 'urip_soemoharjo',    label: 'Jl. Urip Soemoharjo',    ico: 'fa-road',             warna: '#d97706' },
  { id: 'soekarno_hatta',     label: 'Jl. Soekarno Hatta',     ico: 'fa-road',             warna: '#7c3aed' },
  { id: 'diponegoro',         label: 'Jl. Diponegoro',         ico: 'fa-road',             warna: '#c0392b' },
  { id: 'lainnya',            label: 'Area Lainnya',           ico: 'fa-map-location-dot', warna: '#1e6fd9' }
];

var DRAW_WARNA_PRESET = [
  { hex: '#1e6fd9', lbl: 'Biru'   }, { hex: '#c0392b', lbl: 'Merah'  },
  { hex: '#0d9268', lbl: 'Hijau'  }, { hex: '#d97706', lbl: 'Kuning' },
  { hex: '#7c3aed', lbl: 'Ungu'  }, { hex: '#0891b2', lbl: 'Tosca'  },
  { hex: '#e67e22', lbl: 'Oranye'}, { hex: '#e91e63', lbl: 'Pink'   },
  { hex: '#607d8b', lbl: 'Abu'   }, { hex: '#1a1a2e', lbl: 'Hitam'  },
  { hex: '#f59e0b', lbl: 'Emas'  }, { hex: '#10b981', lbl: 'Zamrud' }
];

var SIMBOL_DEF = [
  { id: 'rute',     ico: 'fa-route',               label: 'Rute Patroli', warna: '#1e6fd9' },
  { id: 'hotspot',  ico: 'fa-triangle-exclamation', label: 'Titik Rawan', warna: '#c0392b' },
  { id: 'posjaga',  ico: 'fa-shield-halved',        label: 'Pos Jaga',    warna: '#0d9268' },
  { id: 'toko',     ico: 'fa-store',                label: 'Toko',        warna: '#d97706' },
  { id: 'batas',    ico: 'fa-draw-polygon',         label: 'Batas',       warna: '#7c3aed' },
  { id: 'bangunan', ico: 'fa-building',             label: 'Bangunan',    warna: '#0891b2' },
  { id: 'kamera',   ico: 'fa-video',                label: 'CCTV/Kamera', warna: '#e67e22' },
  { id: 'parkir',   ico: 'fa-square-parking',       label: 'Parkir',      warna: '#2ecc71' }
];

var WARNA_PRESET = [
  '#1e6fd9','#c0392b','#0d9268','#d97706','#7c3aed','#0891b2',
  '#e67e22','#2ecc71','#e91e63','#607d8b','#ff5722','#795548'
];

var TILE_LAYERS = {
  osm:        { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',                                            attr: '© OpenStreetMap',  label: 'OpenStreetMap', maxZoom: 19 },
  satellite:  { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: 'Esri',             label: 'Satelit Esri',  maxZoom: 19 },
  hybrid:     { url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',                                           attr: 'Google',           label: 'Google Hybrid', maxZoom: 20 },
  google_sat: { url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',                                           attr: 'Google',           label: 'Google Sat',    maxZoom: 20 },
  carto:      { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',                                attr: 'CartoDB',          label: 'CartoDB',       maxZoom: 19 },
  topo:       { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',                                              attr: 'OpenTopoMap',      label: 'Topografi',     maxZoom: 17 }
};

// Cache PNG rasterisasi (key: "faIco_warna")
var _simbolIconCache = {};

// FA class → unicode (FA 6 Free Solid)
var FA_UNICODE = {
  'fa-route':                '\uf4d7',
  'fa-triangle-exclamation': '\uf071',
  'fa-shield-halved':        '\uf3ed',
  'fa-store':                '\uf54e',
  'fa-draw-polygon':         '\uf5ee',
  'fa-building':             '\uf1ad',
  'fa-video':                '\uf03d',
  'fa-square-parking':       '\uf540',
  'fa-map-pin':              '\uf276',
  'fa-location-dot':         '\uf3c5',
  'fa-camera':               '\uf030',
  'fa-road':                 '\uf018',
  'fa-map-location-dot':     '\uf5a0'
};

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS UMUM
// ─────────────────────────────────────────────────────────────────────────────
function G(id) { return document.getElementById(id); }

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function hexToRgb(hex) {
  hex = (hex || '607d8b').replace('#','');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  return { r: parseInt(hex.slice(0,2),16), g: parseInt(hex.slice(2,4),16), b: parseInt(hex.slice(4,6),16) };
}

function getSimbolDef(id) {
  var LEGACY = {
    'area':'rute','marker':'posjaga','pin':'posjaga','polyline':'rute','polygon':'batas',
    'dot':'hotspot','line':'rute','poly':'batas','camera':'kamera','foto':'kamera',
    'building':'bangunan','store':'toko','shield':'posjaga','warning':'hotspot','route':'rute'
  };
  var r = LEGACY[id] || id;
  for (var i = 0; i < SIMBOL_DEF.length; i++) if (SIMBOL_DEF[i].id === r) return SIMBOL_DEF[i];
  return SIMBOL_DEF[0];
}

function _getPaperDims() {
  var p = PAPER_SIZES[_pdfOpts.paperSize] || PAPER_SIZES.a4;
  var ls = _pdfOpts.orientation === 'landscape';
  return { w: ls ? p.h : p.w, h: ls ? p.w : p.h };
}

// ─────────────────────────────────────────────────────────────────────────────
//  IKON PIN — render pin ke canvas langsung (tanpa SVG font dependency)
//  Cara: gambar teardrop di canvas pakai Path2D + gambar ikon FA via drawImage
//  dari elemen <i> yang sudah dirender browser → screenshot per-ikon
// ─────────────────────────────────────────────────────────────────────────────

// Gambar pin ke canvas ctx langsung (tidak butuh font embed)
function _drawPinToCanvas(ctx, faIco, warna, cw, ch) {
  var c = warna || '#607d8b';
  // Scale factor
  var sx = cw / 32, sy = ch / 42;

  ctx.clearRect(0, 0, cw, ch);

  // Bayangan elips bawah
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(16 * sx, 39 * sy, 5 * sx, 2.5 * sy, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Badan teardrop
  ctx.save();
  ctx.fillStyle = c;
  ctx.beginPath();
  // Path teardrop: M16 0 C9.37 0 4 5.37 4 12 c0 9.5 12 28 12 28 S28 21.5 28 12 C28 5.37 22.63 0 16 0z
  ctx.moveTo(16 * sx, 0);
  ctx.bezierCurveTo(9.37 * sx, 0, 4 * sx, 5.37 * sy, 4 * sx, 12 * sy);
  ctx.bezierCurveTo(4 * sx, 21.5 * sy, 16 * sx, 40 * sy, 16 * sx, 40 * sy);
  ctx.bezierCurveTo(16 * sx, 40 * sy, 28 * sx, 21.5 * sy, 28 * sx, 12 * sy);
  ctx.bezierCurveTo(28 * sx, 5.37 * sy, 22.63 * sx, 0, 16 * sx, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Highlight semi-transparan
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(16 * sx, 12 * sy, 8 * sx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Lingkaran putih dalam (background ikon)
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(16 * sx, 12 * sy, 6.5 * sx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Ikon FA — render via offscreen div + html2canvas trick:
  // Pakai ctx.font dengan FontAwesome yang sudah dimuat browser
  var uni = FA_UNICODE[faIco] || FA_UNICODE['fa-map-pin'];
  ctx.save();
  ctx.fillStyle = c;
  ctx.font = 'bold ' + Math.round(10 * sx) + 'px "Font Awesome 6 Free"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(uni, 16 * sx, 12 * sy);
  ctx.restore();
}

// Buat PNG base64 dari pin (render langsung ke canvas)
function _makePinPng(faIco, warna) {
  var SIZE = 4; // 4x resolusi
  var cv = document.createElement('canvas');
  cv.width = 32 * SIZE; cv.height = 42 * SIZE;
  var ctx = cv.getContext('2d');
  _drawPinToCanvas(ctx, faIco, warna, cv.width, cv.height);
  return cv.toDataURL('image/png');
}

// Pre-cache semua kombinasi ikon×warna
function _precacheSimbolIcons() {
  var pairs = [];
  SIMBOL_DEF.forEach(function(s) { pairs.push({ ico: s.ico, warna: s.warna }); });
  if (_layerData) {
    _layerData.forEach(function(l) {
      var sd = getSimbolDef(l.simbol);
      pairs.push({ ico: sd.ico, warna: l.warna || sd.warna });
    });
  }
  pairs.forEach(function(p) {
    var key = p.ico + '_' + p.warna;
    if (!_simbolIconCache[key]) {
      _simbolIconCache[key] = _makePinPng(p.ico, p.warna);
    }
  });
}

function _getSimbolPng(faIco, warna) {
  var key = (faIco || 'fa-map-pin') + '_' + (warna || '#607d8b');
  if (!_simbolIconCache[key]) _simbolIconCache[key] = _makePinPng(faIco, warna);
  return _simbolIconCache[key];
}

// ─────────────────────────────────────────────────────────────────────────────
//  FETCH URL → BASE64 (untuk logo)
// ─────────────────────────────────────────────────────────────────────────────
function _imgToBase64(url) {
  return fetch(url)
    .then(function(r) { return r.blob(); })
    .then(function(blob) {
      return new Promise(function(resolve, reject) {
        var rd = new FileReader();
        rd.onloadend = function() { resolve(rd.result); };
        rd.onerror   = reject;
        rd.readAsDataURL(blob);
      });
    });
}

// ══════════════════════════════════════════════════════════════════════════════
//  INJECT CSS
// ══════════════════════════════════════════════════════════════════════════════
function _injectPetaStyles() {
  if (G('peta-dyn-style')) return;
  var s = document.createElement('style');
  s.id = 'peta-dyn-style';
  s.textContent = [
    '.peta-fs-active{position:fixed!important;inset:0!important;z-index:9400!important;width:100vw!important;height:100vh!important;border-radius:0!important;padding:0!important;background:var(--card)!important;}',
    '.peta-exit-fs-btn{display:none!important;position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:9700;background:rgba(15,23,42,.84);color:#fff;border:none;border-radius:20px;padding:6px 16px;font-size:.68rem;font-weight:800;cursor:pointer;align-items:center;gap:6px;backdrop-filter:blur(12px);}',
    '.peta-fs-active .peta-exit-fs-btn{display:flex!important;}',
    '.df-cam-btn{position:absolute;bottom:30px;left:10px;z-index:999;width:36px;height:36px;border-radius:50%;background:rgba(10,22,44,.88);color:#fff;border:none;display:flex;align-items:center;justify-content:center;font-size:.88rem;cursor:pointer;box-shadow:0 3px 14px rgba(0,0,0,.38);transition:all .15s;}',
    '.df-cam-btn:hover{background:rgba(30,111,217,.85);transform:scale(1.08);}',
    '.df-cam-btn.active{background:rgba(30,111,217,.9);box-shadow:0 0 0 2px #fff,0 0 0 4px #1e6fd9;}',
    '.df-street-panel{position:absolute;bottom:74px;left:10px;z-index:1000;background:rgba(10,20,42,.96);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:7px 5px;display:flex;flex-direction:column;gap:1px;box-shadow:0 12px 36px rgba(0,0,0,.48);min-width:205px;transform-origin:bottom left;transition:opacity .18s,transform .18s;}',
    '.df-street-panel.hidden{opacity:0;pointer-events:none;transform:scale(.88) translateY(8px);}',
    '.df-street-panel.visible{opacity:1;pointer-events:auto;transform:scale(1) translateY(0);}',
    '.dsp-lbl{font-size:.52rem;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.28);padding:3px 10px 5px;}',
    '.dsp-btn{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:8px;border:none;background:transparent;color:rgba(255,255,255,.72);font-size:.68rem;font-weight:700;cursor:pointer;text-align:left;width:100%;font-family:var(--font);transition:background .12s,color .12s;}',
    '.dsp-btn:hover{background:rgba(255,255,255,.1);color:#fff;}',
    '.dsp-btn.on{color:#fff;}',
    '.dsp-btn i.si{width:14px;text-align:center;font-size:.74rem;flex-shrink:0;}',
    '.dsp-btn .sc{margin-left:auto;font-size:.58rem;font-family:var(--mono);background:rgba(255,255,255,.1);padding:1px 6px;border-radius:20px;color:rgba(255,255,255,.45);}',
    '.dsp-btn.on .sc{background:rgba(255,255,255,.18);color:#fff;}',
    '.dsp-sep{height:1px;background:rgba(255,255,255,.07);margin:3px 5px;}',
    '.lf-draw-toggle{position:absolute;bottom:30px;right:10px;z-index:1000;width:36px;height:36px;border-radius:50%;background:rgba(10,22,44,.88);color:#fff;border:none;display:flex;align-items:center;justify-content:center;font-size:.88rem;cursor:pointer;box-shadow:0 3px 14px rgba(0,0,0,.35);transition:all .15s;}',
    '.lf-draw-toggle:hover{background:rgba(30,111,217,.85);transform:scale(1.06);}',
    '.lf-draw-toggle.active{background:rgba(30,111,217,.9);box-shadow:0 0 0 2px #fff,0 0 0 4px #1e6fd9;}',
    '.lf-draw-panel{position:absolute;bottom:74px;right:10px;z-index:1001;background:rgba(10,20,42,.96);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:8px 5px;display:flex;flex-direction:column;gap:1px;box-shadow:0 12px 36px rgba(0,0,0,.48);min-width:148px;transform-origin:bottom right;transition:opacity .18s,transform .18s;}',
    '.lf-draw-panel.hidden{opacity:0;pointer-events:none;transform:scale(.88);}',
    '.lf-draw-panel.visible{opacity:1;pointer-events:auto;transform:scale(1);}',
    '.lf-draw-panel-lbl{font-size:.52rem;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.28);padding:3px 10px 5px;}',
    '.lf-draw-sep{height:1px;background:rgba(255,255,255,.07);margin:3px 5px;}',
    '.lf-draw-item{display:flex;align-items:center;gap:7px;padding:7px 10px;border-radius:8px;border:none;background:transparent;color:rgba(255,255,255,.72);font-size:.68rem;font-weight:700;cursor:pointer;text-align:left;width:100%;font-family:var(--font);transition:background .12s,color .12s;}',
    '.lf-draw-item:hover{background:rgba(255,255,255,.1);color:#fff;}',
    '.lf-draw-item.active{background:rgba(30,111,217,.32);color:#80b8ff;}',
    '.lf-draw-item.danger:hover{background:rgba(192,57,43,.32);color:#ff9898;}',
    '.lf-draw-item i{width:14px;text-align:center;font-size:.76rem;flex-shrink:0;}',
    '.lf-meta-overlay{position:absolute;bottom:0;left:0;right:0;z-index:1100;background:rgba(8,18,38,.97);backdrop-filter:blur(16px);border-top:1px solid rgba(255,255,255,.1);padding:14px 16px 16px;border-radius:0 0 12px 12px;transform:translateY(100%);transition:transform .22s cubic-bezier(.34,1.4,.64,1);}',
    '.lf-meta-overlay.show{transform:translateY(0);}',
    '.lf-meta-title{font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.42);margin-bottom:10px;display:flex;align-items:center;gap:6px;}',
    '.lf-meta-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;}',
    '.lf-meta-input{width:100%;padding:7px 9px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:7px;color:#fff;font-family:var(--font);font-size:.72rem;outline:none;transition:border-color .14s,background .14s;}',
    '.lf-meta-input:focus{border-color:rgba(30,111,217,.7);background:rgba(30,111,217,.12);}',
    '.lf-meta-input::placeholder{color:rgba(255,255,255,.25);}',
    '.lf-meta-warna-grid{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;}',
    '.lf-meta-swatch{width:22px;height:22px;border-radius:5px;cursor:pointer;border:2.5px solid transparent;transition:transform .12s,border-color .12s;flex-shrink:0;}',
    '.lf-meta-swatch:hover{transform:scale(1.18);}',
    '.lf-meta-swatch.on{border-color:#fff;transform:scale(1.18);}',
    '.lf-meta-color-custom{display:flex;align-items:center;gap:6px;margin-bottom:10px;}',
    '.lf-meta-color-inp{width:28px;height:28px;border:none;border-radius:5px;cursor:pointer;background:none;padding:0;}',
    '.lf-meta-color-lbl{font-size:.62rem;font-family:var(--mono);color:rgba(255,255,255,.42);}',
    '.lf-meta-actions{display:flex;gap:6px;}',
    '.lf-meta-btn-ok{flex:1;padding:7px;background:#1e6fd9;color:#fff;border:none;border-radius:8px;font-size:.72rem;font-weight:800;cursor:pointer;font-family:var(--font);display:flex;align-items:center;justify-content:center;gap:5px;}',
    '.lf-meta-btn-ok:hover{background:#1660c5;}',
    '.lf-meta-btn-cancel{padding:7px 12px;background:rgba(255,255,255,.07);color:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.1);border-radius:8px;font-size:.72rem;font-weight:700;cursor:pointer;font-family:var(--font);}',
    '.lf-meta-msr{margin-bottom:10px;background:rgba(30,111,217,.14);border:1px solid rgba(30,111,217,.25);border-radius:7px;padding:7px 10px;font-size:.66rem;color:#80b8ff;display:flex;align-items:center;gap:6px;}',
    '.lf-tip-clean{background:rgba(255,255,255,.94)!important;color:#1e3a5f!important;border:1px solid rgba(30,111,217,.25)!important;border-radius:6px!important;padding:4px 9px!important;font-family:var(--font)!important;font-size:.67rem!important;font-weight:700!important;box-shadow:0 2px 10px rgba(0,0,0,.1)!important;pointer-events:none!important;white-space:nowrap!important;}',
    '.lf-tip-clean b{color:#0d7a5f;font-family:var(--mono);}',
    '.lf-pick-cursor .leaflet-container{cursor:crosshair!important;}',
    '.lf-pick-banner{position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:1200;background:rgba(13,146,104,.92);color:#fff;padding:6px 18px;border-radius:20px;font-size:.68rem;font-weight:800;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,.35);display:flex;align-items:center;gap:7px;pointer-events:auto;font-family:var(--font);}',
    '.lf-pick-cancel{background:rgba(255,255,255,.18);border:none;color:#fff;padding:2px 8px;border-radius:10px;font-size:.62rem;font-weight:800;cursor:pointer;font-family:var(--font);margin-left:6px;}',
    '@keyframes peta-pulse{0%{transform:scale(1);opacity:.75}100%{transform:scale(2.8);opacity:0}}',
    '.peta-locate-dot{width:14px;height:14px;background:#1e6fd9;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 8px rgba(30,111,217,.5);position:relative;}',
    '.peta-locate-dot::after{content:"";position:absolute;inset:-2px;background:#1e6fd9;border-radius:50%;animation:peta-pulse 1.8s ease-out infinite;}',
    '.leaflet-container{position:relative!important;}',
    '.df-dot{width:13px;height:13px;border-radius:50%;border:2.5px solid #fff;cursor:pointer;transition:transform .12s,box-shadow .12s;}',
    '.df-dot:hover{transform:scale(1.3);}',
    '.lf-save-note{position:absolute;bottom:80px;left:50%;transform:translateX(-50%);z-index:1002;background:rgba(13,146,104,.92);color:#fff;padding:5px 14px;border-radius:20px;font-size:.65rem;font-weight:800;white-space:nowrap;box-shadow:0 3px 12px rgba(0,0,0,.3);opacity:0;transition:opacity .25s;pointer-events:none;}',
    '.lf-save-note.show{opacity:1;}',
    '.foto-ov{position:fixed;inset:0;z-index:9600;background:rgba(6,14,30,.7);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;pointer-events:none;transition:opacity .22s;}',
    '.foto-ov.show{opacity:1;pointer-events:auto;}',
    '.foto-modal{background:var(--card);border-radius:16px;box-shadow:0 28px 70px rgba(0,0,0,.44);width:100%;max-width:720px;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;animation:mIn .24s cubic-bezier(.34,1.2,.64,1);}',
    '.foto-hd{padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;flex-shrink:0;background:var(--card);}',
    '.foto-hd-ico{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.8rem;flex-shrink:0;}',
    '.foto-hd-info{flex:1;min-width:0;}',
    '.foto-hd-title{font-size:.78rem;font-weight:800;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.foto-hd-sub{font-size:.6rem;color:var(--muted);}',
    '.foto-close{width:28px;height:28px;border-radius:7px;border:none;background:var(--bg);color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.72rem;transition:all .13s;}',
    '.foto-close:hover{background:var(--redl);color:var(--red);}',
    '.foto-filter{flex-shrink:0;padding:9px 14px;background:var(--bg);border-bottom:1px solid var(--border);display:flex;flex-wrap:wrap;gap:7px;align-items:center;}',
    '.foto-filter-lbl{font-size:.58rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;}',
    '.foto-date{padding:5px 9px;border:1px solid var(--border);border-radius:7px;background:var(--card);color:var(--text);font-family:var(--font);font-size:.68rem;outline:none;width:126px;}',
    '.foto-date:focus{border-color:var(--blue);}',
    '.foto-rad{padding:5px 9px;border:1px solid var(--border);border-radius:7px;background:var(--card);color:var(--text);font-family:var(--font);font-size:.68rem;outline:none;}',
    '.foto-search{padding:5px 9px;background:var(--blue);color:#fff;border:none;border-radius:7px;font-size:.65rem;font-weight:800;cursor:pointer;font-family:var(--font);display:flex;align-items:center;gap:4px;}',
    '.foto-search:hover{background:var(--blueh);}',
    '.foto-reset{padding:5px 8px;background:var(--bg);color:var(--muted);border:1px solid var(--border);border-radius:7px;font-size:.65rem;cursor:pointer;font-family:var(--font);}',
    '.foto-body{flex:1;overflow-y:auto;padding:12px 14px;}',
    '.foto-body::-webkit-scrollbar{width:4px;}',
    '.foto-body::-webkit-scrollbar-thumb{background:var(--bdark);border-radius:2px;}',
    '.foto-stat{font-size:.62rem;color:var(--muted);margin-bottom:10px;}',
    '.foto-stat b{color:var(--blue);font-family:var(--mono);}',
    '.foto-list{display:flex;flex-direction:column;gap:8px;}',
    '.foto-card{background:var(--card);border:1px solid var(--border);border-radius:10px;overflow:hidden;display:flex;flex-direction:row;align-items:stretch;transition:all .15s;min-height:90px;}',
    '.foto-card:hover{box-shadow:var(--sh);border-color:rgba(30,111,217,.35);transform:translateY(-1px);}',
    '.foto-thumb-col{width:110px;flex-shrink:0;background:var(--bg);cursor:pointer;overflow:hidden;display:flex;align-items:stretch;position:relative;}',
    '.foto-thumb-col img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .2s;}',
    '.foto-thumb-col:hover img{transform:scale(1.06);}',
    '.foto-thumb-ph{width:110px;flex-shrink:0;background:var(--bg);display:flex;align-items:center;justify-content:center;color:var(--border);font-size:1.6rem;}',
    '.foto-thumb-overlay{position:absolute;inset:0;background:rgba(0,0,0,.32);opacity:0;transition:opacity .15s;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.1rem;}',
    '.foto-thumb-col:hover .foto-thumb-overlay{opacity:1;}',
    '.foto-info-col{flex:1;min-width:0;padding:9px 12px;display:flex;flex-direction:column;justify-content:space-between;}',
    '.foto-fname{font-size:.72rem;font-weight:800;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:5px;line-height:1.3;}',
    '.foto-meta-rows{display:flex;flex-direction:column;gap:3px;flex:1;}',
    '.foto-meta-row{display:flex;align-items:flex-start;gap:5px;font-size:.62rem;color:var(--mid);line-height:1.45;}',
    '.foto-meta-row i{width:12px;text-align:center;flex-shrink:0;margin-top:1px;color:var(--muted);}',
    '.foto-meta-row span{word-break:break-word;}',
    '.foto-bottom-row{display:flex;align-items:center;justify-content:space-between;margin-top:7px;gap:6px;}',
    '.foto-dist{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;background:var(--bluelo);color:var(--blue);border-radius:20px;font-size:.57rem;font-weight:700;font-family:var(--mono);white-space:nowrap;}',
    '.foto-acts{display:flex;gap:4px;flex-shrink:0;}',
    '.foto-btn{padding:3px 9px;border:none;border-radius:6px;font-size:.6rem;font-weight:700;cursor:pointer;font-family:var(--font);display:inline-flex;align-items:center;gap:3px;text-decoration:none;white-space:nowrap;}',
    '.foto-btn.prev{background:var(--bluelo);color:var(--blue);}',
    '.foto-btn.prev:hover{background:var(--blue);color:#fff;}',
    '.foto-btn.gmaps{background:rgba(30,111,217,.1);color:var(--blue);}',
    '.foto-btn.gmaps:hover{background:var(--blue);color:#fff;}',
    '.foto-btn.drv{background:var(--greenl);color:var(--green);}',
    '.foto-btn.drv:hover{background:var(--green);color:#fff;}',
    '.foto-empty{text-align:center;padding:44px 20px;color:var(--muted);}',
    '.foto-empty i{font-size:1.8rem;display:block;margin-bottom:8px;opacity:.18;}',
    '.img-lb-ov{position:fixed;inset:0;z-index:99980;background:rgba(0,0,0,.93);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:20px;opacity:0;pointer-events:none;transition:opacity .2s;}',
    '.img-lb-ov.show{opacity:1;pointer-events:auto;}',
    '.img-lb-img{max-width:90vw;max-height:74vh;border-radius:8px;object-fit:contain;box-shadow:0 20px 60px rgba(0,0,0,.6);}',
    '.img-lb-close{position:absolute;top:14px;right:16px;background:rgba(255,255,255,.1);border:none;color:#fff;width:34px;height:34px;border-radius:50%;font-size:.85rem;cursor:pointer;display:flex;align-items:center;justify-content:center;}',
    '.img-lb-close:hover{background:rgba(192,57,43,.5);}',
    '.img-lb-name{color:rgba(255,255,255,.55);font-size:.65rem;text-align:center;}',
    '.img-lb-drv{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;background:#1e6fd9;color:#fff;border-radius:8px;font-size:.68rem;font-weight:700;text-decoration:none;}',
    '.img-lb-drv:hover{background:#1660c5;}',
    '.mymaps-open-bar{position:absolute;top:8px;left:50%;transform:translateX(-50%);z-index:500;background:rgba(10,22,44,.85);backdrop-filter:blur(10px);color:#fff;border-radius:20px;padding:5px 14px;font-size:.67rem;font-weight:700;display:flex;align-items:center;gap:7px;box-shadow:0 4px 16px rgba(0,0,0,.35);}',
    '.mymaps-open-btn{background:rgba(30,111,217,.9);color:#fff;border:none;border-radius:12px;padding:4px 12px;font-size:.64rem;font-weight:800;cursor:pointer;font-family:var(--font);display:inline-flex;align-items:center;gap:5px;text-decoration:none;}',
    '.mymaps-open-btn:hover{background:rgba(30,111,217,1);}',
    '.pdf-render-overlay{position:fixed;inset:0;z-index:99999;background:rgba(6,14,30,.82);backdrop-filter:blur(8px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;opacity:0;pointer-events:none;transition:opacity .2s;}',
    '.pdf-render-overlay.show{opacity:1;pointer-events:auto;}',
    '.pdf-render-spinner{width:46px;height:46px;border:4px solid rgba(255,255,255,.12);border-top:4px solid #1e6fd9;border-radius:50%;animation:peta-spin .8s linear infinite;}',
    '@keyframes peta-spin{to{transform:rotate(360deg)}}',
    '.pdf-render-txt{color:#fff;font-size:.8rem;font-weight:700;text-align:center;}',
    '.pdf-render-sub{color:rgba(255,255,255,.45);font-size:.67rem;text-align:center;}',
    '.pdf-render-progress{width:200px;height:4px;background:rgba(255,255,255,.12);border-radius:2px;overflow:hidden;}',
    '.pdf-render-bar{height:100%;background:linear-gradient(90deg,#1e6fd9,#0891b2);border-radius:2px;transition:width .3s ease;width:0%;}',
    '.pdf-ov{position:fixed;inset:0;z-index:9800;background:rgba(6,12,28,.88);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;pointer-events:none;transition:opacity .28s;}',
    '.pdf-ov.show{opacity:1;pointer-events:auto;}',
    '.pdf-modal{background:var(--card);border-radius:18px;box-shadow:0 32px 80px rgba(0,0,0,.55);width:100%;max-width:1100px;height:90vh;display:flex;flex-direction:column;overflow:hidden;animation:mIn .28s cubic-bezier(.34,1.2,.64,1);}',
    '.pdf-mhd{padding:12px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}',
    '.pdf-mtitle{font-size:.8rem;font-weight:800;color:var(--text);display:flex;align-items:center;gap:7px;}',
    '.pdf-macts{display:flex;gap:6px;align-items:center;}',
    '.pdf-mbody{flex:1;display:flex;min-height:0;overflow:hidden;}',
    '.pdf-opts{width:270px;flex-shrink:0;border-right:1px solid var(--border);overflow-y:auto;background:var(--bg);}',
    '.pdf-opts::-webkit-scrollbar{width:3px;}',
    '.pdf-opts::-webkit-scrollbar-thumb{background:var(--bdark);border-radius:2px;}',
    '.pdf-sect{padding:12px 12px 0;}',
    '.pdf-sect-lbl{font-size:.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:7px;display:flex;align-items:center;gap:5px;}',
    '.pdf-chk{display:flex;align-items:center;gap:7px;padding:6px 8px;background:var(--card);border:1px solid var(--border);border-radius:7px;margin-bottom:4px;cursor:pointer;user-select:none;transition:all .12s;}',
    '.pdf-chk:hover{border-color:var(--blue);}',
    '.pdf-chk.on{border-color:var(--blue);background:var(--bluelo);}',
    '.pdf-chk input[type=checkbox]{accent-color:var(--blue);width:13px;height:13px;flex-shrink:0;pointer-events:none;}',
    '.pdf-chk label{font-size:.68rem;color:var(--text);line-height:1.4;pointer-events:none;}',
    '.pdf-chk label small{display:block;font-size:.57rem;color:var(--muted);}',
    '.pdf-map-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:10px;}',
    '.pdf-map-btn{padding:7px 4px;border:1.5px solid var(--border);border-radius:7px;background:var(--card);font-size:.6rem;font-weight:700;color:var(--muted);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;transition:all .13s;font-family:var(--font);}',
    '.pdf-map-btn i{font-size:.82rem;}',
    '.pdf-map-btn:hover{border-color:var(--teal);color:var(--teal);}',
    '.pdf-map-btn.on{border-color:var(--teal);background:var(--teall);color:var(--teal);}',
    '.pdf-paper-row{display:flex;gap:5px;margin-bottom:10px;flex-wrap:wrap;}',
    '.pdf-paper-btn{flex:1;min-width:60px;padding:6px 4px;border:1.5px solid var(--border);border-radius:7px;background:var(--card);font-size:.6rem;font-weight:700;color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .13s;font-family:var(--font);white-space:nowrap;}',
    '.pdf-paper-btn:hover{border-color:var(--blue);color:var(--blue);}',
    '.pdf-paper-btn.on{border-color:var(--blue);background:var(--bluelo);color:var(--blue);}',
    '.pdf-ori-row{display:flex;gap:5px;margin-bottom:10px;}',
    '.pdf-ori-btn{flex:1;padding:6px 4px;border:1.5px solid var(--border);border-radius:7px;background:var(--card);font-size:.62rem;font-weight:700;color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:all .13s;font-family:var(--font);}',
    '.pdf-ori-btn:hover{border-color:var(--blue);color:var(--blue);}',
    '.pdf-ori-btn.on{border-color:var(--blue);background:var(--bluelo);color:var(--blue);}',
    '.pdf-dpi-row{display:flex;gap:5px;margin-bottom:6px;}',
    '.pdf-dpi-btn{flex:1;padding:6px 4px;border:1.5px solid var(--border);border-radius:7px;background:var(--card);font-size:.62rem;font-weight:700;color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .13s;font-family:var(--font);}',
    '.pdf-dpi-btn:hover{border-color:var(--blue);color:var(--blue);}',
    '.pdf-dpi-btn.on{border-color:var(--blue);background:var(--bluelo);color:var(--blue);}',
    '.pdf-leg-area{padding:0 0 10px;}',
    '.pdf-leg-row{display:flex;align-items:center;gap:6px;margin-bottom:6px;}',
    '.pdf-leg-swatch-wrap{width:24px;height:20px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}',
    '.pdf-leg-inp{flex:1;padding:4px 7px;border:1px solid var(--border);border-radius:5px;font-size:.68rem;font-family:var(--font);color:var(--text);outline:none;background:var(--card);}',
    '.pdf-leg-inp:focus{border-color:var(--blue);}',
    '.pdf-leg-del{width:22px;height:22px;border-radius:5px;border:none;background:var(--bg);color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.6rem;flex-shrink:0;}',
    '.pdf-leg-del:hover{background:var(--redl);color:var(--red);}',
    '.pdf-leg-add{width:100%;padding:5px;border:1.5px dashed var(--border);border-radius:7px;background:transparent;color:var(--muted);font-size:.65rem;cursor:pointer;font-family:var(--font);transition:all .13s;margin-top:4px;}',
    '.pdf-leg-add:hover{border-color:var(--blue);color:var(--blue);}',
    '.pdf-map-area{flex:1;display:flex;flex-direction:column;overflow:hidden;}',
    '.pdf-map-banner{flex-shrink:0;background:rgba(30,111,217,.08);border-bottom:1px solid rgba(30,111,217,.14);padding:8px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;}',
    '.pdf-map-banner-txt{font-size:.62rem;color:var(--mid);display:flex;align-items:center;gap:6px;}',
    '.pdf-map-banner-txt i{color:var(--blue);}',
    '.pdf-map-frame{flex:1;overflow:hidden;background:#e4eaf5;}',
    '#pdf-map-preview{width:100%;height:100%;}',
    '#lf-loader{display:none;position:absolute;inset:0;background:rgba(235,239,248,.88);backdrop-filter:blur(6px);z-index:800;border-radius:12px;flex-direction:column;align-items:center;justify-content:center;gap:10px;}',
    '.leaflet-overlay-pane svg path[fill="black"]{fill:#7c3aed!important;fill-opacity:.12!important;}',
    '.leaflet-overlay-pane svg path[fill="#000000"]{fill:#7c3aed!important;fill-opacity:.12!important;}',
    '.leaflet-overlay-pane svg path[fill="#000"]{fill:#7c3aed!important;fill-opacity:.12!important;}',
    '.leaflet-draw-tooltip{display:none!important;}',
    '.leaflet-draw-guide-dash{display:none!important;}',
    '.leaflet-tooltip{background:#fff!important;color:#1e3a5f!important;border:1px solid rgba(30,111,217,.22)!important;border-radius:7px!important;padding:5px 10px!important;font-size:.67rem!important;font-weight:700!important;box-shadow:0 2px 10px rgba(0,0,0,.1)!important;white-space:nowrap!important;}',
    '.leaflet-tooltip::before,.leaflet-tooltip-top::before,.leaflet-tooltip-bottom::before,.leaflet-tooltip-left::before,.leaflet-tooltip-right::before{display:none!important;border:none!important;background:transparent!important;}',
    '.leaflet-popup-content-wrapper{background:#fff!important;border:none!important;border-radius:12px!important;box-shadow:0 8px 28px rgba(0,0,0,.18),0 2px 8px rgba(0,0,0,.12)!important;padding:0!important;overflow:hidden!important;}',
    '.leaflet-popup-content{margin:12px 14px!important;font-family:var(--font)!important;font-size:.76rem!important;line-height:1.6!important;}',
    '.leaflet-popup-tip-container{display:none!important;}',
    '.leaflet-popup-tip{display:none!important;}',
    '.leaflet-popup-close-button{color:var(--muted)!important;font-size:16px!important;top:6px!important;right:8px!important;background:transparent!important;}',
    '.leaflet-popup-close-button:hover{color:var(--red)!important;}',
    '.lf-clean-popup .leaflet-popup-content-wrapper{border-radius:12px!important;box-shadow:0 8px 28px rgba(0,0,0,.16)!important;border:1px solid var(--border)!important;}',
    '.lf-clean-popup .leaflet-popup-tip-container{display:none!important;}',
    '.leaflet-interactive{outline:none!important;}',
    '.leaflet-interactive:focus{outline:none!important;}',
    '.leaflet-overlay-pane svg path:focus{outline:none!important;}',
    'path.leaflet-interactive:focus{stroke:inherit!important;outline:none!important;}'
  ].join('');
  document.head.appendChild(s);
}

// ══════════════════════════════════════════════════════════════════════════════
//  DESTROY LEAFLET
// ══════════════════════════════════════════════════════════════════════════════
function _destroyLeaflet() {
  _cancelPickCoord();
  if (_activeDrawHandler) { try { _activeDrawHandler.disable(); } catch(e){} _activeDrawHandler = null; }
  if (_lfMap) { try { _lfMap.off(); _lfMap.remove(); } catch(e){} _lfMap = null; }
  _lfMarkersLP=[]; _lfMarkersDF=[]; _lfLayerGroupDF=null;
  _lfLocateMarker=null; _lfLocateCircle=null;
  _drawnItems=null; _drawControl=null; _activeDrawMode=null;
  _drawPanelOpen=false; _drawnMeta={}; _pendingLayer=null; _pendingLayerType=null;
  _dfRawData=[]; _dfVisible=false; _dfGroupFilter=null; _dfStreetPanelOpen=false;
  _lyrPhotoOpen=false; _currentBaseLayer=null; _currentLayerCenter=null;
}

// ══════════════════════════════════════════════════════════════════════════════
//  LOAD HALAMAN PETA
// ══════════════════════════════════════════════════════════════════════════════
function loadPeta() {
  setNav('pt');
  setPage('Peta Pemetaan Kawasan Pedestrian','Peta wilayah & rute patroli Satlinmas');
  sbClose(); dChart('bar'); dChart('dnt'); dChart('tw');
  G('ct').classList.add('peta-outer-pa');
  _injectPetaStyles(); _destroyLeaflet();
  document.removeEventListener('keydown', _onKeyEsc);

  var h = '<div class="fu peta-container" id="peta-main-wrap" style="padding:0!important;position:relative">'
    +'<div style="padding:10px 14px 0;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">'
      +'<div class="peta-mode-toggle">'
        +'<button class="peta-mode-btn on" id="btn-leaflet" onclick="switchPetaMode(\'leaflet\')"><i class="fas fa-layer-group"></i> Peta Realtime</button>'
        +'<button class="peta-mode-btn" id="btn-mymaps" onclick="switchPetaMode(\'mymaps\')"><i class="fas fa-map"></i> Google My Maps</button>'
      +'</div>'
      +'<div style="display:flex;gap:6px;flex-shrink:0;align-items:center">'
        +'<button class="peta-btn" onclick="openLayerModal()" id="btn-edit-layer"><i class="fas fa-pen-to-square"></i> Edit Layer</button>'
        +'<button class="peta-btn" onclick="openPdfModal()" id="btn-print-pdf"><i class="fas fa-print"></i> Cetak PDF</button>'
        +'<a class="peta-btn" id="btn-open-mymaps" href="'+PETA_MYMAPS_URL+'" target="_blank" rel="noopener" style="display:none;text-decoration:none"><i class="fas fa-external-link-alt"></i> Buka My Maps</a>'
        +'<button class="peta-btn" id="btn-fullscreen" onclick="togglePetaFullscreen()"><i class="fas fa-expand" id="btn-fs-ico"></i> <span id="btn-fs-lbl">Layar Penuh</span></button>'
        +'<button class="peta-btn peta-btn-primary" onclick="reloadPetaActive()"><i class="fas fa-sync"></i> Refresh</button>'
      +'</div>'
    +'</div>'
    +'<div style="flex:1;padding:8px 14px;min-height:0;position:relative">'
      +'<div id="leaflet-wrap" style="height:100%;border-radius:12px;overflow:hidden;border:1px solid var(--border);box-shadow:var(--sh);position:relative">'
        +'<div id="lf-map-div" style="width:100%;height:100%"></div>'
        +'<div id="lf-loader" style="display:none;position:absolute;inset:0;background:rgba(235,239,248,.88);backdrop-filter:blur(6px);z-index:800;border-radius:12px;flex-direction:column;align-items:center;justify-content:center;gap:10px">'
          +'<div class="spw"><div class="spo"></div><div class="spi"></div></div>'
          +'<span style="font-size:.72rem;font-weight:700;color:var(--mid)">Memuat data peta...</span>'
        +'</div>'
        +'<button class="df-cam-btn" id="df-cam-btn" onclick="toggleStreetPanel()" title="Foto Lapangan"><i class="fas fa-camera"></i></button>'
        +'<div class="df-street-panel hidden" id="df-street-panel"></div>'
        +'<button class="lf-draw-toggle" id="btn-draw-toggle" onclick="toggleDrawPanel()" title="Gambar & Ukur"><i class="fas fa-pen-ruler"></i></button>'
        +'<div class="lf-draw-panel hidden" id="lf-draw-panel">'
          +'<div class="lf-draw-panel-lbl">Gambar</div>'
          +'<button class="lf-draw-item" id="btn-draw-line" onclick="startDraw(\'polyline\')"><i class="fas fa-pen-nib" style="color:#1e6fd9"></i> Garis / Rute</button>'
          +'<button class="lf-draw-item" id="btn-draw-area" onclick="startDraw(\'polygon\')"><i class="fas fa-vector-square" style="color:#7c3aed"></i> Area / Zona</button>'
          +'<div class="lf-draw-sep"></div>'
          +'<div class="lf-draw-panel-lbl">Kelola</div>'
          +'<button class="lf-draw-item" id="btn-draw-save" onclick="saveDrawings()"><i class="fas fa-floppy-disk" style="color:#0d9268"></i> Simpan</button>'
          +'<button class="lf-draw-item" onclick="loadDrawings()"><i class="fas fa-download" style="color:#d97706"></i> Muat</button>'
          +'<button class="lf-draw-item danger" onclick="clearDrawings()"><i class="fas fa-eraser" style="color:#c0392b"></i> Hapus Semua</button>'
        +'</div>'
        +'<div class="lf-meta-overlay" id="lf-meta-overlay">'
          +'<div class="lf-meta-title" id="lf-meta-title"><i class="fas fa-pen-nib"></i> Tambah Detail Gambar</div>'
          +'<div class="lf-meta-msr" id="lf-meta-msr" style="display:none"><i class="fas fa-ruler"></i><span id="lf-meta-msr-text"></span></div>'
          +'<div class="lf-meta-row">'
            +'<div><label style="font-size:.58rem;font-weight:700;color:rgba(255,255,255,.38);display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em">Nama <span style="color:#c0392b">*</span></label><input class="lf-meta-input" id="lf-meta-nama" placeholder="Nama garis / area..." maxlength="80"></div>'
            +'<div><label style="font-size:.58rem;font-weight:700;color:rgba(255,255,255,.38);display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em">Keterangan</label><input class="lf-meta-input" id="lf-meta-ket" placeholder="Deskripsi singkat..." maxlength="120"></div>'
          +'</div>'
          +'<label style="font-size:.58rem;font-weight:700;color:rgba(255,255,255,.38);display:block;margin-bottom:5px;text-transform:uppercase;letter-spacing:.06em">Warna</label>'
          +'<div class="lf-meta-warna-grid" id="lf-meta-warna-grid"></div>'
          +'<div class="lf-meta-color-custom"><input type="color" class="lf-meta-color-inp" id="lf-meta-color-inp" value="#1e6fd9" oninput="metaWarnaCustom(this.value)"><span class="lf-meta-color-lbl" id="lf-meta-color-lbl">#1e6fd9</span></div>'
          +'<div class="lf-meta-actions"><button class="lf-meta-btn-ok" onclick="confirmDrawMeta()"><i class="fas fa-check"></i> Tambahkan ke Peta</button><button class="lf-meta-btn-cancel" onclick="cancelDrawMeta()">Batal</button></div>'
        +'</div>'
        +'<div class="lf-save-note" id="lf-save-note">Disimpan!</div>'
      +'</div>'
      +'<div id="mymaps-wrap" style="height:100%;position:relative;border-radius:12px;overflow:hidden;border:1px solid var(--border);box-shadow:var(--sh);display:none">'
        +'<div class="peta-map-shimmer" id="peta-shimmer"><div class="peta-map-shimmer-ico"><i class="fas fa-map-location-dot"></i></div><p>Memuat peta interaktif...</p></div>'
        +'<div style="position:absolute;inset:0;overflow:hidden;border-radius:12px"><iframe id="peta-frame" src="'+PETA_EMBED_URL+'" allowfullscreen="" loading="eager" referrerpolicy="no-referrer-when-downgrade" onload="onPetaFrameLoad()" style="position:absolute;top:-60px;left:0;width:100%;height:calc(100% + 60px);border:none;display:block;opacity:0;transition:opacity .4s"></iframe></div>'
      +'</div>'
    +'</div>'
    +'<div id="peta-legend-bar" style="padding:0 14px 10px;flex-shrink:0"><div class="peta-lf-legend"><div class="peta-lf-legend-title"><i class="fas fa-circle-info" style="color:var(--blue)"></i> Keterangan Layer</div>'+_buildLegendHtml()+'</div></div>'
  +'</div>'
  +'<div class="pdf-render-overlay" id="pdf-render-overlay">'
    +'<div class="pdf-render-spinner"></div>'
    +'<div class="pdf-render-txt" id="pdf-render-txt">Menyiapkan render...</div>'
    +'<div class="pdf-render-sub" id="pdf-render-sub">Mohon tunggu</div>'
    +'<div class="pdf-render-progress"><div class="pdf-render-bar" id="pdf-render-bar"></div></div>'
  +'</div>'
  +'<div class="foto-ov" id="foto-ov">'
    +'<div class="foto-modal">'
      +'<div class="foto-hd" id="foto-hd"></div>'
      +'<div class="foto-filter">'
        +'<span class="foto-filter-lbl">Filter:</span>'
        +'<input type="date" class="foto-date" id="foto-date-from"><span style="color:var(--muted);font-size:.65rem">—</span><input type="date" class="foto-date" id="foto-date-to">'
        +'<select class="foto-rad" id="foto-radius" onchange="refreshFotoModal()">'
          +'<option value="100">100 m</option><option value="250">250 m</option><option value="500">500 m</option>'
          +'<option value="1000" selected>1 km</option><option value="2000">2 km</option>'
        +'</select>'
        +'<button class="foto-search" onclick="refreshFotoModal()"><i class="fas fa-search"></i> Cari</button>'
        +'<button class="foto-reset" onclick="resetFotoFilter()"><i class="fas fa-rotate-left"></i></button>'
      +'</div>'
      +'<div class="foto-body" id="foto-body"></div>'
    +'</div>'
  +'</div>'
  +'<div class="img-lb-ov" id="img-lb-ov">'
    +'<button class="img-lb-close" onclick="closeLb()"><i class="fas fa-times"></i></button>'
    +'<img class="img-lb-img" id="img-lb-img" src="" alt="">'
    +'<div class="img-lb-name" id="img-lb-name"></div>'
    +'<a class="img-lb-drv" id="img-lb-drv" href="#" target="_blank" rel="noopener" style="display:none"><i class="fas fa-external-link-alt"></i> Buka di Google Drive</a>'
  +'</div>'
  +'<div class="pdf-ov" id="pdf-ov">'
    +'<div class="pdf-modal">'
      +'<div class="pdf-mhd">'
        +'<div class="pdf-mtitle"><i class="fas fa-file-pdf" style="color:#c0392b"></i> Pratinjau &amp; Cetak Laporan Peta</div>'
        +'<div class="pdf-macts">'
          +'<button class="bg2" onclick="closePdfModal()"><i class="fas fa-times"></i> Tutup</button>'
          +'<button class="bg2" id="btn-pdf-print" onclick="execPrint()"><i class="fas fa-print"></i> Cetak</button>'
          +'<button class="bp" id="btn-pdf-dl" onclick="execDownload()"><i class="fas fa-download"></i> Unduh PDF</button>'
        +'</div>'
      +'</div>'
      +'<div class="pdf-mbody">'
        +'<div class="pdf-opts" id="pdf-opts-panel"></div>'
        +'<div class="pdf-map-area">'
          +'<div class="pdf-map-banner">'
            +'<div class="pdf-map-banner-txt"><i class="fas fa-circle-info"></i> Atur tampilan peta (pan, zoom), lalu cetak/unduh PDF</div>'
            +'<div style="display:flex;gap:6px;flex-shrink:0;align-items:center">'
              +'<button class="bg2" style="font-size:.62rem;padding:4px 10px" onclick="fitPdfMapBounds()"><i class="fas fa-expand-arrows-alt"></i> Fit Semua</button>'
              +'<div style="display:flex;gap:3px;align-items:center">'
                +'<button class="bg2" style="font-size:.62rem;padding:4px 7px;min-width:28px" onclick="if(_pdfMap)_pdfMap.zoomIn()"><i class="fas fa-plus"></i></button>'
                +'<button class="bg2" style="font-size:.62rem;padding:4px 7px;min-width:28px" onclick="if(_pdfMap)_pdfMap.zoomOut()"><i class="fas fa-minus"></i></button>'
                +'<button class="bg2" style="font-size:.62rem;padding:4px 7px;min-width:28px" onclick="if(_pdfMap)_pdfMap.panBy([0,-120])"><i class="fas fa-chevron-up"></i></button>'
                +'<button class="bg2" style="font-size:.62rem;padding:4px 7px;min-width:28px" onclick="if(_pdfMap)_pdfMap.panBy([0,120])"><i class="fas fa-chevron-down"></i></button>'
                +'<button class="bg2" style="font-size:.62rem;padding:4px 7px;min-width:28px" onclick="if(_pdfMap)_pdfMap.panBy([-120,0])"><i class="fas fa-chevron-left"></i></button>'
                +'<button class="bg2" style="font-size:.62rem;padding:4px 7px;min-width:28px" onclick="if(_pdfMap)_pdfMap.panBy([120,0])"><i class="fas fa-chevron-right"></i></button>'
              +'</div>'
            +'</div>'
          +'</div>'
          +'<div class="pdf-map-frame"><div id="pdf-map-preview"></div></div>'
        +'</div>'
      +'</div>'
    +'</div>'
  +'</div>';

  G('ct').innerHTML = h;
  _buildMetaSwatches();
  document.addEventListener('keydown', _onKeyEsc);
  _initLeaflet();
}

function _buildLegendHtml() {
  return SIMBOL_DEF.map(function(it) {
    return '<div class="peta-lf-leg-item"><i class="fas '+it.ico+'" style="color:'+it.warna+';font-size:.72rem"></i>'+it.label+'</div>';
  }).join('');
}

// ══════════════════════════════════════════════════════════════════════════════
//  FOTO LAPANGAN
// ══════════════════════════════════════════════════════════════════════════════
function toggleStreetPanel() {
  var p = G('df-street-panel');
  if (p && p.classList.contains('visible')) { _closeStreetPanel(); return; }
  _buildStreetPanel();
  if (p) { p.classList.remove('hidden'); p.classList.add('visible'); }
  var btn = G('df-cam-btn'); if (btn) btn.classList.add('active');
  _dfStreetPanelOpen = true;
}

function _closeStreetPanel() {
  var p = G('df-street-panel'), btn = G('df-cam-btn');
  if (p) { p.classList.remove('visible'); p.classList.add('hidden'); }
  if (btn) btn.classList.remove('active');
  _dfStreetPanelOpen = false;
}

function _buildStreetPanel() {
  var p = G('df-street-panel'); if (!p) return;
  var counts = {};
  (_dfRawData||[]).forEach(function(pt){ var k=_resolveKelompok(pt); counts[k]=(counts[k]||0)+1; });
  var total = (_dfRawData||[]).length;
  var h = '<div class="dsp-lbl">Foto Lapangan</div>';
  h += '<button class="dsp-btn'+(_dfGroupFilter===null&&_dfVisible?' on':'')+'" '
    +(_dfGroupFilter===null&&_dfVisible?'style="background:rgba(30,111,217,.18)"':'')
    +' onclick="selectDfGroup(null)">'
    +'<i class="fas fa-layer-group si" style="color:#80b8ff"></i>Semua Foto<span class="sc">'+total+'</span></button>';
  if (_dfVisible) {
    h += '<button class="dsp-btn" onclick="hideDfAll()" style="color:rgba(160,180,210,.7)">'
      +'<i class="fas fa-eye-slash si" style="color:rgba(160,180,210,.4)"></i>Sembunyikan</button>';
  }
  h += '<div class="dsp-sep"></div><div class="dsp-lbl">Per Jalan</div>';
  JALAN_GROUPS.forEach(function(g) {
    var cnt=counts[g.id]||0, isA=_dfGroupFilter===g.id;
    h += '<button class="dsp-btn'+(isA?' on':'')+'" '+(isA?'style="background:'+g.warna+'1a"':'')+' onclick="selectDfGroup(\''+g.id+'\')">'
      +'<i class="fas '+g.ico+' si" style="color:'+g.warna+'"></i>'+g.label.replace('Jl. ','')
      +'<span class="sc"'+(cnt?'':' style="opacity:.3"')+'>'+cnt+'</span></button>';
  });
  p.innerHTML = h;
}

function _resolveKelompok(pt) {
  var k = (pt.kelompokJalan||'').toString().toLowerCase().trim();
  if (k==='jenderal soedirman'||k==='jenderal_soedirman'||k==='jend. soedirman') return 'jenderal_soedirman';
  if (k==='hos cokroaminoto'||k==='hos_cokroaminoto')   return 'hos_cokroaminoto';
  if (k==='urip soemoharjo'||k==='urip_soemoharjo')     return 'urip_soemoharjo';
  if (k==='soekarno hatta'||k==='soekarno_hatta')       return 'soekarno_hatta';
  if (k==='diponegoro')                                  return 'diponegoro';
  return 'lainnya';
}

function selectDfGroup(groupId) {
  _dfGroupFilter=groupId; _dfVisible=true; _closeStreetPanel();
  if (_lfLayerGroupDF&&_lfMap) _lfMap.removeLayer(_lfLayerGroupDF);
  var f = groupId===null ? _dfRawData : (_dfRawData||[]).filter(function(pt){ return _resolveKelompok(pt)===groupId; });
  _renderLeafletDF(f);
  if (_lfLayerGroupDF&&_lfMap) _lfLayerGroupDF.addTo(_lfMap);
  var btn=G('df-cam-btn'); if(btn) btn.classList.add('active');
  var g = groupId ? JALAN_GROUPS.filter(function(x){ return x.id===groupId; })[0] : null;
  toast(f.length+' foto'+(g?' — '+g.label:'')+' ditampilkan.','ok');
}

function hideDfAll() {
  _dfVisible=false; _dfGroupFilter=null; _closeStreetPanel();
  if (_lfLayerGroupDF&&_lfMap) _lfMap.removeLayer(_lfLayerGroupDF);
  var btn=G('df-cam-btn'); if(btn) btn.classList.remove('active');
  toast('Foto lapangan disembunyikan.','inf');
}

// ══════════════════════════════════════════════════════════════════════════════
//  MODAL FOTO LAPANGAN
// ══════════════════════════════════════════════════════════════════════════════
function openLayerPhotoPanel(lat, lng, nama, warna, ico) {
  _currentLayerCenter={lat:lat,lng:lng,nama:nama,warna:warna||'#1e6fd9',ico:ico||'fa-location-dot'};
  _lyrPhotoOpen=true;
  var hdr=G('foto-hd');
  if (hdr) {
    hdr.innerHTML='<div class="foto-hd-ico" style="background:'+warna+'18;color:'+warna+'"><i class="fas '+(ico||'fa-location-dot')+'"></i></div>'
      +'<div class="foto-hd-info"><div class="foto-hd-title">'+esc(nama)+'</div><div class="foto-hd-sub"><i class="fas fa-camera"></i> Foto &amp; Laporan Sekitar Lokasi</div></div>'
      +'<button class="foto-close" onclick="closeLayerPhotoPanel()"><i class="fas fa-xmark"></i></button>';
  }
  var df=G('foto-date-from'),dt=G('foto-date-to');
  if(df) df.value=''; if(dt) dt.value='';
  var ov=G('foto-ov'); if(ov) ov.classList.add('show');
  _loadFotoBody();
  if(_lfMap) _lfMap.closePopup();
}

function closeLayerPhotoPanel() {
  _lyrPhotoOpen=false; _currentLayerCenter=null;
  var ov=G('foto-ov'); if(ov) ov.classList.remove('show');
}

function refreshFotoModal() { _loadFotoBody(); }

function resetFotoFilter() {
  var df=G('foto-date-from'),dt=G('foto-date-to');
  if(df) df.value=''; if(dt) dt.value='';
  _loadFotoBody();
}

function _loadFotoBody() {
  if (!_currentLayerCenter) return;
  var body=G('foto-body');
  if(body) body.innerHTML='<div class="foto-empty"><i class="fas fa-spinner fa-spin"></i><p>Memuat...</p></div>';
  var lat=_currentLayerCenter.lat, lng=_currentLayerCenter.lng;
  var radius=parseInt((G('foto-radius')||{}).value||'1000',10);
  var dateFrom=((G('foto-date-from')||{}).value||'').trim();
  var dateTo=((G('foto-date-to')||{}).value||'').trim();
  var filtered=(_dfRawData||[]).filter(function(pt){
    if(!pt.lat||!pt.lng) return false;
    if(_haversineDistance(lat,lng,pt.lat,pt.lng)>radius) return false;
    if(dateFrom||dateTo){
      var tgl=_parseTglFoto(pt);
      if(!tgl) return !dateFrom;
      if(dateFrom&&tgl<dateFrom) return false;
      if(dateTo&&tgl>dateTo) return false;
    }
    return true;
  });
  filtered.sort(function(a,b){ return _haversineDistance(lat,lng,a.lat,a.lng)-_haversineDistance(lat,lng,b.lat,b.lng); });
  _renderFotoBody(filtered,lat,lng,radius);
}

function _parseTglFoto(pt) {
  var raw=pt.waktuExif||pt.tanggalFoto||''; if(!raw) return null;
  raw=raw.toString().trim();
  var m1=raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/); if(m1) return m1[3]+'-'+m1[2]+'-'+m1[1];
  var m2=raw.match(/^(\d{4})-(\d{2})-(\d{2})/);   if(m2) return m2[1]+'-'+m2[2]+'-'+m2[3];
  return null;
}

function _renderFotoBody(data, cLat, cLng, radius) {
  var body=G('foto-body'); if(!body) return;
  if(!data.length){
    body.innerHTML='<div class="foto-empty"><i class="fas fa-camera-slash"></i><p>Tidak ada foto dalam radius '+_fmtR(radius)+'</p></div>';
    return;
  }
  var stat='<div class="foto-stat">Menampilkan <b>'+data.length+'</b> foto dalam radius '+_fmtR(radius)+'</div>';
  var cards='<div class="foto-list">'+data.map(function(pt){
    var dist=_haversineDistance(cLat,cLng,pt.lat,pt.lng);
    var distStr=dist<1000?Math.round(dist)+' m':(dist/1000).toFixed(1)+' km';
    var hasTh=!!pt.thumbUrl, hasDrv=!!pt.linkDrive, hasGmaps=!!pt.linkGmaps;
    var thumbCol=hasTh
      ?'<div class="foto-thumb-col" onclick="openLb(\''+esc(pt.thumbUrl)+'\','+(hasDrv?'\''+esc(pt.linkDrive)+'\'':'null')+',\''+esc(pt.namaFile||'Foto')+'\')">'
        +'<img src="'+esc(pt.thumbUrl)+'" loading="lazy" onerror="this.parentElement.className=\'foto-thumb-ph\';this.outerHTML=\'<i class=\\\"fas fa-image\\\"></i>\'">'
        +'<div class="foto-thumb-overlay"><i class="fas fa-expand-alt"></i></div></div>'
      :'<div class="foto-thumb-ph"><i class="fas fa-image"></i></div>';
    var waktu=pt.waktuExif||pt.tanggalFoto||'';
    var koordinat=pt.lat.toFixed(5)+', '+pt.lng.toFixed(5);
    var metaRows='<div class="foto-meta-rows">'
      +(pt.danru?'<div class="foto-meta-row"><i class="fas fa-shield-halved" style="color:#0d9268"></i><span>'+esc(pt.danru)+'</span></div>':'')
      +(waktu?'<div class="foto-meta-row"><i class="fas fa-clock"></i><span>'+esc(waktu)+'</span></div>':'')
      +'<div class="foto-meta-row"><i class="fas fa-crosshairs" style="color:#1e6fd9"></i><span style="font-family:var(--mono);font-size:.58rem">'+koordinat+'</span></div>'
      +'</div>';
    var acts='<div class="foto-acts">'
      +(hasTh?'<button class="foto-btn prev" onclick="openLb(\''+esc(pt.thumbUrl)+'\','+(hasDrv?'\''+esc(pt.linkDrive)+'\'':'null')+',\''+esc(pt.namaFile||'Foto')+'\')"><i class="fas fa-eye"></i> Preview</button>':'')
      +(hasGmaps?'<a class="foto-btn gmaps" href="'+esc(pt.linkGmaps)+'" target="_blank" rel="noopener"><i class="fas fa-map-location-dot"></i> Maps</a>':'')
      +(hasDrv?'<a class="foto-btn drv" href="'+esc(pt.linkDrive)+'" target="_blank" rel="noopener"><i class="fas fa-external-link-alt"></i> Drive</a>':'')
      +'</div>';
    var infoCol='<div class="foto-info-col"><div class="foto-fname">'+esc(pt.namaFile||'Foto Lapangan')+'</div>'+metaRows
      +'<div class="foto-bottom-row"><span class="foto-dist"><i class="fas fa-circle-dot"></i>'+distStr+'</span>'+acts+'</div></div>';
    return '<div class="foto-card">'+thumbCol+infoCol+'</div>';
  }).join('')+'</div>';
  body.innerHTML=stat+cards;
}

function _fmtR(r){ return r<1000?r+' m':(r/1000)+' km'; }

function openLb(thumbUrl, driveUrl, nama) {
  var ov=G('img-lb-ov'),img=G('img-lb-img'),nm=G('img-lb-name'),drv=G('img-lb-drv');
  if(!ov||!img) return;
  img.src=thumbUrl||''; img.alt='';
  if(nm) nm.textContent=nama||'';
  if(drv){ if(driveUrl){drv.href=driveUrl;drv.style.display='inline-flex';}else drv.style.display='none'; }
  ov.classList.add('show');
}

function closeLb() {
  var ov=G('img-lb-ov'); if(ov) ov.classList.remove('show');
  var img=G('img-lb-img'); if(img) img.src='';
}

function _haversineDistance(la1,ln1,la2,ln2) {
  var R=6371000,p1=la1*Math.PI/180,p2=la2*Math.PI/180;
  var dp=(la2-la1)*Math.PI/180,dl=(ln2-ln1)*Math.PI/180;
  var a=Math.sin(dp/2)*Math.sin(dp/2)+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)*Math.sin(dl/2);
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

// ══════════════════════════════════════════════════════════════════════════════
//  PENGUKURAN
// ══════════════════════════════════════════════════════════════════════════════
function _calcLen(layer) {
  var ll=layer.getLatLngs?layer.getLatLngs():[];
  if(Array.isArray(ll[0])) ll=ll[0];
  var t=0;
  for(var i=0;i<ll.length-1;i++) t+=ll[i].distanceTo(ll[i+1]);
  return t;
}

function _calcArea(layer) {
  var ll=layer.getLatLngs?layer.getLatLngs():[];
  if(Array.isArray(ll[0])) ll=ll[0];
  if(ll.length<3) return 0;
  var R=6371000,n=ll.length,a=0;
  for(var i=0;i<n;i++){
    var j=(i+1)%n;
    a+=(ll[j].lng-ll[i].lng)*Math.PI/180*(2+Math.sin(ll[i].lat*Math.PI/180)+Math.sin(ll[j].lat*Math.PI/180));
  }
  return Math.abs(a*R*R/2);
}

function _fmtLen(m)   { return m<1000?m.toFixed(0)+' m':(m/1000).toFixed(2)+' km'; }
function _fmtArea(m2) { return m2<10000?m2.toFixed(0)+' m²':(m2/10000).toFixed(3)+' ha'; }

function _getMsr(layer,tipe) {
  try{ return tipe==='polyline'?'📏 '+_fmtLen(_calcLen(layer)):'📐 '+_fmtArea(_calcArea(layer)); }
  catch(e){ return ''; }
}

function _bindMsrTooltip(layer,tipe) {
  var msr=_getMsr(layer,tipe); if(!msr) return;
  layer.bindTooltip('<b>'+msr+'</b>',{permanent:false,sticky:true,direction:'top',offset:[0,-8],className:'lf-tip-clean',opacity:1});
}

// ══════════════════════════════════════════════════════════════════════════════
//  PDF — PROGRESS
// ══════════════════════════════════════════════════════════════════════════════
function _showRenderProgress(txt,sub,pct) {
  var ov=G('pdf-render-overlay'),t=G('pdf-render-txt'),s=G('pdf-render-sub'),bar=G('pdf-render-bar');
  if(ov)  ov.classList.add('show');
  if(t)   t.textContent=txt||'Merender...';
  if(s)   s.textContent=sub||'';
  if(bar) bar.style.width=(pct||0)+'%';
}

function _hideRenderProgress() {
  var ov=G('pdf-render-overlay'); if(ov) ov.classList.remove('show');
  var bar=G('pdf-render-bar'); if(bar) bar.style.width='0%';
}

// ══════════════════════════════════════════════════════════════════════════════
//  PDF — BUILD LEGENDA ROWS
// ══════════════════════════════════════════════════════════════════════════════
function _buildPdfLegendRows() {
  _pdfLegendRows = [];

  // 1) Layer marker aktif
  if (_pdfOpts.showLayers && _layerData) {
    _layerData.filter(function(l){ return l.aktif&&l.lat&&l.lng; }).forEach(function(layer) {
      var sd  = getSimbolDef(layer.simbol);
      var col = layer.warna || sd.warna || '#1e6fd9';
      _pdfLegendRows.push({ warna:col, tipe:'marker', label:layer.nama||'Layer', simbol:sd.ico||'fa-map-pin' });
    });
  }

  // 2) Titik foto
  if (_pdfOpts.showFoto && _dfVisible && JALAN_GROUPS) {
    JALAN_GROUPS.forEach(function(g) {
      _pdfLegendRows.push({ warna:g.warna||'#1e6fd9', tipe:'dot', label:g.label||'Foto', simbol:'fa-camera' });
    });
  }

  // 3) Drawn items
  if (_pdfOpts.showDraw && _drawnItems) {
    _drawnItems.eachLayer(function(layer) {
      var lid=L.Util.stamp(layer), meta=_drawnMeta[lid]||{}, tipe=meta.tipe||'polyline';
      _pdfLegendRows.push({
        warna: meta.warna||'#1e6fd9',
        tipe:  tipe==='polyline'?'line':'poly',
        label: meta.nama||(tipe==='polyline'?'Jalur':'Area'),
        simbol:tipe==='polyline'?'fa-route':'fa-draw-polygon'
      });
    });
  }

  // Deduplikasi
  var seen={};
  _pdfLegendRows = _pdfLegendRows.filter(function(row){
    var k=row.label+row.warna+row.tipe;
    if(seen[k]) return false; seen[k]=true; return true;
  });
}

// ══════════════════════════════════════════════════════════════════════════════
//  PDF — OPEN / CLOSE MODAL
// ══════════════════════════════════════════════════════════════════════════════
async function openPdfModal() {
  var ov=G('pdf-ov'); if(!ov) return;
  ov.classList.add('show');
  _pdfModalOpen=true;
  // Pre-cache semua ikon (sync sekarang, langsung gambar ke canvas)
  _precacheSimbolIcons();
  _buildPdfLegendRows();
  _buildPdfOptsPanel();
  setTimeout(function(){ _initPdfMap(); }, 160);
  window.addEventListener('keydown', _onPdfMapKey);
}

function closePdfModal() {
  var ov=G('pdf-ov'); if(ov) ov.classList.remove('show');
  _pdfModalOpen=false;
  _destroyPdfMap();
  window.removeEventListener('keydown', _onPdfMapKey);
}

function _onPdfMapKey(e){ if(e.key==='Escape'&&_pdfModalOpen) closePdfModal(); }

function _destroyPdfMap() {
  if(_pdfMap){ try{_pdfMap.off();_pdfMap.remove();}catch(e){} _pdfMap=null; }
  _pdfMapLayers={};
}

// ══════════════════════════════════════════════════════════════════════════════
//  PDF — INIT PREVIEW MAP
// ══════════════════════════════════════════════════════════════════════════════
function _initPdfMap() {
  var el=G('pdf-map-preview'); if(!el) return;
  _destroyPdfMap();
  if(!window.L){ console.error('[PDF] Leaflet belum dimuat'); return; }

  var center=_lfMap?_lfMap.getCenter():PETA_CENTER;
  var zoom=_lfMap?_lfMap.getZoom():PETA_ZOOM;

  _pdfMap=L.map('pdf-map-preview',{center:center,zoom:zoom,zoomControl:false,attributionControl:false,preferCanvas:true});

  var tConf=_getTileConf();
  _pdfMapLayers.base=L.tileLayer(tConf.url,{attribution:tConf.attr,maxZoom:tConf.maxZoom||19,crossOrigin:'anonymous',keepBuffer:4});
  _pdfMapLayers.base.addTo(_pdfMap);

  if(_pdfOpts.showLayers&&_layerData){
    _layerData.filter(function(l){return l.aktif&&l.lat&&l.lng;}).forEach(function(layer){
      var sd=getSimbolDef(layer.simbol), warna=layer.warna||sd.warna||'#1e6fd9';
      L.marker([layer.lat,layer.lng],{icon:_makeLeafletIcon(warna,sd.ico)}).addTo(_pdfMap).bindPopup('<b>'+esc(layer.nama)+'</b>');
    });
  }
  if(_pdfOpts.showFoto&&_dfVisible&&_dfRawData){
    var pts=_dfGroupFilter===null?_dfRawData:_dfRawData.filter(function(pt){return _resolveKelompok(pt)===_dfGroupFilter;});
    pts.forEach(function(pt){
      if(!pt.lat||!pt.lng) return;
      var grp=JALAN_GROUPS.filter(function(x){return x.id===_resolveKelompok(pt);})[0];
      var color=grp?grp.warna:'#1e6fd9';
      L.circleMarker([pt.lat,pt.lng],{radius:5,color:'#fff',weight:1.5,fillColor:color,fillOpacity:1}).addTo(_pdfMap).bindPopup(esc(pt.namaFile||'Foto'));
    });
  }
  if(_pdfOpts.showDraw&&_drawnItems){
    _drawnItems.eachLayer(function(layer){
      try{
        var gj=layer.toGeoJSON(),lid=L.Util.stamp(layer),meta=_drawnMeta[lid]||{},w=meta.warna||'#1e6fd9';
        var isLine=(meta.tipe||'polyline')==='polyline';
        var opts=isLine?{color:w,weight:3.5,opacity:.95,dashArray:'8 5',lineCap:'round'}:{color:w,weight:2,fillColor:w,fillOpacity:.22};
        var nl=L.geoJSON(gj,{style:opts}); nl.addTo(_pdfMap);
        if(meta.nama) nl.bindTooltip('<b>'+esc(meta.nama)+'</b>',{permanent:false,className:'lf-tip-clean'});
      }catch(e){console.warn('[PDF] drawn error',e);}
    });
  }
  setTimeout(function(){ if(_pdfMap) _pdfMap.invalidateSize({animate:false}); },260);
}

function fitPdfMapBounds() {
  if(!_pdfMap) return;
  var bounds=[];
  if(_pdfOpts.showLayers&&_layerData)
    _layerData.filter(function(l){return l.aktif&&l.lat&&l.lng;}).forEach(function(l){bounds.push([l.lat,l.lng]);});
  if(_pdfOpts.showFoto&&_dfRawData)
    _dfRawData.forEach(function(pt){if(pt.lat&&pt.lng) bounds.push([pt.lat,pt.lng]);});
  if(_pdfOpts.showDraw&&_drawnItems)
    _drawnItems.eachLayer(function(layer){
      try{var b=layer.getBounds();if(b){bounds.push([b.getNorth(),b.getEast()]);bounds.push([b.getSouth(),b.getWest()]);}}catch(e){}
    });
  if(bounds.length>0) _pdfMap.fitBounds(bounds,{padding:[30,30],animate:false});
  else _pdfMap.setView(PETA_CENTER,PETA_ZOOM,{animate:false});
}

// ══════════════════════════════════════════════════════════════════════════════
//  PDF — PANEL OPSI
// ══════════════════════════════════════════════════════════════════════════════
function _buildPdfOptsPanel() {
  var p=G('pdf-opts-panel'); if(!p) return;
  var mapModes=[
    {id:'osm',ico:'fa-map',lbl:'OSM'},{id:'satellite',ico:'fa-satellite',lbl:'Satelit'},
    {id:'hybrid',ico:'fa-globe',lbl:'Hybrid'},{id:'carto',ico:'fa-map-location',lbl:'CartoDB'},
    {id:'topo',ico:'fa-mountain',lbl:'Topo'}
  ];
  var paperOpts=Object.keys(PAPER_SIZES).map(function(k){
    return '<button class="pdf-paper-btn'+(_pdfOpts.paperSize===k?' on':'')+'" data-sz="'+k+'" onclick="setPdfPaper(\''+k+'\')">'+PAPER_SIZES[k].label+'</button>';
  }).join('');

  p.innerHTML=
    '<div class="pdf-sect">'
      +'<div class="pdf-sect-lbl"><i class="fas fa-sliders"></i> Elemen Tampil</div>'
      +_pdfChk('pc-lay','Marker Layer','<small>Pin lokasi aktif</small>',_pdfOpts.showLayers)
      +_pdfChk('pc-draw','Gambar Overlay','<small>Garis &amp; area</small>',_pdfOpts.showDraw)
      +_pdfChk('pc-foto','Titik Foto','<small>Dot foto lapangan</small>',_pdfOpts.showFoto)
    +'</div>'
    +'<div class="pdf-sect">'
      +'<div class="pdf-sect-lbl"><i class="fas fa-map"></i> Peta Dasar</div>'
      +'<div class="pdf-map-grid">'
      +mapModes.map(function(m){
        return '<button class="pdf-map-btn'+(_pdfOpts.mapMode===m.id?' on':'')+'" data-id="'+m.id+'" onclick="setPdfMap(\''+m.id+'\')">'
          +'<i class="fas '+m.ico+'"></i>'+m.lbl+'</button>';
      }).join('')
      +'</div>'
    +'</div>'
    +'<div class="pdf-sect">'
      +'<div class="pdf-sect-lbl"><i class="fas fa-file"></i> Ukuran Kertas</div>'
      +'<div class="pdf-paper-row">'+paperOpts+'</div>'
    +'</div>'
    +'<div class="pdf-sect">'
      +'<div class="pdf-sect-lbl"><i class="fas fa-rotate"></i> Orientasi</div>'
      +'<div class="pdf-ori-row">'
        +'<button class="pdf-ori-btn'+(_pdfOpts.orientation==='landscape'?' on':'')+'" onclick="setPdfOri(\'landscape\')"><i class="fas fa-image"></i>Landscape</button>'
        +'<button class="pdf-ori-btn'+(_pdfOpts.orientation==='portrait'?' on':'')+'" onclick="setPdfOri(\'portrait\')"><i class="fas fa-file"></i>Portrait</button>'
      +'</div>'
    +'</div>'
    +'<div class="pdf-sect">'
      +'<div class="pdf-sect-lbl"><i class="fas fa-star-half-stroke"></i> Kualitas Render</div>'
      +'<div class="pdf-dpi-row">'
        +_dpiBtn(2,'Normal')+_dpiBtn(3,'HD')+_dpiBtn(4.5,'Full HD')+_dpiBtn(6,'Ultra')
      +'</div>'
      +'<div id="dpi-hint" style="font-size:.58rem;color:var(--muted);padding:3px 2px">'+_getDpiHint()+'</div>'
    +'</div>'
    +'<div class="pdf-sect">'
      +'<div class="pdf-sect-lbl"><i class="fas fa-list"></i> Legenda <span style="font-size:.55rem;font-weight:600;color:var(--muted)">(edit teks)</span></div>'
      +'<div id="pdf-leg-area">'+_buildLegendEditorHtml()+'</div>'
    +'</div>';
}

function _dpiBtn(val,lbl){
  return '<button class="pdf-dpi-btn'+(_pdfOpts.dpi===val?' on':'')+'" data-dpi="'+val+'" onclick="setPdfDpi('+val+')">'+lbl+'</button>';
}

function _getDpiHint(){
  var hints={2:'Cepat (~0.5 MB)',3:'Seimbang HD (~1.5 MB)',4.5:'Full HD (~4 MB)',6:'Ultra (~8 MB)'};
  return '<i class="fas fa-info-circle" style="color:var(--blue)"></i> '+(hints[_pdfOpts.dpi]||'');
}

// ══════════════════════════════════════════════════════════════════════════════
//  PDF — LEGENDA EDITOR
//  Preview swatch di UI: identik dengan marker di peta (PNG cache)
// ══════════════════════════════════════════════════════════════════════════════
function _buildLegendEditorHtml() {
  if(!_pdfLegendRows.length)
    return '<div style="font-size:.6rem;color:var(--muted);padding:6px 2px"><i class="fas fa-info-circle"></i> Aktifkan layer untuk otomatis mengisi legenda</div>';
  return _pdfLegendRows.map(function(row,i){
    return '<div class="pdf-leg-row">'
      +'<div class="pdf-leg-swatch-wrap" style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;flex-shrink:0">'+_buildSwatchHtml(row)+'</div>'
      +'<input class="pdf-leg-inp" data-idx="'+i+'" value="'+esc(row.label)+'" oninput="updateLegRow('+i+',this.value)" placeholder="Keterangan...">'
      +'<button class="pdf-leg-del" onclick="delLegRow('+i+')"><i class="fas fa-times"></i></button>'
    +'</div>';
  }).join('')
  +'<button class="pdf-leg-add" onclick="addLegRow()"><i class="fas fa-plus"></i> Tambah baris</button>';
}

// Preview swatch di UI editor — sama persis dengan tampilan di peta
function _buildSwatchHtml(row) {
  var w=row.warna||'#607d8b', t=row.tipe||'marker', ico=row.simbol||'fa-map-pin';
  if(t==='line'){
    return '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="8">'
      +'<line x1="0" y1="4" x2="28" y2="4" stroke="'+w+'" stroke-width="2.5" stroke-dasharray="5 3" stroke-linecap="round"/>'
      +'</svg>';
  }
  if(t==='poly'){
    return '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="18">'
      +'<rect x="1" y="1" width="24" height="16" rx="2" ry="2" fill="'+w+'" fill-opacity="0.22" stroke="'+w+'" stroke-width="1.8"/>'
      +'</svg>';
  }
  if(t==='dot'){
    return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">'
      +'<circle cx="8" cy="8" r="6" fill="'+w+'" stroke="#fff" stroke-width="2"/>'
      +'</svg>';
  }
  // marker: tampilkan pin identik peta — PNG dari cache, fallback FA icon
  var png=_getSimbolPng(ico,w);
  if(png) return '<img src="'+png+'" width="20" height="26" style="display:block;image-rendering:auto">';
  // fallback: render FA icon warna (saat cache belum ready)
  return '<i class="fas '+ico+'" style="color:'+w+';font-size:16px"></i>';
}

function updateLegRow(idx,val){ if(_pdfLegendRows[idx]) _pdfLegendRows[idx].label=val; }
function delLegRow(idx){ _pdfLegendRows.splice(idx,1); _rebuildLegEditor(); }
function addLegRow(){ _pdfLegendRows.push({warna:'#607d8b',tipe:'dot',label:'Keterangan baru'}); _rebuildLegEditor(); }
function _rebuildLegEditor(){ var a=G('pdf-leg-area'); if(a) a.innerHTML=_buildLegendEditorHtml(); }

// ══════════════════════════════════════════════════════════════════════════════
//  PDF — CHECKBOX & SETTER
// ══════════════════════════════════════════════════════════════════════════════
function _pdfChk(id,lbl,sub,checked){
  return '<div class="pdf-chk'+(checked?' on':'')+'" onclick="togglePdfChk(\''+id+'\')">'
    +'<input type="checkbox" id="'+id+'"'+(checked?' checked':'')+' onclick="event.stopPropagation()">'
    +'<label for="'+id+'">'+lbl+sub+'</label></div>';
}

function togglePdfChk(id){
  var inp=G(id); if(!inp) return;
  inp.checked=!inp.checked;
  var p=inp.closest?inp.closest('.pdf-chk'):inp.parentElement;
  if(p) p.classList.toggle('on',inp.checked);
  var m={'pc-lay':'showLayers','pc-foto':'showFoto','pc-draw':'showDraw'};
  if(m[id]){ _pdfOpts[m[id]]=inp.checked; _buildPdfLegendRows(); _rebuildLegEditor(); _initPdfMap(); }
}

function setPdfMap(mode){
  _pdfOpts.mapMode=mode;
  document.querySelectorAll('.pdf-map-btn').forEach(function(b){b.classList.toggle('on',b.dataset.id===mode);});
  if(_pdfMap&&_pdfMapLayers.base){
    _pdfMap.removeLayer(_pdfMapLayers.base);
    var tc=_getTileConf();
    _pdfMapLayers.base=L.tileLayer(tc.url,{attribution:tc.attr,maxZoom:tc.maxZoom||19,crossOrigin:'anonymous'});
    _pdfMapLayers.base.addTo(_pdfMap);
  }
}

function setPdfOri(ori){
  _pdfOpts.orientation=ori;
  document.querySelectorAll('.pdf-ori-btn').forEach(function(b){
    b.classList.toggle('on',b.textContent.trim().toLowerCase().indexOf(ori)>-1);
  });
}

function setPdfPaper(size){
  _pdfOpts.paperSize=size;
  document.querySelectorAll('.pdf-paper-btn').forEach(function(b){b.classList.toggle('on',b.dataset.sz===size);});
}

function setPdfDpi(val){
  _pdfOpts.dpi=val;
  document.querySelectorAll('.pdf-dpi-btn').forEach(function(b){b.classList.toggle('on',parseFloat(b.dataset.dpi)===val);});
  var h=G('dpi-hint'); if(h) h.innerHTML='<i class="fas fa-info-circle" style="color:var(--blue)"></i> '+_getDpiHint().replace('<i class="fas fa-info-circle" style="color:var(--blue)"></i> ','');
}

// ══════════════════════════════════════════════════════════════════════════════
//  PDF — EXPORT ENTRY POINTS
// ══════════════════════════════════════════════════════════════════════════════
function _setPdfBtn(id,loading,original){
  var btn=G(id); if(!btn) return;
  btn.innerHTML=loading?'<i class="fas fa-spinner fa-spin"></i> Memproses...':original;
  btn.disabled=loading;
}

function execPrint(){
  if(_pdfRenderBusy) return;
  _setPdfBtn('btn-pdf-print',true,'<i class="fas fa-print"></i> Cetak');
  _runPdfExport(function(doc){
    _setPdfBtn('btn-pdf-print',false,'<i class="fas fa-print"></i> Cetak');
    if(!doc) return;
    var url=URL.createObjectURL(doc.output('blob'));
    var w=window.open(url);
    if(w) setTimeout(function(){w.print();},1000);
    toast('Dokumen siap dicetak.','ok');
  });
}

function execDownload(){
  if(_pdfRenderBusy) return;
  _setPdfBtn('btn-pdf-dl',true,'<i class="fas fa-download"></i> Unduh PDF');
  _runPdfExport(function(doc){
    _setPdfBtn('btn-pdf-dl',false,'<i class="fas fa-download"></i> Unduh PDF');
    if(!doc) return;
    var paper=(PAPER_SIZES[_pdfOpts.paperSize]||PAPER_SIZES.a4).label.replace(/\s/g,'_');
    var ori=_pdfOpts.orientation==='landscape'?'L':'P';
    doc.save('Peta_Pedestrian_'+paper+'_'+ori+'_'+new Date().toISOString().slice(0,10)+'.pdf');
    toast('PDF berhasil diunduh.','ok');
  });
}

function _runPdfExport(done){
  if(_pdfRenderBusy){ toast('Render sedang berjalan.','inf'); return; }
  _pdfRenderBusy=true;
  var finish=function(doc){ _pdfRenderBusy=false; _hideRenderProgress(); done(doc); };
  _ensureJsPDF(function(){
    _ensureHtml2Canvas(function(){
      _generatePdf4K(finish);
    });
  });
}

function _ensureHtml2Canvas(cb){
  if(window.html2canvas){cb();return;}
  var s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  s.onload=cb; s.onerror=function(){toast('html2canvas gagal.','er');}; document.head.appendChild(s);
}

function _ensureJsPDF(cb){
  if((window.jspdf&&window.jspdf.jsPDF)||window.jsPDF){cb();return;}
  var s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  s.onload=cb; s.onerror=function(){toast('jsPDF gagal.','er');}; document.head.appendChild(s);
}

// ══════════════════════════════════════════════════════════════════════════════
//  PDF — HIDE/SHOW LEAFLET UI
// ══════════════════════════════════════════════════════════════════════════════
function _hideLeafletUI(mapEl){
  if(!mapEl) return;
  ['.leaflet-control-zoom','.leaflet-control-attribution','.leaflet-control-scale','.leaflet-bar','.leaflet-top','.leaflet-bottom'].forEach(function(sel){
    mapEl.querySelectorAll(sel).forEach(function(el){el.setAttribute('data-pdf-hidden',el.style.display||'');el.style.display='none';});
  });
}

function _showLeafletUI(mapEl){
  if(!mapEl) return;
  mapEl.querySelectorAll('[data-pdf-hidden]').forEach(function(el){
    var orig=el.getAttribute('data-pdf-hidden');
    el.style.display=(orig==='none'||orig==='')?'':orig;
    el.removeAttribute('data-pdf-hidden');
  });
}

// ══════════════════════════════════════════════════════════════════════════════
//  PDF — GENERATE 4K (html2canvas offscreen)
// ══════════════════════════════════════════════════════════════════════════════
function _generatePdf4K(done){
  if(!_pdfMap){ toast('Inisialisasi peta terlebih dahulu.','er'); done(null); return; }

  var dpi=_pdfOpts.dpi||3;
  var dpiLabel=dpi<=2?'Normal':dpi<=3?'HD':dpi<=4.5?'Full HD':'Ultra';
  var today=new Date();
  var tglStr=today.toLocaleDateString('id-ID',{year:'numeric',month:'long',day:'numeric'});
  var jamStr=today.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
  var tileConf=_getTileConf();

  _showRenderProgress('Menyiapkan render '+dpiLabel+'...','Membuat canvas offscreen',5);

  var dims=_getPaperDims();
  var MM=3.7795275591;
  var TW=Math.round((dims.w-10)*MM);
  var TH=Math.round((dims.h-58)*MM);

  var offDiv=document.createElement('div');
  offDiv.id='__pdf_off_4k__';
  offDiv.style.cssText=['position:fixed','left:-99999px','top:0','width:'+TW+'px','height:'+TH+'px','background:#e4eaf5','z-index:-99999','overflow:hidden','pointer-events:none'].join(';');
  document.body.appendChild(offDiv);

  _showRenderProgress('Memuat tile peta...','Tunggu tile dari '+(tileConf.label||'server'),15);

  var offMap=L.map(offDiv,{center:_pdfMap.getCenter(),zoom:_pdfMap.getZoom(),zoomControl:false,attributionControl:false,preferCanvas:true,renderer:L.canvas({padding:.5})});
  L.tileLayer(tileConf.url,{attribution:tileConf.attr,maxZoom:tileConf.maxZoom||19,crossOrigin:'anonymous',keepBuffer:8}).addTo(offMap);
  _cloneLayersTo4KMap(offMap);
  offMap.invalidateSize({animate:false});

  var elapsed=0, captured=false;
  var waitTile=setInterval(function(){
    elapsed+=200;
    var pct=Math.min(55,15+Math.round(elapsed/5000*40));
    var pending=offDiv.querySelectorAll('img.leaflet-tile:not(.leaflet-tile-loaded)').length;
    var total=offDiv.querySelectorAll('img.leaflet-tile').length;
    var loaded=total-pending;
    _showRenderProgress('Memuat tile...',(total>0?loaded+'/'+total+' tile dimuat':'Menunggu...'),pct);
    if(!captured&&((pending===0&&elapsed>600)||(elapsed>=5000))){
      captured=true; clearInterval(waitTile);
      _showRenderProgress('Merender canvas '+dpiLabel+'...','Skala: '+dpi+'x',60);
      setTimeout(function(){ _doH2CCapture4K(offMap,offDiv,TW,TH,dpi,dpiLabel,tglStr,jamStr,tileConf,done); },300);
    }
  },200);
}

function _doH2CCapture4K(offMap,offDiv,TW,TH,dpi,dpiLabel,tglStr,jamStr,tileConf,done){
  var mapEl=offMap.getContainer();
  _hideLeafletUI(mapEl);
  _showRenderProgress('Merender canvas '+dpiLabel+'...','scale='+dpi+'x, resolusi '+(TW*dpi)+'×'+(TH*dpi),65);

  html2canvas(mapEl,{
    useCORS:true, allowTaint:true, scale:dpi, backgroundColor:'#e4eaf5',
    logging:false, imageTimeout:10000, width:TW, height:TH, scrollX:0, scrollY:0,
    foreignObjectRendering:false,
    onclone:function(clonedDoc){
      var cc=clonedDoc.querySelector('#__pdf_off_4k__'); if(!cc) return;
      cc.querySelectorAll('.leaflet-control-zoom,.leaflet-control-attribution,.leaflet-control-scale,.leaflet-bar,.leaflet-top,.leaflet-bottom')
        .forEach(function(el){el.style.display='none';});
      cc.querySelectorAll('[class*="leaflet-pane"]').forEach(function(pane){
        var cls=pane.className||'';
        if(cls.indexOf('leaflet-map-pane')>-1){
          try{var st=window.getComputedStyle(pane).transform;if(st&&st!=='none'){var m=new DOMMatrix(st);pane.style.transform='none';pane.style.left=m.m41+'px';pane.style.top=m.m42+'px';}}catch(e){}
        }
        if(cls.indexOf('leaflet-tile-pane')>-1){
          pane.querySelectorAll('.leaflet-tile-container').forEach(function(tc){
            try{var st2=window.getComputedStyle(tc).transform;if(st2&&st2!=='none'){var m2=new DOMMatrix(st2);tc.style.transform='none';tc.style.left=m2.m41+'px';tc.style.top=m2.m42+'px';}}catch(e){}
          });
        }
      });
      cc.querySelectorAll('.leaflet-overlay-pane svg').forEach(function(svg){
        try{var st3=window.getComputedStyle(svg).transform;if(st3&&st3!=='none'){var m3=new DOMMatrix(st3);svg.style.transform='none';svg.style.left=m3.m41+'px';svg.style.top=m3.m42+'px';}}catch(e){}
      });
      cc.querySelectorAll('.leaflet-canvas-pane canvas').forEach(function(cv){
        try{var st4=window.getComputedStyle(cv).transform;if(st4&&st4!=='none') cv.style.transform='none';}catch(e){}
      });
    }
  }).then(function(canvas){
    _showRenderProgress('Menyusun dokumen PDF...','Menambahkan legenda & elemen',88);
    _showLeafletUI(mapEl);
    try{offMap.off();offMap.remove();}catch(e){}
    if(offDiv.parentNode) offDiv.parentNode.removeChild(offDiv);
    _showRenderProgress('Menghasilkan PDF...','Hampir selesai...',95);
    setTimeout(async function(){
      await _buildPdfDocument(canvas,tglStr,jamStr,tileConf,done);
    },80);
  }).catch(function(e){
    _showLeafletUI(mapEl);
    try{offMap.off();offMap.remove();}catch(ex){}
    if(offDiv.parentNode) offDiv.parentNode.removeChild(offDiv);
    _hideRenderProgress();
    toast('Error render: '+(e.message||e),'er');
    done(null);
  });
}

function _cloneLayersTo4KMap(targetMap){
  if(_pdfOpts.showLayers&&_layerData){
    _layerData.filter(function(l){return l.aktif&&l.lat&&l.lng;}).forEach(function(layer){
      var sd=getSimbolDef(layer.simbol), warna=layer.warna||sd.warna||'#1e6fd9';
      L.marker([layer.lat,layer.lng],{icon:_makeLeafletIcon(warna,sd.ico)}).addTo(targetMap);
    });
  }
  if(_pdfOpts.showDraw&&_drawnItems){
    _drawnItems.eachLayer(function(layer){
      try{
        var gj=layer.toGeoJSON(),lid=L.Util.stamp(layer),meta=_drawnMeta[lid]||{},w=meta.warna||'#1e6fd9';
        var isLine=(meta.tipe||'polyline')==='polyline';
        var opts=isLine?{color:w,weight:3.5,opacity:.95,dashArray:'8 5',lineCap:'round'}:{color:w,weight:2,fillColor:w,fillOpacity:.22};
        L.geoJSON(gj,{style:opts}).addTo(targetMap);
      }catch(e){}
    });
  }
  if(_pdfOpts.showFoto&&_dfRawData){
    var pts=_dfGroupFilter===null?_dfRawData:_dfRawData.filter(function(pt){return _resolveKelompok(pt)===_dfGroupFilter;});
    pts.forEach(function(pt){
      if(!pt.lat||!pt.lng) return;
      var grp=JALAN_GROUPS.filter(function(x){return x.id===_resolveKelompok(pt);})[0];
      var color=grp?grp.warna:'#1e6fd9';
      L.circleMarker([pt.lat,pt.lng],{radius:5,color:'#fff',weight:1.5,fillColor:color,fillOpacity:1}).addTo(targetMap);
    });
  }
}

function _getTileConf(){ return TILE_LAYERS[_pdfOpts.mapMode]||TILE_LAYERS.osm; }

// ══════════════════════════════════════════════════════════════════════════════
//  PDF — BUILD DOCUMENT
// ══════════════════════════════════════════════════════════════════════════════
async function _buildPdfDocument(mapCanvas,tglStr,jamStr,tileConf,done){
  var dims=_getPaperDims(), pgW=dims.w, pgH=dims.h;
  var paper=PAPER_SIZES[_pdfOpts.paperSize]||PAPER_SIZES.a4;
  var isLS=_pdfOpts.orientation==='landscape';
  var JsPDF=(window.jspdf&&window.jspdf.jsPDF)||window.jsPDF;
  if(!JsPDF){ toast('jsPDF tidak tersedia.','er'); done(null); return; }

  var doc=new JsPDF({orientation:isLS?'landscape':'portrait',unit:'mm',format:[dims.w,dims.h]});

  var HDR_H=20, FTR_H=10, PAD=5;
  var LEG_W = _pdfLegendRows.length > 0 ? 52 : 0;  // sidebar lebih sempit
  var LEG_GAP = LEG_W > 0 ? 3 : 0;
  var COMP_H  = 36; // tinggi area kompas

  var cTop = HDR_H + PAD;
  var cBot = pgH - FTR_H - PAD;
  var cH   = cBot - cTop;  // tinggi area konten penuh

  // Lebar area peta = sisa setelah legenda
  var mapAreaW = pgW - PAD * 2 - LEG_W - LEG_GAP;

  // Aspect ratio canvas → hitung dimensi peta
  var imgW = mapCanvas.width, imgH = mapCanvas.height;
  var ratio = imgH / imgW;

  // Peta mengisi penuh tinggi konten, lebar menyesuaikan
  var dispH = cH;
  var dispW = cH / ratio;
  // Jika terlalu lebar, sesuaikan
  if (dispW > mapAreaW) { dispW = mapAreaW; dispH = mapAreaW * ratio; }

  // Posisi peta: kiri rata PAD, vertikal center
  var mapX = PAD;
  var mapY = cTop + (cH - dispH) / 2;

  // Background
  doc.setFillColor(230,237,248); doc.rect(0,0,pgW,pgH,'F');
  doc.setFillColor(246,249,254); doc.roundedRect(3,3,pgW-6,pgH-6,2,2,'F');

  // Pastikan ikon sudah ter-cache (sync)
  _precacheSimbolIcons();

  // Logo (fetch dengan cache)
  if(!_logoCacheB64){
    try{ _logoCacheB64=await _imgToBase64('https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Linmas_Logo.png/960px-Linmas_Logo.png'); }
    catch(e){ console.warn('Logo gagal:',e); }
  }

  // Header
  doc.setFillColor(8,18,38);    doc.rect(0,0,pgW,HDR_H,'F');
  doc.setFillColor(12,26,56);   doc.rect(0,0,pgW*0.58,HDR_H,'F');
  doc.setFillColor(28,111,217); doc.rect(0,HDR_H-1.2,pgW,1.2,'F');

  // Logo atau badge
  if(_logoCacheB64){
    doc.addImage(_logoCacheB64,'PNG',PAD,2,14,14);
  } else {
    doc.setFillColor(28,111,217); doc.roundedRect(PAD,3.5,13,13,1.5,1.5,'F');
    doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(5.5);
    doc.text('PETA',PAD+6.5,8.5,{align:'center'});
    doc.text('PWK', PAD+6.5,12.5,{align:'center'});
  }

  doc.setFont('helvetica','bold'); doc.setFontSize(isLS?10.5:9); doc.setTextColor(238,246,255);
  doc.text('LAPORAN PEMETAAN KAWASAN PEDESTRIAN',PAD+16,9);
  doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(155,193,235);
  doc.text('Satlinmas — '+tglStr+' pukul '+jamStr,PAD+16,14.5);
  doc.setFontSize(6); doc.setTextColor(115,155,210);
  doc.text('Ponorogo, Jawa Timur',pgW-PAD,7.5,{align:'right'});
  doc.text(paper.label+' '+(isLS?'Landscape':'Portrait'),pgW-PAD,11.5,{align:'right'});
  doc.text('Dicetak: '+tglStr,pgW-PAD,15.5,{align:'right'});

  // Shadow & border peta
  doc.setFillColor(195,210,228); doc.roundedRect(mapX+.8,mapY+.8,dispW+.4,dispH+.4,2,2,'F');
  doc.setDrawColor(160,188,218); doc.setLineWidth(.4);
  doc.roundedRect(mapX,mapY,dispW,dispH,1.5,1.5,'S');

  // Gambar peta
  doc.addImage(mapCanvas.toDataURL('image/png',1),'png',mapX,mapY,dispW,dispH,'','FAST');

    // Sidebar legenda — tinggi mengikuti tinggi peta aktual (bukan cH)
  if(LEG_W>0){
    var sbX = mapX + dispW + LEG_GAP;
    var sbY = mapY;
    var sbH = dispH; // sama tinggi dengan peta

    doc.setFillColor(240,245,252); doc.setDrawColor(182,204,226); doc.setLineWidth(.35);
    doc.roundedRect(sbX,sbY,LEG_W,sbH,2,2,'FD');
    doc.setFillColor(18,48,100); doc.roundedRect(sbX+2,sbY+2,LEG_W-4,7,1,1,'F');
    doc.setTextColor(208,228,255); doc.setFont('helvetica','bold'); doc.setFontSize(5.5);
    doc.text('KETERANGAN PETA',sbX+LEG_W/2,sbY+6.5,{align:'center'});
    doc.setDrawColor(145,172,208); doc.setLineWidth(.25);
    doc.line(sbX+3,sbY+10.5,sbX+LEG_W-3,sbY+10.5);

    // Area untuk legenda (di atas kompas)
    var legStartY = sbY + 12;
    var legEndY   = sbY + sbH - COMP_H - 4;
    var legH      = legEndY - legStartY;
    var rowCount  = _pdfLegendRows.length;

    // Tinggi baris adaptif: min 7mm, max 16mm
    var rowH    = rowCount > 0 ? Math.min(16, Math.max(7, legH / rowCount)) : 10;
    // Ikon proporsional 32:42, max lebar LEG_W*0.28
    var icoH    = Math.min(rowH * 0.9, rowH - 1);
    var icoW    = Math.min(icoH * (32/42), LEG_W * 0.28);
    var txtX    = sbX + icoW + 5;
    var txtMaxW = LEG_W - icoW - 7;
    var fSize   = Math.max(5, Math.min(7, rowH * 0.65));

    var curY = legStartY;
    _pdfLegendRows.forEach(function(row){
      if(curY + rowH > legEndY + 1) return; // skip jika tidak muat
      var c = hexToRgb(row.warna || '#607d8b');
      var icoY = curY + (rowH - icoH) / 2; // vertikal center ikon dalam baris
      _drawLegendSymbolPdfSized(doc, row, sbX+2, icoY, c, icoW, icoH);
      doc.setTextColor(36,56,86); doc.setFont('helvetica','normal'); doc.setFontSize(fSize);
      var lines = doc.splitTextToSize((row.label||'').substring(0,34), txtMaxW);
      // Batas max 2 baris label
      if(lines.length > 2) lines = lines.slice(0,2);
      var txtY = curY + rowH/2;
      doc.text(lines, txtX, txtY, {baseline:'middle', lineHeightFactor:1.2});
      // Garis pemisah tipis antar baris
      if(rowH > 8){
        doc.setDrawColor(220,230,245); doc.setLineWidth(.15);
        doc.line(sbX+3, curY+rowH-.5, sbX+LEG_W-3, curY+rowH-.5);
      }
      curY += rowH;
    });

    // Kompas
    var cCX=sbX+LEG_W/2, cCY=sbY+sbH-20, cR=10;
    doc.setFillColor(225,233,250); doc.setDrawColor(158,182,212); doc.setLineWidth(.3);
    doc.circle(cCX,cCY,cR,'FD');
    doc.setFillColor(215,225,245); doc.circle(cCX,cCY,cR-2,'F');
    doc.setDrawColor(140,165,198); doc.setLineWidth(.3);
    doc.line(cCX,cCY-cR+.4,cCX,cCY-cR+2.2);
    doc.line(cCX,cCY+cR-2.2,cCX,cCY+cR-.4);
    doc.line(cCX-cR+.4,cCY,cCX-cR+2.2,cCY);
    doc.line(cCX+cR-2.2,cCY,cCX+cR-.4,cCY);
    doc.setFillColor(192,57,43);
    doc.triangle(cCX,cCY-cR+2,cCX-2.8,cCY,cCX+2.8,cCY,'F');
    doc.setFillColor(130,150,175);
    doc.triangle(cCX,cCY+cR-2,cCX-2.8,cCY,cCX+2.8,cCY,'F');
    doc.setFillColor(248,252,255); doc.circle(cCX,cCY,2.4,'F');
    doc.setFillColor(68,88,120);   doc.circle(cCX,cCY,.9,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(6.2); doc.setTextColor(192,57,43);
    doc.text('U',cCX,cCY-cR-1.8,{align:'center'});
    doc.setTextColor(88,110,145); doc.setFontSize(5);
    doc.text('S',cCX,          cCY+cR+3.8,{align:'center'});
    doc.text('B',cCX-cR-3.5,  cCY+1.6,   {align:'center'});
    doc.text('T',cCX+cR+3.5,  cCY+1.6,   {align:'center'});
    doc.setFont('helvetica','normal'); doc.setFontSize(4.8); doc.setTextColor(105,128,160);
    doc.text('Utara Magnetik',cCX,sbY+sbH-3.5,{align:'center'});
    doc.setFontSize(4.5); doc.setTextColor(85,108,145);
    doc.text('Skala '+_getScaleLabel(_pdfMap?_pdfMap.getZoom():13),cCX,sbY+sbH-.8,{align:'center'});
  }

  // Footer
  var ftY=pgH-FTR_H;
  doc.setFillColor(8,18,38); doc.rect(0,ftY,pgW,FTR_H,'F');
  doc.setFillColor(28,111,217); doc.rect(0,ftY,pgW,1,'F');
  doc.setTextColor(98,138,202); doc.setFont('helvetica','bold'); doc.setFontSize(6);
  doc.text('SATLINMAS PONOROGO — PETA PEDESTRIAN',PAD,ftY+4.5);
  doc.setFont('helvetica','normal'); doc.setFontSize(5); doc.setTextColor(72,108,162);
  doc.text('SI-PEDAS · Sistem Informasi Pedestrian Satlinmas',PAD,ftY+8);
  doc.setTextColor(88,128,192); doc.setFontSize(5.8);
  doc.text('Sumber: '+(tileConf.label||tileConf.attr||'OSM'),pgW/2,ftY+4.5,{align:'center'});
  doc.setFontSize(4.8); doc.setTextColor(62,92,152);
  doc.text('Koordinat: -7.87148, 111.47032',pgW/2,ftY+8,{align:'center'});
  doc.setTextColor(88,128,192); doc.setFontSize(5.8);
  doc.text('Dicetak: '+tglStr+' '+jamStr,pgW-PAD,ftY+4.5,{align:'right'});
  doc.setFontSize(4.5); doc.setTextColor(52,82,142);
  doc.text('Halaman 1 dari 1',pgW-PAD,ftY+8,{align:'right'});

  done(doc);
}

// ══════════════════════════════════════════════════════════════════════════════
//  PDF — GAMBAR SIMBOL LEGENDA (ukuran dinamis)
// ══════════════════════════════════════════════════════════════════════════════
// Versi berukuran tetap (dipakai internal)
function _drawLegendSymbolPdf(doc, row, x, y, c) {
  _drawLegendSymbolPdfSized(doc, row, x, y, c, 10, 13);
}

// Versi ukuran dinamis — icoW & icoH dalam mm
function _drawLegendSymbolPdfSized(doc, row, x, y, c, icoW, icoH) {
  var t = row.tipe || 'marker';
  var cx = x + icoW / 2;   // center X simbol
  var cy = y + icoH / 2;   // center Y simbol

  if (t === 'line') {
    var ly = cy, lx1 = x, lx2 = x + icoW;
    doc.setDrawColor(c.r,c.g,c.b); doc.setLineWidth(Math.max(.8, icoH * .1));
    var dash = icoW / 5, gap = icoW / 8, px = lx1;
    while(px < lx2){ var e=Math.min(px+dash,lx2); doc.line(px,ly,e,ly); px+=dash+gap; }
    doc.setFillColor(c.r,c.g,c.b);
    doc.circle(lx1, ly, Math.max(.4, icoH*.08), 'F');
    doc.circle(lx2, ly, Math.max(.4, icoH*.08), 'F');
    doc.setLineWidth(.25);
    return;
  }

  if (t === 'poly') {
    var aw=icoW*.9, ah=icoH*.65, ax=x+icoW*.05, ay=cy-ah/2;
    doc.setFillColor(c.r,c.g,c.b);
    doc.setGState(doc.GState({opacity:.22}));
    doc.roundedRect(ax,ay,aw,ah,1,1,'F');
    doc.setGState(doc.GState({opacity:1}));
    doc.setDrawColor(c.r,c.g,c.b); doc.setLineWidth(Math.max(.6, icoH*.08));
    doc.roundedRect(ax,ay,aw,ah,1,1,'S');
    doc.setLineWidth(.25);
    return;
  }

  if (t === 'dot') {
    var r = Math.min(icoW, icoH) * .38;
    doc.setFillColor(255,255,255); doc.circle(cx, cy, r+.8, 'F');
    doc.setFillColor(c.r,c.g,c.b); doc.circle(cx, cy, r, 'F');
    return;
  }

  // marker: PNG dari cache
  var png = _getSimbolPng(row.simbol || 'fa-map-pin', row.warna || '#607d8b');
  if (png) {
    try { doc.addImage(png, 'PNG', x, y, icoW, icoH); return; } catch(e) {}
  }
  // fallback pin manual
  var hr = icoW * .38;
  doc.setFillColor(c.r,c.g,c.b); doc.circle(cx, y+hr, hr, 'F');
  doc.triangle(cx-hr+.5, y+hr*1.4, cx+hr-.5, y+hr*1.4, cx, y+icoH-.5, 'F');
  doc.setFillColor(255,255,255); doc.circle(cx, y+hr, hr*.65, 'F');
  doc.setFillColor(c.r,c.g,c.b); doc.circle(cx, y+hr, hr*.28, 'F');
}

function _getScaleLabel(zoom){
  var scales={10:'1:300.000',11:'1:150.000',12:'1:75.000',13:'1:38.000',14:'1:19.000',15:'1:9.500',16:'1:4.800',17:'1:2.400',18:'1:1.200',19:'1:600'};
  return scales[Math.min(19,Math.max(10,zoom||13))]||'1:50.000';
}

// ══════════════════════════════════════════════════════════════════════════════
//  PICK KOORDINAT
// ══════════════════════════════════════════════════════════════════════════════
function _cancelPickCoord(){
  _pickCoordMode=false;
  var md=G('lf-map-div'); if(md) md.classList.remove('lf-pick-cursor');
  var b=G('lf-pick-banner'); if(b&&b.parentNode) b.parentNode.removeChild(b);
  if(_lfMap){ _lfMap.off('click'); _lfMap.on('click',function(){ if(_dfStreetPanelOpen) _closeStreetPanel(); }); }
}

function _setPickedCoord(lat,lng){
  var li=G('lf-lat'),lo=G('lf-lng');
  if(li){ li.value=lat.toFixed(6); li.dispatchEvent(new Event('input')); }
  if(lo){ lo.value=lng.toFixed(6); lo.dispatchEvent(new Event('input')); }
  if(_pickTempMarker&&_lfMap){ try{_lfMap.removeLayer(_pickTempMarker);}catch(e){} }
  _pickTempMarker=L.marker([lat,lng],{icon:L.divIcon({html:'<div style="width:18px;height:18px;border-radius:50%;background:#0d9268;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.4)"></div>',className:'',iconSize:[18,18],iconAnchor:[9,9]})})
    .addTo(_lfMap).bindPopup('<div class="lf-popup-title"><i class="fas fa-crosshairs" style="color:#0d9268"></i> Koordinat Dipilih</div><div class="lf-popup-row"><span style="font-family:var(--mono);font-size:.63rem">'+lat.toFixed(6)+', '+lng.toFixed(6)+'</span></div>',{maxWidth:200}).openPopup();
  toast('Koordinat: '+lat.toFixed(5)+', '+lng.toFixed(5),'ok');
  setTimeout(function(){ if(_pickTempMarker&&_lfMap){ try{_lfMap.removeLayer(_pickTempMarker);}catch(e){} _pickTempMarker=null; } },7000);
}

function openLayerModal_pickCoord(){
  var modal=G('mlayer'); if(modal) modal.classList.remove('on');
  toast('Klik lokasi di peta — modal terbuka kembali otomatis.','inf');
  _pickCoordMode=true;
  var md=G('lf-map-div'); if(md) md.classList.add('lf-pick-cursor');
  var lw=G('leaflet-wrap');
  if(lw&&!G('lf-pick-banner')){
    var b=document.createElement('div'); b.id='lf-pick-banner'; b.className='lf-pick-banner';
    b.innerHTML='<i class="fas fa-crosshairs"></i> Klik lokasi di peta<button class="lf-pick-cancel" onclick="_cancelPickCoordModal()">Batal</button>';
    lw.appendChild(b);
  }
  if(_lfMap){
    _lfMap.once('click',function(e){
      if(!_pickCoordMode) return;
      _cancelPickCoordModal(); _setPickedCoord(e.latlng.lat,e.latlng.lng);
      setTimeout(function(){ if(G('mlayer')) G('mlayer').classList.add('on'); },400);
    });
  }
}

function _cancelPickCoordModal(){
  _pickCoordMode=false;
  var md=G('lf-map-div'); if(md) md.classList.remove('lf-pick-cursor');
  var b=G('lf-pick-banner'); if(b&&b.parentNode) b.parentNode.removeChild(b);
  if(_lfMap){ _lfMap.off('click'); _lfMap.on('click',function(){ if(_dfStreetPanelOpen) _closeStreetPanel(); }); }
  if(G('mlayer')) G('mlayer').classList.add('on');
}

function _onKeyEsc(e){
  if(e.key!=='Escape') return;
  if(_pickCoordMode)                                                            { _cancelPickCoord(); return; }
  if(G('img-lb-ov')&&G('img-lb-ov').classList.contains('show'))                { closeLb(); return; }
  if(_lyrPhotoOpen)                                                             { closeLayerPhotoPanel(); return; }
  if(_pdfModalOpen)                                                             { closePdfModal(); return; }
  if(_dfStreetPanelOpen)                                                        { _closeStreetPanel(); return; }
  if(G('lf-meta-overlay')&&G('lf-meta-overlay').classList.contains('show'))    { cancelDrawMeta(); return; }
  if(_drawPanelOpen)                                                            { closeDrawPanel(); return; }
  if(_activeDrawMode)                                                           { _cancelDraw(); return; }
  if(_petaFullscreen)                                                           { togglePetaFullscreen(); }
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAP CONTROLS
// ══════════════════════════════════════════════════════════════════════════════
function onPetaFrameLoad(){
  var sh=G('peta-shimmer'),fr=G('peta-frame');
  if(sh) sh.classList.add('hidden');
  if(fr) fr.style.opacity='1';
}

function togglePetaFullscreen(){
  _petaFullscreen=!_petaFullscreen;
  var wrap=G('peta-main-wrap'),ico=G('btn-fs-ico'),lbl=G('btn-fs-lbl');
  if(_petaFullscreen){
    wrap.classList.add('peta-fs-active');
    if(ico) ico.className='fas fa-compress';
    if(lbl) lbl.textContent='Keluar Penuh';
    document.body.style.overflow='hidden';
  } else {
    wrap.classList.remove('peta-fs-active');
    if(ico) ico.className='fas fa-expand';
    if(lbl) lbl.textContent='Layar Penuh';
    document.body.style.overflow='';
  }
  if(_lfMap) setTimeout(function(){ _lfMap.invalidateSize({animate:false}); },350);
}

function reloadPetaFrame(){
  var fr=G('peta-frame'),sh=G('peta-shimmer');
  if(!fr){ toast('Frame tidak ditemukan.','er'); return; }
  if(sh) sh.classList.remove('hidden');
  fr.style.opacity='0'; fr.src='';
  setTimeout(function(){fr.src=PETA_EMBED_URL;},100);
}

function switchPetaMode(mode){
  if(_petaMode===mode) return;
  _petaMode=mode;
  var btnMM=G('btn-mymaps'),btnLF=G('btn-leaflet');
  var wMM=G('mymaps-wrap'),wLF=G('leaflet-wrap');
  var bEL=G('btn-edit-layer'),bPR=G('btn-print-pdf'),bOM=G('btn-open-mymaps');
  if(mode==='mymaps'){
    if(btnMM) btnMM.classList.add('on');    if(btnLF) btnLF.classList.remove('on');
    if(wLF)  wLF.style.display='none';     if(wMM) wMM.style.display='';
    if(bEL)  bEL.style.display='none';     if(bPR) bPR.style.display='none';
    if(bOM)  bOM.style.display='';
    closeDrawPanel();
  } else {
    if(btnLF) btnLF.classList.add('on');    if(btnMM) btnMM.classList.remove('on');
    if(wMM)  wMM.style.display='none';     if(wLF) wLF.style.display='';
    if(bEL)  bEL.style.display='';         if(bPR) bPR.style.display='';
    if(bOM)  bOM.style.display='none';
    if(!_lfMap) _initLeaflet();
    else setTimeout(function(){ if(_lfMap) _lfMap.invalidateSize({animate:false}); },80);
  }
}

function reloadPetaActive(){ if(_petaMode==='mymaps') reloadPetaFrame(); else refreshLeaflet(); }
function _lfShowLoad(m){ var el=G('lf-loader'),sp=el&&el.querySelector('span'); if(sp) sp.textContent=m||'Memuat...'; if(el) el.style.display='flex'; }
function _lfHideLoad() { var el=G('lf-loader'); if(el) el.style.display='none'; }

function toggleDrawPanel(){
  _drawPanelOpen=!_drawPanelOpen;
  var p=G('lf-draw-panel'),b=G('btn-draw-toggle');
  if(_drawPanelOpen){ if(p){p.classList.remove('hidden');p.classList.add('visible');}if(b) b.classList.add('active'); }
  else closeDrawPanel();
}

function closeDrawPanel(){
  _drawPanelOpen=false;
  var p=G('lf-draw-panel'),b=G('btn-draw-toggle');
  if(p){p.classList.remove('visible');p.classList.add('hidden');}
  if(b) b.classList.remove('active');
}

// ══════════════════════════════════════════════════════════════════════════════
//  LEAFLET INIT
// ══════════════════════════════════════════════════════════════════════════════
function _ensureLeafletLoaded(cb){
  if(window.L&&window.L.Draw){cb();return;}
  function lC(h,i){if(document.getElementById(i))return;var l=document.createElement('link');l.id=i;l.rel='stylesheet';l.href=h;document.head.appendChild(l);}
  function lS(s,fn){var e=document.createElement('script');e.src=s;e.onload=fn;document.head.appendChild(e);}
  lC('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css','lf-css');
  lC('https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css','lf-draw-css');
  if(!window.L) lS('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',function(){lS('https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js',cb);});
  else lS('https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js',cb);
}

function _initLeaflet(){
  _ensureLeafletLoaded(function(){
    var md=G('lf-map-div'); if(!md) return;
    if(_lfMap){
      if(!document.body.contains(_lfMap.getContainer())){try{_lfMap.off();_lfMap.remove();}catch(e){}_lfMap=null;}
      else{setTimeout(function(){if(_lfMap) _lfMap.invalidateSize({animate:false});},80);refreshLeaflet();return;}
    }
    _lfMap=L.map('lf-map-div',{center:PETA_CENTER,zoom:PETA_ZOOM,zoomControl:false,attributionControl:true});

    var osmL=L.tileLayer(TILE_LAYERS.osm.url,       {attribution:TILE_LAYERS.osm.attr,       maxZoom:19,crossOrigin:true});
    var satL=L.tileLayer(TILE_LAYERS.satellite.url, {attribution:TILE_LAYERS.satellite.attr, maxZoom:19,crossOrigin:true});
    var hybL=L.tileLayer(TILE_LAYERS.hybrid.url,    {attribution:TILE_LAYERS.hybrid.attr,    maxZoom:20,crossOrigin:true});
    var gsL =L.tileLayer(TILE_LAYERS.google_sat.url,{attribution:TILE_LAYERS.google_sat.attr,maxZoom:20,crossOrigin:true});
    var ctL =L.tileLayer(TILE_LAYERS.carto.url,     {attribution:TILE_LAYERS.carto.attr,     maxZoom:19,crossOrigin:true});
    var toL =L.tileLayer(TILE_LAYERS.topo.url,      {attribution:TILE_LAYERS.topo.attr,      maxZoom:17,crossOrigin:true});
    osmL.addTo(_lfMap); _currentBaseLayer=osmL;

    L.control.layers({
      '<i class="fas fa-map" style="color:#1e6fd9"></i>&nbsp;OSM':osmL,
      '<i class="fas fa-satellite" style="color:#0d9268"></i>&nbsp;Satelit':satL,
      '<i class="fas fa-globe" style="color:#ea580c"></i>&nbsp;G.Sat':gsL,
      '<i class="fas fa-road" style="color:#16a34a"></i>&nbsp;Hybrid':hybL,
      '<i class="fas fa-map-location" style="color:#7c3aed"></i>&nbsp;CartoDB':ctL,
      '<i class="fas fa-mountain" style="color:#b45309"></i>&nbsp;Topo':toL
    },{},{collapsed:true,position:'topright'}).addTo(_lfMap);

    _lfMap.on('baselayerchange',function(e){_currentBaseLayer=e.layer;});
    L.control.scale({imperial:false,position:'bottomleft'}).addTo(_lfMap);
    _addNavCtrl();

    _drawnItems=new L.FeatureGroup().addTo(_lfMap);
    _drawControl=new L.Control.Draw({
      position:'topright',
      draw:{
        polyline:{shapeOptions:{color:'#1e6fd9',weight:3,opacity:.9,dashArray:'6 4',fillOpacity:0}},
        polygon:{allowIntersection:false,showArea:false,shapeOptions:{color:'#7c3aed',weight:2.5,opacity:1,fillColor:'#7c3aed',fillOpacity:.12}},
        rectangle:false,circle:false,marker:false,circlemarker:false
      },
      edit:{featureGroup:_drawnItems,remove:true}
    });
    _drawControl.addTo(_lfMap);

    _lfMap.on('mousemove',function(){
      if(!_activeDrawMode) return;
      document.querySelectorAll('.leaflet-overlay-pane svg path').forEach(function(p){
        var f=p.getAttribute('fill');
        if(f==='#000000'||f==='black'||f==='#000'||(!f&&p.style.fill==='')){
          p.setAttribute('fill',_activeDrawMode==='polygon'?'#7c3aed':'none');
          p.setAttribute('fill-opacity','0.12');
        }
      });
    });

    setTimeout(function(){var dc=document.querySelector('.leaflet-draw');if(dc) dc.style.display='none';},200);

    _lfMap.on(L.Draw.Event.CREATED,function(e){
      _showMetaForm(e.layer,_activeDrawMode||(e.layerType==='polyline'?'polyline':'polygon'));
      _activeDrawMode=null;
    });
    _lfMap.on(L.Draw.Event.DRAWSTOP,function(){_setDrawMode(null);});
    _lfMap.on('click',function(){if(_dfStreetPanelOpen) _closeStreetPanel();});

    _lfLayerGroupDF=L.layerGroup();
    _addDefaultMarker();
    refreshLeaflet();
    loadDrawings();
  });
}

function _addNavCtrl(){
  if(!window.L||!_lfMap) return;
  if(!G('lf-nav-style')){
    var st=document.createElement('style'); st.id='lf-nav-style';
    st.textContent=[
      '.lf-nav-wrap{position:absolute;top:10px;left:10px;z-index:900;display:flex;flex-direction:column;align-items:center;gap:0}',
      '.lf-nav-toggle{width:30px;height:30px;border-radius:6px;background:rgba(15,23,42,.9);color:#fff;border:1.5px solid rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;font-size:.8rem;cursor:pointer;backdrop-filter:blur(8px);box-shadow:0 2px 10px rgba(0,0,0,.32);transition:background .14s;flex-shrink:0}',
      '.lf-nav-toggle:hover{background:rgba(30,111,217,.85)}',
      '.lf-nav-toggle.open{background:rgba(30,111,217,.9);border-color:rgba(100,170,255,.4)}',
      '.lf-nav-panel{display:flex;flex-direction:column;align-items:center;gap:2px;overflow:hidden;max-height:0;opacity:0;transition:max-height .22s ease,opacity .18s ease;margin-top:3px}',
      '.lf-nav-panel.open{max-height:200px;opacity:1}',
      '.lf-nav-btn{width:28px;height:28px;border-radius:5px;background:rgba(10,20,42,.88);color:rgba(255,255,255,.82);border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;font-size:.72rem;cursor:pointer;backdrop-filter:blur(6px);transition:background .12s,color .12s;flex-shrink:0}',
      '.lf-nav-btn:hover{background:rgba(30,111,217,.75);color:#fff}',
      '.lf-nav-row{display:flex;gap:2px}',
      '.lf-nav-sep{height:1px;width:28px;background:rgba(255,255,255,.1);margin:1px 0}'
    ].join('');
    document.head.appendChild(st);
  }
  var mapContainer=_lfMap.getContainer();
  var wrap=document.createElement('div'); wrap.className='lf-nav-wrap'; wrap.id='lf-nav-wrap';
  wrap.innerHTML=''
    +'<button class="lf-nav-toggle" id="lf-nav-toggle" title="Navigasi" onclick="_toggleNavPanel()"><i class="fas fa-compass"></i></button>'
    +'<div class="lf-nav-panel" id="lf-nav-panel">'
      +'<button class="lf-nav-btn" title="Zoom In"  onclick="if(_lfMap)_lfMap.zoomIn()"><i class="fas fa-plus"></i></button>'
      +'<button class="lf-nav-btn" title="Zoom Out" onclick="if(_lfMap)_lfMap.zoomOut()"><i class="fas fa-minus"></i></button>'
      +'<div class="lf-nav-sep"></div>'
      +'<button class="lf-nav-btn" onclick="if(_lfMap)_lfMap.panBy([0,-80])"><i class="fas fa-chevron-up"></i></button>'
      +'<div class="lf-nav-row">'
        +'<button class="lf-nav-btn" onclick="if(_lfMap)_lfMap.panBy([-80,0])"><i class="fas fa-chevron-left"></i></button>'
        +'<button class="lf-nav-btn" onclick="if(_lfMap)_lfMap.panBy([80,0])"><i class="fas fa-chevron-right"></i></button>'
      +'</div>'
      +'<button class="lf-nav-btn" onclick="if(_lfMap)_lfMap.panBy([0,80])"><i class="fas fa-chevron-down"></i></button>'
      +'<div class="lf-nav-sep"></div>'
      +'<button class="lf-nav-btn" onclick="if(_lfMap)_lfMap.flyTo(PETA_CENTER,PETA_ZOOM,{animate:true,duration:1.2})" style="color:#f59e0b"><i class="fas fa-crosshairs"></i></button>'
    +'</div>';
  mapContainer.appendChild(wrap);
  L.DomEvent.disableClickPropagation(wrap);
  L.DomEvent.disableScrollPropagation(wrap);
}

function _toggleNavPanel(){
  _navPanelOpen=!_navPanelOpen;
  var panel=G('lf-nav-panel'),toggle=G('lf-nav-toggle');
  if(panel)  panel.classList.toggle('open',_navPanelOpen);
  if(toggle) toggle.classList.toggle('open',_navPanelOpen);
}

function startDraw(type){
  if(!_lfMap||!window.L||!L.Draw){toast('Peta belum siap.','er');return;}
  if(_activeDrawMode===type){_cancelDraw();return;}
  _cancelDraw(); _activeDrawMode=type;
  if(type==='polyline'){
    _activeDrawHandler=new L.Draw.Polyline(_lfMap,{shapeOptions:{color:'#1e6fd9',weight:3,opacity:.9,dashArray:'6 4',fillOpacity:0}});
    toast('Mode GARIS — klik titik, dobel klik selesai','inf');
  } else {
    _activeDrawHandler=new L.Draw.Polygon(_lfMap,{allowIntersection:false,showArea:false,shapeOptions:{color:'#7c3aed',weight:2.5,opacity:1,fillColor:'#7c3aed',fillOpacity:.12}});
    toast('Mode AREA — klik titik, dobel klik selesai','inf');
  }
  if(_activeDrawHandler) _activeDrawHandler.enable();
  _setDrawMode(type); closeDrawPanel();
}

function _cancelDraw(){
  if(_activeDrawHandler){_activeDrawHandler.disable();_activeDrawHandler=null;}
  _activeDrawMode=null; _setDrawMode(null);
}

function _setDrawMode(m){
  var bl=G('btn-draw-line'),ba=G('btn-draw-area');
  if(bl) bl.classList.toggle('active',m==='polyline');
  if(ba) ba.classList.toggle('active',m==='polygon');
}

function clearDrawings(){
  if(!_drawnItems) return;
  var c=Object.keys(_drawnItems._layers||{}).length;
  if(!c){toast('Tidak ada gambar.','inf');return;}
  _drawnItems.clearLayers(); _drawnMeta={}; _cancelDraw(); closeDrawPanel();
  toast(c+' gambar dihapus.','ok');
}

function _buildMetaSwatches(){
  var g=G('lf-meta-warna-grid'); if(!g) return;
  g.innerHTML=DRAW_WARNA_PRESET.map(function(c){
    return '<div class="lf-meta-swatch'+(c.hex===_metaWarna?' on':'')+'" style="background:'+c.hex+'" data-hex="'+c.hex+'" onclick="metaWarnaPilih(\''+c.hex+'\')"></div>';
  }).join('');
}

function metaWarnaPilih(h){
  _metaWarna=h;
  document.querySelectorAll('.lf-meta-swatch').forEach(function(s){s.classList.toggle('on',s.dataset.hex===h);});
  var i=G('lf-meta-color-inp'); if(i) i.value=h;
  var l=G('lf-meta-color-lbl'); if(l) l.textContent=h;
  _applyPC(h);
}

function metaWarnaCustom(h){
  _metaWarna=h;
  document.querySelectorAll('.lf-meta-swatch').forEach(function(s){s.classList.remove('on');});
  var l=G('lf-meta-color-lbl'); if(l) l.textContent=h;
  _applyPC(h);
}

function _applyPC(h){
  if(!_pendingLayer) return;
  try{if(_pendingLayer.setStyle) _pendingLayer.setStyle(_pendingLayerType==='polyline'?{color:h}:{color:h,fillColor:h});}catch(e){}
}

function _showMetaForm(layer,type){
  _pendingLayer=layer; _pendingLayerType=type;
  var dw=type==='polyline'?'#1e6fd9':'#7c3aed';
  _metaWarna=dw; _buildMetaSwatches();
  var inp=G('lf-meta-color-inp'); if(inp) inp.value=dw;
  var lbl=G('lf-meta-color-lbl'); if(lbl) lbl.textContent=dw;
  var n=G('lf-meta-nama'),k=G('lf-meta-ket');
  if(n) n.value=''; if(k) k.value='';
  var msr=_getMsr(layer,type);
  var me=G('lf-meta-msr'),mt=G('lf-meta-msr-text');
  if(me) me.style.display=msr?'':'none'; if(mt) mt.textContent=msr;
  var t=G('lf-meta-title');
  if(t) t.innerHTML='<i class="fas '+(type==='polyline'?'fa-pen-nib':'fa-vector-square')+'"></i> '+(type==='polyline'?'Detail Garis / Rute':'Detail Area / Zona');
  var el=G('lf-meta-overlay'); if(el) el.classList.add('show');
  setTimeout(function(){if(n) n.focus();},260);
}

function confirmDrawMeta(){
  if(!_pendingLayer) return;
  var nama=((G('lf-meta-nama')||{}).value||'').trim();
  if(!nama){var n=G('lf-meta-nama');if(n){n.focus();n.style.borderColor='#c0392b';}toast('Nama wajib diisi.','er');return;}
  var ket=((G('lf-meta-ket')||{}).value||'').trim();
  _applyPC(_metaWarna); _drawnItems.addLayer(_pendingLayer);
  var lid=L.Util.stamp(_pendingLayer), msr=_getMsr(_pendingLayer,_pendingLayerType);
  _drawnMeta[lid]={nama:nama,ket:ket,warna:_metaWarna,tipe:_pendingLayerType,measurement:msr};
  _bindDrawnPopup(_pendingLayer,nama,ket,_metaWarna,_pendingLayerType,msr);
  _bindMsrTooltip(_pendingLayer,_pendingLayerType);
  _hideMetaForm(); _setDrawMode(null);
  toast('Gambar "'+nama+'" ditambahkan.','ok');
  _pendingLayer=null; _pendingLayerType=null;
}

function cancelDrawMeta(){
  if(_pendingLayer&&_lfMap){try{_lfMap.removeLayer(_pendingLayer);}catch(e){}}
  _pendingLayer=null; _pendingLayerType=null;
  _hideMetaForm(); _setDrawMode(null);
  toast('Gambar dibatalkan.','inf');
}

function _hideMetaForm(){ var el=G('lf-meta-overlay'); if(el) el.classList.remove('show'); }

function _bindDrawnPopup(layer,nama,ket,warna,tipe,msr){
  var ico=tipe==='polyline'?'fa-pen-nib':'fa-vector-square';
  var label=tipe==='polyline'?'Garis / Rute':'Area / Zona';
  var html='<div class="lf-popup-title" style="display:flex;align-items:center;gap:5px">'
    +'<i class="fas '+ico+'" style="color:'+warna+'"></i>'
    +'<span style="font-weight:800;color:var(--text)">'+esc(nama)+'</span></div>'
    +'<div class="lf-popup-badge" style="background:'+warna+'18;color:'+warna+';border:1px solid '+warna+'30">'+label+'</div>'
    +(msr?'<div class="lf-popup-row" style="margin-top:4px"><span style="font-family:var(--mono);font-size:.7rem;font-weight:800;color:'+warna+'">'+msr+'</span></div>':'')
    +(ket?'<div class="lf-popup-row"><i class="fas fa-info-circle" style="color:var(--muted)"></i><span>'+esc(ket)+'</span></div>':'');
  if(layer.bindPopup) layer.bindPopup(html,{maxWidth:260,className:'lf-clean-popup'});
}

function _makeLeafletIcon(warna,faIco){
  var svg='<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42"><ellipse cx="16" cy="39" rx="5" ry="2.5" fill="rgba(0,0,0,.2)"/><path d="M16 0C9.37 0 4 5.37 4 12c0 9.5 12 28 12 28S28 21.5 28 12C28 5.37 22.63 0 16 0z" fill="'+warna+'"/><circle cx="16" cy="12" r="8" fill="rgba(255,255,255,.22)"/></svg>';
  return L.divIcon({html:'<div style="position:relative;width:32px;height:42px">'+svg+'<i class="fas '+faIco+'" style="position:absolute;top:6px;left:50%;transform:translateX(-50%);color:#fff;font-size:9px;pointer-events:none"></i></div>',className:'',iconSize:[32,42],iconAnchor:[16,42],popupAnchor:[0,-40]});
}

function _makeDFIcon(groupId){
  var g=groupId?JALAN_GROUPS.filter(function(x){return x.id===groupId;})[0]:null;
  var c=g?g.warna:'#1e6fd9';
  return L.divIcon({html:'<div class="df-dot" style="background:'+c+';box-shadow:0 2px 8px '+c+'55"></div>',className:'',iconSize:[13,13],iconAnchor:[6,6],popupAnchor:[0,-8]});
}

function _addDefaultMarker(){
  if(!_lfMap) return;
  L.marker(PETA_CENTER,{icon:_makeLeafletIcon('#1e6fd9','fa-road')}).addTo(_lfMap)
    .bindPopup('<div class="lf-popup-title"><i class="fas fa-road" style="color:#1e6fd9"></i> Pos Jaga Wilayah Pedestrian</div>'
      +'<div class="lf-popup-badge" style="background:rgba(30,111,217,.1);color:#1e6fd9">Titik Awal Patroli</div>'
      +'<div class="lf-popup-row"><i class="fas fa-map-pin" style="color:#1e6fd9"></i><span>Ponorogo, Jawa Timur</span></div>');
}

function refreshLeaflet(){
  if(!_lfMap){_initLeaflet();return;}
  _lfShowLoad('Memuat data peta...');
  var dL=false,dD=false,lD=[],dD2=[];

  function check(){
    if(!dL||!dD) return;
    _lfHideLoad();
    _renderLeafletLayers(lD);
    _dfRawData=dD2;
    if(_dfVisible&&_dfGroupFilter!==undefined){
      var f=_dfGroupFilter===null?dD2:dD2.filter(function(pt){return _resolveKelompok(pt)===_dfGroupFilter;});
      _renderLeafletDF(f);
      if(_lfLayerGroupDF&&_lfMap) _lfLayerGroupDF.addTo(_lfMap);
    }
    _updateLegendBar(lD);
    _precacheSimbolIcons();
    toast('Peta diperbarui: '+lD.filter(function(l){return l.aktif;}).length+' layer aktif.','ok');
  }

  // ✅ GANTI google.script.run → apiGet
  apiGet('getLayerPeta').then(function(res){
    lD=(res.data)||[];dL=true;_layerData=lD;check();
  }).catch(function(e){
    dL=true;toast('Gagal layer: '+e.message,'er');check();
  });

  apiGet('getDetailFotoMarkers').then(function(res){
    dD2=(res.data)||[];dD=true;check();
  }).catch(function(){
    dD=true;check();
  });
}

function _renderLeafletLayers(data){
  _lfMarkersLP.forEach(function(m){_lfMap.removeLayer(m);}); _lfMarkersLP=[];
  data.forEach(function(layer){
    if(!layer.aktif||!layer.lat||!layer.lng) return;
    var sd=getSimbolDef(layer.simbol), warna=layer.warna||sd.warna;
    var lat=layer.lat, lng=layer.lng, nama=layer.nama;
    var fotoBtn='<div style="margin-top:8px;border-top:1px solid rgba(0,0,0,.07);padding-top:8px">'
      +'<button onclick="openLayerPhotoPanel('+lat+','+lng+',\''+esc(nama).replace(/'/g,"\\'")
      +'\',\''+warna+'\',\''+sd.ico+'\')" '
      +'style="display:flex;align-items:center;gap:5px;width:100%;padding:5px 8px;background:'+warna+'18;color:'+warna+';border:1px solid '+warna+'30;border-radius:6px;font-size:.64rem;font-weight:800;cursor:pointer;font-family:var(--font)">'
      +'<i class="fas fa-camera"></i> Foto &amp; Laporan Sekitar</button></div>';
    var popup='<div class="lf-popup-title"><i class="fas '+sd.ico+'" style="color:'+warna+'"></i> '+esc(nama)+'</div>'
      +'<div class="lf-popup-badge" style="background:'+warna+'22;color:'+warna+'">'+sd.label+'</div>'
      +(layer.ket?'<div class="lf-popup-row"><i class="fas fa-info-circle"></i><span>'+esc(layer.ket)+'</span></div>':'')
      +'<div class="lf-popup-row"><i class="fas fa-map-pin"></i><span>'+lat.toFixed(5)+', '+lng.toFixed(5)+'</span></div>'
      +fotoBtn;
    var m=L.marker([lat,lng],{icon:_makeLeafletIcon(warna,sd.ico)}).addTo(_lfMap).bindPopup(popup,{maxWidth:265});
    _lfMarkersLP.push(m);
  });
}

function _renderLeafletDF(data){
  if(_lfLayerGroupDF) _lfLayerGroupDF.clearLayers();
  else _lfLayerGroupDF=L.layerGroup();
  _lfMarkersDF=[];
  data.forEach(function(pt){
    if(!pt.lat||!pt.lng) return;
    var kelompok=_resolveKelompok(pt), icon=_makeDFIcon(kelompok);
    var thumb=pt.thumbUrl
      ?'<img src="'+esc(pt.thumbUrl)+'" style="width:100%;max-height:100px;object-fit:cover;border-radius:7px;margin:6px 0 4px;cursor:pointer" '
          +'onerror="this.style.display=\'none\';" '
          +'onclick="openLb(\''+esc(pt.thumbUrl)+'\','+(pt.linkDrive?'\''+esc(pt.linkDrive)+'\'':'null')+',\''+esc(pt.namaFile||'Foto')+'\')">'
      :'';
    var grp=JALAN_GROUPS.filter(function(g){return g.id===kelompok;})[0];
    var badge=grp?'<div class="lf-popup-badge" style="background:'+grp.warna+'18;color:'+grp.warna+'"><i class="fas '+grp.ico+'"></i> '+grp.label+'</div>':'';
    var btnDrv=pt.linkDrive?'<a href="'+esc(pt.linkDrive)+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;padding:4px 9px;background:#0d9268;color:#fff;border-radius:6px;font-size:.62rem;font-weight:700;text-decoration:none;margin-right:4px"><i class="fas fa-external-link-alt"></i> Drive</a>':'';
    var btnGmaps=pt.linkGmaps?'<a href="'+esc(pt.linkGmaps)+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;padding:4px 9px;background:#1e6fd9;color:#fff;border-radius:6px;font-size:.62rem;font-weight:700;text-decoration:none"><i class="fas fa-map-location-dot"></i> Maps</a>':'';
    var actions=(btnDrv||btnGmaps)?'<div style="margin-top:7px;display:flex;flex-wrap:wrap;gap:4px">'+btnDrv+btnGmaps+'</div>':'';
    var popup='<div class="lf-popup-title"><i class="fas fa-camera" style="color:#1e6fd9"></i> '+esc(pt.namaFile||'Foto Lapangan')+'</div>'
      +badge+thumb
      +(pt.danru?'<div class="lf-popup-row"><i class="fas fa-shield-halved" style="color:#0d9268"></i><b>'+esc(pt.danru)+'</b></div>':'')
      +(pt.waktuExif?'<div class="lf-popup-row"><i class="fas fa-clock"></i>'+esc(pt.waktuExif)+'</div>':'')
      +'<div class="lf-popup-row"><i class="fas fa-crosshairs" style="color:#1e6fd9"></i><span style="font-family:var(--mono);font-size:.63rem">'+pt.lat.toFixed(6)+', '+pt.lng.toFixed(6)+'</span></div>'
      +(pt.ket?'<div class="lf-popup-row"><i class="fas fa-info-circle"></i><span>'+esc(pt.ket)+'</span></div>':'')
      +actions;
    var m=L.marker([pt.lat,pt.lng],{icon:icon}).bindPopup(popup,{maxWidth:260});
    _lfLayerGroupDF.addLayer(m); _lfMarkersDF.push(m);
  });
  if(_dfVisible&&_lfMap) _lfLayerGroupDF.addTo(_lfMap);
}

function _updateLegendBar(layerData){
  var bar=G('peta-legend-bar'); if(!bar) return;
  var counts={};
  layerData.filter(function(l){return l.aktif;}).forEach(function(l){counts[l.simbol]=(counts[l.simbol]||0)+1;});
  var items=SIMBOL_DEF.filter(function(s){return counts[s.id];}).map(function(s){
    return '<div class="peta-lf-leg-item"><i class="fas '+s.ico+'" style="color:'+s.warna+';font-size:.72rem"></i>'+s.label+' <strong style="font-family:var(--mono)">'+counts[s.id]+'</strong></div>';
  });
  if(_dfVisible&&_dfRawData&&_dfRawData.length){
    var gc={};
    _dfRawData.forEach(function(pt){var k=_resolveKelompok(pt);gc[k]=(gc[k]||0)+1;});
    var fi=JALAN_GROUPS.filter(function(g){return gc[g.id];}).map(function(g){
      var a=_dfGroupFilter===g.id;
      return '<div class="peta-lf-leg-item" style="cursor:pointer;'+(a?'background:'+g.warna+'18;border-radius:6px;padding:2px 4px':'')+'" onclick="selectDfGroup(\''+g.id+'\')">'
        +'<i class="fas '+g.ico+'" style="color:'+g.warna+';font-size:.72rem"></i>'+g.label.replace('Jl. ','')+' <strong style="font-family:var(--mono)">'+gc[g.id]+'</strong></div>';
    });
    if(fi.length){items.push('<div style="height:1px;background:var(--border);margin:3px 0"></div>');items=items.concat(fi);}
  }
  bar.innerHTML='<div class="peta-lf-legend"><div class="peta-lf-legend-title"><i class="fas fa-circle-info" style="color:var(--blue)"></i> Keterangan Layer Aktif</div>'
    +(items.length?items.join(''):'<span style="font-size:.62rem;color:var(--muted)">Belum ada layer aktif</span>')+'</div>';
}

// ══════════════════════════════════════════════════════════════════════════════
//  SIMPAN & MUAT GAMBAR
// ══════════════════════════════════════════════════════════════════════════════
function _serializeDrawings(){
  var r=[]; if(!_drawnItems) return r;
  _drawnItems.eachLayer(function(layer){
    try{
      var gj=layer.toGeoJSON(),lid=L.Util.stamp(layer),meta=_drawnMeta[lid]||{};
      r.push({tipe:gj.geometry.type,warna:meta.warna||'#1e6fd9',nama:meta.nama||'',ket:meta.ket||'',measurement:meta.measurement||'',geojson:JSON.stringify(gj)});
    }catch(e){}
  });
  return r;
}

function saveDrawings(){
  if(!_drawnItems){toast('Tidak ada gambar.','inf');return;}
  var d=_serializeDrawings();
  if(!d.length){toast('Tidak ada gambar.','inf');return;}
  var btn=G('btn-draw-save');
  if(btn) btn.innerHTML='<i class="fas fa-spinner fa-spin"></i>';

  // ✅ GANTI
  apiPost('saveGambarPeta',{drawings:d}).then(function(res){
    if(btn) btn.innerHTML='<i class="fas fa-floppy-disk" style="color:#0d9268"></i> Simpan';
    if(res.success){
      _showSaveNote('✓ '+d.length+' disimpan!');
      toast(d.length+' gambar disimpan.','ok');
      closeDrawPanel();
    }else toast('Gagal.','er');
  });
}

function loadDrawings(){
  if(!_lfMap||!_drawnItems) return;

  // ✅ GANTI
  apiGet('getGambarPeta').then(function(res){
    if(!res.success||!res.data||!res.data.length) return;
    _drawnItems.clearLayers(); _drawnMeta={};
    res.data.forEach(function(d){
      try{
        var gj=JSON.parse(d.geojson),w=d.warna||'#1e6fd9',isLine=gj.geometry&&gj.geometry.type==='LineString';
        var opts=isLine
          ?{color:w,weight:3,opacity:.9,dashArray:'6 4'}
          :{color:w,weight:2,fillColor:w,fillOpacity:.18,opacity:.9};
        var lyr=L.geoJSON(gj,{style:opts});
        lyr.eachLayer(function(sub){
          _drawnItems.addLayer(sub);
          var lid=L.Util.stamp(sub),tipe=isLine?'polyline':'polygon';
          var msr=d.measurement||_getMsr(sub,tipe);
          _drawnMeta[lid]={nama:d.nama||'',ket:d.ket||'',warna:w,tipe:tipe,measurement:msr};
          if(d.nama){_bindDrawnPopup(sub,d.nama,d.ket,w,tipe,msr);_bindMsrTooltip(sub,tipe);}
        });
      }catch(e){}
    });
    toast(res.data.length+' gambar dimuat.','ok');
  });
}

function _showSaveNote(msg){
  var el=G('lf-save-note'); if(!el) return;
  el.textContent=msg; el.classList.add('show');
  setTimeout(function(){el.classList.remove('show');},2800);
}

// ══════════════════════════════════════════════════════════════════════════════
//  MODAL EDIT LAYER
// ══════════════════════════════════════════════════════════════════════════════
function openLayerModal(){ om('mlayer'); _loadLayerList(); }

function _loadLayerList(){
  var body=G('layer-list-body');
  if(body) body.innerHTML='<div class="empty"><i class="fas fa-spinner fa-spin"></i><p>Memuat...</p></div>';

  // ✅ GANTI
  apiGet('getLayerPeta').then(function(res){
    _layerData=res.data||[];
    _renderLayerList();
  }).catch(function(e){
    if(body) body.innerHTML='<div class="empty"><i class="fas fa-circle-xmark" style="color:var(--red)"></i><p>'+esc(e.message)+'</p></div>';
  });
}

function _renderLayerList(){
  var body=G('layer-list-body'); if(!body) return;
  if(!_layerData.length){body.innerHTML='<div class="empty"><i class="fas fa-layer-group"></i><p>Belum ada layer.</p></div>';return;}
  body.innerHTML=_layerData.map(function(layer){
    var sd=getSimbolDef(layer.simbol),ck=rcSet(layer);
    return '<div class="layer-list-item'+(layer.aktif?'':' inactive')+'">'
      +'<div class="layer-item-ico" style="background:'+(layer.warna||sd.warna)+'22;color:'+(layer.warna||sd.warna)+'"><i class="fas '+sd.ico+'"></i></div>'
      +'<div class="layer-item-info"><div class="layer-item-name">'+esc(layer.nama)+'</div><div class="layer-item-sub">'+sd.label+' · '+(layer.aktif?'<span style="color:var(--green)">Aktif</span>':'<span style="color:var(--muted)">Nonaktif</span>')+'</div></div>'
      +'<div class="layer-item-acts">'
        +'<button class="ag-btn" style="background:'+(layer.aktif?'var(--greenl)':'var(--bg)')+';color:'+(layer.aktif?'var(--green)':'var(--muted)')+'" onclick="toggleLayerAktifUI(rcGet(\''+ck+'\'))"><i class="fas '+(layer.aktif?'fa-eye':'fa-eye-slash')+'"></i></button>'
        +'<button class="ag-btn ag-edit" onclick="openLayerForm(rcGet(\''+ck+'\'))"><i class="fas fa-pen"></i></button>'
        +'<button class="ag-btn ag-del" onclick="konfirmHapusLayer(rcGet(\''+ck+'\')._ri)"><i class="fas fa-trash"></i></button>'
      +'</div></div>';
  }).join('');
}

function toggleLayerAktifUI(layer){
  if(!layer) return;

  // ✅ GANTI
  apiPost('toggleLayerAktif',{ri:layer._ri,aktif:!layer.aktif}).then(function(res){
    if(res.success){toast(layer.aktif?'Nonaktif.':'Aktif.','ok');_loadLayerList();}
    else toast('Gagal.','er');
  });
}

function konfirmHapusLayer(ri){ _layerDelRi=ri; G('mbtnhpsLayer').onclick=function(){doHapusLayer();}; om('mconfLayer'); }

function doHapusLayer(){
  if(!_layerDelRi) return;
  cm('mconfLayer');

  // ✅ GANTI
  apiPost('deleteLayerPeta',{ri:_layerDelRi}).then(function(res){
    if(res.success){
      toast('Layer dihapus.','ok');
      _loadLayerList();
      G('layer-form-wrap').innerHTML='<div class="empty" style="padding:40px 10px"><i class="fas fa-hand-pointer" style="font-size:1.5rem;opacity:.14;display:block;margin-bottom:8px"></i><p style="font-size:.72rem">Pilih layer untuk diedit.</p></div>';
    }else toast('Gagal.','er');
  });
}

function openLayerForm(layer){
  _layerFormRow=layer;
  _selectedSimbol=(layer&&layer.simbol)||'rute';
  _selectedWarna=(layer&&layer.warna)||'#1e6fd9';
  var fwrap=G('layer-form-wrap'); if(!fwrap) return;
  fwrap.innerHTML=''
    +'<p style="font-size:.67rem;font-weight:800;color:var(--mid);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">'+(layer?'Edit Layer':'Tambah Layer Baru')+'</p>'
    +'<div class="fgrp"><label class="flbl">Nama Layer <span class="req">*</span></label><input class="fctl" id="lf-nama" value="'+esc(layer?layer.nama:'')+'"></div>'
    +'<div class="fgrp"><label class="flbl">Simbol</label><div class="mlayer-simbol-grid">'
    +SIMBOL_DEF.map(function(s){return '<button class="msimbol-btn'+(s.id===_selectedSimbol?' on':'')+'" onclick="selectSimbol(\''+s.id+'\')" id="sbtn-'+s.id+'"><i class="fas '+s.ico+' simbol-ico"></i>'+s.label+'</button>';}).join('')
    +'</div></div>'
    +'<div class="fgrp"><label class="flbl">Warna</label><div class="color-swatches">'
    +WARNA_PRESET.map(function(w){return '<div class="color-swatch'+(w===_selectedWarna?' on':'')+'" style="background:'+w+'" onclick="selectWarna(\''+w+'\')" data-warna="'+w+'"></div>';}).join('')
    +'</div><div style="display:flex;align-items:center;gap:7px"><input type="color" id="lf-warna-inp" value="'+_selectedWarna+'" oninput="selectWarnaCustom(this.value)" style="width:34px;height:28px;border:none;border-radius:5px;cursor:pointer;background:none"><span id="lf-warna-lbl" style="font-size:.68rem;font-family:var(--mono);color:var(--mid)">'+_selectedWarna+'</span></div></div>'
    +'<div class="fgrp"><label class="flbl">Koordinat</label>'
    +'<button type="button" style="width:100%;margin-bottom:6px;display:flex;align-items:center;justify-content:center;gap:6px;padding:7px 10px;border:1.5px dashed var(--teal);border-radius:8px;background:transparent;color:var(--teal);font-size:.7rem;font-weight:700;cursor:pointer;font-family:var(--font)" onclick="openLayerModal_pickCoord()"><i class="fas fa-crosshairs"></i> Klik Lokasi di Peta</button>'
    +'</div>'
    +'<div class="frow"><div class="fcol"><label class="flbl">Latitude <span class="req">*</span></label><input class="fctl" id="lf-lat" placeholder="-7.8635" value="'+esc(layer?(layer.lat||''):'')+'"></div>'
    +'<div class="fcol"><label class="flbl">Longitude <span class="req">*</span></label><input class="fctl" id="lf-lng" placeholder="111.4625" value="'+esc(layer?(layer.lng||''):'')+'"></div></div>'
    +'<div class="fgrp"><label class="flbl">Keterangan</label><textarea class="fctl" id="lf-ket" rows="3">'+esc(layer?layer.ket:'')+'</textarea></div>'
    +(layer?'<div class="fgrp" style="display:flex;align-items:center;gap:7px"><input type="checkbox" id="lf-aktif" style="width:15px;height:15px;accent-color:var(--green)" '+(layer.aktif?'checked':'')+'><label for="lf-aktif" style="font-size:.76rem;font-weight:600;color:var(--text);cursor:pointer">Layer Aktif</label></div>':'')
    +'<div style="display:flex;gap:6px;margin-top:4px"><button class="bp" style="flex:1" onclick="submitLayerForm()"><i class="fas fa-save"></i> '+(layer?'Perbarui':'Simpan')+'</button><button class="bg2" onclick="cancelLayerForm()"><i class="fas fa-times"></i></button></div>';
}

function selectSimbol(id){
  _selectedSimbol=id;
  document.querySelectorAll('.msimbol-btn').forEach(function(b){b.classList.remove('on');});
  var btn=G('sbtn-'+id); if(btn) btn.classList.add('on');
  selectWarna(getSimbolDef(id).warna);
}

function selectWarna(w){
  _selectedWarna=w;
  document.querySelectorAll('.color-swatch').forEach(function(s){s.classList.toggle('on',s.dataset.warna===w);});
  var i=G('lf-warna-inp'); if(i) i.value=w;
  var l=G('lf-warna-lbl'); if(l) l.textContent=w;
}

function selectWarnaCustom(w){
  _selectedWarna=w;
  document.querySelectorAll('.color-swatch').forEach(function(s){s.classList.remove('on');});
  var l=G('lf-warna-lbl'); if(l) l.textContent=w;
}

function cancelLayerForm(){
  _layerFormRow=null;
  var f=G('layer-form-wrap');
  if(f) f.innerHTML='<div class="empty" style="padding:40px 10px"><i class="fas fa-hand-pointer" style="font-size:1.5rem;opacity:.14;display:block;margin-bottom:8px"></i><p style="font-size:.72rem">Pilih layer di kiri untuk diedit,<br>atau klik Tambah untuk layer baru.</p></div>';
}

function submitLayerForm(){
  var nama=(G('lf-nama')||{}).value||'',lat=(G('lf-lat')||{}).value||'',lng=(G('lf-lng')||{}).value||'';
  if(!nama.trim()){toast('Nama wajib diisi.','er');return;}
  if(!lat||!lng){toast('Koordinat wajib diisi.','er');return;}
  if(isNaN(parseFloat(lat))||isNaN(parseFloat(lng))){toast('Koordinat tidak valid.','er');return;}
  var aktifEl=G('lf-aktif');
  var payload={
    nama:nama,simbol:_selectedSimbol,warna:_selectedWarna,
    lat:parseFloat(lat),lng:parseFloat(lng),
    ket:(G('lf-ket')||{}).value||'',
    aktif:aktifEl?aktifEl.checked:true
  };
  if(_layerFormRow) payload._ri=_layerFormRow._ri;
  var action=_layerFormRow?'updateLayerPeta':'addLayerPeta';
  _lfShowLoad('Menyimpan...');

  // ✅ GANTI
  apiPost(action,payload).then(function(res){
    _lfHideLoad();
    if(res.success){
      toast(_layerFormRow?'Layer diperbarui.':'Layer ditambahkan.','ok');
      _loadLayerList();
      cancelLayerForm();
      refreshLeaflet();
    }else toast('Gagal: '+(res.message||''),'er');
  });
}