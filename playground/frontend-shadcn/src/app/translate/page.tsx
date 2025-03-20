'use client';

import { useState } from 'react';
import axios from 'axios';
import Shell from '@/components/layout/shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Import icons individually
import { Languages } from "lucide-react";

const API_URL = 'http://localhost:8000';

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

export default function TranslateDemo() {
  const [text, setText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('French');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const loadExample = (example: typeof exampleTexts[0]) => {
    setText(example.text);
    setTranslatedText('');
  };

  return (
    <Shell>
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-purple-400 flex items-center justify-center gap-2">
            <Languages className="h-7 w-7" />
            Translation
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            This demo showcases Semantic Kernel's ability to translate text between languages
            using AI-powered semantic functions.
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
                className="border transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-purple-500"
              >
                <CardContent className="p-6 flex flex-col h-full">
                  <h3 className="text-lg font-semibold mb-2">{example.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">
                    {example.text}
                  </p>
                  <Button 
                    onClick={() => loadExample(example)}
                    variant="outline"
                    className="w-full border-purple-600 text-purple-600 hover:bg-purple-50"
                  >
                    Use This Example
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Translation Components */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Text Input */}
          <Card className="border shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">Text to Translate</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Language</label>
                  <Select
                    value={targetLanguage}
                    onValueChange={setTargetLanguage}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((language) => (
                        <SelectItem key={language} value={language}>
                          {language}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Enter Text</label>
                  <Textarea
                    placeholder="Enter text to translate"
                    rows={6}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="resize-none"
                  />
                </div>
                
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={handleTranslate}
                  disabled={loading}
                >
                  {loading ? 'Translating...' : 'Translate'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Translation Result */}
          <Card className="border shadow-sm">
            <CardContent className="p-6 flex flex-col h-full">
              <h2 className="text-xl font-semibold mb-4">Translation Result</h2>
              
              <div className="flex-grow flex flex-col items-center justify-center min-h-[250px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <div className="h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p>Translating...</p>
                  </div>
                ) : translatedText ? (
                  <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded whitespace-pre-wrap">
                    {translatedText}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <Languages className="h-12 w-12 mb-4 opacity-50" />
                    <p>Translation will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <Card className="border bg-gray-50 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">How Translation Works</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Badge className="bg-purple-100 text-purple-600 hover:bg-purple-100">Step 1</Badge>
                <p>Your text is processed by a semantic function with this prompt template: <code>{"{{{$input}}\\n\\nTranslate this into {{$target_language}}:"}</code></p>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge className="bg-purple-100 text-purple-600 hover:bg-purple-100">Step 2</Badge>
                <p>The AI model receives your text and target language as inputs</p>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge className="bg-purple-100 text-purple-600 hover:bg-purple-100">Step 3</Badge>
                <p>The model processes the request and returns the translated text</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
} 