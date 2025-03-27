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
  logging: boolean;
};

type ExampleInput = {
  title: string;
  text: string;
};

type ResultType = {
  result?: string;
  debug?: {
    input_processing?: string;
    output_processing?: string;
    logs?: string;
    log_count?: number;
    input_detections?: any[];
    output_detections?: any[];
  };
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
  }
];

export default function FiltersDemo() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ResultType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDebugLogs, setShowDebugLogs] = useState(false);
  const [filters, setFilters] = useState<FiltersState>({
    pii: true,
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
            <ShieldCheck className="h-7 w-7 text-slate-600" />
            Semantic Kernel Filters
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Experience how Semantic Kernel function invocation filters provide control and visibility over the AI pipeline.
            These filters intercept function calls, allowing pre-processing of inputs and post-processing of outputs,
            enabling detection of personally identifiable information (PII) like credit cards, emails, and phone numbers.
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
                  {loading ? 'Processing...' : 'Process & Detect Sensitive Info'}
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
                    {/* AI Response Card - Display first */}
                    {result.result && (
                      <Card className="border border-slate-200 bg-blue-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                            <h3 className="font-medium text-blue-600">AI Response</h3>
                          </div>
                          <div className="mt-1 bg-white p-4 rounded-md border border-blue-100">
                            <pre className="whitespace-pre-line text-sm font-sans">{result.result}</pre>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Input Detections Card */}
                    {result.debug && (
                      <Card className="border border-amber-200 bg-amber-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Upload className="h-5 w-5 text-amber-600" />
                            <h3 className="font-medium text-amber-600">Input Detection Results</h3>
                          </div>
                          <div className="mt-1 p-3 bg-white rounded-md border border-amber-100">
                            <p className="text-sm text-slate-500 mb-2">{result.debug.input_processing}</p>
                            {result.debug.input_detections && result.debug.input_detections.length > 0 ? (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-amber-700 mb-1">Detected Items:</p>
                                <div className="space-y-2">
                                  {result.debug.input_detections.map((item, idx) => {
                                    const [type, value] = item.split(': ');
                                    return (
                                      <div key={idx} className="flex items-center">
                                        <Badge className="mr-2 bg-amber-100 text-amber-800 hover:bg-amber-100">
                                          {type}
                                        </Badge>
                                        <span className="text-sm">{value}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Output Detections Card */}
                    {result.debug && (
                      <Card className="border border-green-200 bg-green-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Download className="h-5 w-5 text-green-600" />
                            <h3 className="font-medium text-green-600">Output Detection Results</h3>
                          </div>
                          <div className="mt-1 p-3 bg-white rounded-md border border-green-100">
                            <p className="text-sm text-slate-500 mb-2">{result.debug.output_processing}</p>
                            {result.debug.output_detections && result.debug.output_detections.length > 0 ? (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-green-700 mb-1">Detected Items:</p>
                                <div className="space-y-2">
                                  {result.debug.output_detections.map((item, idx) => {
                                    const [type, value] = item.split(': ');
                                    return (
                                      <div key={idx} className="flex items-center">
                                        <Badge className="mr-2 bg-green-100 text-green-800 hover:bg-green-100">
                                          {type}
                                        </Badge>
                                        <span className="text-sm">{value}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Debug logs toggle */}
                    {result.debug && result.debug.logs && (
                      <div className="flex justify-end mb-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowDebugLogs(!showDebugLogs)}
                          className="text-xs flex items-center gap-1"
                        >
                          {showDebugLogs ? (
                            <>
                              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3 w-3">
                                <path d="M3.13523 8.84197C3.3241 9.04343 3.64052 9.0412 3.82828 8.83717L7.5 4.86432L11.1717 8.83717C11.3595 9.0412 11.6759 9.04343 11.8648 8.84197C12.0536 8.64051 12.0514 8.32409 11.8602 8.13633L7.84418 3.78989C7.7583 3.69039 7.63232 3.63506 7.5 3.63506C7.36768 3.63506 7.2417 3.69039 7.15582 3.78989L3.13982 8.13633C2.94858 8.32409 2.94636 8.64051 3.13523 8.84197Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                              </svg>
                              Hide Logs
                            </>
                          ) : (
                            <>
                              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3 w-3">
                                <path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.9588 3.82828 6.16283L7.5 10.1357L11.1717 6.16283C11.3595 5.9588 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0514 6.67591 11.8602 6.86367L7.84418 11.2101C7.7583 11.3096 7.63232 11.3649 7.5 11.3649C7.36768 11.3649 7.2417 11.3096 7.15582 11.2101L3.13982 6.86367C2.94858 6.67591 2.94636 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                              </svg>
                              Show Logs
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                    
                    {/* Execution Logs - Show only when toggle is on */}
                    {result.debug && result.debug.logs && showDebugLogs && (
                      <Card className="border bg-slate-900">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <FilterX className="h-5 w-5 text-slate-300" />
                            <h3 className="font-medium text-slate-300">Execution Logs ({result.debug.log_count || 0} entries)</h3>
                          </div>
                          <div className="bg-slate-800 p-3 rounded-md max-h-[200px] overflow-y-auto">
                            <pre className="text-slate-300 font-mono text-xs whitespace-pre-wrap">
                              {result.debug.logs}
                            </pre>
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