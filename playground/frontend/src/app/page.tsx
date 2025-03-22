import Shell from '@/components/layout/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Import icons individually to avoid barrel import issues
import { MemoryStick } from "lucide-react";
import { FunctionSquare } from "lucide-react";
import { SunMedium } from "lucide-react";
import { GraduationCap } from "lucide-react";
import { Shield } from "lucide-react";
import { Languages } from "lucide-react";
import { Workflow } from "lucide-react";
import { Bot } from "lucide-react";

// Define features
const features = [
  {
    title: 'Semantic Memory',
    description: 'Experience AI-powered memory management with semantic search capabilities.',
    icon: <MemoryStick className="h-8 w-8 text-blue-600" />,
    path: '/memory',
    color: '#2563eb'
  },
  {
    title: 'Semantic Functions',
    description: 'Create and use AI functions with natural language prompts.',
    icon: <FunctionSquare className="h-8 w-8 text-green-600" />,
    path: '/functions',
    color: '#16a34a'
  },
  {
    title: 'Translation',
    description: 'Translate text between multiple languages using AI.',
    icon: <Languages className="h-8 w-8 text-purple-600" />,
    path: '/translate',
    color: '#9333ea'
  },
  {
    title: 'Weather Plugin',
    description: 'Get weather information using a custom Semantic Kernel plugin.',
    icon: <SunMedium className="h-8 w-8 text-orange-600" />,
    path: '/weather',
    color: '#ea580c'
  },
  {
    title: 'Text Summarization',
    description: 'Generate concise summaries of longer texts using AI.',
    icon: <GraduationCap className="h-8 w-8 text-cyan-600" />,
    path: '/summarize',
    color: '#0891b2'
  },
  {
    title: 'SK Filters',
    description: 'Explore pre and post-processing filters for enhanced security and control.',
    icon: <Shield className="h-8 w-8 text-slate-600" />,
    path: '/filters',
    color: '#64748b'
  },
  {
    title: 'Process Framework',
    description: 'Learn how to build structured, event-driven conversational flows with the SK Process Framework.',
    icon: <Workflow className="h-8 w-8 text-teal-600" />,
    path: '/process',
    color: '#0d9488'
  },
  {
    title: 'Agent Chat',
    description: 'Interact with an AI agent powered by Semantic Kernel and plugins.',
    icon: <Bot className="h-8 w-8 text-indigo-600" />,
    path: '/agent',
    color: '#4f46e5'
  }
];

export default function Home() {
  return (
    <Shell>
      <div className="flex flex-col items-center py-10">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-blue-400 mb-4">
          Welcome to Semantic Kernel
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl text-center mb-12">
          Explore the power of AI integration with this interactive demo showcasing
          Semantic Kernel's capabilities in memory management, natural language processing,
          and plugin architecture.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {features.map((feature) => (
            <Card 
              key={feature.title} 
              className={`card-gradient flex flex-col gap-6 rounded-xl py-6 shadow-sm border overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-[${feature.color}] hover:-translate-y-1`}
              style={{ 
                borderColor: `${feature.color}30`,
                boxShadow: `0 2px 10px rgba(0,0,0,0.05)`,
              }}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div 
                  className="flex items-center justify-center w-16 h-16 rounded-full mb-4"
                  style={{ backgroundColor: `${feature.color}15`, color: feature.color }}
                >
                  {feature.icon}
                </div>
                
                <h2 className="text-xl font-semibold mb-2">{feature.title}</h2>
                
                <p className="text-gray-600 mb-6 flex-1">
                  {feature.description}
                </p>
                
                <Button 
                  asChild
                  variant="outline"
                  className={`hover:bg-opacity-10 hover:bg-[${feature.color}]`}
                  style={{ 
                    borderColor: feature.color, 
                    color: feature.color,
                  }}
                >
                  <Link href={feature.path}>Try Demo</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
}
