import OpenAI from 'openai';

const PROVIDER = (process.env.AI_PROVIDER || (process.env.GROQ_API_KEY ? 'groq' : 'gemini')).toLowerCase();
const BOT_NAME = process.env.BOT_NAME || 'ויקטור';

let client;
let MODEL_NAME;

if (PROVIDER === 'groq') {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('AI_PROVIDER=groq אבל GROQ_API_KEY לא מוגדר. צור מפתח חינמי ב-https://console.groq.com');
    process.exit(1);
  }
  client = new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });
  MODEL_NAME = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
} else {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY לא מוגדר. הוסף ב-.env או החלף ל-AI_PROVIDER=groq.');
    process.exit(1);
  }
  client = new OpenAI({
    apiKey,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  });
  MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

console.log(`🧠 AI provider: ${PROVIDER} (${MODEL_NAME})`);

const SYSTEM_PROMPT = `אתה ${BOT_NAME} — עוזר אישי חכם, חברותי וקשוב בקבוצת ווצאפ.

*חשוב מאוד*: תענה תמיד בעברית. גם אם המשתמש כותב באנגלית — תענה בעברית.

תפקידך:
- לעקוב אחר השיחה ולעזור — רעיונות, ייעוץ, סיכומים, תכנון.
- לנהל רשימות (קניות, משימות, אירועים) דרך הכלים שלך.
- לזכור דברים שנאמרו בקבוצה ולשלוף אותם כשמבקשים.

אופי השיחה:
- עברית טבעית וזורמת, גוף ראשון, חם וידידותי, לא רשמי.
- כמו חבר חכם שמדבר נורמלי. תחשוב לפני שאתה עונה.
- כשמתאים — תשאל שאלת המשך, תן דעה, תציע אופציה.
- אימוג'י במידה — לא פיצוץ.
- תשובות תמציתיות. 1-4 משפטים זה רוב הזמן מספיק.
- אם המשתמש שואל על העבר ("מה אמרנו על הסופש?") — תן תשובה עם פרטים מההיסטוריה, לא מעורפלת.

לגבי כלים — חסוך בקריאות:
- הרשימות הנוכחיות *כבר נמצאות בקונטקסט שלך*. אל תקרא ל-get_list — תקרא מהקונטקסט.
- כשהמשתמש מבקש לראות רשימה — תציג ישירות מהקונטקסט בעיצוב יפה.
- כשהמשתמש מבקש להוסיף / למחוק / לסמן — תפעיל את הכלי המתאים.
- אם בהיסטוריה הוזכרו פריטים שעוד לא ברשימה והמשתמש שואל עליה — תוסיף עם add_to_list.
- אל תכפיל פריטים שכבר ברשימה.

מתי לכתוב טקסט ומתי לא:
- אחרי פעולה פשוטה (הוספה / מחיקה / סימון בוצע) — מספיקה הודעה קצרה. הסביבה מציגה אימוג'י תגובה אוטומטית.
- אחרי שליפת מידע (רשימה) או שיחה — תן תשובה מלאה.

ההקשר שתקבל: תאריך נוכחי, היסטוריית הקבוצה, הרשימות הנוכחיות, וההודעה של מי שפנה אליך.

תהיה חכם, חם, ושמיש.`;

