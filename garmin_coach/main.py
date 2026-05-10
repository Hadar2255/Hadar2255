"""Main CLI entry point for Garmin Coach."""

import os
import sys
from pathlib import Path

import typer
from dotenv import load_dotenv
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.rule import Rule
from rich.table import Table
from rich import box

from .garmin_client import GarminClient
from .data_analyzer import DataAnalyzer
from .claude_coach import ClaudeCoach
from .models import FitnessProfile, CoachingPlan

app = typer.Typer(
    name="garmin-coach",
    help="AI coach: מנתח נתוני גרמין ויוצר תוכנית אימון ותזונה אישית עם Claude",
    add_completion=False,
)
console = Console()


def _load_env() -> None:
    env_path = Path(".env")
    if env_path.exists():
        load_dotenv(env_path)
    else:
        load_dotenv()


@app.command()
def run(
    weeks: int = typer.Option(
        None, "--weeks", "-w", help="שבועות אחורה לניתוח (ברירת מחדל מ-.env)"
    ),
    goal: str = typer.Option(
        None, "--goal", "-g",
        help="מטרת אימון: running/cycling/triathlon/strength/weight_loss/general",
    ),
    name: str = typer.Option(None, "--name", "-n", help="השם שלך"),
    save: bool = typer.Option(False, "--save", "-s", help="שמור את התוכנית לקובץ"),
    demo: bool = typer.Option(False, "--demo", help="מצב הדגמה עם נתונים מדומים"),
) -> None:
    """מנתח נתוני גרמין ויוצר תוכנית אימון ותזונה שבועית מותאמת אישית."""
    _load_env()

    weeks = weeks or int(os.environ.get("WEEKS_HISTORY", "4"))
    goal = goal or os.environ.get("FITNESS_GOAL", "general")
    name = name or os.environ.get("USER_NAME", "ספורטאי")

    console.print()
    console.print(
        Panel.fit(
            f"[bold cyan]Garmin Coach[/bold cyan] powered by Claude\n"
            f"[dim]מנתח {weeks} שבועות אחרונים עבור [bold]{name}[/bold][/dim]",
            border_style="cyan",
        )
    )
    console.print()

    daily_health = []
    if demo:
        activities = _demo_activities()
        console.print("[yellow]מצב הדגמה - משתמש בנתונים מדומים[/yellow]")
    else:
        _check_garmin_env()
        client = GarminClient()
        activities, daily_health = client.get_all_data(weeks=weeks)

    if not activities:
        console.print("[red]לא נמצאו אימונים בתקופה הנבחרת.[/red]")
        raise typer.Exit(1)

    analyzer = DataAnalyzer(user_name=name, fitness_goal=goal, weeks=weeks)
    profile = analyzer.analyze(activities, daily_health)
    data_summary = analyzer.build_summary_text(profile)

    _print_stats_table(profile)

    _check_anthropic_env()
    coach = ClaudeCoach()
    plan = coach.create_plan(profile, data_summary)

    console.print()
    _print_plan(plan)

    if save:
        _save_plan(plan, name)


def _check_garmin_env() -> None:
    missing = [v for v in ("GARMIN_EMAIL", "GARMIN_PASSWORD") if not os.environ.get(v)]
    if missing:
        console.print(
            f"[red]חסרים משתני סביבה: {', '.join(missing)}\n"
            "העתק .env.example ל-.env ומלא את פרטי הגרמין.[/red]"
        )
        raise typer.Exit(1)


def _check_anthropic_env() -> None:
    if not os.environ.get("GEMINI_API_KEY") and not os.environ.get("ANTHROPIC_API_KEY"):
        console.print("[red]חסר GEMINI_API_KEY בקובץ .env[/red]")
        raise typer.Exit(1)


