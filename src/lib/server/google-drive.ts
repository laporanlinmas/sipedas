import { getDrive } from './google-auth';
import { Readable } from 'stream';

export const FOLDER_UTAMA_ID = process.env.FOLDER_UTAMA_ID || process.env.GOOGLE_DRIVE_FOLDER_ID || '';
export const DEVELOPER_EMAIL = process.env.DEVELOPER_EMAIL || '';
const TZ = 'Asia/Jakarta';

/**
 * Cache for folders (untuk efisiensi)
 */
const _folderCache: Record<string, string> = {};

/**
 * Dapatkan atau buat sub-folder (Mirroring Monitor Sipedas)
 */
export async function getOrCreateFolder(parentFolderId: string, folderName: string): Promise<string> {
  const cacheKey = `${parentFolderId}::${folderName}`;
  if (_folderCache[cacheKey]) return _folderCache[cacheKey];

  const drive = await getDrive();
  const escaped = folderName.replace(/'/g, "\\'");
  const q = `'${parentFolderId}' in parents and name = '${escaped}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

  const res = await drive.files.list({
    q,
    fields: 'files(id, name)',
    spaces: 'drive',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  } as any);

  if (res.data.files && res.data.files.length > 0) {
    const id = res.data.files[0].id!;
    _folderCache[cacheKey] = id;
    return id;
  }

  // Buat baru jika tidak ada
  const folder = await drive.files.create({
    supportsAllDrives: true,
    resource: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId]
    },
    fields: 'id'
  } as any);

  const folderId = folder.data.id!;

  // 1. Beri akses publik (Reader) agar bisa di-preview di web
  await drive.permissions.create({
    fileId: folderId,
    supportsAllDrives: true,
    resource: { role: 'reader', type: 'anyone' }
  } as any);

  // 2. KRUSIAL: Beri akses Writer ke DEVELOPER_EMAIL agar Apps Script (DriveApp/Drive API) bisa masuk
  if (DEVELOPER_EMAIL) {
    try {
      await drive.permissions.create({
        fileId: folderId,
        supportsAllDrives: true,
        resource: { role: 'writer', type: 'user', emailAddress: DEVELOPER_EMAIL }
      } as any);
      console.log(`Folder shared to ${DEVELOPER_EMAIL}: ${folderId}`);
    } catch (e: any) {
      console.warn('Gagal share folder ke developer email:', e.message);
    }
  }

  _folderCache[cacheKey] = folderId;
  return folderId;
}

/**
 * Upload file from base64 (Mirroring Monitor Logic)
 */
export async function uploadFileFromBase64(folderId: string, base64: string, mimeType: string, fileName: string): Promise<string> {
  const drive = await getDrive();
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const buffer = Buffer.from(base64Data, 'base64');

  const file = await drive.files.create({
    supportsAllDrives: true,
    resource: {
      name: fileName,
      parents: [folderId]
    },
    media: {
      mimeType: mimeType || 'image/jpeg',
      body: Readable.from(buffer)
    },
    fields: 'id, webViewLink'
  } as any);

  await drive.permissions.create({
    fileId: file.data.id!,
    supportsAllDrives: true,
    resource: { role: 'reader', type: 'anyone' }
  } as any);

  return `https://drive.google.com/file/d/${file.data.id}/view?usp=sharing`;
}

/**
 * Delete folder
 */
export async function deleteFolder(folderId: string): Promise<void> {
  const drive = await getDrive();
  await drive.files.update({
    fileId: folderId,
    supportsAllDrives: true,
    resource: { trashed: true }
  } as any);
}

export async function deleteFolderPermanent(folderId: string): Promise<void> {
  try {
    const drive = await getDrive();

    const purge = async (id: string) => {
      const children = await drive.files.list({
        q: `'${id}' in parents and trashed = false`,
        fields: 'files(id, mimeType)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        pageSize: 1000,
      } as any);

      const files = children.data.files || [];
      for (const child of files) {
        if (!child.id) continue;
        if (child.mimeType === 'application/vnd.google-apps.folder') {
          await purge(child.id);
        } else {
          await drive.files.delete({ fileId: child.id, supportsAllDrives: true } as any);
        }
      }
      await drive.files.delete({ fileId: id, supportsAllDrives: true } as any);
    };

    await purge(folderId);
  } catch (err: any) {
    console.warn(`[deleteFolderPermanent] Gagal menghapus folder ${folderId}:`, err.message);
    // Tidak lempar error agar process utama tetap jalan (fault tolerant)
  }
}


/**
 * Download as base64
 */
export async function downloadFileAsBase64(fileId: string): Promise<string> {
  const drive = await getDrive();
  const response = await drive.files.get(
    {
      fileId,
      alt: 'media',
      supportsAllDrives: true,
    } as any,
    { responseType: 'arraybuffer' }
  );

  const buffer = Buffer.from(response.data as ArrayBuffer);
  const mimeType = response.headers['content-type'] || 'image/jpeg';
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

/**
 * Format Helpers (Mirroring Monitor Sipedas)
 */
export function formatBulanTahun(d: Date): string {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTanggalPanjang(d: Date): string {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png',
    'image/gif': '.gif', 'image/webp': '.webp', 'image/heic': '.heic',
    'image/heif': '.heif', 'image/bmp': '.bmp'
  };
  return map[(mime || '').toLowerCase()] || '.jpg';
}
