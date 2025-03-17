import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Paper, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, List, ListItem, ListItemText, Divider,
  Card, CardContent, Alert, CircularProgress, Grid, Chip,
  Stack
} from '@mui/material';
import { Memory as MemoryIcon, Search as SearchIcon, Assistant as AssistantIcon } from '@mui/icons-material';

const API_URL = 'http://localhost:8000';

function MemoryDemo() {
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [synthesizedResponse, setSynthesizedResponse] = useState('');
  const [newMemoryId, setNewMemoryId] = useState('');
  const [newMemoryText, setNewMemoryText] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' });
  const [critique, setCritique] = useState('');

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/memory/collections`);
      setCollections(response.data.collections);
      if (response.data.collections.length > 0) {
        setSelectedCollection(response.data.collections[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching collections:', error);
      setMessage({ 
        text: 'Failed to fetch memory collections. Please make sure the backend server is running.', 
        type: 'error' 
      });
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !selectedCollection) {
      setMessage({ text: 'Please enter a search query and select a collection', type: 'warning' });
      return;
    }

    try {
      setLoading(true);
      setSynthesizedResponse('');
      setCritique('');
      const response = await axios.post(`${API_URL}/memory/search`, {
        collection: selectedCollection,
        query: searchQuery,
        limit: 5
      });
      setSearchResults(response.data.results);
      setSynthesizedResponse(response.data.synthesized_response);
      setCritique(response.data.critique);
      setLoading(false);
      
      if (response.data.results.length === 0) {
        setMessage({ text: 'No results found for your query', type: 'info' });
      } else {
        setMessage({ text: '', type: 'info' });
      }
    } catch (error) {
      console.error('Error searching memory:', error);
      setMessage({ text: 'Error searching memory. Please try again.', type: 'error' });
      setLoading(false);
    }
  };

  const handleAddMemory = async () => {
    if (!newMemoryId.trim() || !newMemoryText.trim() || !selectedCollection) {
      setMessage({ text: 'Please fill in all fields', type: 'warning' });
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/memory/add`, {
        id: newMemoryId,
        text: newMemoryText,
        collection: selectedCollection
      });
      
      setNewMemoryId('');
      setNewMemoryText('');
      setMessage({ text: 'Memory added successfully!', type: 'success' });
      setLoading(false);
    } catch (error) {
      console.error('Error adding memory:', error);
      setMessage({ text: 'Error adding memory. Please try again.', type: 'error' });
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
            background: 'linear-gradient(45deg, #2563eb 30%, #3b82f6 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}
        >
          <MemoryIcon sx={{ fontSize: 35 }} />
          Semantic Memory
        </Typography>
        <Typography 
          variant="subtitle1" 
          color="text.secondary"
          sx={{ maxWidth: 600, mx: 'auto' }}
        >
          Experience AI-powered memory management with semantic search capabilities.
          Store information and retrieve it using natural language queries.
        </Typography>
      </Box>

      {message.text && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 3 }} 
          onClose={() => setMessage({ text: '', type: 'info' })}
        >
          {message.text}
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
              Add New Memory
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Collection</InputLabel>
              <Select
                value={selectedCollection}
                label="Collection"
                onChange={(e) => setSelectedCollection(e.target.value)}
              >
                {collections.map((collection) => (
                  <MenuItem key={collection} value={collection}>
                    {collection}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Memory ID"
              fullWidth
              margin="normal"
              value={newMemoryId}
              onChange={(e) => setNewMemoryId(e.target.value)}
              placeholder="E.g., fact1, budget2023, etc."
              sx={{ mb: 2 }}
            />
            <TextField
              label="Memory Text"
              fullWidth
              margin="normal"
              multiline
              rows={4}
              value={newMemoryText}
              onChange={(e) => setNewMemoryText(e.target.value)}
              placeholder="Enter the information you want to store"
              sx={{ mb: 3 }}
            />
            <Button 
              variant="contained" 
              fullWidth 
              onClick={handleAddMemory}
              disabled={loading}
              sx={{
                bgcolor: '#2563eb',
                '&:hover': {
                  bgcolor: '#1d4ed8',
                },
                mt: 'auto'
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Add to Memory'}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Stack spacing={4}>
            <Paper 
              sx={{ 
                p: 3
              }}
            >
              <Typography variant="h6" gutterBottom>
                Search Memory
              </Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>Collection</InputLabel>
                <Select
                  value={selectedCollection}
                  label="Collection"
                  onChange={(e) => setSelectedCollection(e.target.value)}
                >
                  {collections.map((collection) => (
                    <MenuItem key={collection} value={collection}>
                      {collection}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Search Query"
                fullWidth
                margin="normal"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ask a question in natural language"
                sx={{ mb: 2 }}
              />
              <Button 
                variant="contained" 
                fullWidth 
                onClick={handleSearch}
                disabled={loading}
                sx={{
                  bgcolor: '#2563eb',
                  '&:hover': {
                    bgcolor: '#1d4ed8',
                  }
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'Search'}
              </Button>
            </Paper>

            {synthesizedResponse && (
              <Paper 
                sx={{ 
                  p: 3,
                  bgcolor: '#2563eb10',
                  border: '1px solid #2563eb20'
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <AssistantIcon sx={{ color: '#2563eb', fontSize: 32 }} />
                  <Typography variant="h6" sx={{ color: '#2563eb' }}>
                    AI Assistant
                  </Typography>
                </Stack>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {synthesizedResponse}
                </Typography>
                {critique && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #2563eb20' }}>
                    <Typography variant="subtitle2" sx={{ color: '#2563eb', mb: 1 }}>
                      Response Quality:
                    </Typography>
                    <Chip
                      label={critique}
                      size="small"
                      sx={{
                        bgcolor: critique === 'Grounded' ? '#16a34a20' : 
                                critique === 'Ungrounded' ? '#dc262620' : '#64748b20',
                        color: critique === 'Grounded' ? '#16a34a' : 
                               critique === 'Ungrounded' ? '#dc2626' : '#64748b',
                        fontWeight: 500
                      }}
                    />
                  </Box>
                )}
              </Paper>
            )}

            {searchResults.length > 0 && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Search Results
                </Typography>
                <List sx={{ pt: 0 }}>
                  {searchResults.map((result, index) => (
                    <ListItem 
                      key={result.id}
                      sx={{ 
                        px: 0,
                        '&:first-of-type': { pt: 0 },
                        '&:last-child': { pb: 0 }
                      }}
                    >
                      <Card 
                        sx={{ 
                          width: '100%',
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            borderColor: '#2563eb',
                          }
                        }}
                      >
                        <CardContent>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                            <Typography 
                              variant="subtitle1"
                              sx={{ fontWeight: 600 }}
                            >
                              {result.id}
                            </Typography>
                            <Chip
                              label={`Relevance: ${result.relevance.toFixed(2)}`}
                              size="small"
                              sx={{
                                bgcolor: '#2563eb20',
                                color: '#2563eb',
                                fontWeight: 500
                              }}
                            />
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            {result.text}
                          </Typography>
                        </CardContent>
                      </Card>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            {!loading && searchResults.length === 0 && searchQuery && (
              <Box 
                sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 4,
                  color: 'text.secondary',
                  textAlign: 'center'
                }}
              >
                <SearchIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography>
                  No results found for your query
                </Typography>
              </Box>
            )}
          </Stack>
        </Grid>
      </Grid>

      <Paper sx={{ p: 4, mt: 4, bgcolor: '#f8f9fa' }}>
        <Typography variant="h6" gutterBottom>
          How Semantic Memory Works
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip 
            label="Step 1" 
            sx={{ 
              bgcolor: '#2563eb20',
              color: '#2563eb',
              fontWeight: 600
            }} 
          />
          <Typography>
            Your text is converted into a vector embedding that captures its semantic meaning
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip 
            label="Step 2" 
            sx={{ 
              bgcolor: '#2563eb20',
              color: '#2563eb',
              fontWeight: 600
            }} 
          />
          <Typography>
            The embedding is stored alongside the text in the specified collection
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip 
            label="Step 3" 
            sx={{ 
              bgcolor: '#2563eb20',
              color: '#2563eb',
              fontWeight: 600
            }} 
          />
          <Typography>
            When searching, your query is also converted to an embedding
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip 
            label="Step 4" 
            sx={{ 
              bgcolor: '#2563eb20',
              color: '#2563eb',
              fontWeight: 600
            }} 
          />
          <Typography>
            Results are found by comparing embeddings, enabling semantic search
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip 
            label="Step 5" 
            sx={{ 
              bgcolor: '#2563eb20',
              color: '#2563eb',
              fontWeight: 600
            }} 
          />
          <Typography>
            The AI assistant synthesizes the search results to provide a natural language response
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default MemoryDemo;
