import os
import logging
from uuid import uuid4

from dotenv import load_dotenv

from semantic_kernel.agents.chat_completion.chat_completion_agent import ChatCompletionAgent, ChatHistoryAgentThread
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion
from semantic_kernel.contents.chat_message_content import ChatMessageContent
from semantic_kernel.contents.chat_history import ChatHistory

load_dotenv('../../.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SemanticKernelFlightBookingAgent:
    """A flight booking agent using Semantic Kernel and Azure OpenAI."""

    def __init__(self):
        """Initialize the flight booking agent with Azure OpenAI service."""
        logger.info("Initializing SemanticKernelFlightBookingAgent.")

        self.chat_agent = ChatCompletionAgent(
            service=AzureChatCompletion(),
            name="FlightBookingAssistant",
            instructions=(
                "You are a helpful flight booking assistant. "
                "Your task is to help users book flights by gathering necessary information "
                "such as departure city, destination city, travel dates, number of passengers, "
                "and preferred class of service. Once you have all the required information, "
                "provide a confirmation summary and simulate a successful booking."
            )
        )

        # Store chat history per context to maintain conversation state
        self.history_store: dict[str, ChatHistory] = {}

        logger.info(
            "SemanticKernelFlightBookingAgent initialized successfully.")

    def _get_or_create_chat_history(self, context_id: str) -> ChatHistory:
        """Get existing chat history or create a new one for the given context."""
        chat_history = self.history_store.get(context_id)

        if chat_history is None:
            chat_history = ChatHistory(
                messages=[],
                system_message=(
                    "You are a helpful flight booking assistant. "
                    "Help users book flights by gathering all necessary information: "
                    "departure city, destination city, travel dates, number of passengers, "
                    "and preferred class. Once you have complete information, "
                    "provide a booking confirmation summary."
                )
            )
            self.history_store[context_id] = chat_history
            logger.info(
                f"Created new ChatHistory for context ID: {context_id}")

        return chat_history

    async def book_flight(self, user_input: str, context_id: str) -> str:
        """
        Process a flight booking request from the user.

        Args:
            user_input: The user's request for flight booking
            context_id: The context ID for maintaining conversation state

        Returns:
            The response from the flight booking agent

        Raises:
            ValueError: If user input is empty
        """
        logger.info(
            f"Received flight booking request: {user_input} with context ID: {context_id}")

        if not user_input or not user_input.strip():
            logger.error("User input is empty.")
            raise ValueError("User input cannot be empty.")

        try:
            # Get or create chat history for the context
            chat_history = self._get_or_create_chat_history(context_id)

            # Add user input to chat history
            chat_history.messages.append(
                ChatMessageContent(role="user", content=user_input))

            # Create a new thread from the chat history
            thread = ChatHistoryAgentThread(
                chat_history=chat_history, thread_id=str(uuid4()))

            # Get response from the agent
            response = await self.chat_agent.get_response(message=user_input, thread=thread)

            # Add assistant response to chat history
            chat_history.messages.append(ChatMessageContent(
                role="assistant", content=response.content.content))

            logger.info(
                f"Flight booking agent response: {response.content.content}")

            return response.content.content

        except Exception as e:
            logger.error(f"Error processing flight booking request: {e}")
            return f"I apologize, but I encountered an error while processing your flight booking request: {str(e)}"
