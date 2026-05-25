# 🧠 מוחי / Brainy – אפליקציית זיכרון

> אפליקציית מובייל בסגנון Duolingo ללימוד שיטות זיכרון מוכחות.
> A Duolingo-style mobile app for learning proven memory techniques.

---

## עברית

### על האפליקציה
**מוחי** היא אפליקציה משחקית ללימוד שיטות זיכרון מוכחות בכמה דקות ביום:
- שיעורים קצרים ואינטראקטיביים
- מעקב התקדמות עם רצפים יומיים, נקודות ניסיון (XP), והישגים
- 7 שיטות זיכרון מובילות (MOM, PIE/ארמון הזיכרון, שרשור, רשימת גוף, עוגנים, המרה, FAST)
- תמיכה בעברית ואנגלית (RTL/LTR)

### מבנה הפרויקט
- `mockups/` – שלב 1 (הנוכחי): mockups אינטראקטיביים ב-HTML/CSS/JS לאישור עיצובי
- `docs/` – תיעוד שיטות הזיכרון
- **שלב 2 (עתידי):** מימוש מלא ב-React Native + Expo

### איך לפתוח את ה-Mockups
1. פתח את `mockups/index.html` בדפדפן
2. לחץ על כל מסך כדי לראות אותו במלוא הגודל
3. ניתן לעבור בין עברית לאנגלית בכל מסך עם המתג בפינה
4. עובד במצב mobile responsive – פתח DevTools במצב iPhone 14 Pro

### צבעים וטיפוגרפיה
- **צבע ראשי:** סגול (`#7C3AED`) – מסמל מוח ולמידה
- **צבע משני:** צהוב חרדל (`#FBBF24`) – אנרגיה
- **הצלחה:** ירוק (`#10B981`)
- **טעות:** אדום (`#EF4444`)
- **רצף:** כתום (`#F97316`)
- **פונט עברי:** Heebo
- **פונט אנגלי:** Nunito

---

## English

### About
**Brainy** is a gamified app for learning proven memory techniques in just minutes a day:
- Short, interactive lessons
- Progress tracking with daily streaks, XP, and achievements
- 7 leading memory methods (MOM, PIE/Memory Palace, Chain Linking, Body List, Pegs, Substitution, FAST)
- Hebrew + English support (RTL/LTR)

### Project Structure
- `mockups/` – Phase 1 (current): Interactive HTML/CSS/JS mockups for design validation
- `docs/` – Memory techniques documentation
- **Phase 2 (future):** Full React Native + Expo implementation

### Running the Mockups
1. Open `mockups/index.html` in any browser
2. Click any screen card to view it full-size
3. Toggle Hebrew/English with the switcher in each screen
4. Mobile responsive — open DevTools in iPhone 14 Pro mode for best preview

### Design Tokens
- **Primary:** Purple (`#7C3AED`) – brain/learning
- **Secondary:** Mustard Yellow (`#FBBF24`) – energy
- **Success:** Green (`#10B981`)
- **Error:** Red (`#EF4444`)
- **Streak:** Orange (`#F97316`)
- **Hebrew font:** Heebo
- **English font:** Nunito

---

## Screen Index / רשימת מסכים

| # | Screen | מסך |
|---|--------|-----|
| 01 | Splash | מסך פתיחה |
| 02 | Onboarding (3 slides) | אונבורדינג |
| 03 | Language Selection | בחירת שפה |
| 04 | Daily Goal | יעד יומי |
| 05 | Home / Skill Tree | בית / עץ שיטות |
| 06 | Lesson Intro | פתיחת שיעור |
| 07 | Lesson Teach | שיעור הוראה |
| 08 | Quiz (Multiple Choice) | תרגיל רב-בחירה |
| 09 | Quiz Match | תרגיל התאמה |
| 10 | Quiz Recall (typing) | תרגיל היזכרות |
| 11 | Lesson Complete | סיום שיעור |
| 12 | Profile | פרופיל |
| 13 | Progress | התקדמות |
| 14 | Settings | הגדרות |

---

## Tech Stack
- **Now (mockups):** Vanilla HTML / CSS / JavaScript — no build tools, no dependencies
- **Future:** React Native + Expo for iOS/Android

## Status
🟡 **Phase 1: Mockups** – Complete, awaiting design approval
⚪ **Phase 2: React Native implementation** – Not yet started
