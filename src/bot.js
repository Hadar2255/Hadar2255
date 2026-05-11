import { think, extractPassive } from './ai.js';
import {
  addItem,
  listItems,
  markDone,
  removeItem,
  clearItems,
  recordMessage,
  recentMessages,
  forgetRecentMessages,
  forgetAllMessages,
} from './db.js';
import { ENCRYPTION_ENABLED } from './crypto.js';
import { HELP_TEXT } from './formatter.js';

const BOT_NAME = process.env.BOT_NAME || 'ויקטור';
const PRIVATE_MODE = process.env.BOT_PRIVATE_MODE === '1';

function unwrap(m) {
  if (!m) return null;
  if (m.ephemeralMessage) return unwrap(m.ephemeralMessage.message);
  if (m.viewOnceMessage) return unwrap(m.viewOnceMessage.message);
  if (m.viewOnceMessageV2) return unwrap(m.viewOnceMessageV2.message);
  if (m.viewOnceMessageV2Extension) return unwrap(m.viewOnceMessageV2Extension.message);
  if (m.documentWithCaptionMessage) return unwrap(m.documentWithCaptionMessage.message);
  if (m.editedMessage?.message?.protocolMessage?.editedMessage)
    return unwrap(m.editedMessage.message.protocolMessage.editedMessage);
  return m;
}

function extractText(msg) {
  const m = unwrap(msg.message);
  const candidate =
    m?.conversation ||
    m?.extendedTextMessage?.text ||
    m?.imageMessage?.caption ||
    m?.videoMessage?.caption ||
    '';
  return typeof candidate === 'string' ? candidate.trim() : '';
}

function botPhoneId(sock) {
  const id = sock.user?.id || '';
  return id.split(':')[0].split('@')[0];
}

function isAddressed(text, msg, sock) {
  if (!text) return false;
  const lower = text.trim().toLowerCase();
  const name = BOT_NAME.toLowerCase();

  if (lower.startsWith(name + ' ') || lower.startsWith(name + ',') || lower === name) {
    return true;
  }

  const phone = botPhoneId(sock);
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (mentioned.some((jid) => jid.startsWith(phone))) return true;

  const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
  if (quoted && quoted.startsWith(phone)) return true;

  return false;
}

function stripAddress(text) {
  let t = text.trim();
  if (t.toLowerCase().startsWith(BOT_NAME.toLowerCase())) {
    t = t.slice(BOT_NAME.length).replace(/^[\s,:.\-،]+/, '').trim();
  }
  return t;
}

function senderName(msg) {
  if (msg.pushName) return msg.pushName;
  const jid = msg.key.participant || msg.key.remoteJid || '';
  const num = jid.split('@')[0];
  return num ? `…${num.slice(-4)}` : 'משתמש';
}

async function reactTo(sock, msg, emoji) {
  if (!emoji) return;
  try {
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: emoji, key: msg.key },
    });
  } catch (err) {
    console.warn('reaction failed:', err?.message);
  }
}

async function applyResponse(sock, msg, response) {
  if (!response) return;
  if (response.react) await reactTo(sock, msg, response.react);
  if (response.text && response.text.trim()) {
    await sock.sendMessage(msg.key.remoteJid, { text: response.text });
  }
}

const TYPE_MAP = { shopping: 'shopping', tasks: 'task', events: 'event' };

function makeExecutor({ groupJid, sender }) {
  return (name, args = {}) => {
    switch (name) {
      case 'add_to_list': {
        const type = TYPE_MAP[args.list_type] || args.list_type;
        const existing = listItems({ groupJid, type }).map((i) => i.content.trim().toLowerCase());
        const added = [];
        for (const raw of args.items || []) {
          const item = String(raw).trim();
          if (!item) continue;
          if (existing.includes(item.toLowerCase())) continue;
          addItem({ groupJid, type, content: item, dueAt: args.when || null, createdBy: sender });
          existing.push(item.toLowerCase());
          added.push(item);
        }
        return { ok: true, added, already_existed: (args.items || []).length - added.length };
      }
      case 'get_list': {
        const type = TYPE_MAP[args.list_type] || args.list_type;
        const items = listItems({ groupJid, type }).map((i) => ({
          id: i.id,
          content: i.content,
          due_at: i.due_at,
        }));
        return { ok: true, items, count: items.length };
      }
      case 'remove_from_list': {
        const type = TYPE_MAP[args.list_type] || args.list_type;
        const n = removeItem({ groupJid, type, query: args.query });
        return { ok: n > 0, removed_count: n };
      }
      case 'clear_list': {
        const type = TYPE_MAP[args.list_type] || args.list_type;
        const n = clearItems({ groupJid, type });
        return { ok: true, cleared_count: n };
      }
      case 'mark_done': {
        const n = markDone({ groupJid, type: 'task', query: args.query });
        return { ok: n > 0, done_count: n };
      }
      case 'forget_history': {
        if (args.minutes) {
          const n = forgetRecentMessages({ groupJid, minutes: args.minutes });
          return { ok: true, forgotten_count: n };
        }
        const n = forgetAllMessages({ groupJid });
        return { ok: true, forgotten_count: n };
      }
      default:
        return { ok: false, error: `Unknown function: ${name}` };
    }
  };
}

