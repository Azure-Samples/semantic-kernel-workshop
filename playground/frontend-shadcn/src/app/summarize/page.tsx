'use client';

import { useState } from 'react';
import axios from 'axios';
import Shell from '@/components/layout/shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import icons individually
import { GraduationCap } from "lucide-react";

const API_URL = 'http://localhost:8000';

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

export default function SummarizeDemo() {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const loadExample = (example: typeof exampleTexts[0]) => {
    setText(example.text);
    setSummary('');
  };

  return (
    <Shell>
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-700 to-cyan-400 flex items-center justify-center gap-2">
            <GraduationCap className="h-7 w-7 text-cyan-600" />
            Summarization
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Experience Semantic Kernel's text summarization capabilities powered by AI.
            Turn lengthy content into concise, meaningful summaries.
          </p>
        </div>

        {/* Alert for errors */}
        {error && (
          <Alert 
            className="border-red-500 text-red-500"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Example Texts */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Example Texts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exampleTexts.map((example, index) => (
              <Card 
                key={index}
                className="border transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-cyan-500"
              >
                <CardContent className="p-6 flex flex-col h-full">
                  <h3 className="text-lg font-semibold mb-2">{example.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">
                    {example.text.substring(0, 150)}...
                  </p>
                  <Button 
                    onClick={() => loadExample(example)}
                    variant="outline"
                    className="w-full border-cyan-600 text-cyan-600 hover:bg-cyan-50"
                  >
                    Use This Example
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Summarization Components */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Text Input */}
          <div className="md:col-span-8">
            <Card className="border shadow-sm">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-semibold">Text to Summarize</h2>
                
                <div className="space-y-4">
                  <Textarea
                    placeholder="Enter text to summarize"
                    rows={10}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="resize-none"
                  />
                  
                  <Button 
                    className="w-full bg-cyan-600 hover:bg-cyan-700"
                    onClick={handleSummarize}
                    disabled={loading}
                  >
                    {loading ? 'Summarizing...' : 'Summarize'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Result */}
          <div className="md:col-span-4">
            <Card className="border shadow-sm h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <h2 className="text-xl font-semibold mb-4">Summary</h2>
                
                <div className="flex-grow flex flex-col items-center justify-center">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="h-6 w-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p>Summarizing...</p>
                    </div>
                  ) : summary ? (
                    <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded whitespace-pre-wrap">
                      {summary}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <GraduationCap className="h-12 w-12 mb-4 opacity-50" />
                      <p>Summary will appear here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How it works */}
        <Card className="border bg-gray-50 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">How Summarization Works</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Badge className="bg-cyan-100 text-cyan-600 hover:bg-cyan-100">Step 1</Badge>
                <p>Your text is processed by a semantic function with this prompt template: <code>{"{{{$input}}\\n\\nTL;DR in one sentence:"}</code></p>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge className="bg-cyan-100 text-cyan-600 hover:bg-cyan-100">Step 2</Badge>
                <p>The AI model analyzes the content to identify key information</p>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge className="bg-cyan-100 text-cyan-600 hover:bg-cyan-100">Step 3</Badge>
                <p>A concise, one-sentence summary is generated while preserving the main points</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
} 