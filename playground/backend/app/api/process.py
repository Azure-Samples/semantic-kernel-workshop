import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, List, Optional
from enum import Enum
from pydantic import BaseModel

from semantic_kernel import Kernel
from semantic_kernel.core_plugins.text_memory_plugin import TextMemoryPlugin
from semantic_kernel.kernel_pydantic import KernelBaseModel
from semantic_kernel.processes.kernel_process.kernel_process_step import (
    KernelProcessStep,
)
from semantic_kernel.processes.kernel_process.kernel_process_step_context import (
    KernelProcessStepContext,
)
from semantic_kernel.processes.kernel_process.kernel_process_step_state import (
    KernelProcessStepState,
)
from semantic_kernel.processes.local_runtime.local_event import KernelProcessEvent
from semantic_kernel.processes.local_runtime.local_kernel_process import start
from semantic_kernel.processes.process_builder import ProcessBuilder
from semantic_kernel.functions import kernel_function
from semantic_kernel.contents import ChatHistory

from app.models.api_models import (
    ChatProcessRequest,
    ChatResponse,
    ContentProcessRequest,
    ContentResponse,
)
from app.core.kernel import create_kernel

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/process", tags=["process"])

# In-memory storage for active chat processes
active_processes: Dict[str, dict] = {}

# Define events for our chatbot process


class ChatBotEvents(Enum):
    StartProcess = "startProcess"
    IntroComplete = "introComplete"
    UserInputReceived = "userInputReceived"
    AssistantResponseGenerated = "assistantResponseGenerated"
    Exit = "exit"


# Define state for user input step


class UserInputState(KernelBaseModel):
    user_inputs: list[str] = []
    current_input_index: int = 0


# Create a step to handle the introduction


class IntroStep(KernelProcessStep):
    @kernel_function
    async def print_intro_message(self):
        """Prints the introduction message."""
        logger.info("Welcome to the Semantic Kernel Process Framework Chatbot!")
        logger.info("Type 'exit' to end the conversation.")
        return "Welcome to the Semantic Kernel Process Framework Chatbot!\nType 'exit' to end the conversation."


# Create a step to handle user input


class UserInputStep(KernelProcessStep[UserInputState]):
    def create_default_state(self) -> "UserInputState":
        """Creates the default UserInputState."""
        return UserInputState()

    async def activate(self, state: KernelProcessStepState[UserInputState]):
        """Activates the step and sets the state."""
        state.state = state.state or self.create_default_state()
        self.state = state.state

    @kernel_function(name="get_user_input")
    async def get_user_input(self, context: KernelProcessStepContext):
        """Gets the user input."""
        if not self.state:
            raise ValueError("State has not been initialized")

        # In a real implementation, this would come from the API
        # For now, we'll use a placeholder that will be replaced in the API endpoint
        user_message = "__USER_MESSAGE_PLACEHOLDER__"

        logger.info(f"User input: {user_message}")

        if "exit" in user_message.lower():
            await context.emit_event(process_event=ChatBotEvents.Exit, data=None)
            return

        self.state.current_input_index += 1
        self.state.user_inputs.append(user_message)

        # Emit the user input event
        await context.emit_event(
            process_event=ChatBotEvents.UserInputReceived, data=user_message
        )


# Define state for the chatbot response step


class ChatBotState(KernelBaseModel):
    chat_messages: list = []


# Create a step to handle the chatbot response


class ChatBotResponseStep(KernelProcessStep[ChatBotState]):
    def create_default_state(self) -> "ChatBotState":
        """Creates the default ChatBotState."""
        return ChatBotState()

    async def activate(self, state: KernelProcessStepState[ChatBotState]):
        """Activates the step and initializes the state object."""
        state.state = state.state or self.create_default_state()
        self.state = state.state

    @kernel_function(name="get_chat_response")
    async def get_chat_response(
        self, context: KernelProcessStepContext, user_message: str, kernel: Kernel
    ):
        """Generates a response from the chat completion service."""
        # Add user message to the state
        self.state.chat_messages.append({"role": "user", "content": user_message})

        # Get chat completion service and generate a response
        chat_service = kernel.get_service(service_id="chat")
        settings = chat_service.instantiate_prompt_execution_settings(service_id="chat")

        chat_history = ChatHistory()
        chat_history.add_user_message(user_message)

        try:
            response = await chat_service.get_chat_message_contents(
                chat_history=chat_history, settings=settings
            )

            if response is None:
                raise ValueError(
                    "Failed to get a response from the chat completion service."
                )

            answer = response[0].content
            logger.info(f"Assistant: {answer}")

            # Update state with the response
            self.state.chat_messages.append({"role": "assistant", "content": answer})

            # Emit an event: assistantResponse
            await context.emit_event(
                process_event=ChatBotEvents.AssistantResponseGenerated, data=answer
            )

            return answer
        except Exception as e:
            logger.error(f"Error generating chat response: {str(e)}")
            error_message = f"Sorry, I encountered an error: {str(e)}"
            self.state.chat_messages.append(
                {"role": "assistant", "content": error_message}
            )
            await context.emit_event(
                process_event=ChatBotEvents.AssistantResponseGenerated,
                data=error_message,
            )
            return error_message


# Function to run the chatbot process


