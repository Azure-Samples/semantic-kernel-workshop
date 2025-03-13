import React, { useState } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Paper, TextField, Button, 
  CircularProgress, Alert, Grid, Chip,
  Stack, Switch, FormControlLabel
} from '@mui/material';
import { 
  Shield as ShieldIcon,
  FilterAlt as FilterIcon,
  Login as InputIcon,
  Logout as OutputIcon
} from '@mui/icons-material';

const API_URL = 'http://localhost:8000';

function FiltersDemo() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    pii: true,
    profanity: true,
    logging: true
  });

  const exampleInputs = [
    {
      title: "PII Data",
      text: "My email is john.doe@example.com and my credit card number is 4111-1111-1111-1111"
    },
    {
      title: "Sensitive Information",
      text: "Please call me at (555) 123-4567 or find my SSN: 123-45-6789"
    },
    {
      title: "Mixed Content",
      text: "My name is Alice Smith, my card number is 4111-1111-1111-1111, and I live at 123 Main St."
    }
  ];

  const handleToggleFilter = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const handleProcessText = async () => {
    if (!input.trim()) {
      setError('Please enter some text to process');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${API_URL}/filters/process`, {
        text: input,
        filters: filters
      });
      
      setResult(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error processing text:', error);
      setError('Error processing text. Please ensure the backend server is running.');
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
            background: 'linear-gradient(45deg, #64748b 30%, #94a3b8 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}
        >
          <ShieldIcon sx={{ fontSize: 35 }} />
          Semantic Kernel Filters
        </Typography>
        <Typography 
          variant="subtitle1" 
          color="text.secondary"
          sx={{ maxWidth: 800, mx: 'auto' }}
        >
          Experience how Semantic Kernel filters provide control and visibility over function execution.
          Filters can intercept and modify both inputs and outputs, enabling features like PII detection,
          content moderation, and execution logging.
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
              Enter Text to Process
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Type or select an example text to see how different filters process the content.
              These filters demonstrate pre-processing and post-processing capabilities in SK.
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Active Filters
              </Typography>
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={filters.pii}
                      onChange={() => handleToggleFilter('pii')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#64748b',
                          '&:hover': { backgroundColor: '#64748b20' }
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#64748b'
                        }
                      }}
                    />
                  }
                  label="PII Detection & Redaction"
                />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={filters.profanity}
                      onChange={() => handleToggleFilter('profanity')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#64748b',
                          '&:hover': { backgroundColor: '#64748b20' }
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#64748b'
                        }
                      }}
                    />
                  }
                  label="Content Moderation"
                />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={filters.logging}
                      onChange={() => handleToggleFilter('logging')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#64748b',
                          '&:hover': { backgroundColor: '#64748b20' }
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#64748b'
                        }
                      }}
                    />
                  }
                  label="Function Execution Logging"
                />
              </Stack>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Example Inputs
              </Typography>
              <Stack spacing={1}>
                {exampleInputs.map((example, index) => (
                  <Chip
                    key={index}
                    label={example.title}
                    onClick={() => setInput(example.text)}
                    sx={{
                      bgcolor: input === example.text ? '#64748b20' : 'transparent',
                      color: input === example.text ? '#64748b' : 'inherit',
                      borderColor: '#64748b',
                      '&:hover': {
                        bgcolor: '#64748b10',
                      }
                    }}
                    variant={input === example.text ? "filled" : "outlined"}
                  />
                ))}
              </Stack>
            </Box>

            <TextField
              label="Input Text"
              fullWidth
              multiline
              rows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text to process through filters..."
              sx={{ mb: 3 }}
            />

            <Button 
              variant="contained" 
              fullWidth 
              onClick={handleProcessText}
              disabled={loading}
              sx={{
                bgcolor: '#64748b',
                '&:hover': {
                  bgcolor: '#475569',
                },
                mt: 'auto'
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Process Text'}
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
              Filter Results
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
                <CircularProgress sx={{ color: '#64748b' }} />
              </Box>
            ) : result ? (
              <Box sx={{ mt: 2 }}>
                {result.input_processing && (
                  <Paper 
                    sx={{ 
                      p: 3, 
                      mb: 3,
                      bgcolor: '#64748b10',
                      border: '1px solid #64748b20'
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <InputIcon sx={{ color: '#64748b', fontSize: 32 }} />
                      <Typography variant="h6" sx={{ color: '#64748b' }}>
                        Pre-Processing Results
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Detected and processed by input filters:
                    </Typography>
                    <Typography variant="body1" component="div" sx={{ mt: 1 }}>
                      {result.input_processing}
                    </Typography>
                  </Paper>
                )}
                
                {result.output_processing && (
                  <Paper 
                    sx={{ 
                      p: 3,
                      bgcolor: '#64748b10',
                      border: '1px solid #64748b20'
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <OutputIcon sx={{ color: '#64748b', fontSize: 32 }} />
                      <Typography variant="h6" sx={{ color: '#64748b' }}>
                        Post-Processing Results
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Detected and processed by output filters:
                    </Typography>
                    <Typography variant="body1" component="div" sx={{ mt: 1 }}>
                      {result.output_processing}
                    </Typography>
                  </Paper>
                )}

                {result.logs && result.logs.length > 0 && (
                  <Paper 
                    sx={{ 
                      p: 3,
                      mt: 3,
                      bgcolor: '#0f172a',
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <FilterIcon sx={{ color: '#94a3b8', fontSize: 32 }} />
                      <Typography variant="h6" sx={{ color: '#94a3b8' }}>
                        Execution Logs
                      </Typography>
                    </Stack>
                    <Box 
                      sx={{ 
                        p: 2,
                        borderRadius: 1,
                        bgcolor: '#1e293b',
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}
                    >
                      {result.logs.map((log, index) => (
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
                      ))}
                    </Box>
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
                <ShieldIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography>
                  Filter results will appear here
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 4, mt: 4, bgcolor: '#f8f9fa' }}>
        <Typography variant="h6" gutterBottom>
          How Semantic Kernel Filters Work
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip 
            label="Step 1" 
            sx={{ 
              bgcolor: '#64748b20',
              color: '#64748b',
              fontWeight: 600
            }} 
          />
          <Typography>
            Pre-processing filters intercept and potentially modify the input before function execution
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip 
            label="Step 2" 
            sx={{ 
              bgcolor: '#64748b20',
              color: '#64748b',
              fontWeight: 600
            }} 
          />
          <Typography>
            The function executes with the filtered input, with logging filters tracking the process
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip 
            label="Step 3" 
            sx={{ 
              bgcolor: '#64748b20',
              color: '#64748b',
              fontWeight: 600
            }} 
          />
          <Typography>
            Post-processing filters can modify or validate the output before it's returned
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip 
            label="Step 4" 
            sx={{ 
              bgcolor: '#64748b20',
              color: '#64748b',
              fontWeight: 600
            }} 
          />
          <Typography>
            Execution logs provide transparency into the entire filtering process
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default FiltersDemo;