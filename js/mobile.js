/* ═══════════════════════════════════════════════════════════
   SI-PEDAS Mobile — client.js
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
   INDEXEDDB — PERSISTENSI FOTO KAMERA + TEKS LAPORAN
═══════════════════════════════════════════════════════════ */
var _idb = null, IDB_NAME = 'sipedas_cam_v1', IDB_STORE = 'cam_photos';
var IDB_META_STORE = 'app_meta';
var IDB_TEKS_KEY   = 'draft_teks';

function openIDB(cb) {
  if (_idb) { cb(_idb); return; }
  try {
    var req = indexedDB.open(IDB_NAME, 2);
    req.onupgradeneeded = function (e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE))
        db.createObjectStore(IDB_STORE, { keyPath: 'idbKey', autoIncrement: true });
      if (!db.objectStoreNames.contains(IDB_META_STORE))
        db.createObjectStore(IDB_META_STORE);
    };
    req.onsuccess = function (e) { _idb = e.target.result; cb(_idb); };
    req.onerror   = function () { cb(null); };
  } catch (err) { cb(null); }
}

/* ── IDB Meta ───────────────────────────────────────────── */
function idbMetaSet(key, value, cb) {
  openIDB(function(db) {
    if (!db) { cb && cb(); return; }
    try {
      var tx  = db.transaction(IDB_META_STORE, 'readwrite');
      tx.objectStore(IDB_META_STORE).put(value, key);
      tx.oncomplete = function() { cb && cb(); };
    } catch(e) { cb && cb(); }
  });
}
function idbMetaGet(key, cb) {
  openIDB(function(db) {
    if (!db) { cb(null); return; }
    try {
      var tx  = db.transaction(IDB_META_STORE, 'readonly');
      var req = tx.objectStore(IDB_META_STORE).get(key);
      req.onsuccess = function(e) { cb(e.target.result !== undefined ? e.target.result : null); };
      req.onerror   = function()  { cb(null); };
    } catch(e) { cb(null); }
  });
}
function idbMetaDel(key, cb) {
  openIDB(function(db) {
    if (!db) { cb && cb(); return; }
    try {
      var tx = db.transaction(IDB_META_STORE, 'readwrite');
      tx.objectStore(IDB_META_STORE).delete(key);
      tx.oncomplete = function() { cb && cb(); };
    } catch(e) { cb && cb(); }
  });
}

/* ── IDB Foto ───────────────────────────────────────────── */
function idbSavePhoto(foto, cb) {
  openIDB(function (db) {
    if (!db) { cb && cb(null); return; }
    try {
      var tx  = db.transaction(IDB_STORE, 'readwrite');
      var obj = Object.assign({}, foto);
      delete obj.idbKey; obj.processing = false;
      var req = tx.objectStore(IDB_STORE).add(obj);
      req.onsuccess = function (e) { cb && cb(e.target.result); };
      req.onerror   = function ()  { cb && cb(null); };
    } catch (err) { cb && cb(null); }
  });
}
function idbUpdatePhoto(foto, cb) {
  openIDB(function (db) {
    if (!db || !foto.idbKey) { cb && cb(); return; }
    try {
      var tx = db.transaction(IDB_STORE, 'readwrite');
      var obj = Object.assign({}, foto); obj.processing = false;
      tx.objectStore(IDB_STORE).put(obj);
      tx.oncomplete = function () { cb && cb(); };
    } catch (err) { cb && cb(); }
  });
}
function idbDeletePhoto(key, cb) {
  openIDB(function (db) {
    if (!db || key === undefined || key === null) { cb && cb(); return; }
    try {
      var tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(key);
      tx.oncomplete = function () { cb && cb(); };
    } catch (err) { cb && cb(); }
  });
}
function idbLoadAll(cb) {
  openIDB(function (db) {
    if (!db) { cb([]); return; }
    try {
      var tx  = db.transaction(IDB_STORE, 'readonly');
      var req = tx.objectStore(IDB_STORE).getAll();
      req.onsuccess = function (e) { cb(e.target.result || []); };
      req.onerror   = function ()  { cb([]); };
    } catch (err) { cb([]); }
  });
}
function idbClearAll(cb) {
  openIDB(function (db) {
    if (!db) { cb && cb(); return; }
    try {
      var tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).clear();
      tx.oncomplete = function () { cb && cb(); };
    } catch (err) { cb && cb(); }
  });
}

