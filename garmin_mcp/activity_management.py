"""Activity management tools for Garmin Connect MCP server."""

import json

garmin_client = None


def configure(client):
    global garmin_client
    garmin_client = client


def _clean(d: dict) -> dict:
    """Remove None values from a dict."""
    return {k: v for k, v in d.items() if v is not None}


def register_tools(app):

    @app.tool()
    async def get_activities(start: int = 0, limit: int = 20) -> str:
        """List recent Garmin activities with key metrics.

        Args:
            start: Offset index for pagination (default 0)
            limit: Number of activities to return (default 20, max 100)
        """
        try:
            raw = garmin_client.get_activities(start, limit)
            activities = []
            for a in raw:
                activities.append(_clean({
                    "activityId": a.get("activityId"),
                    "name": a.get("activityName"),
                    "type": a.get("activityType", {}).get("typeKey"),
                    "startTime": a.get("startTimeLocal"),
                    "distance_km": round(a.get("distance", 0) / 1000, 2) if a.get("distance") else None,
                    "duration_min": round(a.get("duration", 0) / 60, 1) if a.get("duration") else None,
                    "avgHR": a.get("averageHR"),
                    "maxHR": a.get("maxHR"),
                    "calories": a.get("calories"),
                    "avgCadence": a.get("averageRunningCadenceInStepsPerMinute"),
                    "avgPower": a.get("avgPower"),
                    "aerobicTE": a.get("aerobicTrainingEffect"),
                    "anaerobicTE": a.get("anaerobicTrainingEffect"),
                    "trainingLoad": a.get("activityTrainingLoad"),
                }))
            return json.dumps(activities, indent=2)
        except Exception as e:
            return f"Error fetching activities: {e}"

    @app.tool()
    async def get_activities_by_date(start_date: str, end_date: str, activity_type: str = "") -> str:
        """Get activities within a date range.

        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            activity_type: Optional filter (e.g. 'running', 'cycling', 'swimming')
        """
        try:
            raw = garmin_client.get_activities_by_date(start_date, end_date, activity_type or None)
            activities = []
            for a in raw:
                activities.append(_clean({
                    "activityId": a.get("activityId"),
                    "name": a.get("activityName"),
                    "type": a.get("activityType", {}).get("typeKey"),
                    "startTime": a.get("startTimeLocal"),
                    "distance_km": round(a.get("distance", 0) / 1000, 2) if a.get("distance") else None,
                    "duration_min": round(a.get("duration", 0) / 60, 1) if a.get("duration") else None,
                    "avgHR": a.get("averageHR"),
                    "maxHR": a.get("maxHR"),
                    "calories": a.get("calories"),
                    "avgCadence": a.get("averageRunningCadenceInStepsPerMinute"),
                    "avgPower": a.get("avgPower"),
                    "aerobicTE": a.get("aerobicTrainingEffect"),
                    "anaerobicTE": a.get("anaerobicTrainingEffect"),
                    "trainingLoad": a.get("activityTrainingLoad"),
                    "trainingEffectLabel": a.get("trainingEffectLabel"),
                }))
            return json.dumps(activities, indent=2)
        except Exception as e:
            return f"Error fetching activities by date: {e}"

    @app.tool()
    async def get_activity(activity_id: int) -> str:
        """Get full details for a single activity.

        Args:
            activity_id: Numeric Garmin activity ID
        """
        try:
            a = garmin_client.get_activity(activity_id)
            summary = a.get("summaryDTO", {})
            return json.dumps(_clean({
                "activityId": a.get("activityId"),
                "name": a.get("activityName"),
                "description": a.get("description"),
                "type": a.get("activityTypeDTO", {}).get("typeKey"),
                "startTime": summary.get("startTimeLocal"),
                "duration_min": round(summary.get("duration", 0) / 60, 1) if summary.get("duration") else None,
                "distance_km": round(summary.get("distance", 0) / 1000, 2) if summary.get("distance") else None,
                "elevationGain_m": summary.get("elevationGain"),
                "avgHR": summary.get("averageHR"),
                "maxHR": summary.get("maxHR"),
                "avgCadence": summary.get("averageRunningCadenceInStepsPerMinute"),
                "avgPower": summary.get("avgPower"),
                "normPower": summary.get("normPower"),
                "calories": summary.get("calories"),
                "aerobicTE": summary.get("aerobicTrainingEffect"),
                "anaerobicTE": summary.get("anaerobicTrainingEffect"),
                "trainingLoad": summary.get("activityTrainingLoad"),
                "avgSpeed_kmh": round(summary.get("averageSpeed", 0) * 3.6, 2) if summary.get("averageSpeed") else None,
                "maxSpeed_kmh": round(summary.get("maxSpeed", 0) * 3.6, 2) if summary.get("maxSpeed") else None,
            }), indent=2)
        except Exception as e:
            return f"Error fetching activity {activity_id}: {e}"

    @app.tool()
    async def get_activity_splits(activity_id: int) -> str:
        """Get lap/split data for an activity.

        Args:
            activity_id: Numeric Garmin activity ID
        """
        try:
            splits = garmin_client.get_activity_splits(activity_id)
            laps = splits.get("lapDTOs", [])
            result = []
            for lap in laps:
                result.append(_clean({
                    "lap": lap.get("lapIndex"),
                    "startTime": lap.get("startTimeLocal"),
                    "duration_min": round(lap.get("duration", 0) / 60, 2) if lap.get("duration") else None,
                    "distance_km": round(lap.get("distance", 0) / 1000, 2) if lap.get("distance") else None,
                    "avgHR": lap.get("averageHR"),
                    "maxHR": lap.get("maxHR"),
                    "avgCadence": lap.get("averageRunCadence"),
                    "avgPower": lap.get("avgPower"),
                    "avgSpeed_kmh": round(lap.get("averageSpeed", 0) * 3.6, 2) if lap.get("averageSpeed") else None,
                }))
            return json.dumps(result, indent=2)
        except Exception as e:
            return f"Error fetching splits for activity {activity_id}: {e}"

    @app.tool()
    async def get_activity_hr_zones(activity_id: int) -> str:
        """Get heart-rate zone distribution for an activity.

        Args:
            activity_id: Numeric Garmin activity ID
        """
        try:
            data = garmin_client.get_activity_hr_in_timezones(activity_id)
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching HR zones for activity {activity_id}: {e}"

    @app.tool()
    async def get_activity_weather(activity_id: int) -> str:
        """Get weather conditions recorded during an activity.

        Args:
            activity_id: Numeric Garmin activity ID
        """
        try:
            data = garmin_client.get_activity_weather(activity_id)
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching weather for activity {activity_id}: {e}"

    @app.tool()
    async def get_activities_count() -> str:
        """Return the total number of activities logged in Garmin Connect."""
        try:
            data = garmin_client.get_activities_count()
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching activity count: {e}"

    @app.tool()
    async def update_activity_name(activity_id: int, name: str) -> str:
        """Rename a Garmin activity.

        Args:
            activity_id: Numeric Garmin activity ID
            name: New name for the activity
        """
        try:
            garmin_client.set_activity_name(activity_id, name)
            return json.dumps({"status": "success", "activity_id": activity_id, "new_name": name})
        except Exception as e:
            return f"Error updating activity name: {e}"

    return app
