import { createPool } from '@vercel/postgres';

// Deteksi koneksi dengan prioritas prefix SIPEDAS_DRAF_ seperti di dashboard Anda
const connectionString =
  process.env.SIPEDAS_DRAF_POSTGRES_URL ||
  process.env.SIPEDAS_DRAF_DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;

const pool = createPool({
  connectionString: connectionString
});

export async function initDb() {
  if (!connectionString) {
    console.warn('CRITICAL: No Database Connection String found in environment variables! Check Vercel Dashboard.');
  }
  try {
    await pool.sql`
      CREATE TABLE IF NOT EXISTS sip_drafts (
        id VARCHAR(100) PRIMARY KEY,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        danru TEXT,
        laporan TEXT,
        fotos JSONB,
        exif_meta JSONB,
        jumlah_foto INTEGER
      );
    `;
    console.log('[initDb] sip_drafts table ready.');
  } catch (error) {
    console.error('[initDb] Error creating table:', error);
    throw error;
  }
}

export async function saveDraftPg(
  draftId: string,
  timestamp: string,
  danru: string,
  laporan: string,
  fotos: any[],
  exifMeta: any[]
) {
  await initDb();
  const fotosJson = JSON.stringify(fotos);
  const exifMetaJson = JSON.stringify(exifMeta);
  const jumlahFoto = fotos.length;

  try {
    await pool.sql`
      INSERT INTO sip_drafts (id, timestamp, danru, laporan, fotos, exif_meta, jumlah_foto)
      VALUES (${draftId}, ${timestamp}, ${danru}, ${laporan}, ${fotosJson}::jsonb, ${exifMetaJson}::jsonb, ${jumlahFoto})
      ON CONFLICT (id) DO UPDATE SET
        timestamp = EXCLUDED.timestamp,
        danru = EXCLUDED.danru,
        laporan = EXCLUDED.laporan,
        fotos = EXCLUDED.fotos,
        exif_meta = EXCLUDED.exif_meta,
        jumlah_foto = EXCLUDED.jumlah_foto;
    `;
  } catch (error) {
    console.error('[saveDraftPg] Error saving draft:', error);
    throw error;
  }
}

export async function appendDraftFotoPg(draftId: string, foto: any, exifMeta: any) {
  const fJson = JSON.stringify([foto]);
  const mJson = JSON.stringify([exifMeta]);

  try {
    await pool.sql`
      UPDATE sip_drafts 
      SET 
        fotos = fotos || ${fJson}::jsonb,
        exif_meta = exif_meta || ${mJson}::jsonb,
        jumlah_foto = jumlah_foto + 1
      WHERE id = ${draftId};
    `;
  } catch (error) {
    console.error('[appendDraftFotoPg] Error appending foto:', error);
    throw error;
  }
}

export async function listDraftsPg() {
  await initDb();
  try {
    const { rows } = await pool.sql`
      SELECT id, timestamp, danru, laporan, jumlah_foto 
      FROM sip_drafts 
      ORDER BY timestamp DESC;
    `;

    return rows.map(r => {
      const teks = String(r.laporan || '');
      return {
        draftId: String(r.id),
        timestamp: new Date(r.timestamp).toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }),
        danru: String(r.danru || '—'),
        jumlahFoto: Number(r.jumlah_foto || 0),
        teksPreview: teks.length > 80 ? teks.slice(0, 80) + '…' : teks
      };
    });
  } catch (error) {
    console.error('[listDraftsPg] Error fetching drafts:', error);
    throw error;
  }
}

export async function getDraftPg(draftId: string) {
  try {
    const { rows } = await pool.sql`
      SELECT id, timestamp, danru, laporan, fotos, exif_meta, jumlah_foto 
      FROM sip_drafts 
      WHERE id = ${draftId};
    `;
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('[getDraftPg] Error getting draft:', error);
    throw error;
  }
}

export async function deleteDraftPg(draftId: string) {
  try {
    await pool.sql`
      DELETE FROM sip_drafts WHERE id = ${draftId};
    `;
  } catch (error) {
    console.error('[deleteDraftPg] Error deleting draft:', error);
    throw error;
  }
}
