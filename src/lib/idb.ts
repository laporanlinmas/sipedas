const IDB_NAME = 'sipedas_cam_v1';
const IDB_STORE = 'cam_photos';
const IDB_META_STORE = 'app_meta';
export const IDB_TEKS_KEY = 'draft_teks';

let _idb: IDBDatabase | null = null;

export function openIDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (_idb) { resolve(_idb); return; }
    try {
      const req = indexedDB.open(IDB_NAME, 2);
      req.onupgradeneeded = (e: any) => {
        const db = e.target.result as IDBDatabase;
        if (!db.objectStoreNames.contains(IDB_STORE))
          db.createObjectStore(IDB_STORE, { keyPath: 'idbKey', autoIncrement: true });
        if (!db.objectStoreNames.contains(IDB_META_STORE))
          db.createObjectStore(IDB_META_STORE);
      };
      req.onsuccess = (e: any) => { _idb = e.target.result; resolve(_idb); };
      req.onerror = () => { resolve(null); };
    } catch (err) { resolve(null); }
  });
}

export async function idbMetaSet(key: string, value: any): Promise<void> {
  const db = await openIDB();
  if (!db) return;
  try {
    const tx = db.transaction(IDB_META_STORE, 'readwrite');
    tx.objectStore(IDB_META_STORE).put(value, key);
  } catch(e) {}
}

export async function idbMetaGet(key: string): Promise<any> {
  const db = await openIDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_META_STORE, 'readonly');
      const req = tx.objectStore(IDB_META_STORE).get(key);
      req.onsuccess = (e: any) => { resolve(e.target.result !== undefined ? e.target.result : null); };
      req.onerror = () => { resolve(null); };
    } catch(e) { resolve(null); }
  });
}

export async function idbMetaDel(key: string): Promise<void> {
  const db = await openIDB();
  if (!db) return;
  try {
    const tx = db.transaction(IDB_META_STORE, 'readwrite');
    tx.objectStore(IDB_META_STORE).delete(key);
  } catch(e) {}
}

export async function idbSavePhoto(foto: any): Promise<number | null> {
  const db = await openIDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const obj = { ...foto };
      delete obj.idbKey; 
      obj.processing = false;
      const req = tx.objectStore(IDB_STORE).add(obj);
      req.onsuccess = (e: any) => { resolve(e.target.result); };
      req.onerror = () => { resolve(null); };
    } catch (err) { resolve(null); }
  });
}

export async function idbUpdatePhoto(foto: any): Promise<void> {
  const db = await openIDB();
  if (!db || !foto.idbKey) return;
  try {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const obj = { ...foto }; 
    obj.processing = false;
    tx.objectStore(IDB_STORE).put(obj);
  } catch (err) {}
}

export async function idbDeletePhoto(key: number): Promise<void> {
  const db = await openIDB();
  if (!db || key === undefined || key === null) return;
  try {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(key);
  } catch (err) {}
}

export async function idbLoadAll(): Promise<any[]> {
  const db = await openIDB();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).getAll();
      req.onsuccess = (e: any) => { 
        const res = e.target.result || [];
        // Sort by 'order' field if it exists
        res.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        resolve(res); 
      };
      req.onerror = () => { resolve([]); };
    } catch (err) { resolve([]); }
  });
}

export async function idbClearAll(): Promise<void> {
  const db = await openIDB();
  if (!db) return;
  try {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).clear();
  } catch (err) {}
}

export async function idbClearEverything(): Promise<void> {
  const db = await openIDB();
  if (!db) return;
  try {
    const tx = db.transaction([IDB_STORE, IDB_META_STORE], 'readwrite');
    tx.objectStore(IDB_STORE).clear();
    tx.objectStore(IDB_META_STORE).clear();
  } catch (err) {}
}
