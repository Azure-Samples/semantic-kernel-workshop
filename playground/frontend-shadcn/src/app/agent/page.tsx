'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Shell from '@/components/layout/shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import {
  Slider
} from "@/components/ui/slider";

// Import icons individually
import { Bot, Send, Settings, RefreshCw, Info, SunMedium, Code, Trash2 } from "lucide-react";

const API_URL = 'http://localhost:8000';

type Message = {
  role: string;
  content: string;
  plugin?: string;
  function?: string;
  parameters?: any;
};

type AgentTemplate = {
  title: string;
  systemPrompt: string;
  description: string;
};

export default function AgentDemo() {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetting, setResetting] = useState(false);
  
  // Agent configuration state
  const [systemPrompt, setSystemPrompt] = useState(
    'You are a helpful assistant that provides concise and accurate information. Keep your responses brief but informative.'
  );
  const [temperature, setTemperature] = useState(0.7);
  const [showSettings, setShowSettings] = useState(false);
  const [availablePlugins, setAvailablePlugins] = useState({
    'Weather': false
  });
  
  // Template presets
  const agentTemplates: AgentTemplate[] = [
    {
      title: 'Helpful Assistant',
      systemPrompt: 'You are a helpful assistant that provides concise and accurate information. Keep your responses brief but informative.',
      description: 'A general-purpose assistant that provides helpful and accurate responses.'
    },
    {
      title: 'Math Tutor',
      systemPrompt: `You are a math tutor specialized in helping students understand mathematical concepts.
      
When responding to questions:
1. First explain the underlying concept in simple terms
2. Then walk through the solution step by step
3. Provide a simple example to reinforce the learning
4. Avoid solving problems directly without explanation

Always be encouraging and patient.`,
      description: 'Specialized in explaining mathematical concepts with step-by-step guidance.'
    },
    {
      title: 'Creative Writer',
      systemPrompt: `You are a creative writing assistant with a flair for engaging storytelling.

When responding to requests:
1. Use vivid and descriptive language
2. Incorporate varied sentence structures
3. Create compelling characters and scenarios
4. Adapt your style based on the genre requested

Be imaginative while maintaining coherent narratives.`,
      description: 'Helps with creative writing tasks using vivid and engaging language.'
    }
  ];
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = {
      role: 'user',
      content: inputMessage
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    setError('');
    
    try {
      // Get enabled plugins
      const enabledPlugins = Object.entries(availablePlugins)
        .filter(([_, enabled]) => enabled)
        .map(([name, _]) => name);
      
      // Convert messages to the format expected by the API
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      const response = await axios.post(`${API_URL}/agent/chat`, {
        message: userMessage.content,
        system_prompt: systemPrompt,
        temperature: temperature,
        available_plugins: enabledPlugins,
        chat_history: chatHistory
      });
      
      // If there are plugin calls, add them to the messages
      if (response.data.plugin_calls && response.data.plugin_calls.length > 0) {
        // Add plugin calls as separate messages
        response.data.plugin_calls.forEach((pluginCall: any) => {
          const pluginMessage: Message = {
            role: 'plugin',
            plugin: pluginCall.plugin_name,
            function: pluginCall.function_name,
            parameters: pluginCall.parameters,
            content: `Using ${pluginCall.plugin_name}.${pluginCall.function_name}(${JSON.stringify(pluginCall.parameters)})`
          };
          setMessages(prev => [...prev, pluginMessage]);
        });
      }
      
      // Add assistant response to chat
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.response
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Error communicating with the agent. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const resetChat = () => {
    setMessages([]);
  };
  
  const applyTemplate = (template: AgentTemplate) => {
    setSystemPrompt(template.systemPrompt);
  };
  
  // Clear chat history and reset kernel
  const clearChat = async () => {
    setMessages([]);
    setError('');
    setResetting(true);
    
    try {
      // Reset the kernel in the backend
      const response = await axios.post(`${API_URL}/kernel/reset`, {
        clear_memory: true
      });
      
      console.log('Kernel reset response:', response.data);
    } catch (error) {
      console.error('Error resetting kernel:', error);
      setError('Failed to reset the kernel. Some state may persist.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <Shell>
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500 flex items-center justify-center gap-2">
            <Bot className="h-7 w-7 text-indigo-600" />
            Agent Demo
          </h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={clearChat}
                  disabled={resetting}
                  className="text-red-500 border-red-200 hover:bg-red-50"
                >
                  {resetting ? (
                    <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear Chat & Reset Kernel</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <p className="text-gray-600 max-w-2xl">
          Interact with an AI agent powered by Semantic Kernel. Configure the agent's behavior
          and experiment with different instructions and settings.
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
          {/* Agent Settings */}
          <div className="md:col-span-4">
            <Card className="border shadow-sm">
              <CardContent className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Agent Templates</h2>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Info className="h-4 w-4 text-gray-500" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Apply a template to quickly configure your agent with different personalities and capabilities</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="space-y-3">
                  {agentTemplates.map((template, index) => (
                    <Card 
                      key={index}
                      className="border hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                      onClick={() => applyTemplate(template)}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-medium">{template.title}</h3>
                        <p className="text-sm text-gray-600">{template.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Settings</h2>
                  <div className="flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={clearChat}
                            disabled={resetting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Clear Chat</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setShowSettings(!showSettings)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {showSettings && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="system-prompt">System Prompt</Label>
                      <Textarea
                        id="system-prompt"
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        placeholder="Enter instructions for the agent..."
                        rows={6}
                        className="resize-none"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="temperature">Temperature</Label>
                        <span className="text-sm text-gray-500">{temperature.toFixed(1)}</span>
                      </div>
                      <Slider
                        id="temperature"
                        value={[temperature]}
                        min={0}
                        max={1}
                        step={0.1}
                        onValueChange={(values) => setTemperature(values[0])}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Available Plugins</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="weather-plugin"
                          checked={availablePlugins.Weather}
                          onCheckedChange={(checked) => 
                            setAvailablePlugins(prev => ({...prev, Weather: checked}))
                          }
                        />
                        <Label htmlFor="weather-plugin" className="flex items-center gap-1">
                          <SunMedium className="h-4 w-4" /> Weather
                        </Label>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="md:col-span-8">
            <Card className="border shadow-sm h-[70vh] flex flex-col">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Chat with Agent</h2>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={resetChat}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Chat
                  </Button>
                </div>
                
                <Separator className="mb-4" />
                
                {/* Messages Area */}
                <div className="flex-grow overflow-y-auto p-2 mb-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                      <Bot className="h-16 w-16 mb-4 opacity-50" />
                      <p className="text-lg">No messages yet</p>
                      <p className="text-sm">Start a conversation with the agent</p>
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
                                : message.role === 'plugin' 
                                  ? 'bg-green-500' 
                                  : 'bg-purple-500'
                            } h-8 w-8`}>
                              <AvatarFallback>
                                {message.role === 'user' 
                                  ? 'U' 
                                  : message.role === 'plugin' 
                                    ? <Code className="h-4 w-4" /> 
                                    : <Bot className="h-4 w-4" />}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div
                              className={`rounded-lg p-3 ${
                                message.role === 'user' 
                                  ? 'bg-blue-500 text-white' 
                                  : message.role === 'plugin' 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              {message.role === 'plugin' ? (
                                <div>
                                  <p className="font-semibold text-sm">
                                    Plugin: {message.plugin}.{message.function}
                                  </p>
                                  <pre className="text-xs mt-1 whitespace-pre-wrap">
                                    Parameters: {JSON.stringify(message.parameters, null, 2)}
                                  </pre>
                                </div>
                              ) : (
                                <p className="whitespace-pre-wrap">{message.content}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
                
                {/* Input Area */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={loading}
                    rows={1}
                    className="resize-none min-h-[56px]"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={loading || !inputMessage.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 h-[56px] w-[56px] p-0"
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
      </div>
    </Shell>
  );
} 