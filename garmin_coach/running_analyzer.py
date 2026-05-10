"""Deep running analysis: pace zones, run classification, race predictions, biomechanics."""

from collections import defaultdict
from datetime import datetime, timedelta
from typing import Optional

from .models import Activity, RunEntry, RunningAnalysis

RUNNING_TYPES = {"running", "trail_running", "treadmill_running", "track_running"}

# Run type thresholds as % of estimated max HR (220 - age, default age 30 → max 190)
# Or based on pace distribution if no HR
RUN_TYPE_LABELS = {
    "easy":       "קל/שיקום",
    "base":       "בסיס אירובי",
    "tempo":      "טמפו",
    "threshold":  "סף אנאירובי",
    "interval":   "אינטרוולים",
    "long":       "ריצה ארוכה",
}

# Riegel exponent for race time prediction
RIEGEL_EXP = 1.06


class RunningAnalyzer:
    def __init__(self, max_hr: int = 190):
        self.max_hr = max_hr

    def analyze(self, activities: list[Activity]) -> Optional[RunningAnalysis]:
        runs = [a for a in activities if a.is_run and a.distance_km > 0.5]
        if not runs:
            return None

        entries = [self._classify(r) for r in runs]
        entries.sort(key=lambda e: e.date)

        weekly_km = self._weekly_km(runs)
        avg_weekly_km = sum(v for _, v in weekly_km) / max(len(weekly_km), 1)

        type_counts: dict[str, int] = defaultdict(int)
        type_km: dict[str, float] = defaultdict(float)
        for e in entries:
            type_counts[e.run_type] += 1
            type_km[e.run_type] += e.distance_km

        easy_paces = [
            e.avg_pace_min_per_km for e in entries
            if e.run_type in ("easy", "base") and e.avg_pace_min_per_km
        ]
        tempo_paces = [
            e.avg_pace_min_per_km for e in entries
            if e.run_type in ("tempo", "threshold") and e.avg_pace_min_per_km
        ]

        avg_easy_pace = _avg(easy_paces)
        avg_tempo_pace = _avg(tempo_paces)

        best_pace_5k, best_pace_10k = self._best_paces(runs)
        predicted = self._race_predictions(runs)
        pace_trend = self._pace_trend(entries)
        hr_per_pace = self._hr_efficiency(entries)
        longest = max(runs, key=lambda r: r.distance_km)
        decouplings = [e.aerobic_decoupling for e in entries if e.aerobic_decoupling]

        cadences = [r.avg_cadence for r in runs if r.avg_cadence]
        strides = [r.avg_stride_length for r in runs if r.avg_stride_length]
        oscillations = [r.avg_vertical_oscillation for r in runs if r.avg_vertical_oscillation]
        contacts = [r.avg_ground_contact_time for r in runs if r.avg_ground_contact_time]

        return RunningAnalysis(
            total_runs=len(runs),
            total_running_km=round(sum(r.distance_km for r in runs), 1),
            avg_weekly_running_km=round(avg_weekly_km, 1),
            weekly_km_trend=weekly_km,
            run_type_counts=dict(type_counts),
            run_type_km={k: round(v, 1) for k, v in type_km.items()},
            avg_easy_pace=avg_easy_pace,
            avg_tempo_pace=avg_tempo_pace,
            best_pace_5k=best_pace_5k,
            best_pace_10k=best_pace_10k,
            pace_trend=pace_trend,
            avg_hr_per_pace=hr_per_pace,
            avg_cadence=_avg(cadences),
            avg_stride_length=_avg(strides),
            avg_vertical_oscillation=_avg(oscillations),
            avg_ground_contact_time=_avg(contacts),
            predicted_5k=predicted.get("5k"),
            predicted_10k=predicted.get("10k"),
            predicted_half=predicted.get("half"),
            predicted_marathon=predicted.get("marathon"),
            longest_run_km=round(longest.distance_km, 1),
            longest_run_date=longest.start_time[:10],
            avg_aerobic_decoupling=round(_avg(decouplings), 1) if decouplings else None,
            runs=entries,
        )

    def _classify(self, r: Activity) -> RunEntry:
        run_type = self._run_type(r)
        return RunEntry(
            date=r.start_time[:10],
            distance_km=round(r.distance_km, 2),
            duration_minutes=round(r.duration_minutes, 1),
            avg_pace_min_per_km=r.avg_pace_min_per_km,
            avg_hr=r.avg_heart_rate,
            max_hr=r.max_heart_rate,
            elevation_gain=r.elevation_gain,
            avg_cadence=r.avg_cadence,
            avg_stride_length=r.avg_stride_length,
            avg_vertical_oscillation=r.avg_vertical_oscillation,
            avg_ground_contact_time=r.avg_ground_contact_time,
            aerobic_decoupling=r.aerobic_decoupling,
            training_stress_score=r.training_stress_score,
            run_type=run_type,
        )

    def _run_type(self, r: Activity) -> str:
        # Long run: >13 km or >75 min
        if r.distance_km >= 13 or r.duration_minutes >= 75:
            return "long"

        # Use HR zones if available
        if r.avg_heart_rate:
            hr_pct = r.avg_heart_rate / self.max_hr
            if hr_pct < 0.72:
                return "easy"
            if hr_pct < 0.82:
                return "base"
            if hr_pct < 0.89:
                return "tempo"
            if hr_pct < 0.94:
                return "threshold"
            return "interval"

        # Fallback: classify by pace (min/km)
        if r.avg_pace_min_per_km:
            p = r.avg_pace_min_per_km
            if p > 6.5:
                return "easy"
            if p > 5.5:
                return "base"
            if p > 4.8:
                return "tempo"
            if p > 4.2:
                return "threshold"
            return "interval"

        return "base"

    def _weekly_km(self, runs: list[Activity]) -> list[tuple[str, float]]:
        buckets: dict[str, float] = defaultdict(float)
        for r in runs:
            try:
                dt = datetime.fromisoformat(r.start_time)
            except ValueError:
                continue
            monday = (dt - timedelta(days=dt.weekday())).strftime("%Y-%m-%d")
            buckets[monday] += r.distance_km
        return [(w, round(km, 1)) for w, km in sorted(buckets.items())]

    def _best_paces(self, runs: list[Activity]) -> tuple[Optional[float], Optional[float]]:
        """Best equivalent 5K and 10K paces using Riegel formula."""
        all_paces = []
        for r in runs:
            if r.avg_pace_min_per_km and r.distance_km >= 3:
                # Convert actual pace to 5K and 10K equivalent pace
                actual_time_min = r.avg_pace_min_per_km * r.distance_km
                p5k = riegel_pace(actual_time_min, r.distance_km, 5.0)
                p10k = riegel_pace(actual_time_min, r.distance_km, 10.0)
                all_paces.append((p5k, p10k))

        if not all_paces:
            return None, None
        best_5k = min(p for p, _ in all_paces)
        best_10k = min(p for _, p in all_paces)
        return round(best_5k, 2), round(best_10k, 2)

    def _race_predictions(self, runs: list[Activity]) -> dict[str, str]:
        # Find the best recent effort to base predictions on
        best: Optional[tuple[float, float]] = None  # (distance_km, time_min)
        for r in sorted(runs, key=lambda x: x.start_time, reverse=True)[:20]:
            if r.avg_pace_min_per_km and r.distance_km >= 3:
                t = r.avg_pace_min_per_km * r.distance_km
                if best is None or r.distance_km > best[0]:
                    best = (r.distance_km, t)

        if not best:
            return {}

        base_dist, base_time = best
        predictions = {}
        for label, target_km in [("5k", 5.0), ("10k", 10.0), ("half", 21.097), ("marathon", 42.195)]:
            pred_time = riegel_time(base_time, base_dist, target_km)
            predictions[label] = _format_time(pred_time)

        return predictions

    def _pace_trend(self, entries: list[RunEntry]) -> str:
        """Compare avg easy/base pace of first half vs second half of period."""
        easy = [e for e in entries if e.run_type in ("easy", "base") and e.avg_pace_min_per_km]
        if len(easy) < 4:
            return "אין מספיק נתונים"
        mid = len(easy) // 2
        old_avg = _avg([e.avg_pace_min_per_km for e in easy[:mid]])
        new_avg = _avg([e.avg_pace_min_per_km for e in easy[mid:]])
        if old_avg is None or new_avg is None:
            return "אין מספיק נתונים"
        diff_pct = (old_avg - new_avg) / old_avg * 100
        if diff_pct > 2:
            return f"משתפר ({diff_pct:.1f}% מהיר יותר)"
        if diff_pct < -2:
            return f"מאט ({abs(diff_pct):.1f}% איטי יותר)"
        return "יציב"

    def _hr_efficiency(self, entries: list[RunEntry]) -> Optional[float]:
        """Average HR during easy runs (lower = more aerobically efficient)."""
        vals = [
            e.avg_hr for e in entries
            if e.run_type in ("easy", "base") and e.avg_hr
        ]
        return round(_avg(vals), 1) if vals else None

    def build_summary_text(self, ra: RunningAnalysis) -> str:
        lines = [
            "=== ניתוח ריצה מפורט ===",
            f"סה\"כ ריצות: {ra.total_runs} | סה\"כ ק\"מ: {ra.total_running_km} ק\"מ",
            f"ממוצע שבועי: {ra.avg_weekly_running_km} ק\"מ/שבוע",
            f"ריצה ארוכה ביותר: {ra.longest_run_km} ק\"מ ({ra.longest_run_date})",
            f"מגמת קצב: {ra.pace_trend}",
        ]

        if ra.avg_easy_pace:
            lines.append(f"קצב ריצה קלה ממוצע: {_fmt_pace(ra.avg_easy_pace)}/ק\"מ")
        if ra.avg_tempo_pace:
            lines.append(f"קצב טמפו ממוצע: {_fmt_pace(ra.avg_tempo_pace)}/ק\"מ")
        if ra.best_pace_5k:
            lines.append(f"קצב 5 ק\"מ הטוב ביותר (שקול): {_fmt_pace(ra.best_pace_5k)}/ק\"מ")
        if ra.best_pace_10k:
            lines.append(f"קצב 10 ק\"מ הטוב ביותר (שקול): {_fmt_pace(ra.best_pace_10k)}/ק\"מ")
        if ra.avg_hr_per_pace:
            lines.append(f"דופק בריצה קלה ממוצע: {ra.avg_hr_per_pace:.0f} bpm")
        if ra.avg_aerobic_decoupling is not None:
            lines.append(f"ניתוק אירובי ממוצע: {ra.avg_aerobic_decoupling}%")

        lines.append("")
        lines.append("חיזוי זמני מרוץ (Riegel Formula):")
        for label, val in [
            ("5 ק\"מ", ra.predicted_5k),
            ("10 ק\"מ", ra.predicted_10k),
            ("חצי מרתון", ra.predicted_half),
            ("מרתון", ra.predicted_marathon),
        ]:
            if val:
                lines.append(f"  {label}: {val}")

        lines.append("")
        lines.append("פילוח סוגי ריצות:")
        for rtype, count in sorted(ra.run_type_counts.items(), key=lambda x: -x[1]):
            km = ra.run_type_km.get(rtype, 0)
            label = RUN_TYPE_LABELS.get(rtype, rtype)
            lines.append(f"  {label}: {count} ריצות, {km} ק\"מ")

        lines.append("")
        lines.append("מגמת ק\"מ שבועית:")
        for week, km in ra.weekly_km_trend:
            bar = "█" * int(km / 5)
            lines.append(f"  {week}: {km:5.1f} ק\"מ  {bar}")

        if any([ra.avg_cadence, ra.avg_stride_length, ra.avg_vertical_oscillation, ra.avg_ground_contact_time]):
            lines.append("")
            lines.append("ביומכניקה (ממוצעים):")
            if ra.avg_cadence:
                lines.append(f"  קדנס ממוצע: {ra.avg_cadence:.0f} צעדים/דק' {'✓ טוב' if ra.avg_cadence >= 170 else '⚠ מומלץ >170'}")
            if ra.avg_stride_length:
                lines.append(f"  אורך צעד ממוצע: {ra.avg_stride_length:.2f} מ'")
            if ra.avg_vertical_oscillation:
                lines.append(f"  תנועה אנכית: {ra.avg_vertical_oscillation:.1f} ס\"מ {'✓' if ra.avg_vertical_oscillation < 9 else '⚠ גבוה'}")
            if ra.avg_ground_contact_time:
                lines.append(f"  זמן מגע קרקע: {ra.avg_ground_contact_time:.0f} ms {'✓' if ra.avg_ground_contact_time < 250 else '⚠ ארוך'}")

        lines.append("")
        lines.append("כל הריצות:")
        for e in sorted(ra.runs, key=lambda x: x.date, reverse=True):
            label = RUN_TYPE_LABELS.get(e.run_type, e.run_type)
            pace_str = f" | {_fmt_pace(e.avg_pace_min_per_km)}/ק\"מ" if e.avg_pace_min_per_km else ""
            hr_str = f" | דופק: {e.avg_hr}" if e.avg_hr else ""
            cad_str = f" | קדנס: {e.avg_cadence}" if e.avg_cadence else ""
            elev_str = f" | עלייה: {e.elevation_gain:.0f}מ'" if e.elevation_gain else ""
            lines.append(
                f"  {e.date} | {label} | {e.distance_km:.1f} ק\"מ | "
                f"{e.duration_minutes:.0f} דק'{pace_str}{hr_str}{cad_str}{elev_str}"
            )

        return "\n".join(lines)


# ── Helpers ──────────────────────────────────────────────────────────────────

def riegel_time(base_time_min: float, base_dist_km: float, target_dist_km: float) -> float:
    """Predict finish time at target distance using Riegel formula."""
    return base_time_min * (target_dist_km / base_dist_km) ** RIEGEL_EXP


def riegel_pace(base_time_min: float, base_dist_km: float, target_dist_km: float) -> float:
    """Predicted pace (min/km) at target distance."""
    pred_time = riegel_time(base_time_min, base_dist_km, target_dist_km)
    return pred_time / target_dist_km


def _avg(vals: list) -> Optional[float]:
    clean = [v for v in vals if v is not None]
    return sum(clean) / len(clean) if clean else None


def _fmt_pace(pace: Optional[float]) -> str:
    if pace is None:
        return ""
    m = int(pace)
    s = int((pace - m) * 60)
    return f"{m}:{s:02d}"


def _format_time(minutes: float) -> str:
    h = int(minutes // 60)
    m = int(minutes % 60)
    s = int((minutes - int(minutes)) * 60)
    if h > 0:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"
