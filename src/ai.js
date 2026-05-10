import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Missing GEMINI_API_KEY in environment. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const BOT_NAME = process.env.BOT_NAME || 'ויקטור';

const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_PROMPT = `אתה ${BOT_NAME}, עוזר חכם וידידותי בקבוצת ווצאפ בעברית.
תפקידך: לזכור עבור הקבוצה רשימות קניות, משימות ולוח זמנים, ולענות בצורה ידידותית.

קיבלת הודעה ממשתמש בקבוצה. עליך להחזיר אך ורק JSON תקני (ללא מרקדאון, ללא טקסט נוסף) עם השדות:

{
  "intent": "ADD_SHOPPING" | "GET_SHOPPING" | "REMOVE_SHOPPING" | "CLEAR_SHOPPING" |
            "ADD_TASK" | "GET_TASKS" | "DONE_TASK" | "REMOVE_TASK" |
            "ADD_EVENT" | "GET_SCHEDULE" | "REMOVE_EVENT" |
            "HELP" | "CHAT",
  "items": ["פריט1", "פריט2"],
  "query": "טקסט לחיפוש פריט קיים (כשמסירים או מסמנים כבוצע)",
  "when": "ISO 8601 datetime או null אם לא הוזכר זמן",
  "reply": "תשובה ידידותית בעברית למשתמש (1-3 משפטים, אפשר אימוג'י)"
}

הנחיות:
- אם המשתמש מציין כמה פריטים יחד ("חלב, ביצים, לחם" / "פיצה ושוקו") — פצל לפריטים נפרדים במערך items.
- אבחן בין רשימת קניות (מוצרים שצריך לקנות), משימות (פעולות לבצע) ואירועי לוח זמנים (פגישות, מפגשים בזמן ספציפי).
- "צריך לקנות X" / "תוסיף לקניות" / "תרשום ש..." → ADD_SHOPPING
- "מה ברשימת הקניות" / "מה צריך לקנות" → GET_SHOPPING
- "תזכיר לי X" / "תוסיף משימה" / "צריך לעשות X" → ADD_TASK
- "מה המשימות" / "מה צריך לעשות" → GET_TASKS
- "סיימתי X" / "ביצעתי X" → DONE_TASK (עם query=X)
- "קבענו פגישה ביום X בשעה Y" / "תרשום בלוז" → ADD_EVENT (עם when ב-ISO)
- "מה הלו"ז" / "מה קבענו" / "מה יש לנו לסופש" → GET_SCHEDULE
- "מה אתה יודע לעשות" / "עזרה" → HELP
- שיחה כללית או הודעה לא ברורה → CHAT (עם reply ידידותי)
- אם הוזכר תאריך יחסי (מחר, ביום שישי, סופ"ש), פתור אותו לפי התאריך הנוכחי שיופיע בהקשר.
- ב-reply דבר בגוף ראשון, חם וידידותי, השתמש באימוג'י מתאים.

החזר רק JSON, ללא הסברים נוספים.`;

const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
  systemInstruction: SYSTEM_PROMPT,
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.3,
  },
});

export async function parseIntent(userMessage) {
  const now = new Date();
  const context = `התאריך והשעה כרגע: ${now.toISOString()} (${now.toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })} שעון ישראל)`;
  const prompt = `${context}\n\nהודעת המשתמש: ${userMessage}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  try {
    const parsed = JSON.parse(text);
    if (!parsed.intent) parsed.intent = 'CHAT';
    if (!Array.isArray(parsed.items)) parsed.items = [];
    return parsed;
  } catch (err) {
    console.error('Failed to parse AI JSON:', text);
    return {
      intent: 'CHAT',
      items: [],
      reply: 'מצטער, לא הבנתי. אפשר לנסח שוב? 🤔',
    };
  }
}
