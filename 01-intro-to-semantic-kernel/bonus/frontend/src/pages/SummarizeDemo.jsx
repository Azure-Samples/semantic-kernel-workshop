import React, { useState } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Paper, TextField, Button, 
  CircularProgress, Alert, Grid, Card, CardContent,
  Chip
} from '@mui/material';
import { Summarize as SummarizeIcon } from '@mui/icons-material';

const API_URL = 'http://localhost:8000';

function SummarizeDemo() {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const exampleTexts = [
    {
      title: 'Semantic Kernel Overview',
      text: `Semantic Kernel is a lightweight, open-source SDK that integrates Large Language Models (LLMs) with conventional programming languages. It combines natural language semantic functions, traditional code native functions, and embeddings-based memory to create AI-enabled experiences.
Semantic Kernel acts as middleware between your application code and AI large language models (LLMs). It enables developers to easily integrate AI into apps by letting AI agents call code functions and by orchestrating complex tasks. SK is lightweight and modular, designed for enterprise-grade solutions with features like telemetry and filters for responsible AI. Major companies (including Microsoft) leverage SK because it's flexible and future-proof – you can swap in new AI models as they emerge without rewriting your code. In short, SK helps build robust, scalable AI applications that can evolve with advancing AI capabilities.`
    },
    {
      title: 'Memory in Semantic Kernel',
      text: `In AI applications, memory is crucial for creating contextual, personalized experiences. Semantic Kernel provides powerful memory management capabilities that allow your AI applications to remember facts and knowledge over time, find information based on meaning rather than exact matches, use previous context in ongoing conversations, and implement Retrieval-Augmented Generation (RAG) patterns.
When we save information to Semantic Memory, the system generates an embedding vector for the text, stores both the text and its vector in the memory store, and associates it with the given ID and collection. For semantic search, we provide a natural language query which the memory system converts to a vector embedding, compares against stored embeddings using cosine similarity, and returns the closest matching results. The search works even if the query doesn't exactly match the stored text, as it finds semantically similar content.`
    },
    {
      title: 'Technical Article',
      text: `The TCP/IP model is a conceptual framework used to understand and implement networking protocols. It consists of four layers: the Network Interface layer (handling physical connections), the Internet layer (managing logical addressing and routing), the Transport layer (ensuring reliable data transfer), and the Application layer (providing services to end-user applications).
When data is sent over a network, it travels down through these layers on the sending device, with each layer adding its own header information. The data then travels across the network to the receiving device, where it moves up through the same layers in reverse order, with each layer processing and removing its respective header information. This layered approach allows for modular design and implementation of networking protocols, making it easier to update or replace specific components without affecting the entire system.`
    }
  ];

  const handleSummarize = async () => {
    if (!text.trim()) {
      setError('Please enter text to summarize');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${API_URL}/summarize`, {
        text: text
      });
      
      setSummary(response.data.summary);
      setLoading(false);
    } catch (error) {
      console.error('Error summarizing text:', error);
      setError('Error summarizing text. Please ensure the backend server is running.');
      setLoading(false);
    }
  };

  const loadExample = (example) => {
    setText(example.text);
    setSummary('');
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
            background: 'linear-gradient(45deg, #0891b2 30%, #22d3ee 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}
        >
          <SummarizeIcon sx={{ fontSize: 35 }} />
          Summarization
        </Typography>
        <Typography 
          variant="subtitle1" 
          color="text.secondary"
          sx={{ maxWidth: 600, mx: 'auto' }}
        >
          Experience Semantic Kernel's text summarization capabilities powered by AI.
          Turn lengthy content into concise, meaningful summaries.
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
                      borderColor: '#0891b2',
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
                      {example.text.substring(0, 150)}...
                    </Typography>
                    <Button 
                      variant="outlined" 
                      onClick={() => loadExample(example)}
                      fullWidth
                      sx={{
                        borderColor: '#0891b2',
                        color: '#0891b2',
                        '&:hover': {
                          borderColor: '#0891b2',
                          backgroundColor: '#0891b210',
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

        <Grid item xs={12} md={8}>
          <Paper 
            sx={{ 
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Text to Summarize
            </Typography>
            <TextField
              label="Enter Text"
              fullWidth
              multiline
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to summarize"
              sx={{ mb: 2 }}
            />
            <Button 
              variant="contained" 
              fullWidth 
              onClick={handleSummarize}
              disabled={loading}
              sx={{
                bgcolor: '#0891b2',
                '&:hover': {
                  bgcolor: '#0e7490',
                }
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Summarize'}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper 
            sx={{ 
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Summary
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
                  <CircularProgress sx={{ color: '#0891b2' }} />
                </Box>
              ) : summary ? (
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
                    {summary}
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
                  <SummarizeIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography>
                    Summary will appear here
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 4, mt: 4, bgcolor: '#f8f9fa' }}>
        <Typography variant="h6" gutterBottom>
          How Summarization Works
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip 
            label="Step 1" 
            sx={{ 
              bgcolor: '#0891b220',
              color: '#0891b2',
              fontWeight: 600
            }} 
          />
          <Typography>
            Your text is processed by a semantic function with this prompt template: <code>{"{{{$input}}\\n\\nTL;DR in one sentence:"}</code>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip 
            label="Step 2" 
            sx={{ 
              bgcolor: '#0891b220',
              color: '#0891b2',
              fontWeight: 600
            }} 
          />
          <Typography>
            The AI model analyzes the content to identify key information
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip 
            label="Step 3" 
            sx={{ 
              bgcolor: '#0891b220',
              color: '#0891b2',
              fontWeight: 600
            }} 
          />
          <Typography>
            A concise, one-sentence summary is generated while preserving the main points
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default SummarizeDemo;
