"""Device management tools for Garmin Connect MCP server."""

import json

garmin_client = None


def configure(client):
    global garmin_client
    garmin_client = client


def register_tools(app):

    @app.tool()
    async def get_devices() -> str:
        """List all Garmin devices linked to the user's account."""
        try:
            data = garmin_client.get_devices()
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching devices: {e}"

    @app.tool()
    async def get_device_settings(device_id: str) -> str:
        """Get settings for a specific Garmin device.

        Args:
            device_id: Device ID string
        """
        try:
            data = garmin_client.get_device_settings(device_id)
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching device settings for {device_id}: {e}"

    @app.tool()
    async def get_device_alarms() -> str:
        """Get all alarms configured on connected Garmin devices."""
        try:
            data = garmin_client.get_device_alarms()
            return json.dumps(data, indent=2)
        except Exception as e:
            return f"Error fetching device alarms: {e}"

    return app
