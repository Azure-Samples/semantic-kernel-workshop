'use client';

import { useState } from 'react';
import axios from 'axios';
import Shell from '@/components/layout/shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Import icons individually
import { ShieldCheck, FilterX, Upload, Download } from "lucide-react";

const API_URL = 'http://localhost:8000';

type FiltersState = {
  pii: boolean;
  profanity: boolean;
  logging: boolean;
};

type ExampleInput = {
  title: string;
  text: string;
};

type ResultType = {
  input_processing?: string;
  output_processing?: string;
  logs?: string[];
};

const exampleInputs: ExampleInput[] = [
  {
    title: "Credit Card & Email",
    text: "My email is john.doe@example.com and my credit card number is 4111-1111-1111-1111"
  },
  {
    title: "Phone & SSN",
    text: "Please call me at (555) 123-4567 or find my SSN: 123-45-6789"
  },
  {
    title: "Multiple PII Elements",
    text: "Hi, I'm Alice Smith (alice.smith@gmail.com). My card is 4111-1111-1111-1111 and phone is (555) 123-4567."
  },
  {
    title: "With Profanity",
    text: "I'm really angry about my badword1 bill. My card ending in 1111 was charged incorrectly."
  }
];

export default function FiltersDemo() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ResultType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FiltersState>({
    pii: true,
    profanity: true,
    logging: true
  });

  const handleToggleFilter = (filterName: keyof FiltersState) => {
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
    <Shell>
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-slate-400 flex items-center justify-center gap-2">
            <ShieldCheck className="h-7 w-7" />
            Semantic Kernel Filters
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Experience how Semantic Kernel function invocation filters provide control and visibility over the AI pipeline.
            These filters intercept function calls, allowing pre-processing of inputs and post-processing of outputs,
            enabling powerful features like PII detection, content moderation, and execution logging.
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

        {/* Input and Result */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="border shadow-sm">
            <CardContent className="p-6 flex flex-col h-full">
              <h2 className="text-xl font-semibold mb-2">Enter Text to Process</h2>
              
              <p className="text-gray-600 text-sm mb-4">
                Type or select an example text to see how different filters process the content.
                These filters demonstrate pre-processing and post-processing capabilities in SK.
              </p>
              
              <div className="mb-4 space-y-3">
                <h3 className="text-sm font-medium mb-2">Active Filters</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="pii-filter"
                      checked={filters.pii}
                      onCheckedChange={() => handleToggleFilter('pii')}
                    />
                    <Label htmlFor="pii-filter">PII Detection Filter (Pre/Post Processing)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="profanity-filter"
                      checked={filters.profanity}
                      onCheckedChange={() => handleToggleFilter('profanity')}
                    />
                    <Label htmlFor="profanity-filter">Content Moderation Filter (Pre/Post Processing)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="logging-filter"
                      checked={filters.logging}
                      onCheckedChange={() => handleToggleFilter('logging')}
                    />
                    <Label htmlFor="logging-filter">Function Invocation Logging Filter</Label>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Example Inputs</h3>
                <div className="flex flex-wrap gap-2">
                  {exampleInputs.map((example, index) => (
                    <Badge 
                      key={index}
                      onClick={() => setInput(example.text)}
                      className={`cursor-pointer px-3 py-1 hover:bg-slate-100 ${
                        input === example.text 
                          ? 'bg-slate-200 text-slate-800 hover:bg-slate-200' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      variant="outline"
                    >
                      {example.title}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4 flex-grow">
                <Textarea
                  placeholder="Enter text to process through filters..."
                  rows={4}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="resize-none"
                />
                
                <Button 
                  className="w-full bg-slate-600 hover:bg-slate-700 mt-auto"
                  onClick={handleProcessText}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Process Text'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="border shadow-sm">
            <CardContent className="p-6 flex flex-col h-full">
              <h2 className="text-xl font-semibold mb-4">Filter Results</h2>
              
              <div className="flex-grow">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <div className="h-6 w-6 border-2 border-slate-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p>Processing text...</p>
                  </div>
                ) : result ? (
                  <div className="space-y-6">
                    {result.input_processing && (
                      <Card className="border border-slate-200 bg-slate-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Upload className="h-5 w-5 text-slate-600" />
                            <h3 className="font-medium text-slate-600">Pre-Processing Results</h3>
                          </div>
                          <p className="text-sm text-slate-500 mb-2">
                            Detected and processed by input filters:
                          </p>
                          <div className="mt-1">
                            {result.input_processing}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {result.output_processing && (
                      <Card className="border border-slate-200 bg-slate-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Download className="h-5 w-5 text-slate-600" />
                            <h3 className="font-medium text-slate-600">Post-Processing Results</h3>
                          </div>
                          <p className="text-sm text-slate-500 mb-2">
                            Detected and processed by output filters:
                          </p>
                          <div className="mt-1">
                            {result.output_processing}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {result.logs && result.logs.length > 0 && (
                      <Card className="border bg-slate-900">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <FilterX className="h-5 w-5 text-slate-300" />
                            <h3 className="font-medium text-slate-300">Execution Logs</h3>
                          </div>
                          <div className="bg-slate-800 p-3 rounded-md max-h-[200px] overflow-y-auto">
                            <div className="space-y-1">
                              {result.logs.map((log, index) => (
                                <p key={index} className="text-slate-300 font-mono text-xs">
                                  {log}
                                </p>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <ShieldCheck className="h-12 w-12 mb-4 opacity-50" />
                    <p>Filter results will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <Card className="border bg-gray-50 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">How Semantic Kernel Function Invocation Filters Work</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Step 1</Badge>
                <p>The user's request is passed to the kernel, which prepares to invoke a function</p>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Step 2</Badge>
                <p>
                  <strong>Pre-processing filters</strong> run before the function executes, examining and potentially modifying the input 
                  (detect PII, log inputs, perform validation checks)
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Step 3</Badge>
                <p>The function executes with the filtered input (in this case, calling an LLM)</p>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Step 4</Badge>
                <p>
                  <strong>Post-processing filters</strong> run to analyze and potentially modify the output 
                  (detect sensitive information in responses, format results, log outputs)
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Step 5</Badge>
                <p>The final output is returned to the application, with all filters helping enforce security and compliance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
} 