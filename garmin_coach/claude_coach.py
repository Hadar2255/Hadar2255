"""AI coach - analyzes Garmin data and creates personalized training + nutrition plans.
Uses Google Gemini API (google-genai).
"""

import os
from google import genai
from google.genai import types
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn

from .models import CoachingPlan, FitnessProfile

console = Console()

SYSTEM_PROMPT = """אתה מאמן כושר ותזונה מקצועי ומנוסה דובר עברית.
אתה מתמחה בניתוח נתוני אימון מגרמין ויצירת תוכניות אישיות מותאמות.

כישורים:
- ניתוח עומסי אימון ומגמות ביצועים
- יצירת תוכניות אימון שבועיות מדורגות ומאוזנות
- תזונה ספורטיבית: לפני, במהלך ואחרי אימון
- ימי מנוחה ושיקום
- מניעת פציעות ועומס יתר
- הצבת מטרות ריאליות

עקרונות:
- ספק עצות ספציפיות ומעשיות, לא גנריות
- התבסס על הנתונים בפועל מהגרמין
- התאם את התוכנית לרמת הכושר הנוכחית
- כלול ימי מנוחה ושיקום מספקים
- הסבר את הלוגיקה מאחורי כל המלצה

פורמט: השב בעברית, בצורה ברורה, מובנית ומעוררת השראה."""

PLAN_PROMPT_TEMPLATE = """בהתבסס על נתוני האימון הבאים מגרמין קונקט, צור תוכנית שבועית מותאמת אישית.

{data_summary}

=== בקשה ===
צור תוכנית מפורטת הכוללת את הסעיפים הבאים, כל אחד עם כותרת ברורה:

1. **תוכנית אימון שבועית** - לוח זמנים מפורט ל-7 ימים עם סוג, משך ועוצמת כל אימון

2. **תוכנית תזונה כללית** - עקרונות תזונה יומיים המותאמים לעומס האימון הנוכחי

3. **תזונה לפני אימון** - מה לאכול ומתי, לפי סוג האימון

4. **תזונה אחרי אימון** - מה לאכול לשיקום מיטבי, עם דוגמאות מעשיות

5. **שיקום ומנוחה** - המלצות לשיקום, שינה, ומתיחות

6. **יעדים לשבוע הקרוב** - 3-4 יעדים ספציפיים וניתנים למדידה

7. **הערה מעוררת** - מסר אישי קצר ומעורר השראה בהתבסס על הנתונים

ענה בצורה מפורטת, מעשית ומותאמת אישית לנתונים שקיבלת."""


class ClaudeCoach:
    def __init__(self):
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set in environment variables.")
        self.client = genai.Client(api_key=api_key)

    def create_plan(self, profile: FitnessProfile, data_summary: str) -> CoachingPlan:
        prompt = PLAN_PROMPT_TEMPLATE.format(data_summary=data_summary)

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
        ) as progress:
            progress.add_task("Gemini מנתח את נתוני האימון שלך ויוצר תוכנית...", total=None)
            response = self.client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    max_output_tokens=4096,
                    temperature=0.7,
                ),
            )

        return self._parse_response(response.text)

    def _parse_response(self, text: str) -> CoachingPlan:
        sections = {
            "weekly_training_plan": "",
            "nutrition_plan": "",
            "pre_workout_nutrition": "",
            "post_workout_nutrition": "",
            "recovery_advice": "",
            "weekly_goals": "",
            "motivational_note": "",
        }

        section_markers = [
            ("1.", "weekly_training_plan"),
            ("תוכנית אימון שבועית", "weekly_training_plan"),
            ("2.", "nutrition_plan"),
            ("תוכנית תזונה", "nutrition_plan"),
            ("3.", "pre_workout_nutrition"),
            ("תזונה לפני", "pre_workout_nutrition"),
            ("4.", "post_workout_nutrition"),
            ("תזונה אחרי", "post_workout_nutrition"),
            ("5.", "recovery_advice"),
            ("שיקום", "recovery_advice"),
            ("6.", "weekly_goals"),
            ("יעדים", "weekly_goals"),
            ("7.", "motivational_note"),
            ("הערה", "motivational_note"),
        ]

        lines = text.split("\n")
        current_section = "weekly_training_plan"
        buffer: list[str] = []

        def flush(key: str, buf: list[str]) -> None:
            sections[key] = "\n".join(buf).strip()

        for line in lines:
            matched = False
            for marker, key in section_markers:
                if marker in line and ("**" in line or line.strip().startswith(marker)):
                    flush(current_section, buffer)
                    current_section = key
                    buffer = [line]
                    matched = True
                    break
            if not matched:
                buffer.append(line)

        flush(current_section, buffer)

        if not any(sections.values()):
            sections["weekly_training_plan"] = text

        return CoachingPlan(
            weekly_training_plan=sections["weekly_training_plan"] or text,
            nutrition_plan=sections["nutrition_plan"],
            pre_workout_nutrition=sections["pre_workout_nutrition"],
            post_workout_nutrition=sections["post_workout_nutrition"],
            recovery_advice=sections["recovery_advice"],
            weekly_goals=sections["weekly_goals"],
            motivational_note=sections["motivational_note"],
        )
