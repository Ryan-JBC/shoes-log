export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS shoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  photo_uri TEXT,
  purchase_date TEXT,
  price REAL,
  target_distance REAL,
  retired INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wear_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shoe_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  distance REAL,
  memo TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (shoe_id) REFERENCES shoes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wear_log_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wear_log_id INTEGER NOT NULL,
  photo_uri TEXT NOT NULL,
  FOREIGN KEY (wear_log_id) REFERENCES wear_logs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wear_logs_shoe ON wear_logs(shoe_id);
CREATE INDEX IF NOT EXISTS idx_photos_log ON wear_log_photos(wear_log_id);
`;
