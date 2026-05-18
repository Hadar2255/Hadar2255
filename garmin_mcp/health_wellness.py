"""Health and wellness data tools for Garmin Connect MCP server."""

import json

garmin_client = None


def configure(client):
    global garmin_client
    garmin_client = client


def _clean(d) -> dict:
    if isinstance(d, dict):
        return {k: v for k, v in d.items() if v is not None}
    return d


def register_tools(app):

    @app.tool()
    async def get_steps(date: str) -> str:
        """Get daily step count and distance for a given date.

        Args:
            date: Date in YYYY-MM-DD format
        """
        try:
            data = garmin_client.get_steps_data(date)
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching steps for {date}: {e}"

    @app.tool()
    async def get_heart_rate(date: str) -> str:
        """Get heart rate summary (resting HR, min, max) for a date.

        Args:
            date: Date in YYYY-MM-DD format
        """
        try:
            data = garmin_client.get_heart_rates(date)
            summary = _clean({
                "date": date,
                "restingHR": data.get("restingHeartRate"),
                "minHR": data.get("minHeartRate"),
                "maxHR": data.get("maxHeartRate"),
                "lastSevenDaysAvgRestingHR": data.get("lastSevenDaysAvgRestingHeartRate"),
            })
            return json.dumps(summary, indent=2)
        except Exception as e:
            return f"Error fetching heart rate for {date}: {e}"

    @app.tool()
    async def get_sleep(date: str) -> str:
        """Get sleep summary for a given date.

        Args:
            date: Date in YYYY-MM-DD format
        """
        try:
            data = garmin_client.get_sleep_data(date)
            daily = data.get("dailySleepDTO", {}) if data else {}
            summary = _clean({
                "date": date,
                "duration_hours": round(daily.get("sleepTimeSeconds", 0) / 3600, 1) if daily.get("sleepTimeSeconds") else None,
                "deep_hours": round(daily.get("deepSleepSeconds", 0) / 3600, 1) if daily.get("deepSleepSeconds") else None,
                "light_hours": round(daily.get("lightSleepSeconds", 0) / 3600, 1) if daily.get("lightSleepSeconds") else None,
                "rem_hours": round(daily.get("remSleepSeconds", 0) / 3600, 1) if daily.get("remSleepSeconds") else None,
                "awake_hours": round(daily.get("awakeSleepSeconds", 0) / 3600, 1) if daily.get("awakeSleepSeconds") else None,
                "score": daily.get("sleepScores", {}).get("overall", {}).get("value"),
                "startTime": daily.get("sleepStartTimestampLocal"),
                "endTime": daily.get("sleepEndTimestampLocal"),
            })
            return json.dumps(summary, indent=2)
        except Exception as e:
            return f"Error fetching sleep data for {date}: {e}"

    @app.tool()
    async def get_hrv(date: str) -> str:
        """Get HRV (Heart Rate Variability) summary for a date.

        Args:
            date: Date in YYYY-MM-DD format
        """
        try:
            data = garmin_client.get_hrv_data(date)
            hrv = data.get("hrvSummary", {}) if data else {}
            summary = _clean({
                "date": date,
                "weeklyAvg": hrv.get("weeklyAvg"),
                "lastNight": hrv.get("lastNight"),
                "lastNight5MinHigh": hrv.get("lastNight5MinHigh"),
                "baseline": hrv.get("baseline", {}).get("lowUpper") if hrv.get("baseline") else None,
                "status": hrv.get("status"),
                "feedbackPhrase": hrv.get("feedbackPhrase"),
            })
            return json.dumps(summary, indent=2)
        except Exception as e:
            return f"Error fetching HRV for {date}: {e}"

    @app.tool()
    async def get_stress(date: str) -> str:
        """Get stress level data for a date.

        Args:
            date: Date in YYYY-MM-DD format
        """
        try:
            data = garmin_client.get_stress_data(date)
            return json.dumps(_clean({
                "date": date,
                "avgStress": data.get("avgStressLevel"),
                "maxStress": data.get("maxStressLevel"),
                "restStress": data.get("restStressDuration"),
                "lowStress": data.get("lowStressDuration"),
                "mediumStress": data.get("mediumStressDuration"),
                "highStress": data.get("highStressDuration"),
            }), indent=2)
        except Exception as e:
            return f"Error fetching stress data for {date}: {e}"

    @app.tool()
    async def get_body_battery(date: str) -> str:
        """Get Body Battery energy monitor data for a date.

        Args:
            date: Date in YYYY-MM-DD format
        """
        try:
            data = garmin_client.get_body_battery(date)
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching Body Battery for {date}: {e}"

    @app.tool()
    async def get_spo2(date: str) -> str:
        """Get blood oxygen (SpO2) data for a date.

        Args:
            date: Date in YYYY-MM-DD format
        """
        try:
            data = garmin_client.get_spo2_data(date)
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching SpO2 for {date}: {e}"

    @app.tool()
    async def get_respiration(date: str) -> str:
        """Get respiration rate data for a date.

        Args:
            date: Date in YYYY-MM-DD format
        """
        try:
            data = garmin_client.get_respiration_data(date)
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching respiration data for {date}: {e}"

    @app.tool()
    async def get_intensity_minutes(date: str) -> str:
        """Get intensity minutes (moderate and vigorous) for a date.

        Args:
            date: Date in YYYY-MM-DD format
        """
        try:
            data = garmin_client.get_intensity_minutes_data(date)
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching intensity minutes for {date}: {e}"

    @app.tool()
    async def get_floors(date: str) -> str:
        """Get floors climbed data for a date.

        Args:
            date: Date in YYYY-MM-DD format
        """
        try:
            data = garmin_client.get_floors(date)
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching floors data for {date}: {e}"

    @app.tool()
    async def get_training_readiness(date: str) -> str:
        """Get training readiness score and components for a date.

        Args:
            date: Date in YYYY-MM-DD format
        """
        try:
            data = garmin_client.get_training_readiness(date)
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching training readiness for {date}: {e}"

    @app.tool()
    async def get_body_composition(date: str) -> str:
        """Get body composition metrics (weight, BMI, body fat) for a date.

        Args:
            date: Date in YYYY-MM-DD format
        """
        try:
            data = garmin_client.get_body_composition(date)
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching body composition for {date}: {e}"

    @app.tool()
    async def get_resting_heart_rate(date: str) -> str:
        """Get resting heart rate for a specific date.

        Args:
            date: Date in YYYY-MM-DD format
        """
        try:
            data = garmin_client.get_rhr_day(date)
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching resting heart rate for {date}: {e}"

    return app