def _print_stats_table(profile: FitnessProfile) -> None:
    console.print(Rule("[bold]סיכום נתוני אימון", style="cyan"))
    console.print()

    info = Table(box=box.SIMPLE, show_header=False, padding=(0, 2))
    info.add_column("שדה", style="dim")
    info.add_column("ערך", style="bold")
    info.add_row("ספורט דומיננטי", profile.dominant_sport)
    info.add_row("רמת כושר משוערת", profile.estimated_fitness_level)
    info.add_row("ממוצע שעות/שבוע", str(profile.avg_weekly_hours))
    info.add_row("ממוצע ק\"מ/שבוע", str(profile.avg_weekly_distance_km))
    info.add_row("סה\"כ אימונים", str(profile.total_activities))
    if profile.avg_daily_steps:
        info.add_row("ממוצע צעדים יומי", f"{profile.avg_daily_steps:,}")
    if profile.avg_resting_hr:
        info.add_row("דופק מנוחה ממוצע", f"{profile.avg_resting_hr:.0f} bpm")
    if profile.avg_training_readiness:
        info.add_row("מוכנות אימון (Garmin)", f"{profile.avg_training_readiness:.0f}/100")
    if profile.current_weight_kg:
        info.add_row("משקל נוכחי", f"{profile.current_weight_kg:.1f} ק\"ג")
    console.print(info)

    if profile.weekly_stats:
        console.print()
        table = Table(
            title="נתונים שבועיים",
            box=box.ROUNDED,
            header_style="bold cyan",
            show_lines=False,
        )
        table.add_column("שבוע", style="dim", min_width=12)
        table.add_column("אימונים", justify="center")
        table.add_column("שעות", justify="right")
        table.add_column("ק\"מ", justify="right")
        table.add_column("קלוריות", justify="right")
        table.add_column("עומס", justify="right")

        for ws in profile.weekly_stats:
            table.add_row(
                ws.week_start,
                str(ws.total_activities),
                f"{ws.total_duration_minutes / 60:.1f}",
                f"{ws.total_distance_km:.1f}",
                str(ws.total_calories),
                f"{ws.training_load:.0f}",
            )
        console.print(table)

    ra = profile.running_analysis
    if ra:
        _print_running_analysis(ra)


