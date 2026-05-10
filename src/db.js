import { Database } from 'node-sqlite3-wasm';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = process.env.DB_PATH || './data/bot.db';
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_jid TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    due_at TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_items_group_type
    ON items(group_jid, type, status);
`);

const insertStmt = db.prepare(
  `INSERT INTO items (group_jid, type, content, due_at, created_by)
   VALUES (?, ?, ?, ?, ?)`
);

const listStmt = db.prepare(
  `SELECT * FROM items
   WHERE group_jid = ? AND type = ? AND status = ?
   ORDER BY COALESCE(due_at, created_at) ASC`
);

const findFuzzyStmt = db.prepare(
  `UPDATE items SET status = 'done'
   WHERE group_jid = ? AND type = ? AND status = 'active'
     AND content LIKE ?`
);

const findByIdStmt = db.prepare(
  `UPDATE items SET status = 'done'
   WHERE id = ? AND group_jid = ?`
);

const clearStmt = db.prepare(
  `DELETE FROM items WHERE group_jid = ? AND type = ?`
);

const removeFuzzyStmt = db.prepare(
  `DELETE FROM items
   WHERE group_jid = ? AND type = ? AND content LIKE ?`
);

export function addItem({ groupJid, type, content, dueAt = null, createdBy = null }) {
  return insertStmt.run(groupJid, type, content, dueAt, createdBy).lastInsertRowid;
}

export function listItems({ groupJid, type, status = 'active' }) {
  return listStmt.all(groupJid, type, status);
}

export function markDone({ groupJid, type, query }) {
  if (!query) return 0;
  const id = parseInt(String(query).trim(), 10);
  if (!Number.isNaN(id) && String(id) === String(query).trim()) {
    return findByIdStmt.run(id, groupJid).changes;
  }
  return findFuzzyStmt.run(groupJid, type, `%${query}%`).changes;
}

export function removeItem({ groupJid, type, query }) {
  if (!query) return 0;
  return removeFuzzyStmt.run(groupJid, type, `%${query}%`).changes;
}

export function clearItems({ groupJid, type }) {
  return clearStmt.run(groupJid, type).changes;
}

export default db;
