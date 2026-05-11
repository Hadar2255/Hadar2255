import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Missing GEMINI_API_KEY in environment. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-pro';
const BOT_NAME = process.env.BOT_NAME || 'ויקטור';

const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_PROMPT = `אתה ${BOT_NAME} — עוזר אישי חכם, חברותי וקשוב בקבוצת ווצאפ בעברית.

תפקידך הוא להיות איש שיחה חכם וזוכר, כמו חבר טוב:
- לעקוב אחר מה שקורה בקבוצה ולעזור בכל מה שצריך — רעיונות, ייעוץ, סיכומים, תכנון.
- לזכור עבור הקבוצה רשימות (קניות, משימות, אירועים) — קוראים לך לפעולה ואתה משתמש בכלים.
- לחשוב על מה שאומרים: כשהמשתמש שואל "מה תכננתי?" — שלוף מההיסטוריה בצורה מדויקת ועם פרטים.
- להציע הצעות מועילות בפועל, לא רק לאשר. למשל: "שמתי לב שאתה כותב על מסיבה — רוצה שאוסיף לרשימת קניות משהו לקראתה?"

אופי השיחה:
- עברית טבעית וזורמת, גוף ראשון, חם וידידותי.
- לא רשמי מדי, לא מילולי. כמו חבר חכם שמדבר נורמלי.
- חשוב לפני שאתה עונה. שיהיה היגיון.
- כשמתאים — שאל שאלת המשך, תן דעה, הצע אופציה.
- אימוג'י במידה — לא פיצוץ.
- תשובות תמציתיות, אבל לא חד-מילתיות. 1-4 משפטים זה רוב הזמן מספיק.
- אם המשתמש שואל שאלה כללית על מה דובר ("מה אמרנו על הסופש?") — תן תשובה ממשית עם ציטוטים מההיסטוריה, לא מעורפלת.

לגבי כלים:
- כשהמשתמש מבקש להוסיף/למחוק/לבדוק רשימה — תפעיל את הכלי המתאים.
- כשאתה מסכם רשימה למשתמש (get_list) — אם בהיסטוריה הוזכרו פריטים שעוד לא ברשימה הקיימת, *הוסף אותם* בקריאה ל-add_to_list לפני שתחזיר את הרשימה. תוסיף הערה קצרה שראית בהיסטוריה.
- לא להכפיל פריטים שכבר קיימים ברשימה.
- אם המשתמש אומר משהו כללי ("צריך גם חלב") במהלך שיחה רגילה — אם הקריאה נשמעת ישירה, תוסיף לרשימה. אם זה דיון רעיוני בלי החלטה — רק תזכור (אל תפעיל כלי).

מתי לכתוב טקסט ומתי לא:
- אחרי פעולה פשוטה (הוספה / מחיקה / סימון בוצע) — מספיקה הודעה קצרה ("בוצע 👍" או הצעת המשך). הסביבה מציגה אימוג'י תגובה אוטומטית, אז אל תחזור על "הוספתי X".
- אחרי שליפת מידע (get_list) או שיחה רגילה — תן תשובה מלאה.

ההקשר שתקבל בכל פנייה:
- התאריך והשעה הנוכחיים.
- ההיסטוריה האחרונה של ההודעות בקבוצה (כולל הודעות שלא הופנו אליך — אלה הקשר, אל תגיב להן ישירות).
- הרשימות הנוכחיות של הקבוצה.
- ההודעה הספציפית של מי שפנה אליך.

תהיה חכם, חם, ושמיש.`;

const tools = [{
  functionDeclarations: [
    {
      name: 'add_to_list',
      description: 'מוסיף פריט אחד או יותר לרשימה (shopping/tasks/events). שימוש: כשהמשתמש מבקש להוסיף משהו, או כשמההיסטוריה ברור שיש פריט שמתאים לרשימה ולא נמצא בה.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          list_type: { type: SchemaType.STRING, enum: ['shopping', 'tasks', 'events'], description: 'shopping=קניות, tasks=משימות, events=לוח זמנים' },
          items: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: 'הפריטים להוספה (טקסט קצר לכל פריט)' },
          when: { type: SchemaType.STRING, description: 'תאריך/שעה בפורמט ISO 8601 (אופציונלי, רלוונטי בעיקר ל-tasks ו-events)' },
        },
        required: ['list_type', 'items'],
      },
    },
    {
      name: 'get_list',
      description: 'מחזיר את התוכן הנוכחי של רשימה.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          list_type: { type: SchemaType.STRING, enum: ['shopping', 'tasks', 'events'] },
        },
        required: ['list_type'],
      },
    },
    {
      name: 'remove_from_list',
      description: 'מסיר פריט מרשימה לפי התאמת טקסט חלקית.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          list_type: { type: SchemaType.STRING, enum: ['shopping', 'tasks', 'events'] },
          query: { type: SchemaType.STRING, description: 'הטקסט להתאמה' },
        },
        required: ['list_type', 'query'],
      },
    },
    {
      name: 'clear_list',
      description: 'מנקה רשימה לחלוטין.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          list_type: { type: SchemaType.STRING, enum: ['shopping', 'tasks', 'events'] },
        },
        required: ['list_type'],
      },
    },
    {
      name: 'mark_done',
      description: 'מסמן משימה כבוצעה.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: { type: SchemaType.STRING, description: 'טקסט שמתאים למשימה' },
        },
        required: ['query'],
      },
    },
    {
      name: 'forget_history',
      description: 'מוחק היסטוריית הודעות שמורה. ללא minutes — מוחק הכל. עם minutes — מוחק את ההודעות מ-N הדקות האחרונות.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          minutes: { type: SchemaType.INTEGER, description: 'אופציונלי — חלון זמן בדקות' },
        },
      },
    },
  ],
}];