def _print_running_analysis(ra) -> None:
    from .running_analyzer import RUN_TYPE_LABELS, _fmt_pace, _format_time

    console.print()
    console.print(Rule("[bold green]ניתוח ריצה מפורט", style="green"))
    console.print()

    # Summary info table
    info = Table(box=box.SIMPLE, show_header=False, padding=(0, 2))
    info.add_column("שדה", style="dim")
    info.add_column("ערך", style="bold green")
    info.add_row("סה\"כ ריצות", str(ra.total_runs))
    info.add_row("סה\"כ ק\"מ", f"{ra.total_running_km} ק\"מ")
    info.add_row("ממוצע שבועי", f"{ra.avg_weekly_running_km} ק\"מ/שבוע")
    info.add_row("ריצה ארוכה ביותר", f"{ra.longest_run_km} ק\"מ ({ra.longest_run_date})")
    info.add_row("מגמת קצב", ra.pace_trend)
    if ra.avg_easy_pace:
        info.add_row("קצב ריצה קלה", f"{_fmt_pace(ra.avg_easy_pace)}/ק\"מ")
    if ra.avg_tempo_pace:
        info.add_row("קצב טמפו", f"{_fmt_pace(ra.avg_tempo_pace)}/ק\"מ")
    if ra.best_pace_5k:
        info.add_row("קצב 5 ק\"מ (שקול)", f"{_fmt_pace(ra.best_pace_5k)}/ק\"מ")
    if ra.best_pace_10k:
        info.add_row("קצב 10 ק\"מ (שקול)", f"{_fmt_pace(ra.best_pace_10k)}/ק\"מ")
    if ra.avg_hr_per_pace:
        info.add_row("דופק בריצה קלה", f"{ra.avg_hr_per_pace:.0f} bpm")
    if ra.avg_aerobic_decoupling is not None:
        info.add_row("ניתוק אירובי", f"{ra.avg_aerobic_decoupling}%")
    console.print(info)

    # Race predictions
    preds = [
        ("5 ק\"מ", ra.predicted_5k),
        ("10 ק\"מ", ra.predicted_10k),
        ("חצי מרתון", ra.predicted_half),
        ("מרתון", ra.predicted_marathon),
    ]
    if any(v for _, v in preds):
        console.print()
        pred_table = Table(
            title="[bold]חיזוי זמני מרוץ (Riegel)",
            box=box.ROUNDED,
            header_style="bold yellow",
        )
        pred_table.add_column("מרחק", style="dim")
        pred_table.add_column("זמן חזוי", style="bold yellow", justify="center")
        for label, val in preds:
            if val:
                pred_table.add_row(label, val)
        console.print(pred_table)

    # Run type breakdown
    if ra.run_type_counts:
        console.print()
        type_table = Table(
            title="[bold]פילוח סוגי ריצות",
            box=box.ROUNDED,
            header_style="bold cyan",
        )
        type_table.add_column("סוג", style="dim")
        type_table.add_column("ריצות", justify="center")
        type_table.add_column("ק\"מ", justify="right")
        for rtype, count in sorted(ra.run_type_counts.items(), key=lambda x: -x[1]):
            km = ra.run_type_km.get(rtype, 0)
            label = RUN_TYPE_LABELS.get(rtype, rtype)
            type_table.add_row(label, str(count), f"{km:.1f}")
        console.print(type_table)

    # Biomechanics
    if any([ra.avg_cadence, ra.avg_stride_length, ra.avg_vertical_oscillation, ra.avg_ground_contact_time]):
        console.print()
        bio_table = Table(
            title="[bold]ביומכניקה (ממוצעים)",
            box=box.ROUNDED,
            header_style="bold magenta",
        )
        bio_table.add_column("מדד", style="dim", min_width=18)
        bio_table.add_column("ערך", justify="right", min_width=12)
        bio_table.add_column("טווח אידיאלי", justify="center", min_width=14)
        bio_table.add_column("סטטוס", justify="center", min_width=8)
        bio_table.add_column("מה זה אומר?", min_width=40)

        if ra.avg_cadence:
            status = "[green]✓ טוב[/green]" if ra.avg_cadence >= 170 else "[yellow]⚠ נמוך[/yellow]"
            explain = (
                "מספר הצעדים בדקה. קדנס גבוה = צעדים קצרים וקלים יותר, "
                "פחות עומס על הברכיים והמפרקים. "
                "קדנס נמוך בד\"כ גורם לדריכת עקב וסיכון פציעה גבוה יותר."
            )
            bio_table.add_row(
                "קדנס (צעדים/דק')",
                f"[bold]{ra.avg_cadence:.0f}[/bold]",
                "170–180 spm",
                status,
                explain,
            )

        if ra.avg_vertical_oscillation:
            if ra.avg_vertical_oscillation < 8:
                v_status = "[green]✓ מצוין[/green]"
            elif ra.avg_vertical_oscillation < 9.5:
                v_status = "[green]✓ טוב[/green]"
            elif ra.avg_vertical_oscillation < 11:
                v_status = "[yellow]⚠ גבוה[/yellow]"
            else:
                v_status = "[red]✗ גבוה מאוד[/red]"
            explain = (
                "כמה אתה קופץ למעלה בכל צעד (ס\"מ). "
                "קפיצה גדולה = אנרגיה מבוזבזת כלפי מעלה במקום קדימה. "
                "ריצה יעילה = תנועה אופקית, לא אנכית."
            )
            bio_table.add_row(
                "תנועה אנכית (גובה קפיצה)",
                f"[bold]{ra.avg_vertical_oscillation:.1f} ס\"מ[/bold]",
                "6.0–9.5 ס\"מ",
                v_status,
                explain,
            )

        if ra.avg_stride_length:
            bio_table.add_row(
                "אורך צעד",
                f"[bold]{ra.avg_stride_length:.2f} מ'[/bold]",
                "תלוי מהירות",
                "",
                "המרחק קדימה בכל צעד. עולה כשרצים מהר יותר. "
                "צעד ארוך מדי עם קדנס נמוך = overstriding - עומס יתר על הברך.",
            )

        if ra.avg_ground_contact_time:
            if ra.avg_ground_contact_time < 220:
                g_status = "[green]✓ מצוין[/green]"
            elif ra.avg_ground_contact_time < 260:
                g_status = "[green]✓ טוב[/green]"
            elif ra.avg_ground_contact_time < 300:
                g_status = "[yellow]⚠ ארוך[/yellow]"
            else:
                g_status = "[red]✗ ארוך מאוד[/red]"
            explain = (
                "כמה זמן הרגל נוגעת בקרקע בכל צעד (ms). "
                "זמן ארוך = הרגל 'נשארת' על הקרקע ומאטה את הריצה. "
                "ריצה מהירה = פחות זמן מגע, יותר קפיציות."
            )
            bio_table.add_row(
                "זמן מגע קרקע",
                f"[bold]{ra.avg_ground_contact_time:.0f} ms[/bold]",
                "200–260 ms",
                g_status,
                explain,
            )

        console.print(bio_table)

    # Weekly km trend
    if ra.weekly_km_trend:
        console.print()
        console.print("[bold]מגמת ק\"מ שבועית:[/bold]")
        max_km = max(km for _, km in ra.weekly_km_trend) or 1
        for week, km in ra.weekly_km_trend:
            bar_len = int(km / max_km * 30)
            bar = "█" * bar_len
            console.print(f"  {week}  [green]{km:5.1f} ק\"מ[/green]  {bar}")

    # All runs table
    if ra.runs:
        console.print()
        runs_table = Table(
            title="[bold]כל הריצות",
            box=box.SIMPLE,
            header_style="bold dim",
            show_lines=True,
        )
        runs_table.add_column("תאריך", style="dim", min_width=10)
        runs_table.add_column("סוג", min_width=12)
        runs_table.add_column("ק\"מ", justify="right")
        runs_table.add_column("דק'", justify="right")
        runs_table.add_column("קצב", justify="right")
        runs_table.add_column("דופק", justify="center")
        runs_table.add_column("קדנס", justify="center")
        runs_table.add_column("עלייה", justify="right")

        TYPE_COLORS = {
            "easy": "dim", "base": "cyan", "tempo": "yellow",
            "threshold": "red", "interval": "bold red", "long": "bold green",
        }
        for e in sorted(ra.runs, key=lambda x: x.date, reverse=True):
            label = RUN_TYPE_LABELS.get(e.run_type, e.run_type)
            color = TYPE_COLORS.get(e.run_type, "")
            runs_table.add_row(
                e.date,
                f"[{color}]{label}[/{color}]" if color else label,
                f"{e.distance_km:.1f}",
                f"{e.duration_minutes:.0f}",
                _fmt_pace(e.avg_pace_min_per_km) if e.avg_pace_min_per_km else "-",
                str(e.avg_hr) if e.avg_hr else "-",
                str(e.avg_cadence) if e.avg_cadence else "-",
                f"{e.elevation_gain:.0f}מ'" if e.elevation_gain else "-",
            )
        console.print(runs_table)


