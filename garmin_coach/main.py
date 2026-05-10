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
    if not os.environ.get("ANTHROPIC_API_KEY"):
        console.print(
            "[red]חסר ANTHROPIC_API_KEY בקובץ .env\n"
            "קבל מפתח API בכתובת: https://console.anthropic.com[/red]"
        )
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
    demos = [
        ("ריצה בוקר", "running", 45 * 60, 9200, 152, 168, 520),
        ("ספינינג", "indoor_cycling", 55 * 60, 0, 145, 172, 480),
        ("ריצה קלה", "running", 35 * 60, 6500, 140, 155, 350),
        ("כוח", "strength_training", 50 * 60, 0, 130, 158, 380),
        ("ריצה ארוכה", "running", 75 * 60, 15000, 148, 162, 720),
        ("הליכה", "walking", 40 * 60, 4000, 115, 130, 200),
        ("ריצה + אינטרוולים", "running", 40 * 60, 8500, 165, 182, 490),
        ("יוגה", "yoga", 60 * 60, 0, 100, 120, 180),
        ("רכיבה", "cycling", 90 * 60, 35000, 142, 168, 850),
        ("ריצה בוקר", "running", 30 * 60, 5800, 148, 162, 310),
        ("כוח", "strength_training", 45 * 60, 0, 128, 155, 360),
        ("ריצה ארוכה", "running", 80 * 60, 16200, 150, 166, 780),
    ]

    activities = []
    for i, (name, atype, dur, dist, avg_hr, max_hr, cal) in enumerate(demos):
        days_ago = i * 2 + 1
        start = (base - timedelta(days=days_ago)).strftime("%Y-%m-%dT07:30:00")
        pace = (dist / 1000) / (dur / 3600) if dist > 0 else None
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
                avg_speed=pace,
                avg_pace_min_per_km=avg_pace,
                elevation_gain=float(i * 15),
                avg_power=200 if atype == "cycling" else None,
                training_effect=3.5,
                aerobic_training_effect=3.2,
                anaerobic_training_effect=1.8,
            )
        )
    return activities


def main() -> None:
    app()


if __name__ == "__main__":
    main()
