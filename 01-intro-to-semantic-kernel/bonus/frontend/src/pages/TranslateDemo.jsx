import React, { useState } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Paper, TextField, Button, 
  CircularProgress, Alert, Grid, MenuItem, Select,
  FormControl, InputLabel, Card, CardContent,
  Chip, Divider
} from '../../../../../playground/frontend/node_modules/@mui/material';
import { Translate as TranslateIcon } from '@mui/icons-material';

const API_URL = 'http://localhost:8000';

function TranslateDemo() {
  const [text, setText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('French');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const languages = [
    'French', 'Spanish', 'German', 'Italian', 'Portuguese', 
    'Russian', 'Japanese', 'Chinese', 'Korean', 'Arabic',
    'Hindi', 'Dutch', 'Swedish', 'Greek', 'Turkish'
  ];

  const exampleTexts = [
    {
      title: 'Semantic Kernel Introduction',
      text: 'Semantic Kernel is an open-source SDK that integrates Large Language Models (LLMs) with conventional programming languages. It enables developers to build AI applications that combine the best of both worlds.'
    },
    {
      title: 'Technical Documentation',
      text: 'To install the package, run "pip install semantic-kernel" in your terminal. Then import the library using "import semantic_kernel as sk" in your Python code.'
    },
    {
      title: 'Casual Conversation',
      text: 'Hey there! I was wondering if you\'d like to join us for dinner tonight? We\'re planning to try that new restaurant downtown around 7pm.'
    }
  ];

  const handleTranslate = async () => {
    if (!text.trim()) {
      setError('Please enter text to translate');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${API_URL}/translate`, {
        text: text,
        target_language: targetLanguage
      });
      
      setTranslatedText(response.data.translated_text);
      setLoading(false);
    } catch (error) {
      console.error('Error translating text:', error);
      setError('Error translating text. Please ensure the backend server is running.');
      setLoading(false);
    }
  };

  const loadExample = (example) => {
    setText(example.text);
    setTranslatedText('');
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
            background: 'linear-gradient(45deg, #9333ea 30%, #c084fc 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}
        >
          <TranslateIcon sx={{ fontSize: 35 }} />
          Translation
        </Typography>
        <Typography 
          variant="subtitle1" 
          color="text.secondary"
          sx={{ maxWidth: 600, mx: 'auto' }}
        >
          This demo showcases Semantic Kernel's ability to translate text between languages
          using AI-powered semantic functions.
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
            Example Texts
          </Typography>
          <Grid container spacing={2}>
            {exampleTexts.map((example, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      borderColor: '#9333ea',
                    }
                  }}
                >
                  <CardContent sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <Typography variant="h6" gutterBottom>
                      {example.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ mb: 2, flexGrow: 1 }}
                    >
                      {example.text.length > 100 
                        ? example.text.substring(0, 100) + '...' 
                        : example.text}
                    </Typography>
                    <Button 
                      variant="outlined" 
                      onClick={() => loadExample(example)}
                      fullWidth
                      sx={{
                        borderColor: '#9333ea',
                        color: '#9333ea',
                        '&:hover': {
                          borderColor: '#9333ea',
                          backgroundColor: '#9333ea10',
                        }
                      }}
                    >
                      Use This Example
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
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
              Text to Translate
            </Typography>
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Target Language</InputLabel>
                <Select
                  value={targetLanguage}
                  label="Target Language"
                  onChange={(e) => setTargetLanguage(e.target.value)}
                >
                  {languages.map((language) => (
                    <MenuItem key={language} value={language}>
                      {language}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Enter Text"
                fullWidth
                multiline
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to translate"
                sx={{ mb: 2 }}
              />
              <Button 
                variant="contained" 
                fullWidth 
                onClick={handleTranslate}
                disabled={loading}
                sx={{
                  bgcolor: '#9333ea',
                  '&:hover': {
                    bgcolor: '#7e22ce',
                  }
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'Translate'}
              </Button>
            </Box>
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
              Translation Result
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
                  <CircularProgress sx={{ color: '#9333ea' }} />
                </Box>
              ) : translatedText ? (
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
                    {translatedText}
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
                  <TranslateIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography>
                    Translation will appear here
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 4, mt: 4, bgcolor: '#f8f9fa' }}>
        <Typography variant="h6" gutterBottom>
          How Translation Works
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip 
            label="Step 1" 
            sx={{ 
              bgcolor: '#9333ea20',
              color: '#9333ea',
              fontWeight: 600
            }} 
          />
          <Typography>
            Your text is processed by a semantic function with this prompt template: <code>{"{{{$input}}\\n\\nTranslate this into {{$target_language}}:"}</code>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip 
            label="Step 2" 
            sx={{ 
              bgcolor: '#9333ea20',
              color: '#9333ea',
              fontWeight: 600
            }} 
          />
          <Typography>
            The AI model receives your text and target language as inputs
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip 
            label="Step 3" 
            sx={{ 
              bgcolor: '#9333ea20',
              color: '#9333ea',
              fontWeight: 600
            }} 
          />
          <Typography>
            The model processes the request and returns the translated text
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default TranslateDemo;
