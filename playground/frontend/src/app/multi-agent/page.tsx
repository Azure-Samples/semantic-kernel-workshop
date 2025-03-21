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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ScrollArea,
} from "@/components/ui/scroll-area";
import {
  List,
  ListItem,
  ListItemContent,
  ListItemIcon,
  ListItemText,
} from "@/components/ui/list";

// Import icons
import { 
  Bot, 
  Send, 
  Settings, 
  RefreshCw, 
  Info, 
  SunMedium, 
  Code, 
  Trash2,
  Plus,
  Edit,
  ChevronDown,
  Brain,
  Lightbulb,
  MessageSquare,
  Merge,
  User,
  Sparkles
} from "lucide-react";

const API_URL = 'http://localhost:8000';

type Message = {
  role: string;
  content: string;
  plugin?: string;
  function?: string;
  parameters?: any;
};

type Agent = {
  name: string;
  icon: any;
  color: string;
  instructions: string;
};

type AgentTemplate = {
  title: string;
  description: string;
  agents: Agent[];
};

// Default agent templates
const defaultAgentTemplates: Agent[] = [
  {
    name: "Researcher",
    icon: Brain,
    color: "#4285F4", // Google Blue
    instructions: "You are a fact-based researcher who provides accurate and concise information. Always stick to verified facts and cite sources when possible. Keep your responses very concise, clear and straightforward."
  },
  {
    name: "Innovator",
    icon: Lightbulb,
    color: "#FBBC05", // Google Yellow
    instructions: "You are a creative thinker who generates novel ideas and perspectives. Offer innovative approaches and unique ideas. Feel free to brainstorm and suggest creative solutions. Keep your responses very concise, imaginative and engaging."
  },
  {
    name: "Critic",
    icon: MessageSquare,
    color: "#EA4335", // Google Red
    instructions: "You are a thoughtful critic who evaluates ideas and identifies potential issues. Analyze the strengths and weaknesses of proposals and suggest improvements. Be constructive in your criticism. Keep your responses very concise, clear and straightforward."
  },
  {
    name: "Synthesizer",
    icon: Merge,
    color: "#34A853", // Google Green
    instructions: "You are a skilled synthesizer who integrates diverse perspectives into coherent conclusions. Identify common themes across different viewpoints and create a balanced, integrated perspective. Keep your responses very concise, clear and straightforward."
  }
];

// Example starter conversations
const exampleConversations = [
  {
    title: "Brainstorm Solutions",
    prompt: "What are some innovative approaches to reduce plastic waste in urban environments?"
  },
  {
    title: "Analyze Technology",
    prompt: "What are the potential benefits and risks of quantum computing for cybersecurity?"
  },
  {
    title: "Debate Topic",
    prompt: "Should artificial intelligence systems be granted legal personhood? Discuss different perspectives."
  }
];

// Template presets
const teamTemplates: AgentTemplate[] = [
  {
    title: 'Problem Solving Team',
    description: 'A balanced team of agents designed to analyze problems from multiple angles and propose solutions.',
    agents: [...defaultAgentTemplates]
  },
  {
    title: 'Creative Writing Team',
    description: 'A team focused on creative content generation with specialized roles.',
    agents: [
      {
        name: "Writer",
        icon: User,
        color: "#4285F4",
        instructions: "You are a skilled writer who crafts engaging prose. Focus on creating clear, compelling content with an emphasis on narrative flow and readability. Keep your responses concise but impactful."
      },
      {
        name: "Editor",
        icon: Edit,
        color: "#EA4335",
        instructions: "You are a detail-oriented editor who refines and improves written content. Check for clarity, coherence, grammar, and style issues. Suggest specific improvements rather than general comments."
      },
      {
        name: "FactChecker",
        icon: Brain,
        color: "#34A853",
        instructions: "You are a meticulous fact-checker who verifies information accuracy. Identify any claims that need verification and suggest corrections for inaccuracies. Ensure content is truthful and well-supported."
      }
    ]
  },
  {
    title: 'Debate Team',
    description: 'A team designed to present different perspectives on controversial topics.',
    agents: [
      {
        name: "Proponent",
        icon: User,
        color: "#4285F4",
        instructions: "You present the strongest case in favor of the topic being discussed. Focus on the benefits, advantages, and positive aspects. Make compelling arguments supported by evidence."
      },
      {
        name: "Opponent",
        icon: User,
        color: "#EA4335",
        instructions: "You present the strongest case against the topic being discussed. Focus on the drawbacks, risks, and negative aspects. Make compelling arguments supported by evidence."
      },
      {
        name: "Moderator",
        icon: User,
        color: "#34A853",
        instructions: "You ensure balanced discussion by highlighting nuances and areas of agreement. Summarize key points from both sides and identify common ground. Maintain neutrality while ensuring all perspectives are considered."
      }
    ]
  }
];

