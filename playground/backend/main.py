import os
import re
from io import StringIO
import logging
import time
from typing import List, Dict, Optional, Callable, Awaitable, Annotated
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import semantic_kernel as sk
from semantic_kernel.connectors.ai.open_ai.services.azure_chat_completion import AzureChatCompletion
from semantic_kernel.connectors.ai.open_ai.services.azure_text_embedding import AzureTextEmbedding
from semantic_kernel.memory.semantic_text_memory import SemanticTextMemory
from semantic_kernel.memory.volatile_memory_store import VolatileMemoryStore
from semantic_kernel.functions.kernel_function_decorator import kernel_function
from semantic_kernel.core_plugins.text_memory_plugin import TextMemoryPlugin
from dotenv import load_dotenv
from semantic_kernel.connectors.ai.open_ai import AzureChatPromptExecutionSettings
from semantic_kernel.contents.chat_history import ChatHistory
from semantic_kernel.connectors.ai.function_choice_behavior import FunctionChoiceBehavior
from semantic_kernel.agents import ChatCompletionAgent
from semantic_kernel.contents import ChatMessageContent, FunctionCallContent
from semantic_kernel.contents.utils.author_role import AuthorRole
from semantic_kernel.functions import KernelArguments
from semantic_kernel.filters import FunctionInvocationContext
import random

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add filter for function invocation logging
async def logger_filter(context: FunctionInvocationContext, next: Callable[[FunctionInvocationContext], Awaitable[None]]) -> None:
    logger.info(f"FunctionInvoking - {context.function.plugin_name}.{context.function.name}")
    
    start_time = time.time()
    await next(context)
    duration = time.time() - start_time
    
    logger.info(f"FunctionInvoked - {context.function.plugin_name}.{context.function.name} ({duration:.3f}s)")

# Load environment variables
load_dotenv('../../.env', override=True)

