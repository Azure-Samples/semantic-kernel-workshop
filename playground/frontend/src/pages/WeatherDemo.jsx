import React, { useState } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Paper, TextField, Button, 
  CircularProgress, Alert, Grid, Chip,
  Stack, Divider
} from '@mui/material';
import { 
  WbSunny as WeatherIcon,
  LocationOn as LocationIcon,
  Cloud as CloudIcon,
  Assistant as AssistantIcon
} from '@mui/icons-material';

const API_URL = 'http://localhost:8000';

function WeatherDemo() {
  const [query, setQuery] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [examples, setExamples] = useState([]);
  const [debugLogs, setDebugLogs] = useState([]);
  const [showDebug, setShowDebug] = useState(false);

  const exampleQueries = [
    "What's the weather like in New York?",
    "Is it going to rain in London this week?",
    "Tell me about the temperature in Tokyo",
    "How's the weather in Paris today?",
    "What's the forecast for Sydney?"
  ];

  const handleGetWeather = async () => {
    if (!query.trim()) {
      setError('Please enter a weather query');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setExamples([]);
      setDebugLogs([]);
      
      const response = await axios.post(`${API_URL}/weather`, {
        query: query
      });
      
      if (response.data.error) {
        setError(response.data.error);
        setExamples(response.data.example_queries || []);
        setWeatherData(null);
      } else {
        setWeatherData(response.data);
        // Update to use debug_logs from response data
        if (response.data.debug_logs) {
          setDebugLogs(response.data.debug_logs);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error getting weather data:', error);
      setError('Error getting weather data. Please ensure the backend server is running.');
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #ea580c 30%, #f97316 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}
        >
          <WeatherIcon sx={{ fontSize: 35 }} />
          Weather
        </Typography>
        <Typography 
          variant="subtitle1" 
          color="text.secondary"
          sx={{ maxWidth: 600, mx: 'auto' }}
        >
          Ask natural questions about the weather and get AI-powered responses.
          Try asking about current conditions or forecasts for any city.
        </Typography>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }} 
          onClose={() => setError('')}
        >
          {error}
          {examples.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Try these example queries:
              </Typography>
              <Stack spacing={1}>
                {examples.map((example, index) => (
                  <Typography 
                    key={index}
                    variant="body2"
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                    onClick={() => setQuery(example)}
                  >
                    • {example}
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper 
            sx={{ 
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Ask About Weather
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ask any question about weather conditions or forecasts. Make sure to mention
              the city you're interested in.
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Example Questions
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                {exampleQueries.map((example) => (
                  <Chip
                    key={example}
                    label={example}
                    onClick={() => setQuery(example)}
                    sx={{
                      bgcolor: query === example ? '#ea580c20' : 'transparent',
                      color: query === example ? '#ea580c' : 'inherit',
                      borderColor: '#ea580c',
                      '&:hover': {
                        bgcolor: '#ea580c10',
                      }
                    }}
                    variant={query === example ? "filled" : "outlined"}
                  />
                ))}
              </Stack>
            </Box>

            <TextField
              label="Your Weather Question"
              fullWidth
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., What's the weather like in New York?"
              multiline
              rows={2}
              sx={{ mb: 3 }}
            />

            <Button 
              variant="contained" 
              fullWidth 
              onClick={handleGetWeather}
              disabled={loading}
              sx={{
                bgcolor: '#ea580c',
                '&:hover': {
                  bgcolor: '#c2410c',
                },
                mt: 'auto'
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Get Answer'}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper 
            sx={{ 
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Weather Information
            </Typography>

            {loading ? (
              <Box 
                sx={{ 
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  flexGrow: 1
                }}
              >
                <CircularProgress sx={{ color: '#ea580c' }} />
              </Box>
            ) : weatherData ? (
              <Box sx={{ mt: 2 }}>
                {weatherData.assistant_response && (
                  <Paper 
                    sx={{ 
                      p: 3, 
                      mb: 3,
                      bgcolor: '#ea580c10',
                      border: '1px solid #ea580c20'
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <AssistantIcon sx={{ color: '#ea580c', fontSize: 32 }} />
                      <Typography variant="h6" sx={{ color: '#ea580c' }}>
                        AI Assistant
                      </Typography>
                    </Stack>
                    <Typography variant="body1">
                      {weatherData.assistant_response}
                    </Typography>
                  </Paper>
                )}
                
                <Divider sx={{ my: 3 }} />
                
                {weatherData.current_weather && (
                  <Paper 
                    sx={{ 
                      p: 3, 
                      mb: 3,
                      bgcolor: '#f8f9fa',
                      border: '1px solid #eaeaea'
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <WeatherIcon sx={{ color: '#64748b', fontSize: 32 }} />
                      <Typography variant="h6" sx={{ color: '#64748b' }}>
                        Current Weather
                      </Typography>
                    </Stack>
                    <Typography variant="body1">
                      {weatherData.current_weather}
                    </Typography>
                  </Paper>
                )}
                
                {weatherData.forecast && (
                  <Paper 
                    sx={{ 
                      p: 3,
                      bgcolor: '#f8f9fa',
                      border: '1px solid #eaeaea'
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <CloudIcon sx={{ color: '#64748b', fontSize: 32 }} />
                      <Typography variant="h6" sx={{ color: '#64748b' }}>
                        Forecast
                      </Typography>
                    </Stack>
                    <Typography variant="body1">
                      {weatherData.forecast}
                    </Typography>
                  </Paper>
                )}
              </Box>
            ) : (
              <Box 
                sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  flexGrow: 1,
                  color: 'text.secondary'
                }}
              >
                <WeatherIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography>
                  Weather information will appear here
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 4, mt: 4, bgcolor: '#f8f9fa' }}>
        <Typography variant="h6" gutterBottom>
          How the Weather Plugin Works
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip 
            label="Step 1" 
            sx={{ 
              bgcolor: '#ea580c20',
              color: '#ea580c',
              fontWeight: 600
            }} 
          />
          <Typography>
            The plugin receives your city name as input
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip 
            label="Step 2" 
            sx={{ 
              bgcolor: '#ea580c20',
              color: '#ea580c',
              fontWeight: 600
            }} 
          />
          <Typography>
            It processes the request using simulated weather data
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip 
            label="Step 3" 
            sx={{ 
              bgcolor: '#ea580c20',
              color: '#ea580c',
              fontWeight: 600
            }} 
          />
          <Typography>
            An AI assistant analyzes the weather data and provides a natural language response
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip 
            label="Step 4" 
            sx={{ 
              bgcolor: '#ea580c20',
              color: '#ea580c',
              fontWeight: 600
            }} 
          />
          <Typography>
            You receive both the raw weather data and the AI's interpretation
          </Typography>
        </Box>
      </Paper>

      {/* Debug Panel */}
      <Paper sx={{ p: 4, mt: 4, bgcolor: '#1e293b' }}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            color: 'white'
          }}
          onClick={() => setShowDebug(!showDebug)}
        >
          <Typography variant="h6" sx={{ color: 'white' }}>
            Debug Information
          </Typography>
          <Chip 
            label={showDebug ? "Hide" : "Show"} 
            sx={{ 
              bgcolor: '#ea580c20',
              color: '#ea580c',
              fontWeight: 600
            }} 
          />
        </Box>
        
        {showDebug && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 2 }}>
              Function Execution Logs
            </Typography>
            <Box 
              sx={{ 
                bgcolor: '#0f172a',
                p: 2,
                borderRadius: 1,
                maxHeight: '300px',
                overflowY: 'auto'
              }}
            >
              {debugLogs.length > 0 ? (
                debugLogs.map((log, index) => (
                  <Typography 
                    key={index}
                    variant="body2" 
                    sx={{ 
                      color: '#e2e8f0',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      mb: 1
                    }}
                  >
                    {log}
                  </Typography>
                ))
              ) : (
                <Typography 
                  variant="body2" 
                  sx={{ color: '#64748b' }}
                >
                  No logs available. Try making a weather query to see function execution details.
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default WeatherDemo;
