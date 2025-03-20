import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Avatar, 
  Divider, 
  FormControlLabel, 
  FormGroup,
  Switch, 
  Slider,
  CircularProgress,
  Alert,
  Grid, 
  Card, 
  CardContent,
  Chip,
  IconButton, 
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  ListItemButton
} from '@mui/material';
import { 
  SmartToy as AgentIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  WbSunny as WeatherIcon,
  Code as FunctionsIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  Lightbulb as LightbulbIcon,
  RateReview as CriticIcon,
  Merge as SynthesizerIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const API_URL = 'http://localhost:8000';

// Default agent templates
const defaultAgentTemplates = [
  {
    name: "Researcher",
    icon: <PsychologyIcon />,
    color: "#4285F4", // Google Blue
    instructions: "You are a fact-based researcher who provides accurate and concise information. Always stick to verified facts and cite sources when possible. Keep your responses very concise, clear and straightforward."
  },
  {
    name: "Innovator",
    icon: <LightbulbIcon />,
    color: "#FBBC05", // Google Yellow
    instructions: "You are a creative thinker who generates novel ideas and perspectives. Offer innovative approaches and unique ideas. Feel free to brainstorm and suggest creative solutions. Keep your responses very concise, imaginative and engaging."
  },
  {
    name: "Critic",
    icon: <CriticIcon />,
    color: "#EA4335", // Google Red
    instructions: "You are a thoughtful critic who evaluates ideas and identifies potential issues. Analyze the strengths and weaknesses of proposals and suggest improvements. Be constructive in your criticism. Keep your responses very concise, clear and straightforward."
  },
  {
    name: "Synthesizer",
    icon: <SynthesizerIcon />,
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
const teamTemplates = [
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
        icon: <PersonIcon />,
        color: "#4285F4",
        instructions: "You are a skilled writer who crafts engaging prose. Focus on creating clear, compelling content with an emphasis on narrative flow and readability. Keep your responses concise but impactful."
      },
      {
        name: "Editor",
        icon: <EditIcon />,
        color: "#EA4335",
        instructions: "You are a detail-oriented editor who refines and improves written content. Check for clarity, coherence, grammar, and style issues. Suggest specific improvements rather than general comments."
      },
      {
        name: "FactChecker",
        icon: <PsychologyIcon />,
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
        icon: <PersonIcon />,
        color: "#4285F4",
        instructions: "You present the strongest case in favor of the topic being discussed. Focus on the benefits, advantages, and positive aspects. Make compelling arguments supported by evidence."
      },
      {
        name: "Opponent",
        icon: <PersonIcon />,
        color: "#EA4335",
        instructions: "You present the strongest case against the topic being discussed. Focus on the drawbacks, risks, and negative aspects. Make compelling arguments supported by evidence."
      },
      {
        name: "Moderator",
        icon: <PersonIcon />,
        color: "#34A853",
        instructions: "You ensure balanced discussion by highlighting nuances and areas of agreement. Summarize key points from both sides and identify common ground. Maintain neutrality while ensuring all perspectives are considered."
      }
    ]
  }
];

