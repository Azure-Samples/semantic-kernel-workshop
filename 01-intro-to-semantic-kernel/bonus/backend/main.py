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
from semantic_kernel.core_plugins.text_memory_plugin import TextMemoryPlugin
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

# Add TextMemoryPlugin to the kernel
kernel.add_plugin(TextMemoryPlugin(memory), "TextMemoryPlugin")

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
        
        # Synthesize a response using the LLM with TextMemoryPlugin
        synthesized_response = ""
        
        if formatted_results:
            # Create RAG prompt using TextMemoryPlugin's recall function
            rag_prompt = """
            Assistant can have a conversation about any topic.

            Here is some background information that might help answer the user's question:
            {{ recall $user_query collection="COLLECTION_NAME" }}

            User: {{$user_query}}
            Assistant:
            """.strip().replace("COLLECTION_NAME", query.collection)
            
            # Create a function using the prompt with recall
            rag_function = kernel.add_function(
                function_name="rag_response",
                plugin_name="MemoryPlugin",
                prompt=rag_prompt
            )
            
            # Invoke the function to get a synthesized response
            synthesized_response = await kernel.invoke(
                rag_function,
                user_query=query.query
            )
            
        return {
            "results": formatted_results,
            "synthesized_response": str(synthesized_response)
        }
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

@app.post("/filters/process")
async def process_with_filters(request: FilterRequest):
    try:
        # Create a new temporary kernel with filters for this request
        temp_kernel = sk.Kernel()
        
        # Add the chat service to the temporary kernel
        temp_kernel.add_service(chat_completion)
        
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
            temp_kernel.add_filter('function_invocation', input_filter_fn)
            temp_kernel.add_filter('function_invocation', output_filter_fn)
        
        # Create a demo function
        echo_function = temp_kernel.add_function(
            prompt="{{$input}}",
            function_name="process_text",
            plugin_name="FiltersDemo"
        )
        
        # Process the input through our function
        logger.info(f"Processing text via kernel function with filters")
        result = await temp_kernel.invoke(echo_function, input=request.text)
        
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

# Add the filter to the kernel
kernel.add_filter('function_invocation', logger_filter)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
