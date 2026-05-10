import sqliteWasm from 'node-sqlite3-wasm';
const { Database } = sqliteWasm;
import path from 'node:path';
import fs from 'node:fs';
import { encrypt, decrypt } from './crypto.js';

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

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_jid TEXT NOT NULL,
    sender TEXT,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_messages_group_time
    ON messages(group_jid, created_at);
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

const findByIdStmt = db.prepare(
  `UPDATE items SET status = 'done'
   WHERE id = ? AND group_jid = ?`
);

const clearStmt = db.prepare(
  `DELETE FROM items WHERE group_jid = ? AND type = ?`
);

const activeIdsStmt = db.prepare(
  `SELECT id, content FROM items
   WHERE group_jid = ? AND type = ? AND status = 'active'`
);

const allIdsStmt = db.prepare(
  `SELECT id, content FROM items
   WHERE group_jid = ? AND type = ?`
);

const updateDoneByIdStmt = db.prepare(
  `UPDATE items SET status = 'done' WHERE id = ?`
);

const deleteByIdStmt = db.prepare(`DELETE FROM items WHERE id = ?`);

const deleteRecentMsgsStmt = db.prepare(
  `DELETE FROM messages
   WHERE group_jid = ?
     AND created_at >= datetime('now', ?)`
);

const deleteAllMsgsStmt = db.prepare(
  `DELETE FROM messages WHERE group_jid = ?`
);

const insertMsgStmt = db.prepare(
  `INSERT INTO messages (group_jid, sender, content) VALUES (?, ?, ?)`
);

const recentMsgStmt = db.prepare(
  `SELECT sender, content, created_at FROM messages
   WHERE group_jid = ?
   ORDER BY id DESC
   LIMIT ?`
);

const pruneMsgStmt = db.prepare(
  `DELETE FROM messages
   WHERE group_jid = ? AND id NOT IN (
     SELECT id FROM messages WHERE group_jid = ? ORDER BY id DESC LIMIT ?
   )`
);

export function addItem({ groupJid, type, content, dueAt = null, createdBy = null }) {
  return insertStmt.run(groupJid, type, encrypt(content), dueAt, createdBy).lastInsertRowid;
}

export function listItems({ groupJid, type, status = 'active' }) {
  const rows = listStmt.all(groupJid, type, status);
  return rows.map((r) => ({ ...r, content: decrypt(r.content) }));
}

function findMatchingIds({ groupJid, type, query, activeOnly = false }) {
  const stmt = activeOnly ? activeIdsStmt : allIdsStmt;
  const rows = stmt.all(groupJid, type);
  const q = String(query).trim().toLowerCase();
  return rows
    .filter((r) => decrypt(r.content)?.toLowerCase().includes(q))
    .map((r) => r.id);
}

export function markDone({ groupJid, type, query }) {
  if (!query) return 0;
  const numericId = parseInt(String(query).trim(), 10);
  if (!Number.isNaN(numericId) && String(numericId) === String(query).trim()) {
    return findByIdStmt.run(numericId, groupJid).changes;
  }
  const ids = findMatchingIds({ groupJid, type, query, activeOnly: true });
  let count = 0;
  for (const id of ids) count += updateDoneByIdStmt.run(id).changes;
  return count;
}

export function removeItem({ groupJid, type, query }) {
  if (!query) return 0;
  const ids = findMatchingIds({ groupJid, type, query, activeOnly: false });
  let count = 0;
  for (const id of ids) count += deleteByIdStmt.run(id).changes;
  return count;
}

export function clearItems({ groupJid, type }) {
  return clearStmt.run(groupJid, type).changes;
}

export function recordMessage({ groupJid, sender, content }) {
  if (!groupJid || !content) return;
  insertMsgStmt.run(groupJid, sender || null, encrypt(content));
  pruneMsgStmt.run(groupJid, groupJid, 500);
}

export function recentMessages({ groupJid, limit = 30 }) {
  const rows = recentMsgStmt.all(groupJid, limit);
  return rows.reverse().map((r) => ({ ...r, content: decrypt(r.content) }));
}

export function forgetRecentMessages({ groupJid, minutes = 5 }) {
  const offset = `-${Math.max(1, minutes)} minutes`;
  return deleteRecentMsgsStmt.run(groupJid, offset).changes;
}

export function forgetAllMessages({ groupJid }) {
  return deleteAllMsgsStmt.run(groupJid).changes;
}

export default db;
