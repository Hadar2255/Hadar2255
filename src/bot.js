import { parseIntent } from './ai.js';
import {
  addItem,
  listItems,
  markDone,
  removeItem,
  clearItems,
  recordMessage,
  recentMessages,
} from './db.js';
import { formatList, HELP_TEXT } from './formatter.js';

const BOT_NAME = process.env.BOT_NAME || 'ויקטור';

function extractText(msg) {
  const m = msg.message;
  return (
    m?.conversation ||
    m?.extendedTextMessage?.text ||
    m?.imageMessage?.caption ||
    m?.videoMessage?.caption ||
    ''
  );
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

  // Only respond when addressed by name / mention / reply.
  if (!isAddressed(text, msg, sock)) return;

  const userInput = stripAddress(text);
  if (!userInput) {
    await sock.sendMessage(groupJid, { text: HELP_TEXT });
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
      recentMessages: recentMessages({ groupJid, limit: 30 }),
      currentLists,
      sender: name,
    });
  } catch (err) {
    console.error('AI error:', err);
    await sock.sendMessage(groupJid, {
      text: 'מצטער, יש לי בעיה רגעית להבין. נסו שוב בעוד רגע 🙏',
    });
    return;
  }

  const reply = runIntent(parsed, { groupJid, sender });
  if (reply) {
    await sock.sendMessage(groupJid, { text: reply });
  }
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
      if (!items.length) return 'מה להוסיף לרשימת הקניות? 🛒';
      const added = dedupeAdd({ groupJid, type: 'shopping', items, sender });
      if (!added.length) return '🛒 הפריטים כבר נמצאים ברשימה.';
      return `🛒 הוספתי לרשימת הקניות:\n• ${added.join('\n• ')}`;
    }

    case 'GET_SHOPPING': {
      const picked = dedupeAdd({ groupJid, type: 'shopping', items, sender });
      const list = listItems({ groupJid, type: 'shopping' });
      const note = picked.length
        ? `\n\n_שמתי לב שהוזכרו בקבוצה לאחרונה: ${picked.join(', ')} — הוספתי._`
        : '';
      return formatList('רשימת קניות', list, '🛒') + note;
    }

    case 'REMOVE_SHOPPING': {
      const target = query || items[0];
      if (!target) return 'מה להסיר מרשימת הקניות?';
      const n = removeItem({ groupJid, type: 'shopping', query: target });
      return n ? `✂️ הסרתי "${target}" מרשימת הקניות.` : `לא מצאתי "${target}" ברשימה.`;
    }

    case 'CLEAR_SHOPPING': {
      const n = clearItems({ groupJid, type: 'shopping' });
      return `🗑️ ניקיתי את רשימת הקניות (${n} פריטים).`;
    }

    case 'ADD_TASK': {
      if (!items.length) return 'איזו משימה להוסיף? ✅';
      const added = dedupeAdd({ groupJid, type: 'task', items, sender, dueAt: when });
      if (!added.length) return '✅ המשימות כבר רשומות.';
      const suffix = when ? ` עד ${new Date(when).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}` : '';
      return `✅ הוספתי למשימות:\n• ${added.join('\n• ')}${suffix}`;
    }

    case 'GET_TASKS': {
      const picked = dedupeAdd({ groupJid, type: 'task', items, sender, dueAt: when });
      const list = listItems({ groupJid, type: 'task' });
      const note = picked.length
        ? `\n\n_מההיסטוריה הוספתי: ${picked.join(', ')}._`
        : '';
      return formatList('המשימות שלנו', list, '✅') + note;
    }

    case 'DONE_TASK': {
      const target = query || items[0];
      if (!target) return 'איזו משימה סיימתם?';
      const n = markDone({ groupJid, type: 'task', query: target });
      return n ? `🎉 כל הכבוד! סימנתי "${target}" כבוצעה.` : `לא מצאתי משימה כזו.`;
    }

    case 'REMOVE_TASK': {
      const target = query || items[0];
      if (!target) return 'איזו משימה להסיר?';
      const n = removeItem({ groupJid, type: 'task', query: target });
      return n ? `✂️ הסרתי "${target}" מהמשימות.` : `לא מצאתי משימה כזו.`;
    }

    case 'ADD_EVENT': {
      if (!items.length) return 'איזה אירוע לרשום? 📅';
      const added = dedupeAdd({ groupJid, type: 'event', items, sender, dueAt: when });
      if (!added.length) return '📅 כבר רשום בלו"ז.';
      const suffix = when ? ` — ${new Date(when).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}` : '';
      return `📅 רשמתי בלו"ז:\n• ${added.join('\n• ')}${suffix}`;
    }

    case 'GET_SCHEDULE': {
      const picked = dedupeAdd({ groupJid, type: 'event', items, sender, dueAt: when });
      const list = listItems({ groupJid, type: 'event' });
      const note = picked.length
        ? `\n\n_מההיסטוריה הוספתי: ${picked.join(', ')}._`
        : '';
      return formatList('לוח זמנים', list, '📅') + note;
    }

    case 'REMOVE_EVENT': {
      const target = query || items[0];
      if (!target) return 'איזה אירוע להסיר?';
      const n = removeItem({ groupJid, type: 'event', query: target });
      return n ? `✂️ הסרתי "${target}" מהלו"ז.` : `לא מצאתי אירוע כזה.`;
    }

    case 'HELP':
      return HELP_TEXT;

    case 'CHAT':
    default:
      return aiReply || 'אני כאן 👋';
  }
}
