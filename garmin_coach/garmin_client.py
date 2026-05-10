"""Garmin Connect client - fetches workout data from Garmin Connect.

Uses token caching (garth) so login with email/password happens only once.
Inspired by: github.com/santoshyadavdev/garmin-api
"""

import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import garminconnect
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn

from .models import Activity, DailyHealth

console = Console()

DEFAULT_TOKEN_STORE = str(Path.home() / ".garminconnect")


class GarminClient:
    def __init__(self):
        self.email = os.environ.get("GARMIN_EMAIL", "")
        self.password = os.environ.get("GARMIN_PASSWORD", "")
        self.tokenstore = os.environ.get("GARMINTOKENS", DEFAULT_TOKEN_STORE)
        self._client: Optional[garminconnect.Garmin] = None

    def connect(self) -> None:
        console.print("[cyan]Connecting to Garmin Connect...[/cyan]")

        # Try cached tokens first (no password needed)
        try:
            api = garminconnect.Garmin()
            api.login(self.tokenstore)
            self._client = api
            console.print("[green]Connected via cached tokens[/green]")
            return
        except Exception:
            pass

        # Fall back to email/password and save tokens for next time
        if not self.email or not self.password:
            console.print(
                "[red]No cached tokens found. Set GARMIN_EMAIL and GARMIN_PASSWORD in .env[/red]"
            )
            raise ValueError("Missing Garmin credentials")

        try:
            api = garminconnect.Garmin(self.email, self.password)
            api.login()
            api.garth.dump(self.tokenstore)
            console.print(f"[green]Connected and tokens saved to {self.tokenstore}[/green]")
            self._client = api
        except garminconnect.GarminConnectAuthenticationError:
            console.print("[red]Authentication failed. Check GARMIN_EMAIL and GARMIN_PASSWORD.[/red]")
            raise
        except garminconnect.GarminConnectConnectionError:
            console.print("[red]Connection failed. Check your internet connection.[/red]")
            raise
        except Exception as e:
            console.print(f"[red]Login failed: {e}[/red]")
            raise

    def get_all_data(self, weeks: int = 4) -> tuple[list[Activity], list[DailyHealth]]:
        """Fetch activities and daily health metrics together."""
        if not self._client:
            self.connect()

        activities = self._fetch_activities(weeks)
        health = self._fetch_daily_health(weeks)
        return activities, health

    def get_activities(self, weeks: int = 4) -> list[Activity]:
        if not self._client:
            self.connect()
        return self._fetch_activities(weeks)

    def _fetch_activities(self, weeks: int) -> list[Activity]:
        end_date = datetime.now()
        start_date = end_date - timedelta(weeks=weeks)
        activities = []

        with Progress(SpinnerColumn(), TextColumn("{task.description}"), console=console) as p:
            task = p.add_task(f"שולף אימונים מ-{weeks} שבועות אחרונים...", total=None)
            try:
                raw_list = self._client.get_activities_by_date(
                    start_date.strftime("%Y-%m-%d"),
                    end_date.strftime("%Y-%m-%d"),
                )
                p.update(task, description=f"מעבד {len(raw_list)} אימונים...")
                for raw in raw_list:
                    a = self._parse_activity(raw)
                    if a:
                        activities.append(a)
            except Exception as e:
                console.print(f"[red]Failed to fetch activities: {e}[/red]")
                raise

        console.print(f"[green]נמצאו {len(activities)} אימונים[/green]")
        return activities

    def _fetch_daily_health(self, weeks: int) -> list[DailyHealth]:
        """Fetch daily health metrics: steps, HR, training readiness, body composition."""
        health_records: list[DailyHealth] = []
        today = datetime.now()

        with Progress(SpinnerColumn(), TextColumn("{task.description}"), console=console) as p:
            p.add_task("שולף נתוני בריאות יומיים...", total=None)

            for day_offset in range(weeks * 7):
                date = today - timedelta(days=day_offset)
                date_str = date.strftime("%Y-%m-%d")
                record = self._fetch_day_health(date_str)
                if record:
                    health_records.append(record)

        console.print(f"[green]נמצאו {len(health_records)} ימי נתוני בריאות[/green]")
        return health_records

    def _fetch_day_health(self, date_str: str) -> Optional[DailyHealth]:
        steps = None
        resting_hr = None
        training_readiness = None
        weight_kg = None

        try:
            steps_data = self._client.get_steps_data(date_str)
            if steps_data and isinstance(steps_data, list) and steps_data:
                steps = sum(
                    int(s.get("steps", 0) or 0)
                    for s in steps_data
                    if isinstance(s, dict)
                )
        except Exception:
            pass

        try:
            hr_data = self._client.get_heart_rates(date_str)
            if isinstance(hr_data, dict):
                resting_hr = _safe_int(hr_data.get("restingHeartRate"))
        except Exception:
            pass

        try:
            readiness = self._client.get_training_readiness(date_str)
            if isinstance(readiness, dict):
                training_readiness = _safe_int(
                    readiness.get("score") or readiness.get("trainingReadinessScore")
                )
        except Exception:
            pass

        try:
            body = self._client.get_body_composition(date_str)
            if isinstance(body, dict):
                entries = body.get("dateWeightList") or body.get("totalAverage") or {}
                if isinstance(entries, list) and entries:
                    weight_kg = _safe_float(entries[0].get("weight"))
                elif isinstance(entries, dict):
                    weight_kg = _safe_float(entries.get("weight"))
        except Exception:
            pass

        if any(v is not None for v in [steps, resting_hr, training_readiness, weight_kg]):
            return DailyHealth(
                date=date_str,
                steps=steps,
                resting_heart_rate=resting_hr,
                training_readiness_score=training_readiness,
                weight_kg=weight_kg,
            )
        return None

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
                # Running biomechanics
                avg_cadence=_safe_int(
                    raw.get("averageRunningCadenceInStepsPerMinute")
                    or raw.get("averageBikingCadenceInRevPerMinute")
                    or raw.get("averageCadence")
                ),
                avg_stride_length=_safe_float(raw.get("avgStrideLength")),
                avg_vertical_oscillation=_safe_float(raw.get("avgVerticalOscillation")),
                avg_ground_contact_time=_safe_int(raw.get("avgGroundContactTime")),
                training_stress_score=_safe_float(raw.get("trainingStressScore")),
                aerobic_decoupling=_safe_float(raw.get("aerobicTrainingEffect")),
                vo2max=_safe_float(raw.get("vO2MaxValue") or raw.get("vo2MaxPreciseValue")),
            )
        except Exception as e:
            console.print(f"[yellow]Warning: skipping activity: {e}[/yellow]")
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