/* ═══════════════════════════════════════════════════════════
   AUTO-SAVE TEKS KE IDB
═══════════════════════════════════════════════════════════ */
var _teksSaveTimer = null;
function onTeksChange() {
  updateChar();
  clearTimeout(_teksSaveTimer);
  _teksSaveTimer = setTimeout(function() {
    var val = document.getElementById('laporan').value;
    idbMetaSet(IDB_TEKS_KEY, val);
  }, 600);
}

/* ═══════════════════════════════════════════════════════════
   HELPER WM
═══════════════════════════════════════════════════════════ */
function getWM(source) { return source === 'camera' ? S.wmCam : S.wmGal; }

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
   FILE INPUT HANDLER
═══════════════════════════════════════════════════════════ */
document.getElementById('fg').addEventListener('change', function (e) { handleFiles(e.target.files, 'gallery'); this.value = ''; });
document.getElementById('fc').addEventListener('change', function (e) { handleFiles(e.target.files, 'camera');  this.value = ''; });

function handleFiles(files, src) {
  var rem = MAX - fotos.length;
  if (rem <= 0) { showAlert('warn','Batas Foto','Maksimal ' + MAX + ' foto.'); return; }
  var toAdd = Math.min(files.length, rem);
  if (files.length > rem)
    showAlert('warn','Batas Terlampaui', files.length + ' foto dipilih, hanya ' + rem + ' slot tersisa. ' + toAdd + ' pertama ditambahkan.');
  for (var i = 0; i < toAdd; i++) {
    (function (file, source) {
      var idx = fotos.length;
      fotos.push({ data:null, mime:file.type, sizeKB:0, compressed:false,
                   processing:true, procLabel:'Membaca file...', source:source,
                   exif:null, exifAddr:null, ts:nowFull(), idbKey:null });
      renderGrid();
      if (source === 'camera') {
        fotos[idx].procLabel = 'Membaca EXIF GPS...'; renderGrid();
        readExif(file, function (exif) {
          fotos[idx].exif = exif;
          if (exif && exif.gps) {
            fotos[idx].procLabel = 'Geocoding nama jalan...'; renderGrid();
            reverseGeocodeForceStreet(exif.gps.lat, exif.gps.lng, function (addr) {
              fotos[idx].exifAddr = addr;
              fotos[idx].procLabel = 'Render WM + QR...'; renderGrid();
              doProcess(file, idx);
            });
          } else {
            fotos[idx].procLabel = 'Render watermark...'; renderGrid();
            doProcess(file, idx);
          }
        });
      } else {
        fotos[idx].procLabel = 'Kompres & watermark...'; renderGrid();
        doProcess(file, idx);
      }
    })(files[i], src);
  }
}

function doProcess(file, idx) {
  var rdr = new FileReader();
  rdr.onload = function (ev) {
    processImage(ev.target.result, file.type, idx, function (res) {
      Object.assign(fotos[idx], res);
      fotos[idx].processing = false;
      if (fotos[idx].source === 'camera') {
        idbSavePhoto(fotos[idx], function (key) {
          if (key !== null && key !== undefined) fotos[idx].idbKey = key;
        });
      }
      renderGrid();
    });
  };
  rdr.readAsDataURL(file);
}

