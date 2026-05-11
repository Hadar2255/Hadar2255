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

// node-sqlite3-wasm prepared statements can get stuck in an error state after
// a failed run (e.g. NOT NULL violation), and subsequent .run() calls then
// throw "Could not reset statement prior to binding new values". To stay
// resilient we prepare-execute-finalize per call. Slight perf cost, much
// stronger guarantees.

function runOnce(sql, params = []) {
  let stmt = null;
  try {
    stmt = db.prepare(sql);
    return stmt.run(params);
  } catch (err) {
    console.warn(
      '❌ SQL run failed:',
      sql.slice(0, 80).replace(/\s+/g, ' '),
      '| params:', params.map((p) => (typeof p === 'string' && p.length > 40 ? p.slice(0, 40) + '…' : p)),
      '| err:', err?.message
    );
    return { changes: 0, lastInsertRowid: 0 };
  } finally {
    try { stmt?.finalize?.(); } catch {}
  }
}

function allOnce(sql, params = []) {
  let stmt = null;
  try {
    stmt = db.prepare(sql);
    return stmt.all(params) || [];
  } catch (err) {
    console.warn('SQL select failed:', sql.slice(0, 60).replace(/\s+/g, ' '), '-', err?.message);
    return [];
  } finally {
    try { stmt?.finalize?.(); } catch {}
  }
}

export function addItem({ groupJid, type, content, dueAt = null, createdBy = null }) {
  const enc = encrypt(content);
  const r = runOnce(
    `INSERT INTO items (group_jid, type, content, due_at, created_by) VALUES (?, ?, ?, ?, ?)`,
    [groupJid, type, enc, dueAt, createdBy]
  );
  console.log(`📝 addItem(type=${type}): "${content}" → id=${r.lastInsertRowid}, changes=${r.changes}`);
  return r.lastInsertRowid;
}

export function listItems({ groupJid, type, status = 'active' }) {
  const rows = allOnce(
    `SELECT * FROM items
     WHERE group_jid = ? AND type = ? AND status = ?
     ORDER BY COALESCE(due_at, created_at) ASC`,
    [groupJid, type, status]
  );
  console.log(`📋 listItems(type=${type}, status=${status}) → ${rows.length} rows`);
  return rows.map((r) => ({ ...r, content: decrypt(r.content) }));
}

function findMatchingIds({ groupJid, type, query, activeOnly = false }) {
  const sql = activeOnly
    ? `SELECT id, content FROM items WHERE group_jid = ? AND type = ? AND status = 'active'`
    : `SELECT id, content FROM items WHERE group_jid = ? AND type = ?`;
  const rows = allOnce(sql, [groupJid, type]);
  const q = String(query).trim().toLowerCase();
  return rows
    .filter((r) => decrypt(r.content)?.toLowerCase().includes(q))
    .map((r) => r.id);
}

export function markDone({ groupJid, type, query }) {
  if (!query) return 0;
  const numericId = parseInt(String(query).trim(), 10);
  if (!Number.isNaN(numericId) && String(numericId) === String(query).trim()) {
    return runOnce(
      `UPDATE items SET status = 'done' WHERE id = ? AND group_jid = ?`,
      [numericId, groupJid]
    ).changes;
  }
  const ids = findMatchingIds({ groupJid, type, query, activeOnly: true });
  let count = 0;
  for (const id of ids) {
    count += runOnce(`UPDATE items SET status = 'done' WHERE id = ?`, [id]).changes;
  }
  return count;
}

export function removeItem({ groupJid, type, query }) {
  if (!query) return 0;
  const ids = findMatchingIds({ groupJid, type, query, activeOnly: false });
  let count = 0;
  for (const id of ids) {
    count += runOnce(`DELETE FROM items WHERE id = ?`, [id]).changes;
  }
  return count;
}

export function clearItems({ groupJid, type }) {
  return runOnce(`DELETE FROM items WHERE group_jid = ? AND type = ?`, [groupJid, type]).changes;
}

export function recordMessage({ groupJid, sender, content }) {
  if (!groupJid || typeof content !== 'string' || !content.trim()) return;
  let stored;
  try {
    stored = encrypt(content);
  } catch (err) {
    console.warn('encrypt failed in recordMessage:', err?.message);
    return;
  }
  if (typeof stored !== 'string' || !stored) return;
  runOnce(
    `INSERT INTO messages (group_jid, sender, content) VALUES (?, ?, ?)`,
    [groupJid, sender || null, stored]
  );
  runOnce(
    `DELETE FROM messages
     WHERE group_jid = ? AND id NOT IN (
       SELECT id FROM messages WHERE group_jid = ? ORDER BY id DESC LIMIT ?
     )`,
    [groupJid, groupJid, 500]
  );
}

export function recentMessages({ groupJid, limit = 30 }) {
  const rows = allOnce(
    `SELECT sender, content, created_at FROM messages
     WHERE group_jid = ?
     ORDER BY id DESC
     LIMIT ?`,
    [groupJid, limit]
  );
  return rows.reverse().map((r) => ({ ...r, content: decrypt(r.content) }));
}

export function forgetRecentMessages({ groupJid, minutes = 5 }) {
  const offset = `-${Math.max(1, minutes)} minutes`;
  return runOnce(
    `DELETE FROM messages WHERE group_jid = ? AND created_at >= datetime('now', ?)`,
    [groupJid, offset]
  ).changes;
}

export function forgetAllMessages({ groupJid }) {
  return runOnce(`DELETE FROM messages WHERE group_jid = ?`, [groupJid]).changes;
}

export default db;