// Add these helper functions at the top of the file, after the imports
const getAgentName = (content: string): string | null => {
  if (!content.startsWith('[')) return null;
  const match = content.match(/^\[(.*?)\]:/);
  return match ? match[1] : null;
};

const getAgentColor = (content: string): string => {
  const agentName = getAgentName(content);
  if (!agentName) return 'bg-purple-500';
  
  const agent = defaultAgentTemplates.find(a => a.name === agentName);
  return agent ? agent.color : 'bg-purple-500';
};

const getAgentBackground = (content: string): string => {
  const agentName = getAgentName(content);
  if (!agentName) return 'bg-gray-100 text-gray-900';
  
  const agent = defaultAgentTemplates.find(a => a.name === agentName);
  if (!agent) return 'bg-gray-100 text-gray-900';
  
  // Convert hex to RGB for background opacity
  const hex = agent.color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `border-2 text-gray-900 border-[${agent.color}]` + 
         ` style="background-color: rgba(${r}, ${g}, ${b}, 0.1);"`;
};

const getAgentIcon = (content: string) => {
  const agentName = getAgentName(content);
  if (!agentName) return <Bot className="h-4 w-4" />;
  
  const agent = defaultAgentTemplates.find(a => a.name === agentName);
  const Icon = agent ? agent.icon : Bot;
  return <Icon className="h-4 w-4" />;
};

