import { getDb } from './database';
import { WearLog, WearLogPhoto, NewWearLog } from '../types';

export async function addWearLog(input: NewWearLog): Promise<number> {
  const db = getDb();
  let logId = 0;
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `INSERT INTO wear_logs (shoe_id, date, distance, memo, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      input.shoe_id,
      input.date,
      input.distance,
      input.memo,
      new Date().toISOString(),
    );
    logId = result.lastInsertRowId;
    for (const uri of input.photo_uris) {
      await db.runAsync(
        'INSERT INTO wear_log_photos (wear_log_id, photo_uri) VALUES (?, ?)',
        logId,
        uri,
      );
    }
  });
  return logId;
}

export async function getWearLogs(): Promise<WearLog[]> {
  const db = getDb();
  return db.getAllAsync<WearLog>(
    'SELECT * FROM wear_logs ORDER BY date DESC, created_at DESC',
  );
}

export async function getWearLogsForShoe(shoeId: number): Promise<WearLog[]> {
  const db = getDb();
  return db.getAllAsync<WearLog>(
    'SELECT * FROM wear_logs WHERE shoe_id = ? ORDER BY date DESC, created_at DESC',
    shoeId,
  );
}

export async function getWearLog(id: number): Promise<WearLog | null> {
  const db = getDb();
  const row = await db.getFirstAsync<WearLog>('SELECT * FROM wear_logs WHERE id = ?', id);
  return row ?? null;
}

export async function getPhotosForLog(logId: number): Promise<WearLogPhoto[]> {
  const db = getDb();
  return db.getAllAsync<WearLogPhoto>(
    'SELECT * FROM wear_log_photos WHERE wear_log_id = ? ORDER BY id ASC',
    logId,
  );
}

export async function deleteWearLog(id: number): Promise<void> {
  const db = getDb();
  await db.runAsync('DELETE FROM wear_logs WHERE id = ?', id);
}
