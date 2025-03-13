import os
import re
from io import StringIO
import logging
import time
from typing import List, Dict, Optional, Callable, Awaitable
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import semantic_kernel as sk
from semantic_kernel.connectors.ai.open_ai.services.azure_chat_completion import AzureChatCompletion
from semantic_kernel.connectors.ai.open_ai.services.azure_text_embedding import AzureTextEmbedding
from semantic_kernel.memory.semantic_text_memory import SemanticTextMemory
from semantic_kernel.memory.volatile_memory_store import VolatileMemoryStore
from semantic_kernel.functions.kernel_function_decorator import kernel_function
from dotenv import load_dotenv
from semantic_kernel.connectors.ai.open_ai import AzureChatPromptExecutionSettings
from semantic_kernel.contents.chat_history import ChatHistory
from semantic_kernel.connectors.ai.function_choice_behavior import FunctionChoiceBehavior
from semantic_kernel.filters import FunctionInvocationContext

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

# Initialize kernel and services
kernel = sk.Kernel()

# Get Azure OpenAI credentials
deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT")
api_key = os.getenv("AZURE_OPENAI_API_KEY")
base_url = os.getenv("AZURE_OPENAI_ENDPOINT")
embedding_deployment = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT", "text-embedding-ada-002")

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

# Initialize memory
memory_store = VolatileMemoryStore()
memory = SemanticTextMemory(storage=memory_store, embeddings_generator=embedding_service)

# Sample collections
FINANCE_COLLECTION = "finance"
PERSONAL_COLLECTION = "personal"
WEATHER_COLLECTION = "weather"

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

class TranslationRequest(BaseModel):
    text: str
    target_language: str

class WeatherRequest(BaseModel):
    query: str  # Changed from city to query to handle free text

class SummarizeRequest(BaseModel):
    text: str

# Weather plugin (simulated)
class WeatherPlugin:
    @kernel_function
    def get_current_weather(self, city: str) -> str:
        # Simulated weather data
        weather_data = {
            "new york": {"temperature": 72, "condition": "Sunny"},
            "london": {"temperature": 65, "condition": "Cloudy"},
            "tokyo": {"temperature": 80, "condition": "Partly Cloudy"},
            "sydney": {"temperature": 85, "condition": "Clear"},
            "paris": {"temperature": 70, "condition": "Rainy"},
        }
        
        city_lower = city.lower()
        if city_lower in weather_data:
            data = weather_data[city_lower]
            # Use original city name for display
            return f"The current weather in {city} is {data['condition']} with a temperature of {data['temperature']}°F."
        else:
            return f"Weather data for {city} is not available."

    @kernel_function
    def get_forecast(self, city: str) -> str:
        # Simulated forecast data
        forecasts = {
            "new york": "Sunny today, with rain expected tomorrow. Temperatures between 65-75°F.",
            "london": "Cloudy with occasional showers throughout the week. Temperatures between 60-68°F.",
            "tokyo": "Warm and humid with clear skies. Temperatures between 75-85°F.",
            "sydney": "Hot and sunny all week. Temperatures between 80-90°F.",
            "paris": "Rain expected to clear by tomorrow. Temperatures between 65-72°F.",
        }
        
        city_lower = city.lower()
        if city_lower in forecasts:
            return forecasts[city_lower]
        else:
            return f"Forecast data for {city} is not available."

# Initialize and register the weather plugin
weather_plugin = WeatherPlugin()
kernel.add_plugin(weather_plugin, plugin_name="Weather")

# Populate initial memory data
@app.on_event("startup")
async def startup_event():
    # Finance collection
    await memory.save_information(collection=FINANCE_COLLECTION, id="budget", text="Your budget for 2024 is $100,000")
    await memory.save_information(collection=FINANCE_COLLECTION, id="savings", text="Your savings from 2023 are $50,000")
    await memory.save_information(collection=FINANCE_COLLECTION, id="investments", text="Your investments are $80,000")
    
    # Personal collection
    await memory.save_information(collection=PERSONAL_COLLECTION, id="fact1", text="John was born in Seattle in 1980")
    await memory.save_information(collection=PERSONAL_COLLECTION, id="fact2", text="John graduated from University of Washington in 2002")
    await memory.save_information(collection=PERSONAL_COLLECTION, id="fact3", text="John has two children named Alex and Sam")
    
    # Weather collection
    await memory.save_information(collection=WEATHER_COLLECTION, id="fact1", text="The weather in New York is typically hot and humid in summer")
    await memory.save_information(collection=WEATHER_COLLECTION, id="fact2", text="London often experiences rain throughout the year")
    await memory.save_information(collection=WEATHER_COLLECTION, id="fact3", text="Tokyo has a rainy season in June and July")

@app.get("/")
async def root():
    return {"message": "Semantic Kernel Demo API is running"}

@app.post("/memory/add")
async def add_to_memory(item: MemoryItem):
    try:
        await memory.save_information(
            collection=item.collection,
            id=item.id,
            text=item.text
        )
        return {"status": "success", "message": f"Added item {item.id} to collection {item.collection}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/memory/search")
