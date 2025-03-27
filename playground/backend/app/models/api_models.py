from typing import List, Dict, Optional
from pydantic import BaseModel


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
    system_prompt: str = (
        "You are a helpful assistant that provides concise and accurate information."
    )
    temperature: float = 0.7
    available_plugins: List[str] = []
    chat_history: List[Dict[str, str]] = []


class MultiAgentRequest(BaseModel):
    message: str
    system_prompt: str = (
        "You are a helpful assistant that provides concise and accurate information."
    )
    temperature: float = 0.7
    available_plugins: List[str] = []
    chat_history: List[Dict[str, str]] = []
    agent_configs: List[Dict[str, str]] = []
    max_iterations: int = 8


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


# New models for the Process Framework


class ChatProcessRequest(BaseModel):
    message: str = ""  # Used for sending messages in an existing chat


class ChatResponse(BaseModel):
    process_id: str
    response: str
    chat_history: List[Dict[str, str]] = []


# New models for the Content Creation Process


class ContentProcessRequest(BaseModel):
    topic: str  # Topic for content creation


class ContentResponse(BaseModel):
    process_id: str
    status: str  # processing, generating, revising, completed
    topic: str
    content: str
    review: str
