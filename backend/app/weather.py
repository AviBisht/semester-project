import requests
import logging

logger = logging.getLogger(__name__)

# Coordinates for Dehradun, Uttarakhand
DEHRADUN_LAT = 30.3165
DEHRADUN_LON = 78.0322

# Reliable mock data fallback in case network is down or API is blocked
MOCK_WEATHER_DATA = {
    "city": "Dehradun, Uttarakhand",
    "temperature": 23.5,
    "humidity": 78,
    "precipitation": 3.2,
    "rain": 2.8,
    "weather_code": 61,
    "weather_description": "Moderate Rain",
    "wind_speed": 8.5,
    "is_warning": False,
    "warning_message": "Normal monsoonal precipitation observed. Monitor low-lying waterlogging zones.",
    "is_mock": True,
}

def get_weather_forecast():
    """
    Fetches live weather from Open-Meteo API for Dehradun.
    Falls back gracefully to realistic mock data on connection failure or error.
    """
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={DEHRADUN_LAT}&longitude={DEHRADUN_LON}&"
        f"current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m"
    )

    try:
        response = requests.get(url, timeout=4)
        if response.status_code == 200:
            data = response.json()
            current = data.get("current", {})
            temp = current.get("temperature_2m", 24.0)
            humidity = current.get("relative_humidity_2m", 75)
            precipitation = current.get("precipitation", 0.0)
            rain = current.get("rain", 0.0)
            code = current.get("weather_code", 0)
            wind = current.get("wind_speed_10m", 5.0)

            # Weather code interpretation
            weather_desc = "Clear / Fair"
            if code in [1, 2, 3]:
                weather_desc = "Partly Cloudy"
            elif code in [45, 48]:
                weather_desc = "Foggy"
            elif code in [51, 53, 55]:
                weather_desc = "Light Drizzle"
            elif code in [61, 63, 65]:
                weather_desc = "Rain Showers"
            elif code in [80, 81, 82]:
                weather_desc = "Heavy Rain"
            elif code in [95, 96, 99]:
                weather_desc = "Thunderstorm Alert"

            # Alert evaluation: High precipitation warning threshold (> 7.5 mm/hr or heavy rain code)
            is_warning = (precipitation >= 7.5 or rain >= 7.5 or code in [81, 82, 95, 96, 99])
            if is_warning:
                warning_message = f"HEAVY PRECIPITATION ALERT ({precipitation} mm/h): Heightened flash flood and waterlogging danger in Dehradun foothills!"
            else:
                warning_message = "Current weather conditions within manageable safety thresholds."

            return {
                "city": "Dehradun, Uttarakhand",
                "temperature": temp,
                "humidity": humidity,
                "precipitation": precipitation,
                "rain": rain,
                "weather_code": code,
                "weather_description": weather_desc,
                "wind_speed": wind,
                "is_warning": is_warning,
                "warning_message": warning_message,
                "is_mock": False,
            }
        else:
            logger.warning(f"Open-Meteo returned status {response.status_code}, falling back to mock")
            return MOCK_WEATHER_DATA
    except Exception as e:
        logger.warning(f"Failed to fetch Open-Meteo weather: {e}, falling back to mock data")
        return MOCK_WEATHER_DATA
