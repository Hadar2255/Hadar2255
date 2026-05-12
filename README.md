# 🏃 מנתח האימונים שלי | Garmin × Gemini AI

> **בינה מלאכותית שמנתחת את הריצות שלך ויוצרת תוכנית אימון מותאמת אישית — בעברית**

[![פתח ב-Google Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Hadar2255/Hadar2255/blob/main/garmin_gemini.ipynb)

---

## מה המערכת עושה?

```
שעון גרמין → Garmin Connect → Python → Gemini AI → תוכנית אימון → גרמין → שעון
```

| שלב | מה קורה |
|-----|---------|
| 📊 **שליפת נתונים** | פעילויות, HRV, שינה, Training Effect |
| 🦿 **ביומכניקה** | קידוד, זמן מגע קרקע, תנודה אנכית, עוצמת ריצה |
| 🤖 **ניתוח AI** | Gemini מנתח הכל ומספק המלצות ספציפיות בעברית |
| 📅 **תוכנית שבועית** | 3-5 אימונים מותאמים לשבוע הקרוב |
| ⌚ **שליחה לשעון** | האימונים נוצרים ב-Garmin Connect ומגיעים לשעון |
| 🌐 **אתר אישי** | כל הניתוחים + גרפים בכתובת hadar2255.github.io |

---

## 🚀 התחלה מהירה (5 דקות, ללא ידע טכני)

### שלב 1: קבל מפתח Gemini AI (חינמי)

1. כנס ל: **https://aistudio.google.com/apikey**
2. לחץ **"Create API Key"**
3. העתק את המפתח (נראה כמו: `AIzaSy...`)

### שלב 2: קבל GitHub Token (לאתר)

1. כנס ל: **https://github.com/settings/tokens**
2. לחץ **"Generate new token (classic)"**
3. שם: `garmin-analysis`
4. סמן: **`repo`**
5. לחץ **"Generate token"** והעתק

### שלב 3: פתח את ה-Notebook

לחץ כאן: **[![פתח ב-Google Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Hadar2255/Hadar2255/blob/main/garmin_gemini.ipynb)**

### שלב 4: מלא את הפרטים

בתא **"שלב 2"** שנה את השורות הבאות:

```python
GARMIN_EMAIL    = "האימייל שלך ב-Garmin"
GARMIN_PASSWORD = "הסיסמה שלך ב-Garmin"
GEMINI_API_KEY  = "המפתח שקיבלת בשלב 1"
GITHUB_TOKEN    = "ה-Token שקיבלת בשלב 2"
```

### שלב 5: הרץ

לחץ: **`Runtime`** (בתפריט העליון) → **`Run all`**

✅ המערכת תרוץ כ-2-3 דקות ותציג את הניתוח.

### שלב 6: ראה את האתר

לאחר הריצה, הניתוח יופיע באתר האישי שלך:
**https://hadar2255.github.io/Hadar2255**

> ⚠️ בפעם הראשונה — הפעל GitHub Pages:
> `Settings` → `Pages` → Source: `main branch` → שמור

### שלב 7: סנכרן לשעון

פתח **אפליקציית Garmin Connect** בטלפון → האימונים יופיעו אוטומטית!

---

## 📊 מה כולל הניתוח?

### ביומכניקה
| מדד | מה המשמעות | מטרה |
|-----|-----------|------|
| **קידוד** | צעדים בדקה | 170–180 spm |
| **GCT** | זמן מגע עם הקרקע | 200–270 ms |
| **תנודה אנכית** | כמה אתה "קופץ" | 6–9 cm |
| **יחס אנכי** | אנרגיה לכלפי מעלה | <10% |
| **איזון** | שמאל/ימין | 50/50 |

> ⚠️ נתוני GCT ותנודה אנכית דורשים שעון עם **Running Dynamics**
> (Forerunner 255/955/265/965 עם חגורת חזה תואמת)

### בריאות ועומס
- ❤️ **HRV** — מצב ההתאוששות
- 😴 **שינה** — עמוקה, REM, כוללת
- 🏋️ **Training Effect** — אירובי ואנאירובי
- 📈 **עומס אימון** — האם אתה מאמן יותר מדי?

---

## 🔄 עדכון שבועי

כל שבוע — חזור על שלב 5 בלבד.
הניתוח יתעדכן אוטומטית ויצור אימונים לשבוע החדש.

---

## ❓ שאלות נפוצות

**ש: האם הסיסמה שלי בטוחה?**
ת: הפרטים נשארים בתוך ה-Colab שלך בלבד ולא נשמרים בשום מקום.

**ש: אין לי Running Dynamics — האם שווה?**
ת: כן! קידוד, עוצמה ו-Training Effect זמינים בכל שעוני גרמין.

**ש: האימונים לא הופיעו בשעון**
ת: פתח את אפליקציית Garmin Connect ↔ בצע סנכרון ידני.

**ש: יש MFA/קוד SMS בחשבון גרמין**
ת: הספרייה תבקש את הקוד ב-Colab — הדבק אותו ולחץ Enter.

---

*מופעל על ידי [garminconnect](https://github.com/cyberjunky/python-garminconnect) + [Google Gemini AI](https://ai.google.dev)*
