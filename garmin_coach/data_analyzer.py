"""Analyzes Garmin workout data to build a fitness profile."""

from collections import defaultdict
from datetime import datetime, timedelta
from typing import Optional

from .models import Activity, FitnessProfile, WeeklyStats

SPORT_DISPLAY = {
    "running": "ריצה",
    "trail_running": "ריצת שטח",
    "treadmill_running": "הליכון",
    "track_running": "מסלול",
    "cycling": "רכיבה",
    "indoor_cycling": "ספינינג",
    "swimming": "שחייה",
    "open_water_swimming": "שחיית מים פתוחים",
    "strength_training": "כוח",
    "yoga": "יוגה",
    "walking": "הליכה",
    "hiking": "טיול רגלי",
    "fitness_equipment": "ציוד כושר",
    "elliptical": "אליפטיקל",
    "cardio": "קרדיו",
    "other": "אחר",
    "unknown": "לא ידוע",
}

ENDURANCE_SPORTS = {
    "running", "trail_running", "treadmill_running", "track_running",
    "cycling", "indoor_cycling", "swimming", "open_water_swimming",
    "walking", "hiking",
}

FITNESS_LEVELS = [
    (0, 2, "מתחיל"),
    (2, 4, "מתחיל-ביניים"),
    (4, 6, "ביניים"),
    (6, 8, "ביניים-מתקדם"),
    (8, float("inf"), "מתקדם"),
]


