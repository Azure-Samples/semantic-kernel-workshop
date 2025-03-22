import random
from typing import Dict, List, Annotated
from semantic_kernel.functions.kernel_function_decorator import kernel_function

class WeatherPlugin:
    def __init__(self):
        # Simulated weather data
        self.weather_conditions = ["Sunny", "Cloudy", "Rainy", "Snowy", "Windy", "Foggy", "Stormy"]
        self.temperature_ranges = {
            "New York": (50, 85),
            "London": (45, 75),
            "Tokyo": (55, 90),
            "Sydney": (60, 95),
            "Paris": (48, 80),
            "Default": (40, 100)
        }
        
        # Simulated alerts
        self.alerts = {
            "New York": "Heat advisory in effect",
            "Tokyo": "Typhoon warning for coastal areas",
            "Sydney": None,
            "London": None,
            "Paris": "Air quality warning"
        }
    
    @kernel_function
    async def get_current_weather(
        self,
        location: Annotated[str, "The city name to get weather for"]
    ) -> Dict:
        """Gets the current weather for a specified location."""
        temp_range = self.temperature_ranges.get(location, self.temperature_ranges["Default"])
        temperature = random.randint(temp_range[0], temp_range[1])
        condition = random.choice(self.weather_conditions)
        
        return {
            "location": location,
            "temperature": temperature,
            "condition": condition,
            "humidity": random.randint(30, 95),
            "wind_speed": random.randint(0, 30)
        }
    
    @kernel_function
    async def get_forecast(
        self,
        location: Annotated[str, "The city name to get forecast for"],
        days: Annotated[int, "Number of days for the forecast"] = 3
    ) -> List[Dict]:
        """Gets a weather forecast for a specified number of days."""
        forecast = []
        temp_range = self.temperature_ranges.get(location, self.temperature_ranges["Default"])
        
        for i in range(days):
            forecast.append({
                "day": i + 1,
                "temperature": random.randint(temp_range[0], temp_range[1]),
                "condition": random.choice(self.weather_conditions),
                "humidity": random.randint(30, 95),
                "wind_speed": random.randint(0, 30)
            })
        
        return forecast
    
    @kernel_function
    async def get_weather_alert(
        self,
        location: Annotated[str, "The city name to check for weather alerts"]
    ) -> Dict:
        """Gets any active weather alerts for a location."""
        alert = self.alerts.get(location)
        
        return {
            "location": location,
            "has_alert": alert is not None,
            "alert_message": alert if alert else "No active alerts"
        }
