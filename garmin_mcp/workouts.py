"""Workout management tools for Garmin Connect MCP server."""

import json
from typing import Optional

garmin_client = None


def configure(client):
    global garmin_client
    garmin_client = client


def _clean(d: dict) -> dict:
    return {k: v for k, v in d.items() if v is not None}


def _curate_workout_summary(w: dict) -> dict:
    return _clean({
        "workoutId": w.get("workoutId"),
        "workoutUuid": w.get("workoutUuid"),
        "workoutName": w.get("workoutName"),
        "description": w.get("description"),
        "sportType": w.get("sportType", {}).get("sportTypeKey"),
        "estimatedDurationSecs": w.get("estimatedDurationInSecs"),
        "estimatedDistanceMeters": w.get("estimatedDistanceInMeters"),
    })


def _fix_hr_zone_step(step: dict) -> dict:
    """Convert targetValueOne (1-5 zone number) to proper zoneNumber field."""
    if step.get("targetType", {}).get("workoutTargetTypeKey") == "heart.rate.zone":
        tv1 = step.get("targetValueOne")
        if tv1 is not None and 1 <= int(tv1) <= 5 and not step.get("zoneNumber"):
            step["zoneNumber"] = int(tv1)
            step.pop("targetValueOne", None)
            step.pop("targetValueTwo", None)
    return step


def register_tools(app):

    @app.tool()
    async def get_workouts(start: int = 0, limit: int = 20) -> str:
        """List saved workouts in Garmin Connect.

        Args:
            start: Offset index for pagination (default 0)
            limit: Number of workouts to return (default 20)
        """
        try:
            raw = garmin_client.get_workouts(start, limit)
            return json.dumps([_curate_workout_summary(w) for w in raw], indent=2)
        except Exception as e:
            return f"Error fetching workouts: {e}"

    @app.tool()
    async def get_workout_by_id(workout_id: str) -> str:
        """Get full details of a workout by ID.

        Args:
            workout_id: Workout ID (numeric or UUID string)
        """
        try:
            try:
                wid = int(workout_id)
            except ValueError:
                wid = workout_id
            data = garmin_client.get_workout(wid)
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching workout {workout_id}: {e}"

    @app.tool()
    async def upload_workout(workout_json: dict) -> str:
        """Upload / create a new workout in Garmin Connect.

        Args:
            workout_json: Full Garmin Connect workout JSON object
        """
        try:
            result = garmin_client.upload_workout(workout_json)
            if isinstance(result, dict):
                return json.dumps(_clean({
                    "status": "success",
                    "workout_id": result.get("workoutId"),
                    "name": result.get("workoutName"),
                    "message": "Workout uploaded successfully",
                }), indent=2)
            return json.dumps(result, indent=2)
        except Exception as e:
            return f"Error uploading workout: {e}"

    @app.tool()
    async def upload_workouts(workouts: list) -> str:
        """Upload multiple workouts to Garmin Connect in a single call.

        Args:
            workouts: List of Garmin Connect workout JSON objects
        """
        try:
            results = []
            for w in workouts:
                try:
                    result = garmin_client.upload_workout(w)
                    results.append(_clean({
                        "status": "success",
                        "workout_id": result.get("workoutId") if isinstance(result, dict) else None,
                        "name": w.get("workoutName"),
                    }))
                except Exception as e:
                    results.append({"status": "error", "name": w.get("workoutName"), "error": str(e)})
            return json.dumps(results, indent=2)
        except Exception as e:
            return f"Error uploading workouts: {e}"

    @app.tool()
    async def schedule_workout(workout_id: int, date: str) -> str:
        """Schedule an existing workout to a calendar date.

        Args:
            workout_id: Numeric workout ID
            date: Date in YYYY-MM-DD format
        """
        try:
            garmin_client.schedule_workout(workout_id, date)
            return json.dumps({"status": "success", "workout_id": workout_id, "date": date})
        except Exception as e:
            return f"Error scheduling workout {workout_id}: {e}"

    @app.tool()
    async def schedule_workouts(items: list) -> str:
        """Schedule multiple workouts to calendar dates.

        Args:
            items: List of objects with workout_id (int) and date (YYYY-MM-DD)
        """
        try:
            results = []
            for item in items:
                wid = int(item["workout_id"])
                d = item["date"]
                try:
                    garmin_client.schedule_workout(wid, d)
                    results.append({"workout_id": wid, "date": d, "status": "scheduled"})
                except Exception as e:
                    results.append({"workout_id": wid, "date": d, "status": "error", "error": str(e)})
            return json.dumps(results, indent=2)
        except Exception as e:
            return f"Error scheduling workouts: {e}"

    @app.tool()
    async def delete_workout(workout_id: int) -> str:
        """Delete a workout from Garmin Connect.

        Args:
            workout_id: Numeric workout ID to delete
        """
        try:
            garmin_client.delete_workout(workout_id)
            return json.dumps({"status": "success", "deleted_workout_id": workout_id})
        except Exception as e:
            return f"Error deleting workout {workout_id}: {e}"

    @app.tool()
    async def delete_workouts(workout_ids: list) -> str:
        """Delete multiple workouts from Garmin Connect.

        Args:
            workout_ids: List of numeric workout IDs to delete
        """
        try:
            results = []
            for wid in workout_ids:
                try:
                    garmin_client.delete_workout(int(wid))
                    results.append({"workout_id": wid, "status": "deleted"})
                except Exception as e:
                    results.append({"workout_id": wid, "status": "error", "error": str(e)})
            return json.dumps(results, indent=2)
        except Exception as e:
            return f"Error deleting workouts: {e}"

    @app.tool()
    async def get_scheduled_workouts(start_date: str, end_date: str) -> str:
        """Get workouts scheduled on the Garmin calendar between two dates.

        Args:
            start_date: Start date YYYY-MM-DD
            end_date: End date YYYY-MM-DD
        """
        try:
            data = garmin_client.get_calendar(start_date, end_date)
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching scheduled workouts: {e}"

    return app
