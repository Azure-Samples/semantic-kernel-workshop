import { CodeFile } from "@/components/ui/code-block";

// Interface for all the code examples for a specific demo
export interface DemoCodeExamples {
  [key: string]: CodeFile[];
}

// Function to get code examples for a specific demo
export function getCodeExamplesForDemo(demoName: string): CodeFile[] {
  return demoCodeExamples[demoName] || [];
}

// Code examples for each demo
export const demoCodeExamples: DemoCodeExamples = {
  summarize: [
    {
      name: "Semantic Kernel Implementation",
      language: "python",
      description: "Core Semantic Kernel implementation for text summarization",
      code: `# Create a kernel instance
kernel = sk.Kernel()

# Add the Azure OpenAI service
chat_completion = AzureChatCompletion(
    endpoint=base_url,
    deployment_name=deployment_name,
    api_key=api_key,
    service_id='chat'
)
kernel.add_service(chat_completion)

# Define the summarization prompt
summarize_prompt = """
{{$input}}

TL;DR in one sentence:"""

# Add the function to the kernel
summarize_fn = kernel.add_function(
    prompt=summarize_prompt,
    function_name="tldr",
    plugin_name="Summarizer",
    max_tokens=100
)

# Invoke the summarization function
result = await kernel.invoke(
    summarize_fn,
    input=text_to_summarize
)

# Get the summary as a string
summary = str(result)`
    }
  ],
  
  translate: [
    {
      name: "Semantic Kernel Implementation",
      language: "python",
      description: "Core Semantic Kernel implementation for text translation",
      code: `# Create a kernel instance
kernel = sk.Kernel()

# Add the Azure OpenAI service
chat_completion = AzureChatCompletion(
    endpoint=base_url,
    deployment_name=deployment_name,
    api_key=api_key,
    service_id='chat'
)
kernel.add_service(chat_completion)

# Define the translation prompt
translate_prompt = """
Translate the following text from {{$source_language}} to {{$target_language}}:

{{$input}}

Translation:"""

# Add the function to the kernel
translate_fn = kernel.add_function(
    prompt=translate_prompt,
    function_name="translate",
    plugin_name="Translator",
    max_tokens=2000
)

# Invoke the translation function
result = await kernel.invoke(
    translate_fn,
    input=text_to_translate,
    source_language=source_language,
    target_language=target_language
)

# Get the translated text as a string
translated_text = str(result)`
    }
  ],
  
  weather: [
    {
      name: "Weather Plugin Implementation",
      language: "python",
      description: "Actual Weather Plugin implementation used in the backend",
      code: `from typing import Annotated, List, Dict
from semantic_kernel.functions.kernel_function_decorator import kernel_function
import random

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

# Register with kernel
weather_plugin = WeatherPlugin()
kernel.add_plugin(
    plugin=weather_plugin,
    plugin_name="Weather"
)`
    },
    {
      name: "Weather Endpoint Implementation",
      language: "python",
      description: "How the Weather Plugin is used in the backend endpoint",
      code: `@app.post("/weather")
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
                        "plugin_name": item.plugin_name,
                        "function_name": item.function_name,
                        "parameters": item.arguments
                    }
                    function_calls.append(function_call)
                    
                    # Execute the appropriate weather functions
                    if item.function_name == "get_current_weather":
                        # Process arguments and invoke function
                        args = process_arguments(item.arguments)
                        current_weather = await kernel.invoke(
                            kernel.plugins["Weather"]["get_current_weather"],
                            **args
                        )
                        
                    elif item.function_name == "get_forecast":
                        # Process arguments and invoke function
                        args = process_arguments(item.arguments)
                        if "days" not in args:
                            args["days"] = 3
                        forecast = await kernel.invoke(
                            kernel.plugins["Weather"]["get_forecast"],
                            **args
                        )
                        
                    elif item.function_name == "get_weather_alert":
                        # Process arguments and invoke function
                        args = process_arguments(item.arguments)
                        alerts = await kernel.invoke(
                            kernel.plugins["Weather"]["get_weather_alert"],
                            **args
                        )
        
        # Format and return the results
        return {
            "assistant_response": str(response),
            "function_calls": function_calls,
            "current_weather": format_current_weather(current_weather),
            "forecast": format_forecast(forecast),
            "alerts": format_alerts(alerts)
        }
    except Exception as e:
        logger.error(f"Error in weather endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))`
    }
  ],
  
  functions: [
    {
      name: "Semantic Kernel Implementation",
      language: "python",
      description: "Core Semantic Kernel implementation for semantic functions",
      code: `# Create a kernel instance
kernel = sk.Kernel()

# Add the Azure OpenAI service
chat_completion = AzureChatCompletion(
    endpoint=base_url,
    deployment_name=deployment_name,
    api_key=api_key,
    service_id='chat'
)
kernel.add_service(chat_completion)

# Define a semantic function with a prompt template
prompt_template = """
{{$input}}

Rewrite this in a professional tone:"""

# Add the function to the kernel
professional_rewriter = kernel.add_function(
    prompt=prompt_template,
    function_name="professional_rewriter",
    plugin_name="TextFormatter"
)

# Invoke the semantic function
result = await kernel.invoke(
    professional_rewriter,
    input=input_text
)

# Return the formatted text
formatted_text = str(result)`
    },
    {
      name: "FastAPI Endpoint Implementation",
      language: "python",
      description: "Backend endpoint for semantic functions",
      code: `@app.post("/functions/semantic")
async def invoke_semantic_function(request: FunctionRequest):
    kernel, _ = create_kernel()
    
    # Create a semantic function with the provided prompt template
    semantic_function = kernel.add_function(
        prompt=request.prompt,
        function_name=request.function_name,
        plugin_name=request.plugin_name
    )
    
    # Invoke the function with the input text
    result = await kernel.invoke(
        semantic_function,
        input=request.input_text
    )
    
    return {"result": str(result)}`
    },
    {
      name: "React Component Implementation",
      language: "tsx",
      description: "Frontend component for semantic functions",
      code: `export default function FunctionsDemo() {
  const [prompt, setPrompt] = useState('{{$input}}\\n\\nRewrite this in a professional tone:');
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleInvokeFunction = async () => {
    try {
      setLoading(true);
      
      const response = await axios.post(\`\${API_URL}/functions/semantic\`, {
        function_name: "professional_rewriter",
        plugin_name: "TextFormatter",
        prompt: prompt,
        input_text: inputText,
        parameters: {}
      });
      
      setResult(response.data.result);
      setLoading(false);
    } catch (error) {
      console.error('Error invoking function:', error);
      setLoading(false);
    }
  };
  
  return (
    <div>
      <Textarea
        placeholder="Enter a prompt template"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <Textarea
        placeholder="Enter the text to process"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />
      <Button onClick={handleInvokeFunction}>
        {loading ? 'Processing...' : 'Run Function'}
      </Button>
      {result && <div>{result}</div>}
    </div>
  );
}`
    }
  ]
};