import logging
import json
from fastapi import APIRouter, HTTPException
from app.models.api_models import AgentRequest, MultiAgentRequest
from app.core.kernel import create_kernel
from semantic_kernel.connectors.ai.open_ai import AzureChatPromptExecutionSettings
from semantic_kernel.contents.chat_history import ChatHistory
from semantic_kernel.connectors.ai.function_choice_behavior import FunctionChoiceBehavior
from semantic_kernel.agents import ChatCompletionAgent, AgentGroupChat
from semantic_kernel.agents.strategies import SequentialSelectionStrategy, DefaultTerminationStrategy
from semantic_kernel.contents import FunctionCallContent

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent", tags=["agents"])

@router.post("/chat")
async def agent_chat(request: AgentRequest):
    # Create a fresh kernel with the requested plugins
    kernel, _ = create_kernel(plugins=request.available_plugins)
    
    try:
        # Create a ChatCompletionAgent with the provided system prompt
        agent = ChatCompletionAgent(
            kernel=kernel,
            name="PlaygroundAgent",
            instructions=request.system_prompt
        )
        
        # Create a chat history
        chat_history = ChatHistory()
        
        # Add previous messages from the chat history if available
        for msg in request.chat_history:
            if msg["role"].lower() == "user":
                chat_history.add_user_message(msg["content"])
            elif msg["role"].lower() == "assistant":
                chat_history.add_assistant_message(msg["content"])
        
        # Add the current user message
        chat_history.add_user_message(request.message)
        
        # Create execution settings
        execution_settings = AzureChatPromptExecutionSettings(
            service_id="chat",
            temperature=request.temperature,
            top_p=0.8,
            max_tokens=1000
        )
        
        # Set up function calling behavior
        execution_settings.function_choice_behavior = FunctionChoiceBehavior.Auto()
        
        # Get the response from the agent
        response = await agent.get_response(chat_history, execution_settings=execution_settings)
        
        # Track function calls
        plugin_calls = []
        
        # Extract function calls from the chat history
        for message in chat_history:
            for item in message.items:
                if isinstance(item, FunctionCallContent):
                    # Convert arguments to a dictionary if it's a string
                    args = item.arguments
                    if isinstance(args, str):
                        try:
                            args = json.loads(args)
                        except:
                            args = {"location": args}
                    
                    plugin_calls.append({
                        "plugin_name": item.plugin_name,
                        "function_name": item.function_name,
                        "parameters": args
                    })
        
        # Return the agent's response along with the updated chat history and plugin calls
        return {
            "response": response.content,
            "chat_history": [
                {"role": "user", "content": request.message},
                {"role": "assistant", "content": response.content}
            ],
            "plugin_calls": plugin_calls
        }
    except Exception as e:
        logger.error(f"Error in agent_chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/multi-chat")
async def multi_agent_chat(request: MultiAgentRequest):
    # Create a fresh kernel with the requested plugins
    kernel, _ = create_kernel(plugins=request.available_plugins)
    
    try:
        # Create agents based on the provided configurations
        agents = []
        for agent_config in request.agent_configs:
            agent = ChatCompletionAgent(
                kernel=kernel,
                name=agent_config.get("name", "Agent"),
                instructions=agent_config.get("instructions", "You are a helpful assistant.")
            )
            agents.append(agent)
        
        # If no agents were provided, create default agents
        if not agents:
            # Create default agents with different perspectives
            agent_factual = ChatCompletionAgent(
                kernel=kernel,
                name="Researcher",
                instructions="You are a fact-based researcher who provides accurate and concise information. Always stick to verified facts and cite sources when possible. Keep your responses very concise, clear and straightforward."
            )
            
            agent_creative = ChatCompletionAgent(
                kernel=kernel,
                name="Innovator",
                instructions="You are a creative thinker who generates novel ideas and perspectives. Offer innovative approaches and unique ideas. Feel free to brainstorm and suggest creative solutions. Keep your responses very concise, imaginative and engaging."
            )
            
            agent_critic = ChatCompletionAgent(
                kernel=kernel,
                name="Critic",
                instructions="You are a thoughtful critic who evaluates ideas and identifies potential issues. Analyze the strengths and weaknesses of proposals and suggest improvements. Be constructive in your criticism. Keep your responses very concise, clear and straightforward."
            )
            
            agent_synthesizer = ChatCompletionAgent(
                kernel=kernel,
                name="Synthesizer",
                instructions="You are a skilled synthesizer who integrates diverse perspectives into coherent conclusions. Identify common themes across different viewpoints and create a balanced, integrated perspective. Keep your responses very concise, clear and straightforward."
            )
            
            agents = [agent_factual, agent_creative, agent_critic, agent_synthesizer]
        
        # Create a group chat with the agents
        group_chat = AgentGroupChat(
            agents=agents,
            selection_strategy=SequentialSelectionStrategy(),
            termination_strategy=DefaultTerminationStrategy(maximum_iterations=request.max_iterations)
        )
        
        # Create a chat history
        chat_history = ChatHistory()
        group_chat.history = chat_history
        
        # Add previous messages from the chat history if available
        for msg in request.chat_history:
            if msg["role"].lower() == "user":
                chat_history.add_user_message(msg["content"])
            elif msg["role"].lower() == "assistant":
                chat_history.add_assistant_message(msg["content"])
        
        # Add the current user message
        await group_chat.add_chat_message(message=request.message)
        
        # Create execution settings
        execution_settings = AzureChatPromptExecutionSettings(
            service_id="chat",
            temperature=request.temperature,
            top_p=0.8,
            max_tokens=1000
        )
        
        # Set up function calling behavior
        execution_settings.function_choice_behavior = FunctionChoiceBehavior.Auto()
        
        # Track agent responses
        agent_responses = []
        current_agent = None
        
        # Invoke the group chat
        try:
            async for response in group_chat.invoke():
                if response is not None and response.name:
                    # Add a separator between different agents
                    if current_agent != response.name:
                        current_agent = response.name
                        agent_responses.append({
                            "agent_name": response.name,
                            "content": response.content,
                            "is_new": True
                        })
                    else:
                        # Same agent continuing
                        agent_responses.append({
                            "agent_name": response.name,
                            "content": response.content,
                            "is_new": False
                        })
        except Exception as e:
            logger.error(f"Error during group chat invocation: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error during group chat invocation: {str(e)}")
        
        # Track function calls
        plugin_calls = []
        
        # Extract function calls from the chat history
        for message in chat_history:
            for item in message.items:
                if isinstance(item, FunctionCallContent):
                    # Convert arguments to a dictionary if it's a string
                    args = item.arguments
                    if isinstance(args, str):
                        try:
                            args = json.loads(args)
                        except:
                            args = {"location": args}
                    
                    plugin_calls.append({
                        "plugin_name": item.plugin_name,
                        "function_name": item.function_name,
                        "parameters": args
                    })
        
        # Reset is_complete to allow for further conversations
        group_chat.is_complete = False
        
        # Return the agent responses along with the updated chat history and plugin calls
        return {
            "agent_responses": agent_responses,
            "chat_history": [
                {"role": "user", "content": request.message}
            ] + [{"role": "assistant", "content": resp["content"], "agent_name": resp["agent_name"]} for resp in agent_responses],
            "plugin_calls": plugin_calls
        }
    except Exception as e:
        logger.error(f"Error in multi_agent_chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
