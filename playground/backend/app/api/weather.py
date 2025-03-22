import logging
import json
from fastapi import APIRouter, HTTPException
from app.models.api_models import WeatherRequest
from app.core.kernel import create_kernel
from semantic_kernel.connectors.ai.open_ai import AzureChatPromptExecutionSettings
from semantic_kernel.contents.chat_history import ChatHistory
from semantic_kernel.connectors.ai.function_choice_behavior import FunctionChoiceBehavior
from semantic_kernel.agents import ChatCompletionAgent
from semantic_kernel.contents import FunctionCallContent

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(tags=["weather"])

@router.post("/weather")
async def get_weather(request: WeatherRequest):
    kernel, _ = create_kernel()
    try:
        # Register the Weather plugin
        from app.plugins.weather import WeatherPlugin
        weather_plugin = WeatherPlugin()
        kernel.add_plugin(weather_plugin, "Weather")
        
        # Create a system message for the chat
        system_message = """
        You are a helpful weather assistant. When asked about weather, use the Weather plugin to get accurate information.
        For weather queries, first determine the location, then call the appropriate weather functions to get the data.
        Always use get_current_weather for current conditions, get_forecast for future predictions, and get_weather_alert for any warnings."""
        
        # Create a chat completion agent
        agent = ChatCompletionAgent(
            kernel=kernel,
            name="WeatherAgent",
            instructions=system_message
        )
        
        # Create a chat history with the user query
        chat_history = ChatHistory()
        chat_history.add_user_message(request.query)
        
        # Set up execution settings for function calling
        execution_settings = AzureChatPromptExecutionSettings()
        execution_settings.function_choice_behavior = FunctionChoiceBehavior.Auto()
        
        # Get response from the agent
        response = await agent.get_response(chat_history, execution_settings=execution_settings)
        
        # Track function calls and results
        function_calls = []
        current_weather = None
        forecast = None
        alerts = None
        
        # Extract function calls from the chat history
        for message in chat_history:
            for item in message.items:
                if isinstance(item, FunctionCallContent):
                    function_call = {
                        "plugin_name": item.plugin_name,
                        "function_name": item.function_name,
                        "parameters": item.arguments
                    }
                    function_calls.append(function_call)
                    
                    # Execute the function and store results
                    if item.function_name == "get_current_weather":
                        # Convert arguments to a dictionary if it's a string
                        args = item.arguments
                        if isinstance(args, str):
                            try:
                                args = json.loads(args)
                            except:
                                args = {"location": args}
                                
                        current_weather = await kernel.invoke(
                            kernel.plugins["Weather"]["get_current_weather"],
                            **args
                        )
                        if not isinstance(current_weather, dict):
                            current_weather = current_weather.value
                            
                    elif item.function_name == "get_forecast":
                        # Convert arguments to a dictionary if it's a string
                        args = item.arguments
                        if isinstance(args, str):
                            try:
                                args = json.loads(args)
                            except:
                                args = {"location": args}
                        
                        # Default to 3 days if not specified
                        if "days" not in args:
                            args["days"] = 3
                            
                        forecast = await kernel.invoke(
                            kernel.plugins["Weather"]["get_forecast"],
                            **args
                        )
                        if not isinstance(forecast, list):
                            forecast = forecast.value
                            
                    elif item.function_name == "get_weather_alert":
                        # Convert arguments to a dictionary if it's a string
                        args = item.arguments
                        if isinstance(args, str):
                            try:
                                args = json.loads(args)
                            except:
                                args = {"location": args}
                                
                        alerts = await kernel.invoke(
                            kernel.plugins["Weather"]["get_weather_alert"],
                            **args
                        )
                        if not isinstance(alerts, dict):
                            alerts = alerts.value
        
        # Prepare response
        result = {
            "assistant_response": str(response),
            "function_calls": function_calls
        }
        
        # Add weather data if available
        if current_weather:
            # Format current weather as a string
            current_weather_str = f"Location: {current_weather['location']}\n"
            current_weather_str += f"Temperature: {current_weather['temperature']}°F\n"
            current_weather_str += f"Condition: {current_weather['condition']}\n"
            current_weather_str += f"Humidity: {current_weather['humidity']}%\n"
            current_weather_str += f"Wind Speed: {current_weather['wind_speed']} mph"
            result["current_weather"] = current_weather_str
            
        if forecast:
            # Format forecast as a string
            forecast_str = ""
            for day_forecast in forecast:
                forecast_str += f"Day {day_forecast['day']}:\n"
                forecast_str += f"  Temperature: {day_forecast['temperature']}°F\n"
                forecast_str += f"  Condition: {day_forecast['condition']}\n"
                forecast_str += f"  Humidity: {day_forecast['humidity']}%\n"
                forecast_str += f"  Wind Speed: {day_forecast['wind_speed']} mph\n\n"
            result["forecast"] = forecast_str.strip()
            
        if alerts:
            # Format alerts as a string
            if alerts['has_alert']:
                result["alerts"] = f"ALERT for {alerts['location']}: {alerts['alert_message']}"
            else:
                result["alerts"] = f"No active weather alerts for {alerts['location']}."
        
        return result
    except Exception as e:
        logger.error(f"Error in weather endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