function emojiForActions(actions) {
  if (!actions?.length) return null;
  const last = actions[actions.length - 1];
  switch (last.name) {
    case 'add_to_list':
      return last.result?.added?.length
        ? { shopping: '🛒', tasks: '✅', events: '📅' }[last.args?.list_type] || '👍'
        : null;
    case 'remove_from_list':
      return last.result?.removed_count > 0 ? '✂️' : null;
    case 'clear_list':
      return '🗑️';
    case 'mark_done':
      return last.result?.done_count > 0 ? '🎉' : null;
    case 'forget_history':
      return '🧹';
    case 'get_list':
      return null;
    default:
      return null;
  }
}

export async function handleMessage(sock, msg) {
  if (!msg.message || msg.key.fromMe) return;

  const groupJid = msg.key.remoteJid;
  if (!groupJid?.endsWith('@g.us')) return;

  const text = extractText(msg);
  if (!text) return;

  const sender = msg.key.participant || msg.key.remoteJid;
  const name = senderName(msg);

  recordMessage({ groupJid, sender: name, content: text });

  const addressed = isAddressed(text, msg, sock);
  if (!addressed) {
    // Passive listening — analyse the message and add to a list if it's actionable.
    if (!PRIVATE_MODE) {
      const passive = await extractPassive(text);
      if (passive?.type && passive.items?.length) {
        const type = TYPE_MAP[passive.type] || passive.type;
        const existing = listItems({ groupJid, type }).map((i) => i.content.trim().toLowerCase());
        const added = [];
        for (const raw of passive.items) {
          const item = String(raw).trim();
          if (!item) continue;
          if (existing.includes(item.toLowerCase())) continue;
          addItem({ groupJid, type, content: item, dueAt: passive.when || null, createdBy: sender });
          existing.push(item.toLowerCase());
          added.push(item);
        }
        if (added.length) {
          const emoji = { shopping: '🛒', task: '✅', event: '📅' }[passive.type] || '👍';
          console.log(`🔧 passive: added to ${type}: ${added.join(', ')}`);
          await reactTo(sock, msg, emoji);
          return;
        }
      }
    }
    await reactTo(sock, msg, '👍');
    return;
  }

  const userInput = stripAddress(text);
  if (!userInput) {
    await applyResponse(sock, msg, { text: HELP_TEXT });
    return;
  }

  const localResponse = handleLocalCommand(userInput, { groupJid });
  if (localResponse !== null) {
    await applyResponse(sock, msg, localResponse);
    return;
  }

  const currentLists = {
    'רשימת קניות': listItems({ groupJid, type: 'shopping' }),
    'משימות פתוחות': listItems({ groupJid, type: 'task' }),
    'אירועים בלוז': listItems({ groupJid, type: 'event' }),
  };

  const executor = makeExecutor({ groupJid, sender: name });

  let result;
  try {
    result = await think(userInput, {
      recentMessages: PRIVATE_MODE ? [] : recentMessages({ groupJid, limit: 30 }),
      currentLists,
      sender: name,
      executor,
    });
  } catch (err) {
    console.error('AI error:', err);
    await applyResponse(sock, msg, {
      text: 'מצטער, יש לי בעיה רגעית להבין. נסו שוב בעוד רגע 🙏',
    });
    return;
  }

  const reactEmoji = emojiForActions(result.actions);
  await applyResponse(sock, msg, { react: reactEmoji, text: result.text });
}

function handleLocalCommand(text, { groupJid }) {
  const t = text.trim();

  if (/^(אבטחה|פרטיות|סטטוס\s+אבטחה)$/i.test(t)) {
    const enc = ENCRYPTION_ENABLED ? '✅ הצפנת AES-256-GCM פעילה' : '⚠️ הצפנה לא מוגדרת (אין BOT_ENCRYPTION_KEY)';
    const priv = PRIVATE_MODE
      ? '✅ מצב פרטי: לא נשלחת היסטוריה ל־Gemini'
      : 'ℹ️ מצב רגיל: 30 הודעות אחרונות נשלחות ל־Gemini כשפונים אליי';
    return { text: `🔐 *סטטוס אבטחה*\n\n${enc}\n${priv}\n\nההודעות נשמרות מקומית בלבד.` };
  }

  if (/^(דיבאג|debug|סטטוס\s+האזנה|מה\s+שמעת)$/i.test(t)) {
    const recent = recentMessages({ groupJid, limit: 10 });
    if (!recent.length) {
      return { text: '🔍 לא שמעתי עדיין הודעות בקבוצה הזו (או שמחקת את ההיסטוריה).' };
    }
    const lines = recent.map((r, i) => `${i + 1}. *${r.sender || 'משתמש'}*: ${String(r.content).slice(0, 80)}`);
    return { text: `🔍 *10 ההודעות האחרונות ששמעתי*\n\n${lines.join('\n')}` };
  }

  return null;
}
