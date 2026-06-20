import { getDb } from './database';
import { Shoe, NewShoe } from '../types';

export async function addShoe(input: NewShoe): Promise<number> {
  const db = getDb();
  const result = await db.runAsync(
    `INSERT INTO shoes
      (name, brand, category, photo_uri, purchase_date, price, target_distance, retired, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    input.name.trim(),
    input.brand,
    input.category,
    input.photo_uri,
    input.purchase_date,
    input.price,
    input.target_distance,
    new Date().toISOString(),
  );
  return result.lastInsertRowId;
}

export async function getShoes(filter: 'active' | 'retired' | 'all' = 'active'): Promise<Shoe[]> {
  const db = getDb();
  const where =
    filter === 'active' ? 'WHERE retired = 0' :
    filter === 'retired' ? 'WHERE retired = 1' : '';
  return db.getAllAsync<Shoe>(`SELECT * FROM shoes ${where} ORDER BY created_at DESC`);
}

export async function getShoe(id: number): Promise<Shoe | null> {
  const db = getDb();
  const row = await db.getFirstAsync<Shoe>('SELECT * FROM shoes WHERE id = ?', id);
  return row ?? null;
}

export async function setShoeRetired(id: number, retired: boolean): Promise<void> {
  const db = getDb();
  await db.runAsync('UPDATE shoes SET retired = ? WHERE id = ?', retired ? 1 : 0, id);
}

export async function deleteShoe(id: number): Promise<void> {
  const db = getDb();
  await db.runAsync('DELETE FROM shoes WHERE id = ?', id);
}
