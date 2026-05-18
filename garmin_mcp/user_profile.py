"""User profile tools for Garmin Connect MCP server."""

import json

garmin_client = None


def configure(client):
    global garmin_client
    garmin_client = client


def register_tools(app):

    @app.tool()
    async def get_user_profile() -> str:
        """Get the authenticated user's Garmin Connect profile."""
        try:
            data = garmin_client.get_user_profile()
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching user profile: {e}"

    @app.tool()
    async def get_user_summary(date: str) -> str:
        """Get a user's daily summary stats for a given date.

        Args:
            date: Date in YYYY-MM-DD format
        """
        try:
            data = garmin_client.get_user_summary(date)
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching user summary for {date}: {e}"

    @app.tool()
    async def get_full_name() -> str:
        """Get the authenticated user's full name."""
        try:
            name = garmin_client.get_full_name()
            return json.dumps({"full_name": name})
        except Exception as e:
            return f"Error fetching full name: {e}"

    @app.tool()
    async def get_unit_system() -> str:
        """Get the user's configured unit system (metric or imperial)."""
        try:
            unit = garmin_client.get_unit_system()
            return json.dumps({"unit_system": unit})
        except Exception as e:
            return f"Error fetching unit system: {e}"

    return app
