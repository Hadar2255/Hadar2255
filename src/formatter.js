const BOT_NAME = process.env.BOT_NAME || 'ויקטור';

function formatDateHe(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('he-IL', {
    timeZone: 'Asia/Jerusalem',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatList(title, items, emoji = '📋') {
  if (!items.length) {
    return `${emoji} *${title}*\n\nאין פריטים כרגע. ✨`;
  }
  const lines = items.map((it, i) => {
    const date = it.due_at ? `  _(${formatDateHe(it.due_at)})_` : '';
    return `${i + 1}. ${it.content}${date}`;
  });
  return `${emoji} *${title}*\n\n${lines.join('\n')}\n\n_סה"כ: ${items.length}_`;
}

export const HELP_TEXT = `🤖 *היי! אני ${BOT_NAME}, העוזר של הקבוצה.*

אני זוכר עבורכם:
🛒 *רשימת קניות* — ${'״'}${BOT_NAME} תוסיף לקניות חלב, ביצים ולחם${'״'}, ${'״'}${BOT_NAME} מה ברשימת הקניות?${'״'}
✅ *משימות* — ${'״'}${BOT_NAME} תזכיר לקבוע תור לרופא${'״'}, ${'״'}${BOT_NAME} מה המשימות?${'״'}
📅 *לוח זמנים* — ${'״'}${BOT_NAME} קבענו ארוחת ערב ביום שישי ב־20:00${'״'}, ${'״'}${BOT_NAME} מה הלו"ז לסופש?${'״'}

טיפים נוספים:
• ${'״'}סיימתי X${'״'} — מסמן משימה כבוצעה
• ${'״'}תמחק מהקניות חלב${'״'} — מסיר פריט
• ${'״'}תנקה את רשימת הקניות${'״'} — מנקה הכל

פנו אליי בשם *${BOT_NAME}* או ענו לאחת מההודעות שלי 😊`;
