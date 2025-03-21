import React, { useState } from 'react';
import { Button } from './button';
import { Code } from 'lucide-react';

interface CodeToggleProps {
  content: React.ReactNode;
  codeView: React.ReactNode;
}

export function CodeToggle({ content, codeView }: CodeToggleProps) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 z-10 m-4">
        <Button
          onClick={() => setShowCode(!showCode)}
          variant="outline"
          size="sm"
          className={`flex items-center gap-1.5 ${
            showCode ? 'bg-cyan-100 text-cyan-800 border-cyan-200' : ''
          }`}
        >
          <Code className="h-4 w-4" />
          {showCode ? 'Hide Code' : 'View Code'}
        </Button>
      </div>
      
      <div className="space-y-6">
        {content}
        
        {showCode && (
          <div className="transition-opacity duration-300 ease-in-out">
            {codeView}
          </div>
        )}
      </div>
    </div>
  );
} 