# 🚀 הפעלת ויקטור 24/7 בחינם על Oracle Cloud

מדריך שלב-אחר-שלב להעלאת הבוט לשרת ענן חינמי שירוץ תמיד — גם כשהמחשב שלך כבוי.

**זמן משוער:** 30-45 דקות (כולל הרשמה ל-Oracle).

---

## למה Oracle Cloud Free Tier?

- **חינם לתמיד** — לא ניסיון, לא 12 חודשים. באמת חינם.
- 4 ליבות ARM + 24GB RAM (יותר ממה שצריך).
- 200GB דיסק.
- אינטרנט מהיר ויציב.

החיסרון היחיד: ההרשמה דורשת כרטיס אשראי לאימות (לא מחויב), ולפעמים נגמרים שרתים פנויים — צריך לנסות שוב.

---

## חלק 1 — הרשמה ל-Oracle Cloud

1. היכנס ל-https://www.oracle.com/cloud/free/
2. לחץ **Start for free**.
3. מלא פרטים אישיים:
   - **Country:** Israel
   - **Name + Email** — אמיתיים.
   - **Account Type:** Individual.
4. אמת בטלפון (קוד SMS).
5. הכנס פרטי כרטיס אשראי (לאימות בלבד — לא יחויב כל עוד אתה ב-Always Free).
6. בחר אזור (**Home Region**) — מומלץ:
   - **Frankfurt** (`eu-frankfurt-1`) — קרוב לישראל, חיבור מהיר.
   - אם לא נגמרים שרתים שם, נסה **Amsterdam** או **London**.
7. סיים את ההרשמה והמתן לאישור (לרוב 5-30 דקות, אבל יכול גם יום).

---

## חלק 2 — יצירת שרת (Compute Instance)

לאחר שהחשבון מאושר ואתה ב-Oracle Cloud Console:

1. בתפריט השמאלי העליון (☰): **Compute → Instances**.
2. **Create instance**.
3. מלא:
   - **Name:** `victor-bot` (או כל שם אחר).
   - **Image:** לחץ **Edit → Change image**, בחר **Canonical Ubuntu 22.04** (או 24.04).
   - **Shape:** לחץ **Edit → Change shape**, בחר:
     - **Ampere** (חינם, ARM)
     - מודל: **VM.Standard.A1.Flex**
     - **OCPUs:** 2, **Memory:** 12GB (יש לך 4 ליבות ו-24GB חינם, אבל 2/12 מספיק בקלות).
   - **Networking:** השאר default. ודא ש-**Assign a public IPv4 address** מסומן.
   - **SSH keys:**
     - בחר **Generate a key pair for me**.
     - **חשוב מאוד:** לחץ **Download private key** ושמור את הקובץ (למשל ב-`~/Downloads/ssh-key-victor.key`). תזדקק לו כדי להתחבר לשרת. אם תאבד אותו, לא תוכל להיכנס יותר!
     - לחץ גם **Download public key** (גיבוי).
4. לחץ **Create**.

המתן 1-3 דקות עד שה-Instance במצב **RUNNING** (מסומן בירוק).

5. רשום לעצמך את ה-**Public IP Address** של ה-Instance (למשל `129.xxx.xxx.xxx`).

---

### אם קיבלת "Out of capacity" / "Out of host capacity"

זו הבעיה הנפוצה ביותר ב-Oracle. פתרונות:
- נסה שוב כל כמה שעות (יש סקריפטים לרענון אוטומטי).
- שנה אזור (Region) ונסה שוב — בתפריט העליון יש בורר אזור.
- שנה ל-**VM.Standard.E2.1.Micro** (AMD, פחות חזק אבל זמין יותר). חינם גם הוא.

---

## חלק 3 — חיבור SSH לשרת

### ב-Windows (PowerShell)
```powershell
# החלף את הנתיב לקובץ המפתח ואת ה-IP
ssh -i C:\Users\YourName\Downloads\ssh-key-victor.key ubuntu@129.xxx.xxx.xxx
```

ייתכן ותקבל אזהרה על הרשאות מפתח. תקן עם:
```powershell
icacls C:\Users\YourName\Downloads\ssh-key-victor.key /inheritance:r
icacls C:\Users\YourName\Downloads\ssh-key-victor.key /grant:r "$($env:USERNAME):R"
```

