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
import { FunctionSquare } from "lucide-react";

const API_URL = 'http://localhost:8000';

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

export default function FunctionsDemo() {
  const [prompt, setPrompt] = useState('{{$input}}\n\nRewrite this in a professional tone:');
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInvokeFunction = async () => {
    if (!prompt.trim() || !inputText.trim()) {
      setError('Please provide both a prompt template and input text');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log("Current prompt template:", prompt);
      
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

  // Function to safely display strings with curly braces in JSX
  const displayWithCurlyBraces = (text) => {
    return text.split('{{').join('{ "{" }').split('}}').join('{ "}" }');
  };

  return (
    <Shell>
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-green-400 flex items-center justify-center gap-2">
            <FunctionSquare className="h-7 w-7 text-green-600" />
            Semantic Functions
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Create and experiment with AI-powered semantic functions. Define your own prompts
            or try our examples to see how Semantic Kernel processes natural language.
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

        {/* Example Functions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Example Functions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {examplePrompts.map((example, index) => (
              <Card 
                key={index}
                className="border transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-green-500"
              >
                <CardContent className="p-6 flex flex-col h-full">
                  <h3 className="text-lg font-semibold mb-2">{example.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{example.description}</p>
                  <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4 flex-grow">
                    <code className="text-sm font-mono" dangerouslySetInnerHTML={{ __html: example.prompt.replace(/\{\{/g, "&#123;&#123;").replace(/\}\}/g, "&#125;&#125;") }} />
                  </div>
                  <Button 
                    onClick={() => loadExample(example)}
                    variant="outline"
                    className="w-full border-green-600 text-green-600 hover:bg-green-50"
                  >
                    Try This Function
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Function Definition and Result */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Define Function */}
          <div className="md:col-span-7">
            <Card className="border shadow-sm">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-semibold">Define Your Function</h2>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prompt Template</label>
                  <Textarea
                    placeholder="Enter a prompt template with placeholder"
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500">Use the placeholder &#123;&#123;$input&#125;&#125; to indicate where the input text should be inserted</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Input Text</label>
                  <Textarea
                    placeholder="Enter the text to process"
                    rows={4}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="resize-none"
                  />
                </div>
                
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleInvokeFunction}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Run Function'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="md:col-span-5">
            <Card className="border shadow-sm h-full">
              <CardContent className="p-6 h-full">
                <h2 className="text-xl font-semibold mb-4">Result</h2>
                
                <div className="min-h-[200px] flex flex-col items-center justify-center">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="h-6 w-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p>Processing...</p>
                    </div>
                  ) : result ? (
                    <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded whitespace-pre-wrap">
                      {result}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <FunctionSquare className="h-12 w-12 mb-4 opacity-50" />
                      <p>Function output will appear here</p>
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
            <h3 className="text-xl font-semibold mb-4">How Semantic Functions Work</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Badge className="bg-green-100 text-green-600 hover:bg-green-100">Step 1</Badge>
                <p>Define your prompt template with placeholders</p>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge className="bg-green-100 text-green-600 hover:bg-green-100">Step 2</Badge>
                <p>Semantic Kernel replaces the placeholders with your input text</p>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge className="bg-green-100 text-green-600 hover:bg-green-100">Step 3</Badge>
                <p>The completed prompt is sent to the AI model for processing</p>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge className="bg-green-100 text-green-600 hover:bg-green-100">Step 4</Badge>
                <p>The model's response is returned as your function's output</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
} 