def _print_plan(plan: CoachingPlan) -> None:
    sections = [
        ("תוכנית אימון שבועית", plan.weekly_training_plan, "green"),
        ("תוכנית תזונה", plan.nutrition_plan, "yellow"),
        ("תזונה לפני אימון", plan.pre_workout_nutrition, "blue"),
        ("תזונה אחרי אימון", plan.post_workout_nutrition, "blue"),
        ("שיקום ומנוחה", plan.recovery_advice, "magenta"),
        ("יעדים לשבוע הקרוב", plan.weekly_goals, "cyan"),
        ("הערה מעוררת", plan.motivational_note, "bold white"),
    ]

    for title, content, color in sections:
        if content and content.strip():
            console.print(Rule(f"[bold {color}]{title}", style=color))
            console.print(Markdown(content))
            console.print()


def _save_plan(plan: CoachingPlan, name: str) -> None:
    from datetime import datetime

    filename = f"coaching_plan_{name}_{datetime.now().strftime('%Y%m%d_%H%M')}.md"
    lines = [
        f"# תוכנית אימון ותזונה - {name}\n",
        f"*נוצר: {datetime.now().strftime('%d/%m/%Y %H:%M')}*\n\n",
    ]

    sections = [
        ("תוכנית אימון שבועית", plan.weekly_training_plan),
        ("תוכנית תזונה", plan.nutrition_plan),
        ("תזונה לפני אימון", plan.pre_workout_nutrition),
        ("תזונה אחרי אימון", plan.post_workout_nutrition),
        ("שיקום ומנוחה", plan.recovery_advice),
        ("יעדים לשבוע הקרוב", plan.weekly_goals),
        ("הערה מעוררת", plan.motivational_note),
    ]
    for title, content in sections:
        if content and content.strip():
            lines.append(f"## {title}\n\n{content}\n\n")

    Path(filename).write_text("".join(lines), encoding="utf-8")
    console.print(f"[green]התוכנית נשמרה לקובץ: {filename}[/green]")