class DataAnalyzer:
    def __init__(self, user_name: str, fitness_goal: str, weeks: int):
        self.user_name = user_name
        self.fitness_goal = fitness_goal
        self.weeks = weeks

    def analyze(self, activities: list[Activity]) -> FitnessProfile:
        weekly_stats = self._compute_weekly_stats(activities, self.weeks)
        dominant_sport = self._dominant_sport(activities)
        avg_weekly_hours = self._avg_weekly_hours(weekly_stats)
        avg_weekly_distance = self._avg_weekly_distance(weekly_stats)
        fitness_level = self._estimate_fitness_level(avg_weekly_hours, activities)

        return FitnessProfile(
            user_name=self.user_name,
            fitness_goal=self.fitness_goal,
            weeks_analyzed=self.weeks,
            total_activities=len(activities),
            weekly_stats=weekly_stats,
            all_activities=activities,
            dominant_sport=dominant_sport,
            avg_weekly_hours=avg_weekly_hours,
            avg_weekly_distance_km=avg_weekly_distance,
            estimated_fitness_level=fitness_level,
        )

    def _compute_weekly_stats(
        self, activities: list[Activity], weeks: int
    ) -> list[WeeklyStats]:
        buckets: dict[str, list[Activity]] = defaultdict(list)
        for a in activities:
            try:
                dt = datetime.fromisoformat(a.start_time)
            except ValueError:
                continue
            monday = dt - timedelta(days=dt.weekday())
            week_key = monday.strftime("%Y-%m-%d")
            buckets[week_key].append(a)

        result = []
        for week_start in sorted(buckets.keys()):
            week_acts = buckets[week_start]
            type_counts: dict[str, int] = defaultdict(int)
            for a in week_acts:
                sport = SPORT_DISPLAY.get(a.type, a.type)
                type_counts[sport] += 1

            hrs = [a.avg_heart_rate for a in week_acts if a.avg_heart_rate]
            avg_hr = sum(hrs) / len(hrs) if hrs else None
            load = self._training_load(week_acts)

            result.append(
                WeeklyStats(
                    week_start=week_start,
                    total_activities=len(week_acts),
                    total_duration_minutes=sum(a.duration_minutes for a in week_acts),
                    total_distance_km=sum(a.distance_km for a in week_acts),
                    total_calories=sum(a.calories or 0 for a in week_acts),
                    avg_heart_rate=avg_hr,
                    activity_types=dict(type_counts),
                    longest_activity_minutes=max(
                        (a.duration_minutes for a in week_acts), default=0
                    ),
                    training_load=load,
                )
            )
        return result

    def _training_load(self, activities: list[Activity]) -> float:
        """Simple TRIMP-inspired load: duration(min) × HR_ratio."""
        total = 0.0
        for a in activities:
            if a.avg_heart_rate and a.duration_minutes:
                hr_ratio = a.avg_heart_rate / 180
                total += a.duration_minutes * hr_ratio
            else:
                total += a.duration_minutes * 0.6
        return round(total, 1)

    def _dominant_sport(self, activities: list[Activity]) -> str:
        if not activities:
            return "לא ידוע"
        counts: dict[str, int] = defaultdict(int)
        for a in activities:
            counts[a.type] += 1
        top = max(counts, key=lambda k: counts[k])
        return SPORT_DISPLAY.get(top, top)

    def _avg_weekly_hours(self, weekly_stats: list[WeeklyStats]) -> float:
        if not weekly_stats:
            return 0.0
        total = sum(w.total_duration_minutes for w in weekly_stats)
        return round(total / len(weekly_stats) / 60, 1)

    def _avg_weekly_distance(self, weekly_stats: list[WeeklyStats]) -> float:
        if not weekly_stats:
            return 0.0
        total = sum(w.total_distance_km for w in weekly_stats)
        return round(total / len(weekly_stats), 1)

    def _estimate_fitness_level(
        self, avg_weekly_hours: float, activities: list[Activity]
    ) -> str:
        for lo, hi, label in FITNESS_LEVELS:
            if lo <= avg_weekly_hours < hi:
                return label
        return "מתקדם"

    def build_summary_text(self, profile: FitnessProfile) -> str:
        """Build a Hebrew/English data summary to send to Claude."""
        lines = [
            f"=== פרופיל ספורט של {profile.user_name} ===",
            f"מטרת אימון: {profile.fitness_goal}",
            f"ספורט דומיננטי: {profile.dominant_sport}",
            f"רמת כושר משוערת: {profile.estimated_fitness_level}",
            f"ממוצע שבועי: {profile.avg_weekly_hours} שעות, {profile.avg_weekly_distance_km} ק\"מ",
            f"סה\"כ אימונים ב-{profile.weeks_analyzed} שבועות: {profile.total_activities}",
            "",
            "=== נתונים שבועיים ===",
        ]

        for ws in profile.weekly_stats:
            types_str = ", ".join(f"{k}×{v}" for k, v in ws.activity_types.items())
            hr_str = f", ממוצע דופק: {ws.avg_heart_rate:.0f}" if ws.avg_heart_rate else ""
            lines.append(
                f"שבוע {ws.week_start}: {ws.total_activities} אימונים | "
                f"{ws.total_duration_minutes:.0f} דק' | "
                f"{ws.total_distance_km:.1f} ק\"מ | "
                f"{ws.total_calories} קלוריות | "
                f"עומס אימון: {ws.training_load}{hr_str} | "
                f"סוגים: {types_str}"
            )

        lines += ["", "=== אימונים אחרונים (10 אחרונים) ==="]
        recent = sorted(
            profile.all_activities,
            key=lambda a: a.start_time,
            reverse=True,
        )[:10]

        for a in recent:
            pace_str = (
                f" | קצב: {_format_pace(a.avg_pace_min_per_km)}/ק\"מ"
                if a.avg_pace_min_per_km
                else ""
            )
            hr_str = f" | דופק ממוצע: {a.avg_heart_rate}" if a.avg_heart_rate else ""
            power_str = f" | עוצמה ממוצעת: {a.avg_power}W" if a.avg_power else ""
            cal_str = f" | {a.calories} קלוריות" if a.calories else ""
            sport = SPORT_DISPLAY.get(a.type, a.type)
            lines.append(
                f"• {a.start_time[:10]} | {sport} | {a.duration_minutes:.0f} דק'"
                f" | {a.distance_km:.1f} ק\"מ{pace_str}{hr_str}{power_str}{cal_str}"
            )

        return "\n".join(lines)


def _format_pace(pace: Optional[float]) -> str:
    if pace is None:
        return ""
    minutes = int(pace)
    seconds = int((pace - minutes) * 60)
    return f"{minutes}:{seconds:02d}"
