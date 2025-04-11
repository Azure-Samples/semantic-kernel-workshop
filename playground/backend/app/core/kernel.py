import os
import logging
from typing import Tuple, List, Optional
import semantic_kernel as sk
from semantic_kernel.connectors.ai.open_ai.services.azure_chat_completion import (
    AzureChatCompletion,
)
from semantic_kernel.connectors.ai.open_ai.services.azure_text_embedding import (
    AzureTextEmbedding,
)
from semantic_kernel.memory.semantic_text_memory import SemanticTextMemory
from semantic_kernel.memory.volatile_memory_store import VolatileMemoryStore
from semantic_kernel.core_plugins.text_memory_plugin import TextMemoryPlugin
from dotenv import load_dotenv
import time
from semantic_kernel.filters import FunctionInvocationContext
from typing import Callable, Awaitable

# Load environment variables
load_dotenv("../../.env", override=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Get Azure OpenAI credentials
deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
api_key = os.getenv("AZURE_OPENAI_API_KEY")
base_url = os.getenv("AZURE_OPENAI_ENDPOINT")
embedding_deployment = os.getenv(
    "AZURE_OPENAI_EMBEDDING_DEPLOYMENT", "text-embedding-ada-002"
)

# Initialize memory store
memory_store = VolatileMemoryStore()

# Sample collections
FINANCE_COLLECTION = "finance"
PERSONAL_COLLECTION = "personal"
WEATHER_COLLECTION = "weather"


# Add filter for function invocation logging
async def logger_filter(
    context: FunctionInvocationContext,
    next: Callable[[FunctionInvocationContext], Awaitable[None]],
) -> None:
    """
    Filter function that logs function invocations.
    """
    logger.info(
        f"FunctionInvoking - {context.function.plugin_name}.{context.function.name}"
    )

    start_time = time.time()
    await next(context)
    duration = time.time() - start_time

    logger.info(
        f"FunctionInvoked - {context.function.plugin_name}.{context.function.name} ({duration:.3f}s)"
    )


def create_kernel(
    plugins: Optional[List[str]] = None,
) -> Tuple[sk.Kernel, SemanticTextMemory]:
    """
    Create a fresh kernel instance with the necessary services and plugins.

    Args:
        plugins (list, optional): List of plugin names to add to the kernel. Defaults to None.

    Returns:
        Tuple[Kernel, SemanticTextMemory]: A new kernel instance and memory instance.
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
        service_id="chat",
    )
    kernel.add_service(chat_completion)

    # Add embedding service
    embedding_service = AzureTextEmbedding(
        endpoint=base_url,
        deployment_name=embedding_deployment,
        api_key=api_key,
        service_id="embeddings",
    )
    kernel.add_service(embedding_service)

    # Create memory instance
    memory = SemanticTextMemory(
        storage=memory_store, embeddings_generator=embedding_service
    )

    # Add TextMemoryPlugin to the kernel
    kernel.add_plugin(TextMemoryPlugin(memory), "TextMemoryPlugin")

    # Add the logger filter
    kernel.add_filter("function_invocation", logger_filter)

    # Import plugins here to avoid circular imports
    if plugins:
        from app.plugins.weather import WeatherPlugin

        if "Weather" in plugins:
            weather_plugin = WeatherPlugin()
            kernel.add_plugin(weather_plugin, plugin_name="Weather")
        # Add more plugin options here as they become available

    return kernel, memory


async def initialize_memory():
    """
    Initialize memory with sample data.
    """
    # Create a memory instance for initial data
    _, memory_instance = create_kernel()

    # Finance collection
    await memory_instance.save_information(
        collection=FINANCE_COLLECTION,
        id="budget",
        text="Your budget for 2024 is $100,000",
    )
    await memory_instance.save_information(
        collection=FINANCE_COLLECTION,
        id="savings",
        text="Your savings from 2023 are $50,000",
    )
    await memory_instance.save_information(
        collection=FINANCE_COLLECTION,
        id="investments",
        text="Your investments are $80,000",
    )

    # Personal collection
    await memory_instance.save_information(
        collection=PERSONAL_COLLECTION,
        id="fact1",
        text="John was born in Seattle in 1980",
    )
    await memory_instance.save_information(
        collection=PERSONAL_COLLECTION,
        id="fact2",
        text="John graduated from University of Washington in 2002",
    )
    await memory_instance.save_information(
        collection=PERSONAL_COLLECTION,
        id="fact3",
        text="John has two children named Alex and Sam",
    )

    # Weather collection
    await memory_instance.save_information(
        collection=WEATHER_COLLECTION,
        id="fact1",
        text="The weather in New York is typically hot and humid in summer",
    )
    await memory_instance.save_information(
        collection=WEATHER_COLLECTION,
        id="fact2",
        text="London often experiences rain throughout the year",
    )
    await memory_instance.save_information(
        collection=WEATHER_COLLECTION,
        id="fact3",
        text="Tokyo has a rainy season in June and July",
    )


async def reset_memory() -> None:
    """
    Reset the memory store and reinitialize with sample data.
    """
    global memory_store
    memory_store = VolatileMemoryStore()
    await initialize_memory()
