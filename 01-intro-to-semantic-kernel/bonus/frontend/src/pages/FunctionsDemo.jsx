import React, { useState } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Paper, TextField, Button, 
  CircularProgress, Alert, Grid, Card, CardContent,
  Chip
} from '@mui/material';
import { Functions as FunctionsIcon } from '@mui/icons-material';

const API_URL = 'http://localhost:8000';

function FunctionsDemo() {
  const [prompt, setPrompt] = useState('{{$input}}\n\nRewrite this in a professional tone:');
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Example prompts for users to try
  const examplePrompts = [
    {
      title: 'Professional Rewriter',
      prompt: '{{$input}}\n\nRewrite this in a professional tone:',
      inputExample: 'Hey, I think we should meet up to talk about that project thing we were discussing last week. It\'s kind of important.',
      description: 'Convert casual text into professional business communication.'
    },
    {
      title: 'Summarizer',
      prompt: '{{$input}}\n\nTL;DR in one sentence:',
      inputExample: 'Semantic Kernel is a lightweight SDK that integrates Large Language Models (LLMs) with conventional programming languages. It combines natural language semantic functions, traditional code native functions, and embeddings-based memory to create AI-enabled experiences.',
      description: 'Create a one-sentence summary of longer text.'
    },
    {
      title: 'Idea Generator',
      prompt: '{{$input}}\n\nGenerate 5 creative ideas related to this topic:',
      inputExample: 'Building a mobile app for personal finance management',
      description: 'Generate creative ideas around a specific topic.'
    }
  ];

  const handleInvokeFunction = async () => {
    if (!prompt.trim() || !inputText.trim()) {
      setError('Please provide both a prompt template and input text');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${API_URL}/functions/semantic`, {
        function_name: "professional_rewriter",
        plugin_name: "TextFormatter",
        prompt: prompt,
        input_text: inputText,
        parameters: {}
      });
      
      setResult(response.data.result);
      setLoading(false);
    } catch (error) {
      console.error('Error invoking function:', error);
      setError('Error invoking semantic function. Please ensure the backend server is running.');
      setLoading(false);
    }
  };

  const loadExample = (example) => {
    setPrompt(example.prompt);
    setInputText(example.inputExample);
    setResult('');
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
            background: 'linear-gradient(45deg, #16a34a 30%, #22c55e 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}
        >
          <FunctionsIcon sx={{ fontSize: 35 }} />
          Semantic Functions
        </Typography>
        <Typography 
          variant="subtitle1" 
          color="text.secondary"
          sx={{ maxWidth: 600, mx: 'auto' }}
        >
          Create and experiment with AI-powered semantic functions. Define your own prompts
          or try our examples to see how Semantic Kernel processes natural language.
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
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Example Functions
          </Typography>
          <Grid container spacing={2}>
            {examplePrompts.map((example, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      borderColor: '#16a34a',
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {example.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ mb: 2 }}
                    >
                      {example.description}
                    </Typography>
                    <Box 
                      sx={{ 
                        p: 2, 
                        bgcolor: '#f8f9fa',
                        borderRadius: 1,
                        border: '1px solid #eaeaea',
                        mb: 2,
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                      }}
                    >
                      {example.prompt}
                    </Box>
                    <Button 
                      variant="outlined" 
                      onClick={() => loadExample(example)}
                      fullWidth
                      sx={{
                        borderColor: '#16a34a',
                        color: '#16a34a',
                        '&:hover': {
                          borderColor: '#16a34a',
                          backgroundColor: '#16a34a10',
                        }
                      }}
                    >
                      Try This Function
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper 
            sx={{ 
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Define Your Function
            </Typography>
            <TextField
              label="Prompt Template"
              fullWidth
              margin="normal"
              multiline
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a prompt template with {{$input}} placeholder"
              helperText="Use {{$input}} to indicate where the input text should be inserted"
              sx={{ mb: 3 }}
            />
            <TextField
              label="Input Text"
              fullWidth
              margin="normal"
              multiline
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter the text to process"
              sx={{ mb: 3 }}
            />
            <Button 
              variant="contained" 
              fullWidth 
              onClick={handleInvokeFunction}
              disabled={loading}
              sx={{
                bgcolor: '#16a34a',
                '&:hover': {
                  bgcolor: '#15803d',
                }
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Run Function'}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper 
            sx={{ 
              p: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Result
            </Typography>
            <Box sx={{ flexGrow: 1 }}>
              {loading ? (
                <Box 
                  sx={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    minHeight: 200
                  }}
                >
                  <CircularProgress sx={{ color: '#16a34a' }} />
                </Box>
              ) : result ? (
                <Box 
                  sx={{ 
                    mt: 2,
                    p: 3,
                    bgcolor: '#f8f9fa',
                    borderRadius: 1,
                    border: '1px solid #eaeaea'
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {result}
                  </Typography>
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    minHeight: 200,
                    color: 'text.secondary'
                  }}
                >
                  <FunctionsIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography>
                    Function output will appear here
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 4, mt: 4, bgcolor: '#f8f9fa' }}>
        <Typography variant="h6" gutterBottom>
          How Semantic Functions Work
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip 
            label="Step 1" 
            sx={{ 
              bgcolor: '#16a34a20',
              color: '#16a34a',
              fontWeight: 600
            }} 
          />
          <Typography>
            Define your prompt template with placeholders like <code>{"{{{$input}}}"}</code>
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip 
            label="Step 2" 
            sx={{ 
              bgcolor: '#16a34a20',
              color: '#16a34a',
              fontWeight: 600
            }} 
          />
          <Typography>
            Semantic Kernel replaces the placeholders with your input text
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip 
            label="Step 3" 
            sx={{ 
              bgcolor: '#16a34a20',
              color: '#16a34a',
              fontWeight: 600
            }} 
          />
          <Typography>
            The completed prompt is sent to the AI model for processing
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip 
            label="Step 4" 
            sx={{ 
              bgcolor: '#16a34a20',
              color: '#16a34a',
              fontWeight: 600
            }} 
          />
          <Typography>
            The model's response is returned as your function's output
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default FunctionsDemo;