async def search_memory(query: SearchQuery):
    try:
        results = await memory.search(
            collection=query.collection,
            query=query.query,
            limit=query.limit
        )
        
        formatted_results = []
        for result in results:
            formatted_results.append({
                "id": result.id,
                "text": result.text,
                "relevance": result.relevance
            })
            
        return {"results": formatted_results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/memory/collections")
async def get_collections():
    # In a real implementation, this would query the actual collections
    # For this demo, we'll return the predefined collections
    return {"collections": [FINANCE_COLLECTION, PERSONAL_COLLECTION, WEATHER_COLLECTION]}

@app.post("/functions/semantic")
async def invoke_semantic_function(data: FunctionInput):
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
    try:
        # Define a translation function
        translate_prompt = "{{$input}}\n\nTranslate this into {{$target_language}}:"
        
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
    try:
        # Set up log capture
        log_capture = StringIO()
        log_handler = logging.StreamHandler(log_capture)
        log_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
        logger.addHandler(log_handler)
        
        # Create chat history and add user query
        history = ChatHistory()
        history.add_user_message(request.query)
        
        # Let the LLM process the query and decide which city to check
        execution_settings = AzureChatPromptExecutionSettings()
        execution_settings.function_choice_behavior = FunctionChoiceBehavior.Auto()
        
        # Create a prompt for initial processing
        process_query_prompt = """
        Extract the city name from the following weather query. If multiple cities are mentioned, focus on the first one.
        If no city is explicitly mentioned, respond with "unknown".
        Query: {{$input}}
        City:"""
        
        process_query_fn = kernel.add_function(
            prompt=process_query_prompt,
            function_name="process_query",
            plugin_name="WeatherQueryProcessor"
        )
        
        # Extract city from query
        city_result = await kernel.invoke(process_query_fn, input=request.query)
        city = str(city_result).strip().lower()
        
        if city == "unknown":
            return {
                "error": "Could not determine the city from your query. Please include a city name in your question.",
                "example_queries": [
                    "What's the weather like in New York?",
                    "Will it rain tomorrow in London?",
                    "Tell me about the forecast for Tokyo"
                ]
            }
        
        # Use the weather plugin to get data
        current_weather = await kernel.invoke(
            kernel.plugins["Weather"]["get_current_weather"],
            city=city
        )
        
        forecast = await kernel.invoke(
            kernel.plugins["Weather"]["get_forecast"],
            city=city
        )
        
        # Let the LLM provide a natural response
        result = await chat_completion.get_chat_message_content(
            chat_history=history,
            settings=execution_settings,
            kernel=kernel,
            context_vars={
                "current_weather": str(current_weather), 
                "forecast": str(forecast),
                "query": request.query
            }
        )
        
        # Get captured logs
        logger.removeHandler(log_handler)
        logs = log_capture.getvalue().splitlines()
        log_capture.close()
        
        return {
            "current_weather": str(current_weather),
            "forecast": str(forecast),
            "assistant_response": str(result),
            "debug_logs": logs
        }
    except Exception as e:
        if 'log_handler' in locals():
            logger.removeHandler(log_handler)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize")
async def summarize_text(request: SummarizeRequest):
    try:
        # Define a summarization function
        summarize_prompt = "{{$input}}\n\nTL;DR in one sentence:"
        
        summarize_fn = kernel.add_function(
            prompt=summarize_prompt,
            function_name="tldr",
            plugin_name="Summarizer",
            max_tokens=100
        )
        
        # Invoke the summarization function
        result = await kernel.invoke(summarize_fn, input=request.text)
        
        return {"summary": str(result)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class FilterRequest(BaseModel):
    text: str
    filters: Dict[str, bool]

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

@app.post("/filters/process")
async def process_with_filters(request: FilterRequest):
    try:
        # Capture logs if logging is enabled
        logs = []
        if request.filters.get('logging', True):
            log_capture = StringIO()
            log_handler = logging.StreamHandler(log_capture)
            log_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
            logger.addHandler(log_handler)
        
        input_text = request.text
        detected_items = []
        
        # Pre-processing filters
        if request.filters.get('pii', True):
            logger.info("Applying PII detection filter")
            content_filter = ContentFilter()
            input_text, detected = content_filter.redact_sensitive_info(input_text)
            detected_items.extend(detected)
        
        if request.filters.get('profanity', True):
            logger.info("Applying profanity filter")
            profanity_filter = ProfanityFilter()
            input_text, detected = profanity_filter.filter_content(input_text)
            detected_items.extend(detected)
        
        # Simulate function execution
        logger.info(f"Processing filtered text (length: {len(input_text)})")
        output_text = f"Processed: {input_text}"
        
        # Post-processing result
        if detected_items:
            logger.info(f"Found {len(detected_items)} sensitive items")
        
        # Get captured logs if logging was enabled
        if request.filters.get('logging', True):
            logger.removeHandler(log_handler)
            logs = log_capture.getvalue().splitlines()
            log_capture.close()
        
        return {
            "input_processing": "Detected and redacted:\n" + "\n".join(detected_items) if detected_items else None,
            "output_processing": output_text,
            "logs": logs
        }
        
    except Exception as e:
        if 'log_handler' in locals():
            logger.removeHandler(log_handler)
        raise HTTPException(status_code=500, detail=str(e))

# Add the filter to the kernel
kernel.add_filter('function_invocation', logger_filter)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
