import { parseIntent } from './ai.js';
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
import { formatList, HELP_TEXT } from './formatter.js';

const BOT_NAME = process.env.BOT_NAME || 'ויקטור';
const PRIVATE_MODE = process.env.BOT_PRIVATE_MODE === '1';

const FORGET_RE = /^(שכח|תשכח|מחק)(\s+את\s+)?(.+)?$/i;

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
  if (response.text) {
    await sock.sendMessage(msg.key.remoteJid, { text: response.text });
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

  // Always listen — store every group message for later context.
  recordMessage({ groupJid, sender: name, content: text });

  const addressed = isAddressed(text, msg, sock);
  if (!addressed) {
    // Passive listening: acknowledge with a thumbs-up reaction on the message.
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

  let parsed;
  try {
    parsed = await parseIntent(userInput, {
      recentMessages: PRIVATE_MODE ? [] : recentMessages({ groupJid, limit: 30 }),
      currentLists,
      sender: name,
    });
  } catch (err) {
    console.error('AI error:', err);
    await applyResponse(sock, msg, {
      text: 'מצטער, יש לי בעיה רגעית להבין. נסו שוב בעוד רגע 🙏',
    });
    return;
  }

  const response = runIntent(parsed, { groupJid, sender });
  await applyResponse(sock, msg, response);
}

function handleLocalCommand(text, { groupJid }) {
  const t = text.trim();

  if (/^(אבטחה|פרטיות|סטטוס\s+אבטחה)$/i.test(t)) {
    const enc = ENCRYPTION_ENABLED ? '✅ הצפנת AES-256-GCM פעילה' : '⚠️ הצפנה לא מוגדרת (אין BOT_ENCRYPTION_KEY)';
    const priv = PRIVATE_MODE
      ? '✅ מצב פרטי: לא נשלחת היסטוריה ל־Gemini'
      : 'ℹ️ מצב רגיל: 30 הודעות אחרונות נשלחות ל־Gemini כשפונים אליי';
    return { text: `🔐 *סטטוס אבטחה*\n\n${enc}\n${priv}\n\nההודעות נשמרות מקומית בלבד. אפשר לומר "${BOT_NAME} שכח את ההודעות האחרונות" כדי למחוק היסטוריה.` };
  }

  if (/^(דיבאג|debug|סטטוס\s+האזנה|מה\s+שמעת)$/i.test(t)) {
    const recent = recentMessages({ groupJid, limit: 10 });
    if (!recent.length) {
      return { text: '🔍 לא שמעתי עדיין הודעות בקבוצה הזו (או שמחקת את ההיסטוריה).' };
    }
    const lines = recent.map((r, i) => `${i + 1}. *${r.sender || 'משתמש'}*: ${String(r.content).slice(0, 80)}`);
    return { text: `🔍 *10 ההודעות האחרונות ששמעתי*\n\n${lines.join('\n')}` };
  }

  const m = t.match(FORGET_RE);
  if (m) {
    const what = (m[3] || '').trim().toLowerCase();
    if (!what || /הכל|הכול|כל ההודעות|הכל היסטור/.test(what)) {
      forgetAllMessages({ groupJid });
      return { react: '🧹' };
    }
    const minMatch = what.match(/(\d+)\s*דקות?/);
    const minutes = minMatch ? parseInt(minMatch[1], 10) : 5;
    forgetRecentMessages({ groupJid, minutes });
    return { react: '🧹' };
  }

  return null;
}

function dedupeAdd({ groupJid, type, items, sender, dueAt = null }) {
  const existing = listItems({ groupJid, type }).map((i) => i.content.trim().toLowerCase());
  const added = [];
  for (const raw of items || []) {
    const item = String(raw).trim();
    if (!item) continue;
    if (existing.includes(item.toLowerCase())) continue;
    addItem({ groupJid, type, content: item, dueAt, createdBy: sender });
    existing.push(item.toLowerCase());
    added.push(item);
  }
  return added;
}

function runIntent(parsed, { groupJid, sender }) {
  const { intent, items = [], query, when, reply: aiReply } = parsed;

  switch (intent) {
    case 'ADD_SHOPPING': {
      if (!items.length) return { text: 'מה להוסיף לרשימת הקניות? 🛒' };
      dedupeAdd({ groupJid, type: 'shopping', items, sender });
      return { react: '🛒' };
    }

    case 'GET_SHOPPING': {
      const picked = dedupeAdd({ groupJid, type: 'shopping', items, sender });
      const list = listItems({ groupJid, type: 'shopping' });
      const note = picked.length
        ? `\n\n_שמתי לב שהוזכרו בקבוצה לאחרונה: ${picked.join(', ')} — הוספתי._`
        : '';
      return { text: formatList('רשימת קניות', list, '🛒') + note };
    }

    case 'REMOVE_SHOPPING': {
      const target = query || items[0];
      if (!target) return { text: 'מה להסיר מרשימת הקניות?' };
      const n = removeItem({ groupJid, type: 'shopping', query: target });
      return n ? { react: '✂️' } : { text: `לא מצאתי "${target}" ברשימה.` };
    }

    case 'CLEAR_SHOPPING': {
      clearItems({ groupJid, type: 'shopping' });
      return { react: '🗑️' };
    }

    case 'ADD_TASK': {
      if (!items.length) return { text: 'איזו משימה להוסיף? ✅' };
      dedupeAdd({ groupJid, type: 'task', items, sender, dueAt: when });
      return { react: '✅' };
    }

    case 'GET_TASKS': {
      const picked = dedupeAdd({ groupJid, type: 'task', items, sender, dueAt: when });
      const list = listItems({ groupJid, type: 'task' });
      const note = picked.length
        ? `\n\n_מההיסטוריה הוספתי: ${picked.join(', ')}._`
        : '';
      return { text: formatList('המשימות שלנו', list, '✅') + note };
    }

    case 'DONE_TASK': {
      const target = query || items[0];
      if (!target) return { text: 'איזו משימה סיימתם?' };
      const n = markDone({ groupJid, type: 'task', query: target });
      return n ? { react: '🎉' } : { text: 'לא מצאתי משימה כזו.' };
    }

    case 'REMOVE_TASK': {
      const target = query || items[0];
      if (!target) return { text: 'איזו משימה להסיר?' };
      const n = removeItem({ groupJid, type: 'task', query: target });
      return n ? { react: '✂️' } : { text: 'לא מצאתי משימה כזו.' };
    }

    case 'ADD_EVENT': {
      if (!items.length) return { text: 'איזה אירוע לרשום? 📅' };
      dedupeAdd({ groupJid, type: 'event', items, sender, dueAt: when });
      return { react: '📅' };
    }

    case 'GET_SCHEDULE': {
      const picked = dedupeAdd({ groupJid, type: 'event', items, sender, dueAt: when });
      const list = listItems({ groupJid, type: 'event' });
      const note = picked.length
        ? `\n\n_מההיסטוריה הוספתי: ${picked.join(', ')}._`
        : '';
      return { text: formatList('לוח זמנים', list, '📅') + note };
    }

    case 'REMOVE_EVENT': {
      const target = query || items[0];
      if (!target) return { text: 'איזה אירוע להסיר?' };
      const n = removeItem({ groupJid, type: 'event', query: target });
      return n ? { react: '✂️' } : { text: 'לא מצאתי אירוע כזה.' };
    }

    case 'HELP':
      return { text: HELP_TEXT };

    case 'CHAT':
    default:
      return { text: aiReply || 'אני כאן 👋' };
  }
}