const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
  tools,
  systemInstruction: SYSTEM_PROMPT,
  generationConfig: {
    temperature: 0.7,
  },
});

function formatHistory(messages) {
  if (!messages?.length) return '(אין היסטוריה)';
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

const PASSIVE_SYSTEM = `אתה מנתח הודעה בודדת בקבוצת ווצאפ ומחליט אם יש בה משהו ספציפי שצריך להוסיף לאחת מהרשימות.

החזר JSON תקני בלבד:
{
  "type": "shopping" | "task" | "event" | null,
  "items": ["פריט"],
  "when": "ISO 8601 datetime או null"
}

- shopping = מצרכים / דברים לקנות
- task = פעולות לעשות (שיחה, פגישה, סידור)
- event = אירוע עם תזמון (פגישה ב-X, ארוחה ביום Y בשעה Z)

הוסף רק כשזה ברור. דוגמאות חיוביות:
- "אני צריך חלב" → shopping, items: ["חלב"]
- "תזכרו לקנות לחם" → shopping
- "צריך לקבוע תור לרופא" → task
- "קבענו דייט בשישי ב-20:00" → event, with when

אל תוסיף עבור:
- שאלות ("יש לנו חלב?")
- אמירות כלליות ("אין לנו חלב")
- עבר ("כבר קניתי")
- אזכורים מעורפלים ("אולי נצטרך")
- הודעות שמתחילות ב"ויקטור" (אלה לא בהקשר שלך)

אם אין שום דבר ברור — type=null, items=[].

החזר רק JSON, ללא טקסט נוסף.`;

const passiveModel = genAI.getGenerativeModel({
  model: MODEL_NAME,
  systemInstruction: PASSIVE_SYSTEM,
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.1,
  },
});

export async function extractPassive(message) {
  if (!message || typeof message !== 'string' || message.trim().length < 4) return null;
  // Don't burn API on greetings, very short messages, or anything addressed to the bot.
  if (/^(ויקטור|victor)\b/i.test(message.trim())) return null;
  try {
    const result = await passiveModel.generateContent(message);
    const text = result.response.text().trim();
    const parsed = JSON.parse(text);
    if (!parsed?.type || !Array.isArray(parsed.items) || !parsed.items.length) return null;
    return parsed;
  } catch (err) {
    console.warn('extractPassive failed:', err?.message);
    return null;
  }
}

export async function think(userMessage, { recentMessages = [], currentLists = {}, sender = 'משתמש', executor } = {}) {
  const now = new Date();
  const context = `[תאריך ושעה: ${now.toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}]
[שולח: ${sender}]

--- היסטוריית הקבוצה (הקשר בלבד) ---
${formatHistory(recentMessages)}

--- רשימות נוכחיות ---
${formatLists(currentLists)}

--- הודעת המשתמש ---
${userMessage}`;

  const chat = model.startChat({ history: [] });
  const actions = [];

  let result;
  try {
    result = await chat.sendMessage(context);
  } catch (err) {
    throw err;
  }

  let safety = 0;
  while (safety++ < 5) {
    const calls = result.response.functionCalls?.() || [];
    if (!calls.length) break;

    const fnResponses = [];
    for (const call of calls) {
      let fnResult;
      try {
        fnResult = executor ? executor(call.name, call.args || {}) : { ok: false, error: 'no executor' };
      } catch (err) {
        fnResult = { ok: false, error: err?.message || 'execution failed' };
      }
      console.log(`🔧 tool: ${call.name}(${JSON.stringify(call.args)}) → ${JSON.stringify(fnResult).slice(0, 120)}`);
      actions.push({ name: call.name, args: call.args, result: fnResult });
      fnResponses.push({
        functionResponse: {
          name: call.name,
          response: { result: fnResult },
        },
      });
    }

    try {
      result = await chat.sendMessage(fnResponses);
    } catch (err) {
      throw err;
    }
  }

  let text = '';
  try {
    text = result.response.text() || '';
  } catch {
    text = '';
  }

  return { text: text.trim(), actions };
}