### ב-Mac/Linux
```bash
chmod 600 ~/Downloads/ssh-key-victor.key
ssh -i ~/Downloads/ssh-key-victor.key ubuntu@129.xxx.xxx.xxx
```

בהתחברות ראשונה הוא ישאל "Are you sure you want to continue connecting" — הקלד `yes`.

אם הצלחת — אתה רואה prompt דומה ל-`ubuntu@victor-bot:~$`. אתה בתוך השרת!

---

## חלק 4 — התקנת הבוט

הדבק את הפקודות האלה אחת-אחת בשרת:

### 4א. הורד את הקוד
```bash
git clone https://github.com/Hadar2255/Hadar2255.git
cd Hadar2255
```

### 4ב. הרץ את סקריפט ההתקנה
```bash
bash deploy/install.sh
```

זה ייקח 2-3 דקות. הסקריפט:
- מתקין Node.js 20
- מתקין pm2 (מנהל תהליכים)
- מתקין את כל התלויות
- יוצר קובץ `.env` ועוצר כדי שתערוך אותו.

### 4ג. ערוך את `.env` והוסף את המפתחות
```bash
nano .env
```

לפחות שני שדות חובה:
```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxx
BOT_ENCRYPTION_KEY=סיסמה_חזקה_של_12_תווים_לפחות
```

(הGROQ_API_KEY שלך מ-https://console.groq.com)

יציאה מ-nano: `Ctrl+X`, אז `Y`, אז `Enter`.

### 4ד. הרץ שוב את ההתקנה (להפעלה)
```bash
bash deploy/install.sh
```

הפעם זה יפעיל את הבוט עם pm2 ויגדיר אתחול אוטומטי בעת restart של השרת.

---

## חלק 5 — סריקת QR (פעם אחת)

```bash
pm2 logs victor-bot
```

תוך כמה שניות יופיע קוד QR בטרמינל (גדול, ASCII).

1. פתח וואטסאפ בטלפון שמיועד לבוט.
2. הגדרות (Settings) → מכשירים מקושרים (Linked Devices) → קישור מכשיר (Link Device).
3. סרוק את ה-QR מהטרמינל.

אחרי הסריקה תראה בלוגים: `✅ WhatsApp connected`. סיימת!

לחיצה על `Ctrl+C` תצא מצפיית הלוגים — **הבוט ימשיך לרוץ ברקע**.

---

## חלק 6 — בדיקה ושימוש יומיומי

| פעולה | פקודה |
|-------|--------|
| לראות סטטוס | `pm2 status` |
| לוגים בזמן אמת | `pm2 logs victor-bot` |
| הפעלה מחדש | `pm2 restart victor-bot` |
| עצירה | `pm2 stop victor-bot` |
| התחלה מחדש | `pm2 start victor-bot` |
| עדכון מהקוד החדש | `cd ~/Hadar2255 && git pull && pm2 restart victor-bot` |

עכשיו אתה יכול לסגור את חלון ה-SSH — הבוט ממשיך לרוץ. גם אם השרת יעבור restart הוא יחזור אוטומטית.

---

## פתרון בעיות

### "Connection refused" ב-SSH
- ודא שה-Instance במצב RUNNING.
- ודא שאתה משתמש ב-IP הציבורי הנכון.
- ודא שאתה מתחבר כ-`ubuntu@` (לא root).

### הבוט קורס לולאתית
```bash
pm2 logs victor-bot --lines 100
```
- אם זו שגיאת `GROQ_API_KEY` — ערוך את `.env` שוב.
- אם זה משהו אחר — שלח לי את הלוג.

### QR לא מופיע
```bash
rm -rf ~/Hadar2255/auth_info
pm2 restart victor-bot
pm2 logs victor-bot
```

### לעדכן את הבוט לגרסה חדשה
```bash
cd ~/Hadar2255
git pull
npm install
pm2 restart victor-bot
```

### גיבוי
המידע החשוב נמצא ב:
- `~/Hadar2255/data/bot.db` — הרשימות וההיסטוריה
- `~/Hadar2255/auth_info/` — אישורי וואטסאפ

להוריד גיבוי למחשב המקומי:
```bash
# מהמחשב שלך (לא מהשרת)
scp -i ~/Downloads/ssh-key-victor.key -r ubuntu@129.xxx.xxx.xxx:~/Hadar2255/data ./backup
```
