import os
import logging

import uvicorn
from dotenv import load_dotenv

from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2a.types import (
    AgentCapabilities,
    AgentCard,
    AgentSkill,
)
from agent_executor import SemanticKernelFlightBookingAgentExecutor

load_dotenv('../../.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Server configuration
SERVER_HOST = "0.0.0.0"
SERVER_PORT = 9999


def create_flight_booking_skill() -> AgentSkill:
    """Create and return the flight booking skill configuration."""
    return AgentSkill(
        id='flight_booking',
        name='Flight Booking',
        description='Assists users in booking flights based on their requests.',
        tags=['flight', 'booking', 'travel'],
        examples=[
            'Book a flight from New York to London next Monday.',
            'I need a flight to Paris tomorrow morning.',
        ],
    )


def create_agent_card() -> AgentCard:
    """Create and return the agent card configuration."""
    return AgentCard(
        name='Semantic Kernel Flight Booking Agent',
        description='An agent that helps users book flights using semantic kernel capabilities.',
        capabilities=AgentCapabilities(streaming=True),
        url=os.environ.get('A2A_SERVER_URL'),
        version='1.0.0',
        defaultInputModes=['text'],
        defaultOutputModes=['text'],
        skills=[create_flight_booking_skill()],
        supportsAuthenticatedExtendedCard=False,
    )


def create_server() -> A2AStarletteApplication:
    """Create and configure the A2A server application."""
    # Initialize request handler with the flight booking agent executor
    request_handler = DefaultRequestHandler(
        agent_executor=SemanticKernelFlightBookingAgentExecutor(),
        task_store=InMemoryTaskStore(),
    )

    # Create and return the server application
    return A2AStarletteApplication(
        agent_card=create_agent_card(),
        http_handler=request_handler,
    )


def main() -> None:
    """Main entry point for the flight booking agent server."""
    logger.info("Starting Semantic Kernel Flight Booking Agent Server.")

    server = create_server()

    logger.info(f"Starting server on {SERVER_HOST}:{SERVER_PORT}")
    uvicorn.run(server.build(), host=SERVER_HOST, port=SERVER_PORT)


if __name__ == '__main__':
    main()
