import React, { useState } from 'react';
import { Card, CardContent } from './card';
import { Button } from './button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Copy, Check } from 'lucide-react';

interface CodeViewerProps {
  files: {
    name: string;
    language: string;
    code: string;
    description?: string;
  }[];
}

export function CodeViewer({ files }: CodeViewerProps) {
  const [activeTab, setActiveTab] = useState(files[0]?.name || '');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-0">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-700">Source Code</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => copyToClipboard(files.find(f => f.name === activeTab)?.code || '')}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-gray-200 bg-gray-50 px-4">
            <TabsList className="h-10 bg-transparent">
              {files.map((file) => (
                <TabsTrigger
                  key={file.name}
                  value={file.name}
                  className="text-xs px-3 py-1.5 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 data-[state=active]:shadow-none rounded-none"
                >
                  {file.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          {files.map((file) => (
            <TabsContent key={file.name} value={file.name} className="m-0">
              {file.description && (
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 text-sm text-gray-600">
                  {file.description}
                </div>
              )}
              <pre className="p-4 overflow-auto text-sm bg-gray-50 rounded-b-md whitespace-pre text-gray-800 font-mono">
                <code>{file.code}</code>
              </pre>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
} 