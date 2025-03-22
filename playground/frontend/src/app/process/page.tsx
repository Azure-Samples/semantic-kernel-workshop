'use client';

import { useState, useEffect, useRef } from 'react';
import React from 'react';
import axios from 'axios';
import Shell from '@/components/layout/shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import icons individually
import { Bot, Send, RefreshCw, ArrowRight, Workflow, Circle, MessageSquare, ArrowDown, Play, RotateCw, ArrowUpRight, ArrowDownLeft, CornerDownLeft } from "lucide-react";

const API_URL = 'http://localhost:8000';

type Message = {
  role: string;
  content: string;
};

type ProcessStep = {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
  icon: React.ReactNode;
};

export default function ProcessDemo() {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processId, setProcessId] = useState<string | null>(null);
  const [processStarted, setProcessStarted] = useState(false);
  const [animationActive, setAnimationActive] = useState(false);
  
  // Process visualization state
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([
    {
      id: 'intro',
      name: 'Introduction Step',
      description: 'Prints the introduction message and welcomes the user',
      status: 'pending',
      icon: <Circle className="h-5 w-5" />
    },
    {
      id: 'userInput',
      name: 'User Input Step',
      description: 'Captures and processes user input',
      status: 'pending',
      icon: <MessageSquare className="h-5 w-5" />
    },
    {
      id: 'chatResponse',
      name: 'Chatbot Response Step',
      description: 'Generates a response using the chat completion service',
      status: 'pending',
      icon: <Bot className="h-5 w-5" />
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Scroll to bottom of messages - modified to be more controlled
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // Use scrollIntoView with a more controlled behavior
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' // Changed from 'start' to 'nearest' to prevent excessive scrolling
      });
    }
  };
  
  useEffect(() => {
    // Only scroll if there are messages
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);
  
  // Start animation effect
  useEffect(() => {
    let animationInterval: NodeJS.Timeout;
    
    if (processStarted && processId) {
      // Start the animation loop
      setAnimationActive(true);
      animationInterval = setInterval(() => {
        setAnimationActive(prev => !prev);
      }, 2000);
    }
    
    return () => {
      if (animationInterval) clearInterval(animationInterval);
    };
  }, [processStarted, processId]);
  
  // Function to start a new chat process
  const startChatProcess = async () => {
    setLoading(true);
    setError('');
    setProcessStarted(true);
    
    try {
      const response = await axios.post(`${API_URL}/process/chat/start`, {});
      
      setProcessId(response.data.process_id);
      
      // Update the intro step to completed
      updateStepStatus('intro', 'completed');
      
      // Update the user input step to active
      updateStepStatus('userInput', 'active');
      
      // Add the welcome message
      setMessages([{
        role: 'system',
        content: response.data.response
      }]);
    } catch (error) {
      console.error('Error starting chat process:', error);
      setError('Failed to start the chat process. Please ensure the backend server is running.');
      setProcessStarted(false);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to update the status of a process step
  const updateStepStatus = (stepId: string, status: 'pending' | 'active' | 'completed') => {
    setProcessSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };
  
  // Function to send a message to the chat process
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !processId) return;
    
    // Add user message to chat
    const userMessage: Message = {
      role: 'user',
      content: inputMessage
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    setError('');
    
    // Update the user input step to completed
    updateStepStatus('userInput', 'completed');
    
    // Update the chatbot response step to active
    updateStepStatus('chatResponse', 'active');
    
    try {
      const response = await axios.post(`${API_URL}/process/chat/${processId}/message`, {
        message: inputMessage
      });
      
      // Add assistant response to chat
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.response
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update the chatbot response step to completed
      updateStepStatus('chatResponse', 'completed');
      
      // Reset the user input step to active for the next message
      updateStepStatus('userInput', 'active');
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Error communicating with the chat process. Please try again or restart the process.');
      
      // Reset all steps to pending
      updateStepStatus('chatResponse', 'pending');
      updateStepStatus('userInput', 'pending');
    } finally {
      setLoading(false);
      
      // Focus the input field after sending the message
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const resetChat = async () => {
    setMessages([]);
    setProcessId(null);
    setError('');
    setProcessStarted(false);
    
    // Reset all steps to pending
    setProcessSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));
  };
  
  return (
    <Shell>
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500 flex items-center justify-center gap-2">
            <Workflow className="h-7 w-7 text-blue-600" />
            Process Framework Demo
          </h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={resetChat}
                  disabled={loading}
                  className="text-blue-500 border-blue-200 hover:bg-blue-50"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset Process</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <p className="text-gray-600 max-w-2xl">
          This demo showcases the Semantic Kernel Process Framework, which allows you to create structured, event-driven 
          workflows for building conversational AI applications. The visualization below shows how the process steps 
          are connected and how events trigger transitions between steps.
        </p>

        {/* Alert for errors */}
        {error && (
          <Alert 
            className="border-red-500 text-red-500"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Process Visualization */}
          <div className="md:col-span-4 flex flex-col">
            {/* Main visualization card with fixed height to match chat interface */}
            <Card className="border shadow-sm flex-grow flex flex-col" style={{ height: "70vh" }}>
              <CardContent className="p-6 space-y-6 flex-grow overflow-y-auto">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Process Visualization</h2>
                  
                  {!processStarted && (
                    <Button 
                      onClick={startChatProcess}
                      disabled={loading || processStarted}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {loading ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Start Process
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    The Semantic Kernel Process Framework uses an event-driven architecture to manage the flow between steps.
                    Each step can emit events that trigger other steps to execute.
                  </p>
                  
                  <div className="mt-6 space-y-4 relative">
                    {/* Introduction Step */}
                    <div className="relative">
                      <div className={`flex items-center gap-3 ${
                        processSteps[0].status === 'completed' ? 'text-green-600' : 
                        processSteps[0].status === 'active' ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        <div className={`p-2 rounded-full ${
                          processSteps[0].status === 'completed' ? 'bg-green-100' : 
                          processSteps[0].status === 'active' ? 'bg-blue-100' : 'bg-gray-100'
                        } transition-colors duration-300`}>
                          {processSteps[0].icon}
                        </div>
                        <div>
                          <h3 className="font-medium">{processSteps[0].name}</h3>
                          <p className="text-xs text-gray-500">{processSteps[0].description}</p>
                        </div>
                      </div>
                      
                      {/* Connector line */}
                      <div className="absolute left-[18px] top-[40px] h-[20px] w-[2px] bg-gray-200"></div>
                    </div>
                    
                    {/* Process Loop Container */}
                    <div className="relative border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="absolute -top-3 left-4 bg-white px-2 text-sm font-medium text-gray-500">Process Loop</div>
                      
                      <div className="flex items-start gap-4">
                        {/* Steps Column */}
                        <div className="flex-1">
                          {/* User Input Step */}
                          <div className="mb-8 relative">
                            <div className={`flex items-center gap-3 ${
                              processSteps[1].status === 'completed' ? 'text-green-600' : 
                              processSteps[1].status === 'active' ? 'text-blue-600' : 'text-gray-400'
                            }`}>
                              <div className={`p-2 rounded-full ${
                                processSteps[1].status === 'completed' ? 'bg-green-100' : 
                                processSteps[1].status === 'active' ? 'bg-blue-100' : 'bg-gray-100'
                              } transition-colors duration-300`}>
                                {processSteps[1].icon}
                              </div>
                              <div>
                                <h3 className="font-medium">{processSteps[1].name}</h3>
                                <p className="text-xs text-gray-500">{processSteps[1].description}</p>
                              </div>
                            </div>
                            
                            {/* Connector line */}
                            <div className="absolute left-[18px] top-[40px] h-[40px] w-[2px] bg-gray-200"></div>
                          </div>
                          
                          {/* Chatbot Response Step */}
                          <div>
                            <div className={`flex items-center gap-3 ${
                              processSteps[2].status === 'completed' ? 'text-green-600' : 
                              processSteps[2].status === 'active' ? 'text-blue-600' : 'text-gray-400'
                            }`}>
                              <div className={`p-2 rounded-full ${
                                processSteps[2].status === 'completed' ? 'bg-green-100' : 
                                processSteps[2].status === 'active' ? 'bg-blue-100' : 'bg-gray-100'
                              } transition-colors duration-300`}>
                                {processSteps[2].icon}
                              </div>
                              <div>
                                <h3 className="font-medium">{processSteps[2].name}</h3>
                                <p className="text-xs text-gray-500">{processSteps[2].description}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Loop Indicator Column */}
                        {processStarted && (
                          <div className="flex flex-col items-center justify-between h-[160px] w-[40px]">
                            <div className={`p-1.5 rounded-full ${animationActive ? 'bg-blue-100 text-blue-500' : 'bg-gray-100 text-gray-400'} transition-colors duration-300`}>
                              <ArrowDownLeft className="h-4 w-4" />
                            </div>
                            <div className={`p-1.5 rounded-full ${!animationActive ? 'bg-blue-100 text-blue-500' : 'bg-gray-100 text-gray-400'} transition-colors duration-300`}>
                              <RotateCw className="h-4 w-4" />
                            </div>
                            <div className={`p-1.5 rounded-full ${animationActive ? 'bg-blue-100 text-blue-500' : 'bg-gray-100 text-gray-400'} transition-colors duration-300`}>
                              <CornerDownLeft className="h-4 w-4" />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Loop explanation text */}
                      <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200 text-sm">
                        <p className="text-blue-600 text-xs">
                          The User Input and Chatbot Response steps form a continuous loop, processing messages until an "exit" event is triggered.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Events Flow - Moved inside main card */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Events Flow</h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
                      <span><code>StartProcess</code> - Initiates the process</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                      <span><code>IntroComplete</code> - Introduction message displayed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-purple-500"></span>
                      <span><code>UserInputReceived</code> - User message received</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-orange-500"></span>
                      <span><code>AssistantResponseGenerated</code> - Response created</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
                      <span><code>Exit</code> - Process termination requested</span>
                    </div>
                  </div>
                </div>
                
                {/* Process ID - Moved inside main card */}
                <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                  <h4 className="font-medium text-sm mb-2">Process ID:</h4>
                  <code className="text-xs bg-gray-100 p-1 rounded block w-full overflow-auto">{processId || 'Not started'}</code>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="md:col-span-8">
            <Card className="border shadow-sm h-[70vh] flex flex-col">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Process Framework Chat</h2>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={resetChat}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Process
                  </Button>
                </div>
                
                <Separator className="mb-4" />
                
                {/* Messages Area */}
                <div className="flex-grow overflow-y-auto p-2 mb-4 scroll-smooth" style={{ scrollBehavior: 'smooth' }}>
                  {!processStarted ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                      <Workflow className="h-16 w-16 mb-4 opacity-50" />
                      <p className="text-lg">Process not started</p>
                      <p className="text-sm mb-6">Click the "Start Process" button to begin</p>
                      <Button 
                        onClick={startChatProcess}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {loading ? (
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        Start Process
                      </Button>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                      <Workflow className="h-16 w-16 mb-4 opacity-50" />
                      <p className="text-lg">Starting process...</p>
                      <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mt-4"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`flex items-start gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                          >
                            <Avatar className={`${
                              message.role === 'user' 
                                ? 'bg-blue-500' 
                                : message.role === 'system' 
                                  ? 'bg-green-500' 
                                  : 'bg-purple-500'
                            } h-8 w-8`}>
                              <AvatarFallback>
                                {message.role === 'user' 
                                  ? 'U' 
                                  : message.role === 'system' 
                                    ? 'S' 
                                    : <Bot className="h-4 w-4" />}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div
                              className={`rounded-lg p-3 ${
                                message.role === 'user' 
                                  ? 'bg-blue-500 text-white' 
                                  : message.role === 'system' 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {/* Changed to a zero-height div to prevent affecting layout */}
                      <div ref={messagesEndRef} style={{ height: 0 }} />
                    </div>
                  )}
                </div>
                
                {/* Input Area */}
                <div className="flex gap-2">
                  <Textarea
                    ref={inputRef}
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={loading || !processId}
                    rows={1}
                    className="resize-none min-h-[56px]"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={loading || !inputMessage.trim() || !processId}
                    className="bg-blue-600 hover:bg-blue-700 h-[56px] w-[56px] p-0"
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Process Framework Explanation */}
        <Card className="border shadow-sm mt-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Understanding the Process Framework</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Key Components</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Process:</strong> A collection of steps that work together to accomplish a task</li>
                  <li><strong>Steps:</strong> Individual units of work that can be connected together</li>
                  <li><strong>Events:</strong> Signals that trigger transitions between steps</li>
                  <li><strong>State:</strong> Data that persists between step executions</li>
                  <li><strong>Kernel:</strong> Provides services like chat completion and memory</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Benefits</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Modularity:</strong> Break complex workflows into manageable, reusable steps</li>
                  <li><strong>Event-Driven:</strong> Steps communicate through events, making the system flexible</li>
                  <li><strong>State Management:</strong> Each step can maintain its own state</li>
                  <li><strong>Testability:</strong> Steps can be tested individually</li>
                  <li><strong>Extensibility:</strong> Easy to add new steps or modify existing ones</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Implementation Example</h3>
              <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
{`# Define the steps
intro_step = process.add_step(IntroStep)
user_input_step = process.add_step(UserInputStep)
response_step = process.add_step(ChatBotResponseStep)

# Connect the steps with events
process.on_input_event(event_id=ChatBotEvents.StartProcess).send_event_to(target=intro_step)

intro_step.on_function_result(function_name="print_intro_message").send_event_to(
    target=user_input_step
)

user_input_step.on_event(event_id=ChatBotEvents.UserInputReceived).send_event_to(
    target=response_step, parameter_name="user_message"
)

response_step.on_event(event_id=ChatBotEvents.AssistantResponseGenerated).send_event_to(
    target=user_input_step
)`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