/* ═══════════════════════════════════════════════════════════
   EXIF PARSER
═══════════════════════════════════════════════════════════ */
function readExif(file, cb) {
  var rdr = new FileReader();
  rdr.onload  = function (e) { try { cb(parseExif(new DataView(e.target.result))); } catch (err) { cb(null); } };
  rdr.onerror = function ()  { cb(null); };
  rdr.readAsArrayBuffer(file);
}
function parseExif(dv) {
  if (dv.getUint16(0) !== 0xFFD8) return null;
  var off = 2, len = dv.byteLength;
  while (off < len - 4) {
    if (dv.getUint8(off) !== 0xFF) break;
    var mk = dv.getUint16(off), sl = dv.getUint16(off+2);
    if (mk===0xFFE1 && dv.getUint32(off+4)===0x45786966 && dv.getUint16(off+8)===0x0000)
      return parseTiff(dv, off+10);
    off += 2 + sl;
  }
  return null;
}
function parseTiff(dv, base) {
  var le  = (dv.getUint16(base)===0x4949);
  var r16 = function(o){ return le?dv.getUint16(o,true):dv.getUint16(o,false); };
  var r32 = function(o){ return le?dv.getUint32(o,true):dv.getUint32(o,false); };
  var rStr= function(o,l){ var s=''; for(var i=0;i<l;i++){var c=dv.getUint8(o+i);if(!c)break;s+=String.fromCharCode(c);}return s.trim(); };
  var rRat= function(o){ var n=r32(o),d=r32(o+4); return d?n/d:0; };
  var res={},ifd0=r32(base+4),nE=r16(base+ifd0),exifOff=null,gpsOff=null;
  for(var i=0;i<nE;i++){
    var ep=base+ifd0+2+(i*12),tag=r16(ep),cnt=r32(ep+4),vp=ep+8;
    if(tag===0x8769)exifOff=r32(vp);
    if(tag===0x8825)gpsOff=r32(vp);
    if(tag===0x0132)res.dateTime=rStr(base+r32(vp),cnt);
  }
  if(exifOff){
    var eb=base+exifOff,en=r16(eb);
    for(var j=0;j<en;j++){
      var ep2=eb+2+(j*12),t2=r16(ep2),c2=r32(ep2+4),v2=ep2+8;
      if(t2===0x9003)res.dto=rStr(base+r32(v2),c2);
      if(t2===0x9004)res.dtd=rStr(base+r32(v2),c2);
      if(t2===0x882a)res.tzOff=dv.getInt16(v2,le);
    }
  }
  if(gpsOff){
    var gb=base+gpsOff,gn=r16(gb),gps={};
    for(var k=0;k<gn;k++){
      var gp=gb+2+(k*12),gt=r16(gp),gc=r32(gp+4),gv=gp+8;
      if(gt===1)gps.latRef=String.fromCharCode(dv.getUint8(gv));
      if(gt===2){var lo=base+r32(gv);gps.latD=rRat(lo);gps.latM=rRat(lo+8);gps.latS=rRat(lo+16);}
      if(gt===3)gps.lngRef=String.fromCharCode(dv.getUint8(gv));
      if(gt===4){var lo2=base+r32(gv);gps.lngD=rRat(lo2);gps.lngM=rRat(lo2+8);gps.lngS=rRat(lo2+16);}
    }
    if(gps.latD!==undefined&&gps.lngD!==undefined){
      var lat=gps.latD+gps.latM/60+gps.latS/3600;
      var lng=gps.lngD+gps.lngM/60+gps.lngS/3600;
      if(gps.latRef==='S')lat=-lat;
      if(gps.lngRef==='W')lng=-lng;
      res.gps={lat:lat,lng:lng};
    }
  }
  return Object.keys(res).length?res:null;
}
function fmtExifTime(exif) {
  if(!exif)return nowFull()+' WIB';
  var raw=exif.dto||exif.dtd||exif.dateTime;
  if(!raw)return nowFull()+' WIB';
  var m=/(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/.exec(raw);
  if(!m)return nowFull()+' WIB';
  var tz=exif.tzOff!==undefined?' GMT'+(exif.tzOff>=0?'+':'')+exif.tzOff:' WIB';
  return m[3]+'/'+m[2]+'/'+m[1]+' '+m[4]+':'+m[5]+':'+m[6]+tz;
}

/* ═══════════════════════════════════════════════════════════
   REVERSE GEOCODING
═══════════════════════════════════════════════════════════ */
function reverseGeocodeForceStreet(lat, lng, cb) {
  var done=false;
  var timer=setTimeout(function(){if(!done){done=true;cb({full:'Koordinat: '+lat.toFixed(5)+','+lng.toFixed(5),road:'',parts:[]});}},5000);
  function finish(result){if(done)return;clearTimeout(timer);done=true;cb(result);}
  function buildAddr(road,houseNum,a){
    var parts=[];
    if(road){var r=road;if(houseNum)r+=' No.'+houseNum;parts.push(r);}
    var dukuh=a.hamlet||a.allotments||a.neighbourhood||a.quarter||null;
    if(dukuh&&dukuh!==road)parts.push(dukuh);
    var desa=a.village||a.town||a.suburb||null;if(desa)parts.push(desa);
    var kec=a.subdistrict||a.city_district||null;if(kec)parts.push('Kec. '+kec);
    var kab=a.city||a.county||a.regency||a.municipality||null;if(kab)parts.push(kab);
    if(a.state)parts.push(a.state);parts.push('Indonesia');
    return{full:parts.join(', '),road:road||'',parts:parts};
  }
  function tryZoom(zoom,nextZoom){
    fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat='+lat+'&lon='+lng+'&zoom='+zoom+'&addressdetails=1&namedetails=1&accept-language=id')
      .then(function(r){return r.json();})
      .then(function(d){
        if(done)return;
        if(!d||!d.address){if(nextZoom)tryZoom(nextZoom,null);else finish(buildFallback(lat,lng,null));return;}
        var a=d.address;
        var road=a.road||a.pedestrian||a.footway||a.path||a.cycleway||a.service||a.track||a.living_street||a.motorway||a.trunk||a.primary||a.secondary||a.tertiary||a.unclassified||a.residential||a.highway||null;
        if(!road&&d.namedetails&&d.namedetails.name)road=d.namedetails.name;
        if(!road&&d.display_name){var cand=(d.display_name.split(',')[0]||'').trim();if(cand&&!/^\d+\.?\d*$/.test(cand)&&cand.length>3)road=cand;}
        if(road){finish(buildAddr(road,a.house_number||'',a));}
        else if(nextZoom){tryZoom(nextZoom,null);}
        else{tryOverpass(lat,lng,finish,function(){finish(buildFallback(lat,lng,a));});}
      }).catch(function(){if(done)return;if(nextZoom)tryZoom(nextZoom,null);else finish(buildFallback(lat,lng,null));});
  }
  tryZoom(19,18);
}
function tryOverpass(lat,lng,onSuccess,onFail){
  var r=0.0007;
  var q='[out:json][timeout:4];way["highway"]["name"]('+(lat-r)+','+(lng-r)+','+(lat+r)+','+(lng+r)+');out 1 tags;';
  fetch('https://overpass-api.de/api/interpreter?data='+encodeURIComponent(q))
    .then(function(r){return r.json();})
    .then(function(d){
      if(d&&d.elements&&d.elements.length>0&&d.elements[0].tags&&d.elements[0].tags.name){
        var road=d.elements[0].tags.name;
        onSuccess({full:road+', Ponorogo, Jawa Timur, Indonesia',road:road,parts:[road,'Ponorogo','Jawa Timur','Indonesia']});
      }else{onFail();}
    }).catch(function(){onFail();});
}
function buildFallback(lat,lng,addr){
  if(addr){
    var parts=[];
    var desa=addr.village||addr.town||addr.suburb||null;if(desa)parts.push(desa);
    var kec=addr.subdistrict||addr.city_district||null;if(kec)parts.push('Kec. '+kec);
    var kab=addr.city||addr.county||addr.regency||null;if(kab)parts.push(kab);
    if(addr.state)parts.push(addr.state);parts.push('Indonesia');
    if(parts.length>1)return{full:parts.join(', '),road:'',parts:parts};
  }
  return{full:lat.toFixed(5)+', '+lng.toFixed(5)+', Indonesia',road:'',parts:[]};
}

/* ═══════════════════════════════════════════════════════════
   QR CODE
═══════════════════════════════════════════════════════════ */
function makeQRCanvas(lat,lng,size,cb){
  try{
    var url='https://www.google.com/maps?q='+lat.toFixed(6)+','+lng.toFixed(6);
    var cont=document.getElementById('qr-worker');cont.innerHTML='';
    new QRCode(cont,{text:url,width:size,height:size,colorDark:'#000000',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});
    setTimeout(function(){
      var el=cont.querySelector('canvas')||cont.querySelector('img');
      if(!el){cb(null);return;}
      if(el.tagName==='CANVAS'){cb(el);}
      else{var c=document.createElement('canvas');c.width=size;c.height=size;c.getContext('2d').drawImage(el,0,0,size,size);cb(c);}
    },80);
  }catch(e){cb(null);}
}

/* ═══════════════════════════════════════════════════════════
   IMAGE PROCESSING
═══════════════════════════════════════════════════════════ */
function processImage(dataUrl, mime, idx, callback) {
  var img = new Image();
  img.onload = function () {
    var f=fotos[idx],cvs=document.getElementById('cvs'),ctx=cvs.getContext('2d');
    var w=img.naturalWidth,h=img.naturalHeight,mx=2500;
    if(w>mx||h>mx){if(w>h){h=Math.round(h*mx/w);w=mx;}else{w=Math.round(w*mx/h);h=mx;}}
    cvs.width=w;cvs.height=h;ctx.drawImage(img,0,0,w,h);
    function finalize(qrCvs){
      if(getWM(f.source))drawWM(ctx,w,h,idx,qrCvs);
      var outMime='image/jpeg',q=0.92,raw=cvs.toDataURL(outMime,q),sz=b64sz(raw),comp=false,out=raw;
      if(sz>MAX_B){comp=true;var lo=0.10,hi=q,best=raw;
        for(var it=0;it<14;it++){var mid=(lo+hi)/2,trial=cvs.toDataURL(outMime,mid),tsz=b64sz(trial);
          if(tsz<=MAX_B){best=trial;lo=mid;}else hi=mid;if(hi-lo<0.006)break;}out=best;}
      callback({data:out,mime:outMime,sizeKB:Math.round(b64sz(out)/1024),compressed:comp,ts:f.ts});
    }
    if(f.source==='camera'&&f.exif&&f.exif.gps&&getWM('camera')){
      var qrSz=Math.max(90,Math.min(240,Math.round(Math.min(w,h)*0.16)));
      makeQRCanvas(f.exif.gps.lat,f.exif.gps.lng,qrSz,function(qrCvs){finalize(qrCvs);});
    }else{finalize(null);}
  };
  img.src=dataUrl;
}

/* ═══════════════════════════════════════════════════════════
   WATERMARK RENDERER
═══════════════════════════════════════════════════════════ */
function wrapTxt(ctx,txt,maxW){
  if(!txt)return[];if(ctx.measureText(txt).width<=maxW)return[txt];
  var words=txt.split(/\s+/),lines=[],cur='';
  words.forEach(function(w){var t=cur?cur+' '+w:w;if(ctx.measureText(t).width>maxW&&cur){lines.push(cur);cur=w;}else cur=t;});
  if(cur)lines.push(cur);return lines.slice(0,5);
}
function drawWM(ctx,w,h,idx,qrCvs){
  var f=fotos[idx],isCam=(f.source==='camera'),exif=f.exif;
  var lat=null,lng=null;
  if(isCam&&exif&&exif.gps){lat=exif.gps.lat;lng=exif.gps.lng;}
  else if(S.lat&&S.lng){lat=parseFloat(S.lat);lng=parseFloat(S.lng);}
  var coordStr=(lat!==null&&lng!==null)?'📡 '+lat.toFixed(6)+', '+lng.toFixed(6):'Koordinat tidak tersedia';
  var addrFull=(isCam&&f.exifAddr&&f.exifAddr.full)?f.exifAddr.full:getManualLoc();
  var timeStr=isCam?fmtExifTime(exif):(nowFull()+' WIB');
  var danru=getDanru()||'—';
  var BAR=Math.max(3,Math.round(w*0.006)),PAD=Math.round(w*0.022),PADV=8;
  var LOGO=Math.round(Math.min(w,h)*0.10),QR=qrCvs?Math.max(90,Math.min(240,Math.round(Math.min(w,h)*0.16))):0;
  var QR_PAD=qrCvs?Math.round(PAD*0.6):0;
  var fT=Math.max(11,Math.round(LOGO*0.36)),fB=Math.max(9,Math.round(LOGO*0.30)),fS=Math.max(7,Math.round(fB*0.82));
  var LH=Math.round(fB*1.5),TX=BAR+Math.round(PAD*0.35)+LOGO+Math.round(PAD*0.45);
  var TW=w-TX-PAD-(qrCvs?QR+QR_PAD*2:0);
  ctx.font=fB+'px Arial,sans-serif';
  var addrLines=wrapTxt(ctx,addrFull,TW);
  var nLines=1+1+1+addrLines.length+1;
  var CONTH=PADV+Math.round(fT*1.45)+nLines*LH+PADV;
  var STRPH=Math.max(Math.round(h*0.15),CONTH,qrCvs?QR+PADV*2:0);
  var SY=h-STRPH;
  ctx.save();
  var gr=ctx.createLinearGradient(0,SY,0,h);gr.addColorStop(0,'rgba(2,6,18,0.42)');gr.addColorStop(0.6,'rgba(2,6,18,0.65)');gr.addColorStop(1,'rgba(2,6,18,0.80)');ctx.fillStyle=gr;ctx.fillRect(0,SY,w,STRPH);
  var bg=ctx.createLinearGradient(0,SY,0,h);bg.addColorStop(0,'rgba(41,121,245,0.65)');bg.addColorStop(1,'rgba(26,80,184,0.90)');ctx.fillStyle=bg;ctx.fillRect(0,SY,BAR,STRPH);
  var lx=BAR+Math.round(PAD*0.35),ly=SY+Math.round((STRPH-LOGO)/2);
  var lel=document.getElementById('img-linmas');
  if(lel&&lel.complete&&lel.naturalWidth>0){try{ctx.globalAlpha=0.65;ctx.drawImage(lel,lx,ly,LOGO,LOGO);ctx.globalAlpha=1;}catch(e){}}
  if(qrCvs&&QR>0){
    var qx=w-QR-QR_PAD,qy=SY+Math.round((STRPH-QR)/2) - 25;
    ctx.fillStyle='#ffffff';var qPad=4;ctx.fillRect(qx-qPad,qy-qPad,QR+qPad*2,QR+qPad*2);
    try{ctx.drawImage(qrCvs,qx,qy,QR,QR);}catch(e){}
    ctx.font='bold '+Math.max(7,Math.round(fS*0.82))+'px Arial,sans-serif';ctx.fillStyle='rgba(255,255,255,0.70)';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText('📍 SCAN',qx+QR/2,qy+QR+4);
  }
  ctx.textAlign='left';ctx.textBaseline='top';var tx=TX,ty=SY+PADV;
  ctx.font='800 '+fT+'px Arial,sans-serif';ctx.fillStyle='rgba(255,210,0,0.90)';ctx.fillText('SATLINMAS PEDESTRIAN',tx,ty,TW);ty+=Math.round(fT*1.45);
  ctx.font='700 '+fB+'px Arial,sans-serif';ctx.fillStyle='rgba(255,255,255,0.90)';ctx.fillText('Danru: '+danru,tx,ty,TW);ty+=LH;
  ctx.font='400 '+fB+'px Arial,sans-serif';ctx.fillStyle='rgba(160,210,255,0.90)';ctx.fillText(timeStr,tx,ty,TW);ty+=LH;
  ctx.font='500 '+fB+'px Arial,sans-serif';ctx.fillStyle=(isCam&&f.exifAddr&&f.exifAddr.road)?'rgba(180,248,200,0.90)':'rgba(160,240,200,0.80)';
  addrLines.forEach(function(ln){ctx.fillText(ln,tx,ty,TW);ty+=LH;});
  ctx.font='400 '+fS+'px Arial,sans-serif';ctx.fillStyle='rgba(140,180,220,0.85)';ctx.fillText(coordStr,tx,ty,TW);
  var spF=Math.max(8,Math.round(w*0.024));ctx.font='900 '+spF+'px Arial,sans-serif';ctx.fillStyle='rgba(255,205,0,0.55)';ctx.textAlign='right';ctx.textBaseline='bottom';ctx.fillText('SI-PEDAS',w-Math.round(PAD*0.5),h-Math.round(PAD*0.3),Math.round(w*0.22));
  ctx.font='400 '+Math.round(spF*0.72)+'px Arial,sans-serif';ctx.fillStyle='rgba(255,255,255,0.35)';ctx.fillText('mobile',w-Math.round(PAD*0.5),h-Math.round(PAD*0.3)-spF-2,Math.round(w*0.18));
  ctx.restore();
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

    // Upload satu foto
    var f   = fotos[uploadIdx];
    var pct = 10 + Math.round((uploadIdx / totalFoto) * 70);
    stepProg(1, pct, 'Upload foto ' + (uploadIdx + 1) + ' / ' + totalFoto + '...');

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
      hideLoading(); btn.disabled = false;
      showAlert('error', 'Gagal Upload Foto ' + (uploadIdx + 1), err.message || 'Periksa koneksi dan coba lagi.');
    });
  }

  setTimeout(uploadNext, 300);
}


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

/* Modal draft backdrop click */
document.addEventListener('DOMContentLoaded', function() {
  var dm = document.getElementById('draft-modal');
  if (dm) dm.addEventListener('click', function(e){ if(e.target===this) closeDraftModal(); });
});