async def run_chatbot_process():
    """Function to run the chatbot process."""
    # Create a kernel
    kernel, _ = create_kernel(plugins=["Weather"])

    # Create a process builder
    process = ProcessBuilder(name="ChatBot")

    # Define the steps
    intro_step = process.add_step(IntroStep)
    user_input_step = process.add_step(UserInputStep)
    response_step = process.add_step(ChatBotResponseStep)

    # Define the input event that starts the process and where to send it
    process.on_input_event(event_id=ChatBotEvents.StartProcess).send_event_to(
        target=intro_step
    )

    # Define the event that triggers the next step in the process
    intro_step.on_function_result(
        function_name=IntroStep.print_intro_message.__name__
    ).send_event_to(target=user_input_step)

    # Define the event that triggers the process to stop
    user_input_step.on_event(event_id=ChatBotEvents.Exit).stop_process()

    # For the user step, send the user input to the response step
    user_input_step.on_event(event_id=ChatBotEvents.UserInputReceived).send_event_to(
        target=response_step, parameter_name="user_message"
    )

    # For the response step, send the response back to the user input step
    response_step.on_event(
        event_id=ChatBotEvents.AssistantResponseGenerated
    ).send_event_to(target=user_input_step)

    # Build the kernel process
    kernel_process = process.build()

    # Start the process
    await start(
        process=kernel_process,
        kernel=kernel,
        initial_event=KernelProcessEvent(id=ChatBotEvents.StartProcess, data=None),
    )


@router.post("/chat/start", response_model=ChatResponse)
async def start_chat_process(
    request: ChatProcessRequest, background_tasks: BackgroundTasks
):
    """
    Start a new chat process.

    Args:
        request: The request containing initial message if any
        background_tasks: FastAPI background tasks

    Returns:
        ChatResponse: The response containing the process ID and initial greeting
    """
    # Generate a unique process ID
    import uuid

    process_id = str(uuid.uuid4())

    # Create a kernel
    kernel, _ = create_kernel(plugins=["Weather"])

    # Store the process data
    active_processes[process_id] = {"kernel": kernel, "messages": []}

    # Add the intro message to the chat history
    intro_message = "Welcome to the Semantic Kernel Process Framework Chatbot! Type 'exit' to end the conversation."
    active_processes[process_id]["messages"].append(
        {"role": "system", "content": intro_message}
    )

    return ChatResponse(
        process_id=process_id,
        response=intro_message,
        chat_history=[{"role": "system", "content": intro_message}],
    )


@router.post("/chat/{process_id}/message", response_model=ChatResponse)
async def send_message(process_id: str, request: ChatProcessRequest):
    """
    Send a message to an existing chat process.

    Args:
        process_id: The ID of the chat process
        request: The request containing the user's message

    Returns:
        ChatResponse: The response containing the chatbot's reply
    """
    # Check if the process exists
    if process_id not in active_processes:
        raise HTTPException(status_code=404, detail="Chat process not found")

    # Get the process data
    process_data = active_processes[process_id]
    kernel = process_data["kernel"]

    # Add the user message to the chat history
    user_message = request.message
    process_data["messages"].append({"role": "user", "content": user_message})

    # Check for exit command
    if user_message.lower() == "exit":
        return ChatResponse(
            process_id=process_id,
            response="Goodbye! Chat session ended.",
            chat_history=process_data["messages"]
            + [{"role": "assistant", "content": "Goodbye! Chat session ended."}],
        )

    # Create a chat history from the existing messages
    chat_history = ChatHistory()

    # Add the last few messages for context (up to 5)
    for message in process_data["messages"][-5:]:
        if message["role"] == "user":
            chat_history.add_user_message(message["content"])
        elif message["role"] == "assistant":
            chat_history.add_assistant_message(message["content"])
        elif message["role"] == "system":
            chat_history.add_system_message(message["content"])

    # Get chat completion service
    chat_service = kernel.get_service(service_id="chat")
    settings = chat_service.instantiate_prompt_execution_settings(service_id="chat")

    try:
        # Get the response from the chat service
        response = await chat_service.get_chat_message_contents(
            chat_history=chat_history, settings=settings
        )

        if response is None:
            raise ValueError("Failed to get a response from the chat service.")

        assistant_response = response[0].content
        logger.info(f"Assistant response: {assistant_response}")

        # Add the assistant response to the chat history
        process_data["messages"].append(
            {"role": "assistant", "content": assistant_response}
        )

        return ChatResponse(
            process_id=process_id,
            response=assistant_response,
            chat_history=process_data["messages"],
        )
    except Exception as e:
        logger.error(f"Error in send_message: {str(e)}")
        error_message = f"Sorry, I encountered an error: {str(e)}"

        # Add the error message to the chat history
        process_data["messages"].append({"role": "assistant", "content": error_message})

        return ChatResponse(
            process_id=process_id,
            response=error_message,
            chat_history=process_data["messages"],
        )


@router.delete("/chat/{process_id}", response_model=dict)
async def end_chat_process(process_id: str):
    """
    End a chat process and clean up resources.

    Args:
        process_id: The ID of the chat process

    Returns:
        dict: A status message
    """
    # Check if the process exists
    if process_id not in active_processes:
        raise HTTPException(status_code=404, detail="Chat process not found")

    # Remove the process from active processes
    del active_processes[process_id]

    return {"status": "success", "message": f"Chat process {process_id} ended"}