export default function MultiAgentDemo() {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetting, setResetting] = useState(false);
  
  // Agent configuration state
  const [systemPrompt, setSystemPrompt] = useState(
    'You are coordinating a team of specialized agents to solve problems collaboratively.'
  );
  const [temperature, setTemperature] = useState(0.7);
  const [showSettings, setShowSettings] = useState(false);
  const [availablePlugins, setAvailablePlugins] = useState({
    'Weather': false
  });
  const [maxIterations, setMaxIterations] = useState(8);
  
  // Agent management
  const [agents, setAgents] = useState<Agent[]>([...defaultAgentTemplates]);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const [showExampleDialog, setShowExampleDialog] = useState(false);
  
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
        content: msg.content,
        ...(msg.plugin && { plugin: msg.plugin }),
        ...(msg.function && { function: msg.function }),
        ...(msg.parameters && { parameters: msg.parameters })
      }));
      
      // Convert agents to the format expected by the API
      const agentConfigs = agents.map(agent => ({
        name: agent.name,
        instructions: agent.instructions
      }));
      
      const response = await axios.post(`${API_URL}/agent/multi-chat`, {
        message: userMessage.content,
        system_prompt: systemPrompt,
        temperature: temperature,
        available_plugins: enabledPlugins,
        chat_history: chatHistory,
        agent_configs: agentConfigs,
        max_iterations: maxIterations
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
      
      // Add agent responses to chat
      if (response.data.agent_responses && response.data.agent_responses.length > 0) {
        response.data.agent_responses.forEach((agentResponse: any) => {
          const agentMessage: Message = {
            role: 'assistant',
            content: `[${agentResponse.agent_name}]: ${agentResponse.content}`
          };
          setMessages(prev => [...prev, agentMessage]);
        });
      }
      
      // Add final assistant response if present
      if (response.data.response) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.data.response
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
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
    setAgents(template.agents);
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

  const handleAddAgent = () => {
    setEditingAgent({
      name: '',
      icon: User,
      color: '#4285F4',
      instructions: ''
    });
    setShowAgentDialog(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setShowAgentDialog(true);
  };

  const handleSaveAgent = () => {
    if (!editingAgent) return;
    
    if (editingAgent.name.trim() === '') {
      setError('Agent name is required');
      return;
    }
    
    if (editingAgent.instructions.trim() === '') {
      setError('Agent instructions are required');
      return;
    }
    
    // Check if an agent with this name already exists
    const existingAgent = agents.find(agent => agent.name === editingAgent.name);
    
    if (!existingAgent) {
      // Add new agent
      setAgents(prev => [...prev, editingAgent]);
    } else {
      // Update existing agent
      setAgents(prev => prev.map(agent => 
        agent.name === editingAgent.name ? editingAgent : agent
      ));
    }
    
    setShowAgentDialog(false);
    setEditingAgent(null);
  };

  const handleDeleteAgent = (agentName: string) => {
    setAgents(prev => prev.filter(agent => agent.name !== agentName));
  };

  const handleExampleSelect = (prompt: string) => {
    setInputMessage(prompt);
    setShowExampleDialog(false);
  };

  return (
    <Shell>
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500 flex items-center justify-center gap-2">
            <Sparkles className="h-7 w-7 text-indigo-600" />
            Multi-Agent Chat
          </h1>
          <div className="flex gap-2">
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
        </div>
        
        <p className="text-gray-600 max-w-2xl">
          Interact with multiple specialized AI agents working together to solve complex problems.
          Each agent brings unique expertise and perspective to the conversation.
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
                  <h2 className="text-lg font-semibold">Team Templates</h2>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Info className="h-4 w-4 text-gray-500" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Apply a pre-configured team template to quickly set up your agent team</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {teamTemplates.map((template, index) => (
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
                </ScrollArea>

                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Active Agents</h2>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleAddAgent}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Agent
                  </Button>
                </div>

                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {agents.map((agent, index) => (
                      <Card key={index} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div 
                                className="p-2 rounded-full"
                                style={{ backgroundColor: `${agent.color}20` }}
                              >
                                <agent.icon className="h-5 w-5" style={{ color: agent.color }} />
                              </div>
                              <div>
                                <h3 className="font-medium">{agent.name}</h3>
                                <p className="text-sm text-gray-600 line-clamp-2">{agent.instructions}</p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditAgent(agent)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteAgent(agent.name)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>

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
                        placeholder="Enter instructions for the agent team..."
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

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="max-iterations">Max Iterations</Label>
                        <span className="text-sm text-gray-500">{maxIterations}</span>
                      </div>
                      <Slider
                        id="max-iterations"
                        value={[maxIterations]}
                        min={1}
                        max={12}
                        step={1}
                        onValueChange={(values) => setMaxIterations(values[0])}
                      />
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
                  <h2 className="text-lg font-semibold">Chat with Agents</h2>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setShowExampleDialog(true)}
                      className="gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Examples
                    </Button>
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
                </div>
                
                <Separator className="mb-4" />
                
                {/* Messages Area */}
                <div className="flex-grow overflow-y-auto p-2 mb-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                      <Sparkles className="h-16 w-16 mb-4 opacity-50" />
                      <p className="text-lg">No messages yet</p>
                      <p className="text-sm">Start a conversation with the agent team</p>
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
                                  : getAgentColor(message.content)
                            } h-8 w-8`}>
                              <AvatarFallback>
                                {message.role === 'user' 
                                  ? 'U' 
                                  : message.role === 'plugin' 
                                    ? <Code className="h-4 w-4" /> 
                                    : getAgentIcon(message.content)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div
                              className={`rounded-lg p-3 ${
                                message.role === 'user' 
                                  ? 'bg-blue-500 text-white' 
                                  : message.role === 'plugin' 
                                    ? 'bg-green-500 text-white' 
                                    : 'text-gray-900 border-2'
                              }`}
                              style={
                                message.role === 'assistant' && message.content.startsWith('[')
                                  ? {
                                      backgroundColor: `${getAgentColor(message.content)}20`,
                                      borderColor: getAgentColor(message.content)
                                    }
                                  : undefined
                              }
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
                                <div>
                                  {message.role === 'assistant' && message.content.startsWith('[') && (
                                    <p className="font-medium mb-1 text-sm" style={{ 
                                      color: getAgentColor(message.content)
                                    }}>
                                      {getAgentName(message.content)}
                                    </p>
                                  )}
                                  <p className="whitespace-pre-wrap">{
                                    message.role === 'assistant' && message.content.startsWith('[') 
                                      ? message.content.substring(message.content.indexOf(']:') + 2).trim()
                                      : message.content
                                  }</p>
                                </div>
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

      {/* Agent Dialog */}
      <Dialog open={showAgentDialog} onOpenChange={setShowAgentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAgent?.name ? 'Edit Agent' : 'Add Agent'}</DialogTitle>
            <DialogDescription>
              Configure a new agent or modify an existing one.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="agent-name">Name</Label>
              <Textarea
                id="agent-name"
                value={editingAgent?.name || ''}
                onChange={(e) => setEditingAgent(prev => prev ? {...prev, name: e.target.value} : null)}
                placeholder="Enter agent name..."
                rows={1}
                className="resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agent-instructions">Instructions</Label>
              <Textarea
                id="agent-instructions"
                value={editingAgent?.instructions || ''}
                onChange={(e) => setEditingAgent(prev => prev ? {...prev, instructions: e.target.value} : null)}
                placeholder="Enter agent instructions..."
                rows={6}
                className="resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {['#4285F4', '#FBBC05', '#EA4335', '#34A853'].map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${
                      editingAgent?.color === color ? 'border-gray-900' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditingAgent(prev => prev ? {...prev, color} : null)}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAgentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAgent}>
              Save Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Example Dialog */}
      <Dialog open={showExampleDialog} onOpenChange={setShowExampleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Example Conversations</DialogTitle>
            <DialogDescription>
              Choose an example to start a conversation with the agent team.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {exampleConversations.map((example, index) => (
              <Card 
                key={index}
                className="cursor-pointer hover:shadow-md transition-all"
                onClick={() => handleExampleSelect(example.prompt)}
              >
                <CardContent className="p-4">
                  <h3 className="font-medium">{example.title}</h3>
                  <p className="text-sm text-gray-600">{example.prompt}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
} 