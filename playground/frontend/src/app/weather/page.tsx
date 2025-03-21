'use client';

import { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import Shell from '@/components/layout/shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CodeToggle } from '@/components/ui/code-toggle';
import { CodeBlocks } from '@/components/ui/code-block';
import { getCodeExamplesForDemo } from '@/lib/code-examples';

// Import icons individually
import { SunMedium, MapPin, Cloud, MessagesSquare } from "lucide-react";

const API_URL = 'http://localhost:8000';

const exampleQueries = [
  "What's the weather like in New York?",
  "Is it going to rain in London this week?",
  "Tell me about the temperature in Tokyo",
  "How's the weather in Paris today?",
  "What's the forecast for Sydney?"
];

export default function WeatherDemo() {
  const [query, setQuery] = useState('');
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [examples, setExamples] = useState<string[]>([]);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  const handleGetWeather = async () => {
    if (!query.trim()) {
      setError('Please enter a weather query');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setExamples([]);
      setDebugLogs([]);
      
      const response = await axios.post(`${API_URL}/weather`, {
        query: query
      });
      
      if (response.data.error) {
        setError(response.data.error);
        setExamples(response.data.example_queries || []);
        setWeatherData(null);
      } else {
        setWeatherData(response.data);
        // Update to use debug_logs from response data
        if (response.data.debug_logs) {
          setDebugLogs(response.data.debug_logs);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error getting weather data:', error);
      setError('Error getting weather data. Please ensure the backend server is running.');
      setLoading(false);
    }
  };

  return (
    <Shell>
      <CodeToggle 
        content={
          <div className="flex flex-col space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-700 to-orange-400 flex items-center justify-center gap-2">
                <SunMedium className="h-7 w-7 text-orange-600" />
                Weather
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Ask natural questions about the weather and get AI-powered responses.
                Try asking about current conditions or forecasts for any city.
              </p>
            </div>

            {/* Alert for errors */}
            {error && (
              <Alert 
                className="border-red-500 text-red-500"
              >
                <AlertDescription>
                  <div>
                    {error}
                    {examples.length > 0 && (
                      <div className="mt-3">
                        <p className="font-medium mb-1">Try these example queries:</p>
                        <ul className="space-y-1">
                          {examples.map((example, index) => (
                            <li 
                              key={index}
                              className="cursor-pointer hover:underline text-sm"
                              onClick={() => setQuery(example)}
                            >
                              • {example}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Query and Result */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Query Input */}
              <Card className="border shadow-sm">
                <CardContent className="p-6 flex flex-col h-full">
                  <h2 className="text-xl font-semibold mb-2">Ask About Weather</h2>
                  
                  <p className="text-gray-600 text-sm mb-4">
                    Ask any question about weather conditions or forecasts. Make sure to mention
                    the city you're interested in.
                  </p>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2">Example Questions</h3>
                    <div className="flex flex-wrap gap-2">
                      {exampleQueries.map((example) => (
                        <Badge 
                          key={example}
                          onClick={() => setQuery(example)}
                          className={`cursor-pointer px-3 py-1 hover:bg-orange-50 ${
                            query === example 
                              ? 'bg-orange-100 text-orange-600 hover:bg-orange-100' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4 flex-grow">
                    <Textarea
                      placeholder="e.g., What's the weather like in New York?"
                      rows={3}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="resize-none"
                    />
                    
                    <Button 
                      className="w-full bg-orange-600 hover:bg-orange-700 mt-auto"
                      onClick={handleGetWeather}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Get Answer'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Results */}
              <Card className="border shadow-sm">
                <CardContent className="p-6 flex flex-col h-full">
                  <h2 className="text-xl font-semibold mb-4">Weather Information</h2>
                  
                  <div className="flex-grow">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <div className="h-6 w-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p>Getting weather information...</p>
                      </div>
                    ) : weatherData ? (
                      <div className="space-y-6">
                        {weatherData.assistant_response && (
                          <Card className="border border-orange-100 bg-orange-50">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <MessagesSquare className="h-5 w-5 text-orange-600" />
                                <h3 className="font-medium text-orange-600">AI Assistant</h3>
                              </div>
                              <div className="prose prose-orange max-w-none">
                                <ReactMarkdown>{weatherData.assistant_response}</ReactMarkdown>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                        
                        <Separator />
                        
                        {weatherData.current_weather && (
                          <Card className="border bg-gray-50">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <SunMedium className="h-5 w-5 text-orange-600" />
                                <h3 className="font-medium text-gray-600">Current Weather</h3>
                              </div>
                              <p>{weatherData.current_weather}</p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {weatherData.forecast && (
                          <Card className="border bg-gray-50">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Cloud className="h-5 w-5 text-gray-600" />
                                <h3 className="font-medium text-gray-600">Forecast</h3>
                              </div>
                              <p>{weatherData.forecast}</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <SunMedium className="h-12 w-12 mb-4 opacity-50" />
                        <p>Weather information will appear here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* How it works */}
            <Card className="border bg-gray-50 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">How the Weather Plugin Works</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100">Step 1</Badge>
                    <p>The backend creates a ChatCompletionAgent with the WeatherPlugin registered</p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100">Step 2</Badge>
                    <p>Your query is sent to the agent, which determines which weather functions to call</p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100">Step 3</Badge>
                    <p>The agent calls the appropriate functions (get_current_weather, get_forecast, get_weather_alert) with the location</p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100">Step 4</Badge>
                    <p>Each function returns structured data with temperature, conditions, humidity, and wind speed</p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100">Step 5</Badge>
                    <p>The data is formatted and returned along with the agent's natural language response</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Debug Panel */}
            <Card className="border bg-slate-900 shadow-sm">
              <CardContent className="p-6">
                <div 
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => setShowDebug(!showDebug)}
                >
                  <h3 className="text-xl font-semibold text-white">Debug Information</h3>
                  <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100">
                    {showDebug ? "Hide" : "Show"}
                  </Badge>
                </div>
                
                {showDebug && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-slate-400 mb-2">Function Execution Logs</h4>
                    <div className="bg-slate-950 p-4 rounded-md max-h-[300px] overflow-y-auto">
                      {debugLogs.length > 0 ? (
                        <div className="space-y-1">
                          {debugLogs.map((log, index) => (
                            <p key={index} className="text-slate-300 font-mono text-sm">
                              {log}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500">
                          No logs available. Try making a weather query to see function execution details.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        }
        codeView={<CodeBlocks files={getCodeExamplesForDemo('weather')} />}
      />
    </Shell>
  );
}