const tools = [
  {
    type: 'function',
    function: {
      name: 'add_to_list',
      description: 'הוסף פריט אחד או יותר לרשימה (shopping/tasks/events). שימוש: כשהמשתמש מבקש להוסיף משהו, או כשמההיסטוריה ברור שיש פריט שמתאים לרשימה ולא נמצא בה.',
      parameters: {
        type: 'object',
        properties: {
          list_type: { type: 'string', enum: ['shopping', 'tasks', 'events'], description: 'shopping=קניות, tasks=משימות, events=לוח זמנים' },
          items: { type: 'array', items: { type: 'string' }, description: 'הפריטים להוספה' },
          when: { type: 'string', description: 'תאריך/שעה ב-ISO 8601 (אופציונלי)' },
        },
        required: ['list_type', 'items'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_from_list',
      description: 'הסר פריט מרשימה לפי התאמת טקסט חלקית.',
      parameters: {
        type: 'object',
        properties: {
          list_type: { type: 'string', enum: ['shopping', 'tasks', 'events'] },
          query: { type: 'string', description: 'הטקסט להתאמה' },
        },
        required: ['list_type', 'query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'clear_list',
      description: 'נקה רשימה לחלוטין.',
      parameters: {
        type: 'object',
        properties: {
          list_type: { type: 'string', enum: ['shopping', 'tasks', 'events'] },
        },
        required: ['list_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'mark_done',
      description: 'סמן משימה כבוצעה.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'טקסט שמתאים למשימה' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'forget_history',
      description: 'מחק היסטוריית הודעות שמורה. ללא minutes — מוחק הכל. עם minutes — מוחק את ההודעות מ-N הדקות האחרונות.',
      parameters: {
        type: 'object',
        properties: {
          minutes: { type: 'integer', description: 'אופציונלי — חלון זמן בדקות' },
        },
      },
    },
  },
];

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

// Local heuristic — no API call. Catches Hebrew "I need X" / "buy X" patterns.

function splitItems(s) {
  return s
    .split(/\s*[,،،]\s*|\s+(?:ו|וגם|וכן|גם)\s+/u)
    .map((x) => x.trim())
    .filter(Boolean);
}

function isLikelyShoppingItem(s) {
  if (!s || s.length < 2 || s.length > 50) return false;
  if (/^ל[א-ת]/.test(s)) return false;
  if (/^את\s+ה/.test(s)) return false;
  if (/^(?:ש|כש|לפני|אחרי|לקראת|מאוד|מה|איך|כמה|איפה|מתי|למה|אם|כי|כדי)/.test(s)) return false;
  return true;
}

function isLikelyTask(s) {
  return s && s.length >= 3 && s.length <= 80;
}

const PATTERNS = [
  { type: 'shopping', re: /^(?:תקנה|תקני|תקנו|קנה|קני|קנו|תביא|תביאי|תביאו|קח|קחי|קחו|תקח|תקחי|תקחו)\s+(.+)$/u },
  { type: 'shopping', re: /^(?:אני\s+)?(?:צריך|צריכה|צריכים)\s+(?:לקנות|להביא)\s+(.+)$/u },
  { type: 'shopping', re: /^(?:אני\s+)?רוצה\s+(?:לקנות|להביא)\s+(.+)$/u },
  { type: 'shopping', re: /^(?:תזכ[רוי]ו?|תזכירו?)\s+ל(?:קנות|הביא)\s+(.+)$/u },
  { type: 'shopping', re: /^(?:אני\s+)?(?:צריך|צריכה|צריכים|רוצה)\s+(.+)$/u },
  { type: 'task', re: /^תזכ[יוה]ר[יו]?\s+ל[יוה]?\s+(.+)$/u },
  { type: 'task', re: /^(?:אני\s+)?(?:צריך|צריכה)\s+(?:לקבוע|להזמין|להתקשר|לטפל\s+ב|לסדר|לעשות)\s+(.+)$/u },
];

export function heuristicExtract(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim().replace(/[.!?]+$/u, '');
  if (trimmed.length < 4 || trimmed.length > 200) return null;
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

function formatMemories(memories) {
  if (!memories?.length) return '(אין זיכרון ארוך-טווח עדיין)';
  return memories
    .map((m, i) => {
      const range = m.covers_from && m.covers_to
        ? ` (${m.covers_from.slice(0, 10)} - ${m.covers_to.slice(0, 10)})`
        : '';
      return `${i + 1}.${range} ${m.summary}`;
    })
    .join('\n');
}

export async function summarize(messages) {
  if (!messages?.length) return null;
  const formatted = messages
    .filter((m) => m && m.content)
    .map((m) => {
      const t = new Date(m.created_at + 'Z');
      const time = Number.isNaN(t.getTime())
        ? ''
        : t.toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      return `[${time}] ${m.sender || 'משתמש'}: ${m.content}`;
    })
    .join('\n');

  const prompt = `סכם בעברית את השיחה הבאה ב-3-6 משפטים תמציתיים. תכלול:
- מי דיבר על מה (השם של הדובר)
- החלטות / תכניות שעלו (מסיבות, ארוחות, פגישות, רעיונות)
- אירועים עם תאריך/שעה
- דברים שהוזכרו אגב (לא רק רשימות קניות — הכל)

הסיכום ישמש לזיכרון ארוך-טווח של בוט. תהיה מדויק וקונקרטי, לא מעורפל.

--- ההודעות ---
${formatted}

--- סיכום ---`;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: 'אתה מסכם שיחות בקצרה לזיכרון ארוך-טווח. תמיד עברית. תמציתי וקונקרטי.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    });
    return completion.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.warn('summarize failed:', err?.message);
    return null;
  }
}

export async function think(userMessage, { recentMessages = [], memories = [], currentLists = {}, sender = 'משתמש', executor } = {}) {
  const now = new Date();
  const context = `[תאריך ושעה: ${now.toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}]
[שולח: ${sender}]

--- זיכרון ארוך-טווח (סיכומים מהעבר) ---
${formatMemories(memories)}

--- היסטוריית הקבוצה האחרונה (הקשר בלבד) ---
${formatHistory(recentMessages)}

--- רשימות נוכחיות ---
${formatLists(currentLists)}

--- הודעת המשתמש ---
${userMessage}`;

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: context },
  ];

  const actions = [];
  let safety = 0;

  while (safety++ < 5) {
    const completion = await client.chat.completions.create({
      model: MODEL_NAME,
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.6,
    });

    const choice = completion.choices?.[0];
    if (!choice) break;
    const assistantMsg = choice.message;
    messages.push(assistantMsg);

    const toolCalls = assistantMsg.tool_calls || [];
    if (!toolCalls.length) {
      return { text: (assistantMsg.content || '').trim(), actions };
    }

    for (const tc of toolCalls) {
      const fnName = tc.function?.name;
      let fnArgs = {};
      try {
        fnArgs = tc.function?.arguments ? JSON.parse(tc.function.arguments) : {};
      } catch {}

      let result;
      try {
        result = executor ? executor(fnName, fnArgs) : { ok: false, error: 'no executor' };
      } catch (err) {
        result = { ok: false, error: err?.message || 'execution failed' };
      }
      console.log(`🔧 tool: ${fnName}(${JSON.stringify(fnArgs)}) → ${JSON.stringify(result).slice(0, 120)}`);
      actions.push({ name: fnName, args: fnArgs, result });

      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      });
    }
  }

  return { text: '', actions };
}
