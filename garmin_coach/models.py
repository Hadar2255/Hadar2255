"""Data models for workout and analysis data."""

from dataclasses import dataclass, field
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

    @property
    def duration_minutes(self) -> float:
        return self.duration_seconds / 60

    @property
    def distance_km(self) -> float:
        return self.distance_meters / 1000


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
class FitnessProfile:
    user_name: str
    fitness_goal: str
    weeks_analyzed: int
    total_activities: int
    weekly_stats: list[WeeklyStats]
    all_activities: list[Activity]
    dominant_sport: str
    avg_weekly_hours: float
    avg_weekly_distance_km: float
    estimated_fitness_level: str


@dataclass
class CoachingPlan:
    weekly_training_plan: str
    nutrition_plan: str
    pre_workout_nutrition: str
    post_workout_nutrition: str
    recovery_advice: str
    weekly_goals: str
    motivational_note: str
