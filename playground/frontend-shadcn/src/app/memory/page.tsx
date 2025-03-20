'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Shell from '@/components/layout/shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Import icons individually to avoid barrel import issues
import { MemoryStick } from "lucide-react";
import { Search } from "lucide-react";
import { MessagesSquare } from "lucide-react";

const API_URL = 'http://localhost:8000';

export default function MemoryDemo() {
  const [collections, setCollections] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [synthesizedResponse, setSynthesizedResponse] = useState<string>('');
  const [newMemoryId, setNewMemoryId] = useState<string>('');
  const [newMemoryText, setNewMemoryText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'info' | 'warning' | 'error' | 'success' }>({ text: '', type: 'info' });
  const [critique, setCritique] = useState<string>('');

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
    <Shell>
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-blue-400 flex items-center justify-center gap-2">
            <MemoryStick className="h-7 w-7" />
            Semantic Memory
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Experience AI-powered memory management with semantic search capabilities.
            Store information and retrieve it using natural language queries.
          </p>
        </div>

        {/* Alert messages */}
        {message.text && (
          <Alert 
            className={`${
              message.type === 'error' ? 'border-red-500 text-red-500' :
              message.type === 'success' ? 'border-green-500 text-green-500' :
              message.type === 'warning' ? 'border-yellow-500 text-yellow-500' :
              'border-blue-500 text-blue-500'
            }`}
          >
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add Memory Panel */}
          <Card className="border shadow-sm">
            <CardContent className="p-6 flex flex-col space-y-4">
              <h2 className="text-xl font-semibold">Add New Memory</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Collection</label>
                  <Select 
                    value={selectedCollection} 
                    onValueChange={setSelectedCollection}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a collection" />
                    </SelectTrigger>
                    <SelectContent>
                      {collections.map((collection) => (
                        <SelectItem key={collection} value={collection}>
                          {collection}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Memory ID</label>
                  <Input
                    placeholder="E.g., fact1, budget2023, etc."
                    value={newMemoryId}
                    onChange={(e) => setNewMemoryId(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Memory Text</label>
                  <Textarea
                    placeholder="Enter the information you want to store"
                    rows={4}
                    value={newMemoryText}
                    onChange={(e) => setNewMemoryText(e.target.value)}
                  />
                </div>
                
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleAddMemory}
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add to Memory'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search Panel */}
          <div className="space-y-6">
            <Card className="border shadow-sm">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-semibold">Search Memory</h2>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Collection</label>
                    <Select 
                      value={selectedCollection} 
                      onValueChange={setSelectedCollection}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a collection" />
                      </SelectTrigger>
                      <SelectContent>
                        {collections.map((collection) => (
                          <SelectItem key={collection} value={collection}>
                            {collection}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Search Query</label>
                    <Input
                      placeholder="Ask a question in natural language"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={handleSearch}
                    disabled={loading}
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Response */}
            {synthesizedResponse && (
              <Card className="border border-blue-100 bg-blue-50 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MessagesSquare className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-600">AI Assistant</h3>
                  </div>
                  <p className="mb-4">
                    {synthesizedResponse}
                  </p>
                  
                  {critique && (
                    <div className="pt-4 border-t border-blue-100">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-600">Response Quality:</span>
                        <Badge 
                          className={
                            critique === 'Grounded' ? 'bg-green-100 text-green-600 hover:bg-green-100' : 
                            critique === 'Ungrounded' ? 'bg-red-100 text-red-600 hover:bg-red-100' : 
                            'bg-gray-100 text-gray-600 hover:bg-gray-100'
                          }
                        >
                          {critique}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <Card className="border shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Search Results</h3>
                  <div className="space-y-4">
                    {searchResults.map((result) => (
                      <Card 
                        key={result.id} 
                        className="border transition-all duration-300 hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{result.id}</h4>
                            <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-100">
                              Relevance: {result.relevance.toFixed(2)}
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm">{result.text}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Results */}
            {!loading && searchResults.length === 0 && searchQuery && (
              <div className="flex flex-col items-center justify-center p-8 text-gray-500 text-center">
                <Search className="h-12 w-12 mb-4 opacity-50" />
                <p>No results found for your query</p>
              </div>
            )}
          </div>
        </div>

        {/* How it works */}
        <Card className="border bg-gray-50 shadow-sm mt-4">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">How Semantic Memory Works</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-100">Step 1</Badge>
                <p>Your text is converted into a vector embedding that captures its semantic meaning</p>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-100">Step 2</Badge>
                <p>The embedding is stored alongside the text in the specified collection</p>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-100">Step 3</Badge>
                <p>When searching, your query is also converted to an embedding</p>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-100">Step 4</Badge>
                <p>Results are found by comparing embeddings, enabling semantic search</p>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-100">Step 5</Badge>
                <p>The AI assistant synthesizes the search results to provide a natural language response</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
} 