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

לגבי כלים — *חסוך בקריאות API*:
- הרשימות הנוכחיות *כבר נמצאות בקונטקסט שלך* (תחת "רשימות נוכחיות"). אל תקרא ל-get_list — תקרא רק מהקונטקסט.
- כשהמשתמש מבקש לראות רשימה — תציג אותה ישירות מהקונטקסט, בפורמט מעוצב יפה.
- כשהמשתמש מבקש להוסיף/למחוק/לסמן — תפעיל את הכלי המתאים (add_to_list / remove_from_list / mark_done / clear_list).
- אם בהיסטוריה הוזכרו פריטים שעוד לא ברשימה הקיימת ושהמשתמש כעת שואל על הרשימה — *הוסף אותם* בקריאה ל-add_to_list. תוסיף הערה קצרה שראית בהיסטוריה.
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

// Local heuristic extractor — no API calls. Catches the common Hebrew patterns
// for "I need X" / "buy X" so passive listening doesn't burn the daily Gemini
// quota.

function splitItems(s) {
  return s
    .split(/\s*[,،،]\s*|\s+(?:ו|וגם|וכן|גם)\s+/u)
    .map((x) => x.trim())
    .filter(Boolean);
}

function isLikelyShoppingItem(s) {
  if (!s || s.length < 2 || s.length > 50) return false;
  if (/^ל[א-ת]/.test(s)) return false; // infinitive verb (לקנות, ללכת, לאכול...)
  if (/^את\s+ה/.test(s)) return false; // definite object, usually referential
  if (/^(?:ש|כש|לפני|אחרי|לקראת|מאוד|מה|איך|כמה|איפה|מתי|למה|אם|כי|כדי)/.test(s)) return false;
  return true;
}

function isLikelyTask(s) {
  if (!s || s.length < 3 || s.length > 80) return false;
  return true;
}

const PATTERNS = [
  // Imperative buy
  { type: 'shopping', re: /^(?:תקנה|תקני|תקנו|קנה|קני|קנו|תביא|תביאי|תביאו|קח|קחי|קחו|תקח|תקחי|תקחו)\s+(.+)$/u },
  // Explicit "need to buy / need to bring"
  { type: 'shopping', re: /^(?:אני\s+)?(?:צריך|צריכה|צריכים)\s+(?:לקנות|להביא)\s+(.+)$/u },
  // "I want to buy / bring"
  { type: 'shopping', re: /^(?:אני\s+)?רוצה\s+(?:לקנות|להביא)\s+(.+)$/u },
  // "Remember to buy/bring"
  { type: 'shopping', re: /^(?:תזכ[רוי]ו?|תזכירו?)\s+ל(?:קנות|הביא)\s+(.+)$/u },
  // Direct "I need X" / "I want X" — only when X doesn't start with a verb
  { type: 'shopping', re: /^(?:אני\s+)?(?:צריך|צריכה|צריכים|רוצה)\s+(.+)$/u },

  // Task: "remind me to ..."
  { type: 'task', re: /^תזכ[יוה]ר[יו]?\s+ל[יוה]?\s+(.+)$/u },
  // Task: "need to call / book / fix / arrange ..."
  { type: 'task', re: /^(?:אני\s+)?(?:צריך|צריכה)\s+(?:לקבוע|להזמין|להתקשר|לטפל\s+ב|לסדר|לעשות)\s+(.+)$/u },
];

export function heuristicExtract(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim().replace(/[.!?]+$/u, '');
  if (trimmed.length < 4 || trimmed.length > 200) return null;
  // Skip if it's actually addressed to the bot.
  if (/^(?:ויקטור|victor)\b/i.test(trimmed)) return null;

  for (const { type, re } of PATTERNS) {
    const m = trimmed.match(re);
    if (!m) continue;
    const tail = m[1].trim();
    if (type === 'shopping') {
      const items = splitItems(tail).filter(isLikelyShoppingItem);
      if (items.length) return { type, items, when: null };
    } else if (type === 'task') {
      const item = tail.trim();
      if (isLikelyTask(item)) return { type, items: [item], when: null };
    }
  }
  return null;
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