def _demo_activities():
    """Return realistic demo activities for testing without Garmin credentials."""
    from .models import Activity
    from datetime import datetime, timedelta

    base = datetime.now()
    # (name, type, duration_sec, distance_m, avg_hr, max_hr, calories, cadence, stride_m, vert_osc_cm, gct_ms)
    demos = [
        ("ריצה קלה בוקר",    "running",          32*60, 5800,  140, 158, 310, 162, 1.18, 8.5, 265),
        ("ספינינג עצים",      "indoor_cycling",   55*60,    0,  148, 172, 480, None, None, None, None),
        ("ריצה קלה",          "running",          38*60, 6500,  138, 154, 340, 160, 1.20, 8.8, 270),
        ("כוח - גפיים תחת",  "strength_training",50*60,    0,  128, 155, 360, None, None, None, None),
        ("ריצה ארוכה",        "running",          78*60,15800,  145, 162, 740, 165, 1.22, 8.2, 255),
        ("הליכה",             "walking",          40*60, 4000,  112, 128, 190, None, None, None, None),
        ("אינטרוולים 400מ'",  "running",          42*60, 9200,  168, 185, 510, 174, 1.35, 7.8, 230),
        ("יוגה",              "yoga",             60*60,    0,   98, 118, 170, None, None, None, None),
        ("רכיבה חוץ",         "cycling",          90*60,35000,  140, 165, 840, None, None, None, None),
        ("טמפו 5ק\"מ",        "running",          27*60, 5200,  162, 178, 380, 170, 1.32, 7.5, 238),
        ("כוח - גפיים עיל",  "strength_training",45*60,    0,  126, 152, 340, None, None, None, None),
        ("ריצה ארוכה",        "running",          88*60,17500,  148, 164, 820, 164, 1.24, 8.1, 252),
        ("ריצה קלה שיקום",    "running",          25*60, 4200,  132, 150, 240, 158, 1.16, 9.0, 275),
        ("ספינינג",           "indoor_cycling",   45*60,    0,  144, 168, 420, None, None, None, None),
        ("ריצה + סטרידס",     "running",          35*60, 6800,  150, 170, 390, 168, 1.28, 8.0, 248),
        ("רכיבה",             "cycling",          60*60,22000,  135, 158, 580, None, None, None, None),
    ]

    activities = []
    for i, (name, atype, dur, dist, avg_hr, max_hr, cal, cad, stride, vert, gct) in enumerate(demos):
        days_ago = i * 2 + 1
        start = (base - timedelta(days=days_ago)).strftime("%Y-%m-%dT07:00:00")
        avg_speed = (dist / 1000) / (dur / 3600) if dist > 0 else None
        avg_pace = (dur / 60) / (dist / 1000) if dist > 0 else None
        activities.append(
            Activity(
                activity_id=str(1000 + i),
                name=name,
                type=atype,
                start_time=start,
                duration_seconds=dur,
                distance_meters=dist,
                avg_heart_rate=avg_hr,
                max_heart_rate=max_hr,
                calories=cal,
                avg_speed=avg_speed,
                avg_pace_min_per_km=avg_pace,
                elevation_gain=float(i * 12),
                avg_power=220 if atype == "cycling" else None,
                training_effect=3.5,
                aerobic_training_effect=3.2,
                anaerobic_training_effect=1.8,
                avg_cadence=cad,
                avg_stride_length=stride,
                avg_vertical_oscillation=vert,
                avg_ground_contact_time=gct,
                training_stress_score=round(dur / 60 * (avg_hr / 180) * 0.85, 1),
                aerobic_decoupling=round(2.5 + i * 0.3, 1) if atype == "running" else None,
                vo2max=52.0,
            )
        )
    return activities


def main() -> None:
    app()


if __name__ == "__main__":
    main()