function MultiAgentDemo() {
  // Chat state
  const [messages, setMessages] = useState([]);
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
  const [agents, setAgents] = useState([...defaultAgentTemplates]);
  const [editingAgent, setEditingAgent] = useState(null);
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  
  const messagesEndRef = useRef(null);
  
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
    const userMessage = {
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
        response.data.plugin_calls.forEach(pluginCall => {
          const pluginMessage = {
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
        response.data.agent_responses.forEach(agentResponse => {
          const agent = agents.find(a => a.name === agentResponse.agent_name) || defaultAgentTemplates.find(a => a.name === agentResponse.agent_name);
          
          const assistantMessage = {
            role: 'assistant',
            agent_name: agentResponse.agent_name,
            is_new: agentResponse.is_new,
            content: agentResponse.content,
            color: agent ? agent.color : "#6366F1"
          };
          
          setMessages(prev => [...prev, assistantMessage]);
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Error communicating with the agents. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const resetChat = () => {
    setMessages([]);
  };
  
  const applyTemplate = (template) => {
    setAgents([...template.agents]);
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
  
  // Agent management functions
  const openAgentDialog = (agent = null) => {
    if (agent) {
      setEditingAgent({ ...agent });
    } else {
      setEditingAgent({
        name: "",
        color: "#6366F1",
        instructions: ""
      });
    }
    setShowAgentDialog(true);
  };
  
  const closeAgentDialog = () => {
    setShowAgentDialog(false);
    setEditingAgent(null);
  };
  
  const saveAgent = () => {
    if (!editingAgent.name || !editingAgent.instructions) {
      return;
    }
    
    if (editingAgent.id) {
      // Update existing agent
      setAgents(agents.map(agent => 
        agent.id === editingAgent.id ? editingAgent : agent
      ));
    } else {
      // Add new agent
      setAgents([...agents, {
        ...editingAgent,
        id: Date.now().toString(),
        icon: <PersonIcon />
      }]);
    }
    
    closeAgentDialog();
  };
  
  const removeAgent = (agentId) => {
    setAgents(agents.filter(agent => agent.id !== agentId));
  };
  
  // Get the appropriate icon for an agent
  const getAgentIcon = (agentName) => {
    const agent = agents.find(a => a.name === agentName);
    if (agent && agent.icon) {
      return agent.icon;
    }
    
    switch (agentName) {
      case 'Researcher':
        return <PsychologyIcon />;
      case 'Innovator':
        return <LightbulbIcon />;
      case 'Critic':
        return <CriticIcon />;
      case 'Synthesizer':
        return <SynthesizerIcon />;
      default:
        return <AgentIcon />;
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #6366F1 30%, #8B5CF6 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}
          >
            <AgentIcon sx={{ fontSize: 35 }} />
            Multi-Agent Chat
          </Typography>
          <Box>
            <Tooltip title="Clear Chat & Reset Kernel">
              <IconButton 
                onClick={clearChat} 
                color="error" 
                disabled={resetting}
                sx={{ mr: 1 }}
              >
                {resetting ? <CircularProgress size={24} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Typography 
          variant="subtitle1" 
          color="text.secondary"
          sx={{ maxWidth: 600, mx: 'auto' }}
        >
          Collaborate with a team of specialized AI agents to solve complex problems.
          Each agent has different expertise and perspective to contribute to the discussion.
        </Typography>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }} 
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Example Conversations</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {exampleConversations.map((conversation, index) => (
            <Chip
              key={index}
              label={conversation.title}
              onClick={() => setInputMessage(conversation.prompt)}
              sx={{ 
                p: 1,
                height: 'auto',
                '& .MuiChip-label': { 
                  whiteSpace: 'normal',
                  display: 'block',
                  p: 0.5
                }
              }}
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Agent Team</Typography>
              <Box>
                <Tooltip title="Add Agent">
                  <IconButton onClick={() => openAgentDialog()} color="primary">
                    <AddIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Settings">
                  <IconButton onClick={() => setShowSettings(!showSettings)} color="primary">
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            <List sx={{ mb: 3 }}>
              {agents.map((agent, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => openAgentDialog(agent)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  }
                  disablePadding
                >
                  <ListItemButton>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: agent.color }}>
                        {agent.icon || <AgentIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={agent.name} 
                      secondary={agent.instructions.length > 50 ? 
                        `${agent.instructions.substring(0, 50)}...` : 
                        agent.instructions} 
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
            
            {showSettings && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  System Prompt
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Enter instructions for the agent group..."
                  variant="outlined"
                  size="small"
                  sx={{ mb: 3 }}
                />
                
                <Typography variant="subtitle2" gutterBottom>
                  Temperature: {temperature.toFixed(1)}
                </Typography>
                <Slider
                  value={temperature}
                  onChange={(_, newValue) => setTemperature(newValue)}
                  min={0}
                  max={1}
                  step={0.1}
                  valueLabelDisplay="auto"
                  sx={{ mb: 3 }}
                />
                
                <Typography variant="subtitle2" gutterBottom>
                  Max Iterations: {maxIterations}
                </Typography>
                <Slider
                  value={maxIterations}
                  onChange={(_, newValue) => setMaxIterations(newValue)}
                  min={4}
                  max={16}
                  step={1}
                  valueLabelDisplay="auto"
                  sx={{ mb: 3 }}
                />
                
                <Typography variant="subtitle2" gutterBottom>
                  Available Plugins
                </Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={availablePlugins.Weather}
                        onChange={(e) => setAvailablePlugins({
                          ...availablePlugins,
                          Weather: e.target.checked
                        })}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <WeatherIcon fontSize="small" sx={{ mr: 1 }} />
                        Weather
                      </Box>
                    }
                  />
                </FormGroup>
              </Box>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper 
            sx={{ 
              p: 3,
              height: '70vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2
            }}>
              <Typography variant="h6">
                Chat with Agent Team
              </Typography>
              <Button 
                startIcon={<RefreshIcon />}
                size="small"
                onClick={resetChat}
              >
                Reset Chat
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box 
              sx={{ 
                flexGrow: 1, 
                overflowY: 'auto',
                mb: 2,
                p: 1
              }}
            >
              {messages.length === 0 ? (
                <Box 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center', 
                    alignItems: 'center',
                    color: 'text.secondary'
                  }}
                >
                  <Box sx={{ display: 'flex', mb: 2 }}>
                    {defaultAgentTemplates.map((agent, index) => (
                      <Avatar 
                        key={index} 
                        sx={{ 
                          bgcolor: agent.color,
                          width: 40,
                          height: 40,
                          margin: '0 -8px',
                          border: '2px solid white'
                        }}
                      >
                        {agent.icon}
                      </Avatar>
                    ))}
                  </Box>
                  <Typography variant="body1" gutterBottom>
                    No messages yet
                  </Typography>
                  <Typography variant="body2">
                    Start a conversation with the agent team
                  </Typography>
                </Box>
              ) : (
                messages.map((message, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      mb: 2,
                      flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: message.role === 'user' 
                          ? 'primary.main' 
                          : message.role === 'plugin' 
                            ? 'success.main' 
                            : message.color || 'secondary.main',
                        width: 36,
                        height: 36
                      }}
                    >
                      {message.role === 'user' 
                        ? 'U' 
                        : message.role === 'plugin' 
                          ? <FunctionsIcon fontSize="small" /> 
                          : getAgentIcon(message.agent_name)}
                    </Avatar>
                    <Paper
                      sx={{
                        p: 2,
                        ml: message.role === 'user' ? 0 : 1,
                        mr: message.role === 'user' ? 1 : 0,
                        maxWidth: '80%',
                        bgcolor: message.role === 'user' 
                          ? 'primary.light' 
                          : message.role === 'plugin' 
                            ? 'success.light' 
                            : message.is_new ? message.color + '22' : 'background.paper',
                        color: message.role === 'user' || message.role === 'plugin' 
                          ? 'white' 
                          : 'text.primary',
                        borderLeft: message.role === 'assistant' && message.is_new 
                          ? `4px solid ${message.color}` 
                          : 'none'
                      }}
                    >
                      {message.role === 'plugin' ? (
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            Plugin: {message.plugin}.{message.function}
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            Parameters: {JSON.stringify(message.parameters, null, 2)}
                          </Typography>
                        </Box>
                      ) : message.role === 'assistant' ? (
                        <Box>
                          {message.is_new && (
                            <Typography variant="subtitle2" sx={{ 
                              fontWeight: 'bold',
                              color: message.color,
                              mb: 1
                            }}>
                              {message.agent_name}:
                            </Typography>
                          )}
                          <Box sx={{ 
                            '& pre': { 
                              backgroundColor: '#f5f5f5', 
                              p: 1, 
                              borderRadius: 1,
                              overflowX: 'auto'
                            },
                            '& code': {
                              backgroundColor: '#f5f5f5',
                              p: 0.5,
                              borderRadius: 0.5
                            },
                            '& ul, & ol': {
                              pl: 2
                            },
                            '& a': {
                              color: 'primary.main'
                            },
                            '& blockquote': {
                              borderLeft: '3px solid #ddd',
                              pl: 1,
                              color: 'text.secondary'
                            }
                          }}>
                            <ReactMarkdown>
                              {message.content}
                            </ReactMarkdown>
                          </Box>
                        </Box>
                      ) : (
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {message.content}
                        </Typography>
                      )}
                    </Paper>
                  </Box>
                ))
              )}
              <div ref={messagesEndRef} />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                multiline
                maxRows={3}
                sx={{ flexGrow: 1 }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSendMessage}
                disabled={loading || !inputMessage.trim()}
                sx={{ minWidth: '50px', height: '56px' }}
              >
                {loading ? <CircularProgress size={24} /> : <SendIcon />}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Templates</Typography>
            <List>
              {teamTemplates.map((template, index) => (
                <ListItem key={index} button onClick={() => applyTemplate(template)}>
                  <ListItemText primary={template.title} secondary={template.description} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Agent Edit Dialog */}
      <Dialog open={showAgentDialog} onClose={closeAgentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAgent && editingAgent.id ? 'Edit Agent' : 'Add New Agent'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Agent Name"
              value={editingAgent ? editingAgent.name : ''}
              onChange={(e) => setEditingAgent({...editingAgent, name: e.target.value})}
              margin="normal"
              variant="outlined"
            />
            
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Agent Color
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              {['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6'].map(color => (
                <Box
                  key={color}
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: color,
                    cursor: 'pointer',
                    border: editingAgent && editingAgent.color === color ? '3px solid black' : '1px solid #ddd',
                    '&:hover': {
                      opacity: 0.8
                    }
                  }}
                  onClick={() => setEditingAgent({...editingAgent, color})}
                />
              ))}
            </Box>
            
            <TextField
              fullWidth
              label="Instructions"
              value={editingAgent ? editingAgent.instructions : ''}
              onChange={(e) => setEditingAgent({...editingAgent, instructions: e.target.value})}
              margin="normal"
              variant="outlined"
              multiline
              rows={6}
              placeholder="Describe the agent's role, expertise, and how it should respond..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAgentDialog}>Cancel</Button>
          <Button 
            onClick={saveAgent} 
            variant="contained" 
            color="primary"
            disabled={!editingAgent || !editingAgent.name || !editingAgent.instructions}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MultiAgentDemo;
