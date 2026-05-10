"""Garmin Connect client - fetches workout data from Garmin Connect."""

import os
from datetime import datetime, timedelta
from typing import Optional
import garminconnect
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn

from .models import Activity

console = Console()


class GarminClient:
    def __init__(self):
        self.email = os.environ["GARMIN_EMAIL"]
        self.password = os.environ["GARMIN_PASSWORD"]
        self._client: Optional[garminconnect.Garmin] = None

    def connect(self) -> None:
        console.print("[cyan]Connecting to Garmin Connect...[/cyan]")
        try:
            self._client = garminconnect.Garmin(self.email, self.password)
            self._client.login()
            console.print("[green]Connected to Garmin Connect[/green]")
        except garminconnect.GarminConnectAuthenticationError:
            console.print("[red]Authentication failed. Check your GARMIN_EMAIL and GARMIN_PASSWORD.[/red]")
            raise
        except garminconnect.GarminConnectConnectionError:
            console.print("[red]Connection failed. Check your internet connection.[/red]")
            raise
        except Exception as e:
            console.print(f"[red]Login failed: {e}[/red]")
            raise

    def get_activities(self, weeks: int = 4) -> list[Activity]:
        if not self._client:
            self.connect()

        end_date = datetime.now()
        start_date = end_date - timedelta(weeks=weeks)

        activities = []

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
        ) as progress:
            task = progress.add_task(
                f"Fetching activities for the last {weeks} weeks...", total=None
            )

            try:
                raw_activities = self._client.get_activities_by_date(
                    start_date.strftime("%Y-%m-%d"),
                    end_date.strftime("%Y-%m-%d"),
                )
                progress.update(task, description=f"Processing {len(raw_activities)} activities...")

                for raw in raw_activities:
                    activity = self._parse_activity(raw)
                    if activity:
                        activities.append(activity)

            except Exception as e:
                console.print(f"[red]Failed to fetch activities: {e}[/red]")
                raise

        console.print(f"[green]Fetched {len(activities)} activities[/green]")
        return activities

    def get_user_profile(self) -> dict:
        if not self._client:
            self.connect()
        try:
            return self._client.get_user_profile() or {}
        except Exception:
            return {}

    def _parse_activity(self, raw: dict) -> Optional[Activity]:
        try:
            activity_type = (
                raw.get("activityType", {}).get("typeKey", "unknown")
                if isinstance(raw.get("activityType"), dict)
                else str(raw.get("activityType", "unknown"))
            )

            duration = float(raw.get("duration", 0) or 0)
            distance = float(raw.get("distance", 0) or 0)

            avg_speed = raw.get("averageSpeed")
            avg_pace = None
            if avg_speed and avg_speed > 0 and activity_type in (
                "running", "trail_running", "treadmill_running", "track_running"
            ):
                avg_pace = 1000 / (avg_speed * 60)

            return Activity(
                activity_id=str(raw.get("activityId", "")),
                name=str(raw.get("activityName", "Unknown")),
                type=activity_type,
                start_time=str(raw.get("startTimeLocal", "")),
                duration_seconds=duration,
                distance_meters=distance,
                avg_heart_rate=_safe_int(raw.get("averageHR")),
                max_heart_rate=_safe_int(raw.get("maxHR")),
                calories=_safe_int(raw.get("calories")),
                avg_speed=_safe_float(avg_speed),
                avg_pace_min_per_km=avg_pace,
                elevation_gain=_safe_float(raw.get("elevationGain")),
                avg_power=_safe_int(raw.get("avgPower")),
                training_effect=_safe_float(raw.get("trainingEffect")),
                aerobic_training_effect=_safe_float(raw.get("aerobicTrainingEffect")),
                anaerobic_training_effect=_safe_float(raw.get("anaerobicTrainingEffect")),
            )
        except Exception as e:
            console.print(f"[yellow]Warning: skipping activity due to parse error: {e}[/yellow]")
            return None


def _safe_int(val) -> Optional[int]:
    try:
        return int(val) if val is not None else None
    except (ValueError, TypeError):
        return None


def _safe_float(val) -> Optional[float]:
    try:
        return float(val) if val is not None else None
    except (ValueError, TypeError):
        return None
