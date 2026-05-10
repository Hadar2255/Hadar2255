import { parseIntent } from './ai.js';
import { addItem, listItems, markDone, removeItem, clearItems } from './db.js';
import { formatList, HELP_TEXT } from './formatter.js';

const BOT_NAME = process.env.BOT_NAME || 'בוט';

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

export async function handleMessage(sock, msg) {
  if (!msg.message || msg.key.fromMe) return;

  const groupJid = msg.key.remoteJid;
  if (!groupJid?.endsWith('@g.us')) return;

  const text = extractText(msg);
  if (!text || !isAddressed(text, msg, sock)) return;

  const userInput = stripAddress(text);
  if (!userInput) {
    await sock.sendMessage(groupJid, { text: HELP_TEXT });
    return;
  }

  const sender = msg.key.participant || msg.key.remoteJid;

  let parsed;
  try {
    parsed = await parseIntent(userInput);
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

function runIntent(parsed, { groupJid, sender }) {
  const { intent, items = [], query, when, reply: aiReply } = parsed;

  switch (intent) {
    case 'ADD_SHOPPING': {
      if (!items.length) return 'מה להוסיף לרשימת הקניות? 🛒';
      for (const item of items) {
        addItem({ groupJid, type: 'shopping', content: item, createdBy: sender });
      }
      return `🛒 הוספתי לרשימת הקניות:\n• ${items.join('\n• ')}`;
    }

    case 'GET_SHOPPING':
      return formatList('רשימת קניות', listItems({ groupJid, type: 'shopping' }), '🛒');

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
      for (const item of items) {
        addItem({ groupJid, type: 'task', content: item, dueAt: when, createdBy: sender });
      }
      const suffix = when ? ` עד ${new Date(when).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}` : '';
      return `✅ הוספתי למשימות:\n• ${items.join('\n• ')}${suffix}`;
    }

    case 'GET_TASKS':
      return formatList('המשימות שלנו', listItems({ groupJid, type: 'task' }), '✅');

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
      for (const item of items) {
        addItem({ groupJid, type: 'event', content: item, dueAt: when, createdBy: sender });
      }
      const suffix = when ? ` — ${new Date(when).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}` : '';
      return `📅 רשמתי בלו"ז:\n• ${items.join('\n• ')}${suffix}`;
    }

    case 'GET_SCHEDULE':
      return formatList('לוח זמנים', listItems({ groupJid, type: 'event' }), '📅');

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
