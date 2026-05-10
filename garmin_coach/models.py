"""Data models for workout and analysis data."""

from dataclasses import dataclass
from typing import Optional


@dataclass
class Activity:
    activity_id: str
    name: str
    type: str
    start_time: str
    duration_seconds: float
    distance_meters: float
    avg_heart_rate: Optional[int]
    max_heart_rate: Optional[int]
    calories: Optional[int]
    avg_speed: Optional[float]
    avg_pace_min_per_km: Optional[float]
    elevation_gain: Optional[float]
    avg_power: Optional[int]
    training_effect: Optional[float]
    aerobic_training_effect: Optional[float]
    anaerobic_training_effect: Optional[float]
    # Running-specific metrics
    avg_cadence: Optional[int]           # steps/min
    avg_stride_length: Optional[float]   # meters
    avg_vertical_oscillation: Optional[float]  # cm
    avg_ground_contact_time: Optional[int]     # ms
    training_stress_score: Optional[float]
    aerobic_decoupling: Optional[float]  # % HR drift relative to pace
    vo2max: Optional[float]              # Garmin's VO2max estimate

    @property
    def duration_minutes(self) -> float:
        return self.duration_seconds / 60

    @property
    def distance_km(self) -> float:
        return self.distance_meters / 1000

    @property
    def is_run(self) -> bool:
        return self.type in (
            "running", "trail_running", "treadmill_running", "track_running"
        )


@dataclass
class DailyHealth:
    date: str
    steps: Optional[int]
    resting_heart_rate: Optional[int]
    training_readiness_score: Optional[int]
    weight_kg: Optional[float]


@dataclass
class WeeklyStats:
    week_start: str
    total_activities: int
    total_duration_minutes: float
    total_distance_km: float
    total_calories: int
    avg_heart_rate: Optional[float]
    activity_types: dict
    longest_activity_minutes: float
    training_load: float


@dataclass
class RunEntry:
    """A single classified run."""
    date: str
    distance_km: float
    duration_minutes: float
    avg_pace_min_per_km: Optional[float]
    avg_hr: Optional[int]
    max_hr: Optional[int]
    elevation_gain: Optional[float]
    avg_cadence: Optional[int]
    avg_stride_length: Optional[float]
    avg_vertical_oscillation: Optional[float]
    avg_ground_contact_time: Optional[int]
    aerobic_decoupling: Optional[float]
    training_stress_score: Optional[float]
    run_type: str          # easy / base / tempo / threshold / interval / long


@dataclass
class RunningAnalysis:
    """All running-specific metrics across the analysis period."""
    total_runs: int
    total_running_km: float
    avg_weekly_running_km: float
    weekly_km_trend: list[tuple[str, float]]   # (week, km)

    # Run type breakdown
    run_type_counts: dict   # {type: count}
    run_type_km: dict       # {type: total_km}

    # Pace analysis
    avg_easy_pace: Optional[float]       # min/km
    avg_tempo_pace: Optional[float]
    best_pace_5k: Optional[float]        # fastest 5K equivalent pace
    best_pace_10k: Optional[float]
    pace_trend: str          # "improving" / "declining" / "stable"

    # HR efficiency
    avg_hr_per_pace: Optional[float]     # avg HR at easy pace (lower = more efficient)

    # Biomechanics (averages over all runs)
    avg_cadence: Optional[float]
    avg_stride_length: Optional[float]
    avg_vertical_oscillation: Optional[float]
    avg_ground_contact_time: Optional[float]

    # Race predictions (Riegel formula)
    predicted_5k: Optional[str]          # "MM:SS"
    predicted_10k: Optional[str]
    predicted_half: Optional[str]
    predicted_marathon: Optional[str]

    # Long run
    longest_run_km: float
    longest_run_date: str

    # Aerobic decoupling
    avg_aerobic_decoupling: Optional[float]

    # Weekly km distribution
    runs: list[RunEntry]


@dataclass
class FitnessProfile:
    user_name: str
    fitness_goal: str
    weeks_analyzed: int
    total_activities: int
    weekly_stats: list[WeeklyStats]
    all_activities: list[Activity]
    daily_health: list[DailyHealth]
    dominant_sport: str
    avg_weekly_hours: float
    avg_weekly_distance_km: float
    estimated_fitness_level: str
    avg_daily_steps: Optional[int]
    avg_resting_hr: Optional[float]
    avg_training_readiness: Optional[float]
    current_weight_kg: Optional[float]
    running_analysis: Optional[RunningAnalysis]


@dataclass
class CoachingPlan:
    weekly_training_plan: str
    nutrition_plan: str
    pre_workout_nutrition: str
    post_workout_nutrition: str
    recovery_advice: str
    weekly_goals: str
    motivational_note: str
