import React, { useState } from 'react';
import { Button } from './button';
import { Code, Eye } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from './tabs';

interface CodeToggleProps {
  content: React.ReactNode;
  codeView: React.ReactNode;
}

export function CodeToggle({ content, codeView }: CodeToggleProps) {
  const [activeView, setActiveView] = useState<'demo' | 'code'>('demo');

  return (
    <div className="relative">
      <div className="mb-6">
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'demo' | 'code')} className="w-full">
          <div className="flex justify-end border-b">
            <TabsList className="bg-transparent">
              <TabsTrigger 
                value="demo" 
                className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 rounded-none"
              >
                <Eye className="h-4 w-4 mr-2" />
                Demo
              </TabsTrigger>
              <TabsTrigger 
                value="code" 
                className="data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 rounded-none"
              >
                <Code className="h-4 w-4 mr-2" />
                Code
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </div>
      
      <div className="space-y-6">
        {activeView === 'demo' && content}
        {activeView === 'code' && (
          <div className="transition-opacity duration-300 ease-in-out">
            {codeView}
          </div>
        )}
      </div>
    </div>
  );
}