app = FastAPI(title="Semantic Kernel Demo API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get Azure OpenAI credentials
deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT")
api_key = os.getenv("AZURE_OPENAI_API_KEY")
base_url = os.getenv("AZURE_OPENAI_ENDPOINT")
embedding_deployment = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT", "text-embedding-ada-002")

# Initialize memory store
memory_store = VolatileMemoryStore()

# Sample collections
FINANCE_COLLECTION = "finance"
PERSONAL_COLLECTION = "personal"
WEATHER_COLLECTION = "weather"

# Helper function to create a fresh kernel instance with necessary services
def create_kernel(plugins=None):
    """
    Create a fresh kernel instance with the necessary services and plugins.
    
    Args:
        plugins (list, optional): List of plugin names to add to the kernel. Defaults to None.
    
    Returns:
        Kernel: A new kernel instance with the specified services and plugins.
    """
    # Create a new kernel instance
    kernel = sk.Kernel()
    
    # Remove any existing services (just to be safe)
    kernel.remove_all_services()
    
    # Add chat completion service
    chat_completion = AzureChatCompletion(
        endpoint=base_url,
        deployment_name=deployment_name,
        api_key=api_key,
        service_id='chat'
    )
    kernel.add_service(chat_completion)
    
    # Add embedding service
    embedding_service = AzureTextEmbedding(
        endpoint=base_url,
        deployment_name=embedding_deployment,
        api_key=api_key,
        service_id='embeddings'
    )
    kernel.add_service(embedding_service)
    
    # Create memory instance
    memory = SemanticTextMemory(storage=memory_store, embeddings_generator=embedding_service)
    
    # Add TextMemoryPlugin to the kernel
    kernel.add_plugin(TextMemoryPlugin(memory), "TextMemoryPlugin")
    
    # Add the logger filter
    kernel.add_filter('function_invocation', logger_filter)
    
    # Add requested plugins
    if plugins:
        if "Weather" in plugins:
            weather_plugin = WeatherPlugin()
            kernel.add_plugin(weather_plugin, plugin_name="Weather")
        # Add more plugin options here as they become available
    
    return kernel, memory

# Populate initial memory data
@app.on_event("startup")
async def startup_event():
    # Create a global memory instance for initial data
    _, memory_instance = create_kernel()
    
    # Finance collection
    await memory_instance.save_information(collection=FINANCE_COLLECTION, id="budget", text="Your budget for 2024 is $100,000")
    await memory_instance.save_information(collection=FINANCE_COLLECTION, id="savings", text="Your savings from 2023 are $50,000")
    await memory_instance.save_information(collection=FINANCE_COLLECTION, id="investments", text="Your investments are $80,000")
    
    # Personal collection
    await memory_instance.save_information(collection=PERSONAL_COLLECTION, id="fact1", text="John was born in Seattle in 1980")
    await memory_instance.save_information(collection=PERSONAL_COLLECTION, id="fact2", text="John graduated from University of Washington in 2002")
    await memory_instance.save_information(collection=PERSONAL_COLLECTION, id="fact3", text="John has two children named Alex and Sam")
    
    # Weather collection
    await memory_instance.save_information(collection=WEATHER_COLLECTION, id="fact1", text="The weather in New York is typically hot and humid in summer")
    await memory_instance.save_information(collection=WEATHER_COLLECTION, id="fact2", text="London often experiences rain throughout the year")
    await memory_instance.save_information(collection=WEATHER_COLLECTION, id="fact3", text="Tokyo has a rainy season in June and July")

# Pydantic models for API requests/responses
class MemoryItem(BaseModel):
    id: str
    text: str
    collection: str

class SearchQuery(BaseModel):
    collection: str
    query: str
    limit: int = 5

class FunctionInput(BaseModel):
    function_name: str
    plugin_name: str
    prompt: str
    input_text: str
    parameters: Optional[Dict[str, str]] = None

class AgentRequest(BaseModel):
    message: str
    system_prompt: str = "You are a helpful assistant that provides concise and accurate information."
    temperature: float = 0.7
    available_plugins: List[str] = []
    chat_history: List[Dict[str, str]] = []

class TranslationRequest(BaseModel):
    text: str
    target_language: str

class WeatherRequest(BaseModel):
    query: str  # Changed from city to query to handle free text

class SummarizeRequest(BaseModel):
    text: str

class FilterRequest(BaseModel):
    text: str
    filters: Dict[str, bool] = {"pii": True, "profanity": True, "logging": True}

class KernelResetRequest(BaseModel):
    clear_memory: bool = False

# Weather plugin (simulated)
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

@app.get("/")
async def root():
    return {"message": "Semantic Kernel Demo API is running"}

@app.post("/memory/add")
async def add_to_memory(item: MemoryItem):
    _, memory_instance = create_kernel()
    try:
        await memory_instance.save_information(
            collection=item.collection,
            id=item.id,
            text=item.text
        )
        return {
            "status": "success", 
            "message": f"Added item {item.id} to collection {item.collection}",
            "synthesized_response": "",
            "critique": ""
        }
    except Exception as e:
        logger.error(f"Error in add_to_memory: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/memory/search")
async def search_memory(query: SearchQuery):
    _, memory_instance = create_kernel()
    try:
        results = await memory_instance.search(
            collection=query.collection,
            query=query.query,
            limit=query.limit
        )
        
        # Format the results to match what the frontend expects
        formatted_results = [{"id": r.id, "text": r.text, "relevance": r.relevance} for r in results]
        
        # Return the results with empty synthesized_response and critique fields
        # to match the format the frontend expects
        return {
            "results": formatted_results,
            "synthesized_response": "",
            "critique": ""
        }
    except Exception as e:
        logger.error(f"Error in search_memory: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/memory/collections")
async def get_collections():
    try:
        # In a real implementation, this would query the actual collections
        # For this demo, we'll return the predefined collections
        return {
            "collections": [FINANCE_COLLECTION, PERSONAL_COLLECTION, WEATHER_COLLECTION],
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error in get_collections: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/functions/semantic")
async def invoke_semantic_function(data: FunctionInput):
    kernel, _ = create_kernel()
    try:
        # Create a semantic function
        function = kernel.add_function(
            prompt=data.prompt,
            function_name=data.function_name,
            plugin_name=data.plugin_name,
            max_tokens=500
        )
        
        # Prepare parameters
        parameters = data.parameters or {}
        
        # Invoke the function
        result = await kernel.invoke(
            function,
            input=data.input_text,
            **parameters
        )
        
        return {"result": str(result)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/translate")
async def translate_text(request: TranslationRequest):
    kernel, _ = create_kernel()
    try:
        # Define a translation function
        translate_prompt = """
        {{$input}}\n\nTranslate this into {{$target_language}}:"""
        
        translate_fn = kernel.add_function(
            prompt=translate_prompt,
            function_name="translator",
            plugin_name="Translator",
            max_tokens=500
        )
        
        # Invoke the translation function
        result = await kernel.invoke(
            translate_fn,
            input=request.text,
            target_language=request.target_language
        )
        
        return {"translated_text": str(result)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/weather")
async def get_weather(request: WeatherRequest):
    kernel, _ = create_kernel()
    try:
        # Register the Weather plugin
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
                        "plugin_name": "Weather",
                        "function_name": item.function_name,
                        "parameters": item.arguments
                    }
                    function_calls.append(function_call)
                    
                    # Execute the function and store results
                    if item.function_name == "get_current_weather":
                        # Convert arguments to a dictionary if it's a string
                        args = item.arguments
                        if isinstance(args, str):
                            import json
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
                            import json
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
                            import json
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

@app.post("/summarize")
async def summarize_text(request: SummarizeRequest):
    kernel, _ = create_kernel()
    try:
        # Define a summarization function
        summarize_prompt = """
        {{$input}}\n\nTL;DR in one sentence:"""
        
        summarize_fn = kernel.add_function(
            prompt=summarize_prompt,
            function_name="tldr",
            plugin_name="Summarizer",
            max_tokens=100
        )
        
        # Invoke the summarization function
        result = await kernel.invoke(
            summarize_fn,
            input=request.text
        )
        
        return {"summary": str(result)}
    except Exception as e:
        logger.error(f"Error in summarize_text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agent/chat")
async def agent_chat(request: AgentRequest):
    # Create a fresh kernel with the requested plugins
    kernel, _ = create_kernel(plugins=request.available_plugins)
    
    try:
        # Create a ChatCompletionAgent with the provided system prompt
        agent = ChatCompletionAgent(
            kernel=kernel,
            name="PlaygroundAgent",
            instructions=request.system_prompt
        )
        
        # Create a chat history
        chat_history = ChatHistory()
        
        # Add previous messages from the chat history if available
        for msg in request.chat_history:
            if msg["role"].lower() == "user":
                chat_history.add_user_message(msg["content"])
            elif msg["role"].lower() == "assistant":
                chat_history.add_assistant_message(msg["content"])
        
        # Add the current user message
        chat_history.add_user_message(request.message)
        
        # Create execution settings
        execution_settings = AzureChatPromptExecutionSettings(
            service_id="chat",
            temperature=request.temperature,
            top_p=0.8,
            max_tokens=1000
        )
        
        # Variable to track plugin calls
        plugin_calls = []
        
        # Get the response from the agent
        response = await agent.get_response(chat_history, execution_settings=execution_settings)
        
        # Check if the message is about weather and the Weather plugin is enabled
        if "Weather" in request.available_plugins and any(keyword in request.message.lower() for keyword in ["weather", "temperature", "forecast", "climate", "rain", "snow", "alert"]):
            # Extract city name using the same approach as in the weather endpoint
            process_query_prompt = """
            Extract the city name from the following weather query. If multiple cities are mentioned, focus on the first one.
            If no city is explicitly mentioned, respond with "New York".
            Query: {{$input}}
            City:"""
            
            process_query_fn = kernel.add_function(
                prompt=process_query_prompt,
                function_name="process_query",
                plugin_name="WeatherQueryProcessor"
            )
            
            # Extract city from query
            city_result = await kernel.invoke(process_query_fn, input=request.message)
            city = str(city_result).strip()
            
            # Add plugin calls for visualization
            plugin_calls.append({
                "plugin_name": "Weather",
                "function_name": "get_current_weather",
                "parameters": {"location": city}
            })
            
            plugin_calls.append({
                "plugin_name": "Weather",
                "function_name": "get_forecast",
                "parameters": {"location": city, "days": 3}
            })
            
            plugin_calls.append({
                "plugin_name": "Weather",
                "function_name": "get_weather_alert",
                "parameters": {"location": city}
            })
        
        # Return the agent's response along with the updated chat history and plugin calls
        return {
            "response": response.content,
            "chat_history": [
                {"role": "user", "content": request.message},
                {"role": "assistant", "content": response.content}
            ],
            "plugin_calls": plugin_calls
        }
    except Exception as e:
        logger.error(f"Error in agent_chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class ContentFilter:
    def __init__(self):
        self.patterns = {
            'credit_card': r'\b(?:\d{4}[-\s]?){3}\d{4}\b',
            'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            'phone': r'\b(?:\+\d{1,3}[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}\b',
            'ssn': r'\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b',
        }
        
    def redact_sensitive_info(self, text: str) -> tuple[str, List[str]]:
        """Redact sensitive information from text."""
        result = text
        detected = []
        
        for pattern_name, pattern in self.patterns.items():
            matches = re.finditer(pattern, result)
            for match in matches:
                detected.append(f"{pattern_name}: {match.group()}")
                result = result.replace(match.group(), f"[REDACTED {pattern_name.upper()}]")
        
        return result, detected

class ProfanityFilter:
    def __init__(self):
        # Simple demo list - in production, use a comprehensive profanity detection library
        self.profanity_list = ['badword1', 'badword2', 'offensive']
        
    def filter_content(self, text: str) -> tuple[str, List[str]]:
        """Filter out profanity from text."""
        result = text
        detected = []
        
        for word in self.profanity_list:
            if word in text.lower():
                detected.append(f"profanity: {word}")
                result = re.sub(word, '[REDACTED]', result, flags=re.IGNORECASE)
        
        return result, detected

# Input filter function for semantic kernel
async def input_filter_fn(context: FunctionInvocationContext, next: Callable[[FunctionInvocationContext], Awaitable[None]]) -> None:
    """
    Filter function that detects and redacts sensitive information from function inputs.
    This demonstrates pre-processing in the Semantic Kernel pipeline.
    """
    logger.info(f"Input Filter - Processing input for {context.function.plugin_name}.{context.function.name}")
    
    # Check if there's an input parameter
    if 'input' in context.arguments:
        original_input = context.arguments['input']
        
        # Apply content filter to input
        content_filter = ContentFilter()
        filtered_input, detected = content_filter.redact_sensitive_info(str(original_input))
        
        if detected:
            logger.info(f"Input Filter - Detected sensitive information: {', '.join(detected)}")
            
        # Apply profanity filter
        profanity_filter = ProfanityFilter()
        filtered_input, profanity_detected = profanity_filter.filter_content(filtered_input)
        
        if profanity_detected:
            logger.info(f"Input Filter - Detected profanity: {', '.join(profanity_detected)}")
            detected.extend(profanity_detected)
            
        # Replace the original input with the filtered version
        context.arguments['input'] = filtered_input
        
        # Metadata handling is version-dependent
        # Let's try to be compatible with both SK versions
        try:
            # Try to store detection info for later use
            if hasattr(context, 'metadata'):
                context.metadata['detected_items'] = detected
            else:
                # If metadata attribute doesn't exist, we'll just log the detections
                logger.info(f"Metadata not available, detections logged only")
        except Exception as e:
            logger.warning(f"Could not store metadata: {str(e)}")
    
    # Continue to the next filter or function
    await next(context)

# Output filter function for semantic kernel
async def output_filter_fn(context: FunctionInvocationContext, next: Callable[[FunctionInvocationContext], Awaitable[None]]) -> None:
    """
    Filter function that processes function outputs.
    This demonstrates post-processing in the Semantic Kernel pipeline.
    """
    # First, continue to the next filter or execute the function
    start_time = time.time()
    await next(context)
    execution_time = time.time() - start_time
    
    logger.info(f"Output Filter - Function {context.function.plugin_name}.{context.function.name} executed in {execution_time:.4f}s")
    
    # Process the output if it exists
    if context.result:
        logger.info(f"Output Filter - Processing result for {context.function.plugin_name}.{context.function.name}")
        
        # Check for sensitive information in the output
        content_filter = ContentFilter()
        filtered_output, detected = content_filter.redact_sensitive_info(str(context.result))
        
        if detected:
            logger.info(f"Output Filter - Detected sensitive information in output: {', '.join(detected)}")
            
            try:
                # Try to store metadata if the attribute exists
                if hasattr(context, 'metadata'):
                    context.metadata['original_output'] = str(context.result)
                    context.metadata['output_detected_items'] = detected
            except Exception as e:
                logger.warning(f"Could not store metadata: {str(e)}")
            
            # Replace with filtered output
            try:
                from semantic_kernel.functions import FunctionResult
                context.result = FunctionResult(
                    function=context.function.metadata,
                    value=filtered_output
                )
            except Exception as e:
                # If FunctionResult fails, log it but continue
                logger.warning(f"Couldn't create FunctionResult: {str(e)}")
                # Try a direct string replacement as fallback
                context.result = filtered_output

@app.post("/kernel/reset")
async def reset_kernel(request: KernelResetRequest):
    try:
        # Create a fresh kernel instance
        _, memory_instance = create_kernel()
        
        # Clear memory if requested
        if request.clear_memory:
            # This is a simplified approach - in a real app, you might want to 
            # selectively clear collections or implement a more sophisticated approach
            global memory_store
            memory_store = VolatileMemoryStore()
            
            # Re-initialize the memory with the fresh kernel
            _, memory_instance = create_kernel()
            
            # Re-populate the memory with initial data
            # Finance collection
            await memory_instance.save_information(collection=FINANCE_COLLECTION, id="budget", text="Your budget for 2024 is $100,000")
            await memory_instance.save_information(collection=FINANCE_COLLECTION, id="savings", text="Your savings from 2023 are $50,000")
            await memory_instance.save_information(collection=FINANCE_COLLECTION, id="investments", text="Your investments are $80,000")
            
            # Personal collection
            await memory_instance.save_information(collection=PERSONAL_COLLECTION, id="fact1", text="John was born in Seattle in 1980")
            await memory_instance.save_information(collection=PERSONAL_COLLECTION, id="fact2", text="John graduated from University of Washington in 2002")
            await memory_instance.save_information(collection=PERSONAL_COLLECTION, id="fact3", text="John has two children named Alex and Sam")
            
            # Weather collection
            await memory_instance.save_information(collection=WEATHER_COLLECTION, id="fact1", text="The weather in New York is typically hot and humid in summer")
            await memory_instance.save_information(collection=WEATHER_COLLECTION, id="fact2", text="London often experiences rain throughout the year")
            await memory_instance.save_information(collection=WEATHER_COLLECTION, id="fact3", text="Tokyo has a rainy season in June and July")
        
        return {"status": "success", "message": "Kernel reset successfully", "memory_cleared": request.clear_memory}
    except Exception as e:
        logger.error(f"Error in reset_kernel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/filters/process")
async def process_with_filters(request: FilterRequest):
    kernel, _ = create_kernel()
    try:
        # Set up log capture for this request
        logs = []
        log_capture = StringIO()
        log_handler = logging.StreamHandler(log_capture)
        log_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
        logger.addHandler(log_handler)
        
        # Add appropriate filters based on user selections
        filter_results = {
            "input_detected": [],
            "output_detected": [],
            "function_calls": []
        }
        
        if request.filters.get('pii', True) or request.filters.get('profanity', True):
            # Add input and output filters
            kernel.add_filter('function_invocation', input_filter_fn)
            kernel.add_filter('function_invocation', output_filter_fn)
        
        # Create a demo function
        echo_function = kernel.add_function(
            prompt="{{$input}}",
            function_name="process_text",
            plugin_name="FiltersDemo"
        )
        
        # Process the input through our function
        logger.info(f"Processing text via kernel function with filters")
        result = await kernel.invoke(echo_function, input=request.text)
        
        # Get logs and clean up
        logger.removeHandler(log_handler)
        logs = log_capture.getvalue().splitlines()
        log_capture.close()
        
        # Parse the logs to extract input and output processing information
        input_processing = []
        output_processing = []
        
        for log in logs:
            if "Input Filter - Detected" in log:
                item = log.split("Input Filter - Detected")[1].strip()
                input_processing.append(item)
            elif "Output Filter - Detected" in log:
                item = log.split("Output Filter - Detected")[1].strip()
                output_processing.append(item)
        
        return {
            "input_processing": "Detected and redacted:\n" + "\n".join(input_processing) if input_processing else None,
            "output_processing": str(result),
            "logs": logs if request.filters.get('logging', True) else []
        }
        
    except Exception as e:
        if 'log_handler' in locals():
            logger.removeHandler(log_handler)
        logger.error(f"Error in process_with_filters: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
