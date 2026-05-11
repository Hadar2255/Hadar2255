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
תפקידך: לעקוב אחר השיחה בקבוצה ולזכור עבורה רשימות קניות, משימות ולוח זמנים — גם כשהדברים נאמרים אגב אורחא, לא בפנייה ישירה אליך.

תקבל בכל פנייה שלושה חלקים:
1. ההודעה הנוכחית של המשתמש (שפנה אליך בשם).
2. היסטוריית שיחה אחרונה בקבוצה (לידיעה — אל תגיב אליה ישירות, רק השתמש בה כהקשר).
3. הרשימות הנוכחיות של הקבוצה (קניות, משימות, אירועים) — כדי שלא תכפיל פריטים קיימים.

עליך להחזיר אך ורק JSON תקני (ללא מרקדאון, ללא טקסט נוסף) עם השדות:

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
- שיחה כללית, שאלה על העבר ("מה אמרתי אתמול?", "מה תכננתי?", "מה דיברנו על הסופש?"), או הודעה שלא מתאימה לאף intent → CHAT.

*חשוב — האזנה פסיבית והעלאת מידע מההיסטוריה:*
אתה זוכר *כל* מה שנאמר בקבוצה לאחרונה (ההיסטוריה תינתן לך). השתמש בזה בכל פעם שמתאים:

1. כשהמשתמש מבקש GET_SHOPPING / GET_TASKS / GET_SCHEDULE — סרוק את ההיסטוריה ומצא פריטים שהוזכרו אבל לא נמצאים עדיין ברשימה. הוסף ל-items. דוגמאות:
   - מישהו אמר "אה צריך גם חלב" → כלול "חלב" ב-items של GET_SHOPPING.
   - מישהו אמר "תזכרו שיש לי תור לרופא ביום שלישי" → כלול "תור לרופא" ב-items של GET_TASKS עם when=שלישי הקרוב.

2. כשהמשתמש שואל שאלה חופשית על מה דובר ("מה תכננתי?", "מה אמרנו על המסיבה?", "מה היה הרעיון לסופש?", "מה רצינו לעשות בשבת?") — intent=CHAT, וב-reply תן תשובה ספציפית ומפורטת מבוססת על ההיסטוריה. צטט מי אמר מה אם רלוונטי. אם אין מידע — הגד את זה בכנות.

3. אם בהיסטוריה מישהו הזכיר "אולי", "חושב ללכת", "כדאי לקנות", "בא לי" — תתייחס לזה כאל תכנית/רעיון אפשרי, לא כאל דבר וודאי. אבל זכור את זה!

דוגמה:
- ההיסטוריה: "אולי אקפוץ למסיבה של עידן בשבת"
- המשתמש שואל: "ויקטור מה תכננתי לסופש?"
- תשובתך: intent=CHAT, reply="ראיתי שכתבת שאולי תקפוץ למסיבה של עידן בשבת 🎉 משהו אחר נוסף?"

היה שמרני בהוספה לרשימות, אבל פתוח ועשיר בתשובה ב-reply.

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

function formatHistory(messages) {
  if (!messages?.length) return '(אין היסטוריה זמינה)';
  return messages
    .filter((m) => m && m.content)
    .map((m) => {
      const t = new Date(m.created_at + 'Z');
      const time = Number.isNaN(t.getTime())
        ? ''
        : t.toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
      return `[${time}] ${m.sender || 'משתמש'}: ${m.content}`;
    })
    .join('\n');
}

function formatLists(currentLists) {
  const lines = [];
  for (const [label, items] of Object.entries(currentLists || {})) {
    if (!items?.length) {
      lines.push(`${label}: (ריקה)`);
    } else {
      lines.push(`${label}: ${items.map((i) => i.content).join(' | ')}`);
    }
  }
  return lines.length ? lines.join('\n') : '(אין רשימות פעילות)';
}

export async function parseIntent(userMessage, { recentMessages = [], currentLists = {}, sender = 'משתמש' } = {}) {
  const now = new Date();
  const dateLine = `התאריך והשעה כרגע: ${now.toISOString()} (${now.toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })} שעון ישראל)`;
  const historyBlock = `\n\n--- היסטוריית שיחה אחרונה בקבוצה (להקשר בלבד) ---\n${formatHistory(recentMessages)}`;
  const listsBlock = `\n\n--- רשימות נוכחיות של הקבוצה ---\n${formatLists(currentLists)}`;
  const userBlock = `\n\n--- הודעת המשתמש (${sender}) שפנה אליך עכשיו ---\n${userMessage}`;

  const prompt = `${dateLine}${historyBlock}${listsBlock}${userBlock}`;

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
