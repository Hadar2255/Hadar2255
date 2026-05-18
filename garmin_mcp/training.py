"""Training and performance analysis tools for Garmin Connect MCP server."""

import json

garmin_client = None


def configure(client):
    global garmin_client
    garmin_client = client


def _clean(d: dict) -> dict:
    return {k: v for k, v in d.items() if v is not None}


def register_tools(app):

    @app.tool()
    async def get_training_status(date: str) -> str:
        """Get training status with load balance and VO2 max info.

        Args:
            date: Date in YYYY-MM-DD format
        """
        try:
            data = garmin_client.get_training_status(date)
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching training status for {date}: {e}"

    @app.tool()
    async def get_training_load_trends(start_date: str, end_date: str) -> str:
        """Get training load trends (CTL/ATL/TSB) over a date range.

        Args:
            start_date: Start date YYYY-MM-DD
            end_date: End date YYYY-MM-DD (max 90-day range recommended)
        """
        try:
            data = garmin_client.get_training_load_trends(start_date, end_date)
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching training load trends: {e}"

    @app.tool()
    async def get_vo2max(date: str) -> str:
        """Get VO2 max estimate for a given date.

        Args:
            date: Date in YYYY-MM-DD format
        """
        try:
            data = garmin_client.get_vo2max_data(date)
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching VO2 max for {date}: {e}"

    @app.tool()
    async def get_hrv_trends(start_date: str, end_date: str) -> str:
        """Get HRV trends over a date range.

        Args:
            start_date: Start date YYYY-MM-DD
            end_date: End date YYYY-MM-DD
        """
        try:
            results = []
            from datetime import date, timedelta
            d = date.fromisoformat(start_date)
            end = date.fromisoformat(end_date)
            while d <= end:
                try:
                    hrv = garmin_client.get_hrv_data(str(d))
                    if hrv and hrv.get("hrvSummary"):
                        h = hrv["hrvSummary"]
                        results.append(_clean({
                            "date": str(d),
                            "lastNight": h.get("lastNight"),
                            "weeklyAvg": h.get("weeklyAvg"),
                            "status": h.get("status"),
                        }))
                except Exception:
                    pass
                d += timedelta(days=1)
            return json.dumps(results, indent=2)
        except Exception as e:
            return f"Error fetching HRV trends: {e}"

    @app.tool()
    async def get_fitness_age(date: str) -> str:
        """Get fitness age calculation for a given date.

        Args:
            date: Date in YYYY-MM-DD format
        """
        try:
            data = garmin_client.get_fitness_age(date)
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching fitness age for {date}: {e}"

    @app.tool()
    async def get_lactate_threshold() -> str:
        """Get lactate threshold data (if available for your device)."""
        try:
            data = garmin_client.get_lactate_threshold()
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching lactate threshold: {e}"

    @app.tool()
    async def get_cycling_ftp() -> str:
        """Get Functional Threshold Power (FTP) for cycling."""
        try:
            data = garmin_client.get_ftp()
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching cycling FTP: {e}"

    @app.tool()
    async def get_endurance_score(date: str) -> str:
        """Get endurance score for a given date.

        Args:
            date: Date in YYYY-MM-DD format
        """
        try:
            data = garmin_client.get_endurance_score(date)
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching endurance score for {date}: {e}"

    @app.tool()
    async def get_hill_score(date: str) -> str:
        """Get hill score metric for a given date.

        Args:
            date: Date in YYYY-MM-DD format
        """
        try:
            data = garmin_client.get_hill_score(date)
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching hill score for {date}: {e}"

    return app
