import { CodeFile } from "@/components/ui/code-block";

interface CodeFile {
  name: string;
  language: string;
  code: string;
  description?: string;
}

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
      name: "SK Summarization",
      language: "python",
      description: "Core Semantic Kernel implementation for text summarization",
      code: `# Define a summarization function with Semantic Kernel
# Create a kernel instance
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
    },
    {
      name: "SK Configuration",
      language: "python",
      description: "Semantic Kernel configuration with Azure OpenAI",
      code: `# Helper function to create a fresh kernel instance with necessary services
def create_kernel():
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
    
    # Add embedding service (for memory capabilities)
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
    
    return kernel, memory`
    },
    {
      name: "Setup Instructions",
      language: "bash",
      description: "Setting up your environment for Semantic Kernel development",
      code: `# Create a virtual environment
python -m venv env
source env/bin/activate  # On Windows: env\\Scripts\\activate

# Install required packages
pip install semantic-kernel python-dotenv fastapi uvicorn

# Create a .env file with your Azure OpenAI credentials
echo "AZURE_OPENAI_DEPLOYMENT=your-deployment-name
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_ENDPOINT=your-endpoint
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=your-embedding-deployment" > .env

# Import the required modules in your code
import semantic_kernel as sk
from semantic_kernel.connectors.ai.open_ai.services.azure_chat_completion import AzureChatCompletion
from semantic_kernel.connectors.ai.open_ai.services.azure_text_embedding import AzureTextEmbedding
from semantic_kernel.memory.semantic_text_memory import SemanticTextMemory
from semantic_kernel.memory.volatile_memory_store import VolatileMemoryStore
from dotenv import load_dotenv

# Load your environment variables
load_dotenv()`
    }
  ]
}; 