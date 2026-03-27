/* ═══════════════════════════════════════════════════════════
   SI-PEDAS Mobile — idb.js
   IndexedDB operations for photo persistence and text drafts
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