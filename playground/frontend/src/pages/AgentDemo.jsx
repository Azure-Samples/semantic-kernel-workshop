import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
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
  Tooltip
} from '@mui/material';
import { 
  SmartToy as AgentIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  WbSunny as WeatherIcon,
  Code as FunctionsIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const API_URL = 'http://localhost:8000';

function AgentDemo() {
  // Chat state
  const [messages, setMessages] = useState([]);
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
  const agentTemplates = [
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
      
      // Add assistant response to chat
      const assistantMessage = {
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
            Agent Demo
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
          Interact with an AI agent powered by Semantic Kernel. Configure the agent's behavior
          and experiment with different instructions and settings.
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

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Agent Templates</Typography>
              <Tooltip title="Apply a template to quickly configure your agent with different personalities and capabilities">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              {agentTemplates.map((template, index) => (
                <Card 
                  key={index} 
                  sx={{ 
                    mb: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 2
                    }
                  }}
                  onClick={() => applyTemplate(template)}
                >
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {template.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {template.description}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Settings</Typography>
              <Box>
                <Tooltip title="Clear Chat">
                  <IconButton 
                    onClick={clearChat} 
                    color="primary" 
                    disabled={resetting}
                  >
                    {resetting ? <CircularProgress size={24} /> : <DeleteIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Settings">
                  <IconButton onClick={() => setShowSettings(!showSettings)} color="primary">
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            {showSettings && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  System Prompt
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Enter instructions for the agent..."
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
                Chat with Agent
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
                  <AgentIcon sx={{ fontSize: 60, mb: 2, opacity: 0.7 }} />
                  <Typography variant="body1" gutterBottom>
                    No messages yet
                  </Typography>
                  <Typography variant="body2">
                    Start a conversation with the agent
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
                            : 'secondary.main',
                        width: 36,
                        height: 36
                      }}
                    >
                      {message.role === 'user' 
                        ? 'U' 
                        : message.role === 'plugin' 
                          ? <FunctionsIcon fontSize="small" /> 
                          : <AgentIcon fontSize="small" />}
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
                            : 'background.paper',
                        color: message.role === 'user' || message.role === 'plugin' ? 'white' : 'text.primary',
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
    </Box>
  );
}

export default AgentDemo;
