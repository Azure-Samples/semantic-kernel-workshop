import logging

from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue
from a2a.utils import new_agent_text_message, new_task

from agent import SemanticKernelFlightBookingAgent

logger = logging.getLogger(__name__)


class SemanticKernelFlightBookingAgentExecutor(AgentExecutor):
    """Executor for SemanticKernelFlightBookingAgent that handles A2A protocol integration."""

    def __init__(self):
        """Initialize the executor with a flight booking agent instance."""
        logger.info("Initializing SemanticKernelFlightBookingAgentExecutor.")
        self.agent = SemanticKernelFlightBookingAgent()
        logger.info(
            "SemanticKernelFlightBookingAgentExecutor initialized successfully.")

    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue,
    ) -> None:
        """
        Execute a flight booking request.

        Args:
            context: The request context containing user input and task information
            event_queue: Queue for sending events and responses
        """
        user_input = context.get_user_input()
        task = context.current_task
        context_id = context.context_id

        # Create a new task if one doesn't exist
        if not task:
            task = new_task(context.message)
            await event_queue.enqueue_event(task)

        logger.info(
            f"Executing flight booking - User input: {user_input}, Task ID: {task.id}, Context ID: {context_id}")

        try:
            # Process the flight booking request
            result = await self.agent.book_flight(user_input, context_id)

            # Send the result back through the event queue
            await event_queue.enqueue_event(new_agent_text_message(result))

            logger.info("Flight booking executed successfully.")

        except ValueError as ve:
            logger.error(f"Validation error during flight booking: {ve}")
            await event_queue.enqueue_event(
                new_agent_text_message(
                    f"I need more information to help you book a flight: {str(ve)}")
            )

        except Exception as e:
            logger.error(
                f"Unexpected error during flight booking execution: {e}")
            await event_queue.enqueue_event(
                new_agent_text_message(
                    "I apologize, but I encountered an error while processing your flight booking request. "
                    "Please try again or contact support if the issue persists."
                )
            )

    async def cancel(
        self,
        context: RequestContext,
        event_queue: EventQueue
    ) -> None:
        """
        Handle cancellation requests.

        Args:
            context: The request context
            event_queue: Queue for sending events

        Raises:
            Exception: Cancel operation is not supported
        """
        logger.warning(
            "Cancel operation requested but not supported for flight booking agent.")
        raise Exception(
            'Cancel operation not supported for flight booking operations.')
