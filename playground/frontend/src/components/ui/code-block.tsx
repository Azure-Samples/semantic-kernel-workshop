import React, { useState } from 'react';
import { Card, CardContent } from './card';
import { Button } from './button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Copy, Check, FileCode } from 'lucide-react';

export interface CodeFile {
  name: string;
  language: string;
  code: string;
  description?: string;
}

interface CodeBlocksProps {
  files: CodeFile[];
}

export function CodeBlocks({ files }: CodeBlocksProps) {
  const [activeTab, setActiveTab] = useState(files[0]?.name || '');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeFile = files.find(file => file.name === activeTab) || files[0];

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-0">
        <div className="border-b border-gray-200 bg-muted px-4 py-2 flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <FileCode className="h-4 w-4 text-cyan-600" />
            Source Code
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => copyToClipboard(activeFile?.code || '')}
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
          <div className="border-b border-gray-200 bg-muted px-4">
            <TabsList className="h-10 bg-transparent">
              {files.map((file) => (
                <TabsTrigger
                  key={file.name}
                  value={file.name}
                  className="text-xs px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 data-[state=active]:shadow-none rounded-none"
                >
                  {file.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          {files.map((file) => (
            <TabsContent key={file.name} value={file.name} className="m-0">
              {file.description && (
                <div className="bg-muted border-b border-gray-200 px-4 py-2 text-sm text-muted-foreground">
                  {file.description}
                </div>
              )}
              <div className="relative">
                <pre className="p-4 overflow-auto font-mono text-sm bg-gray-50 dark:bg-[#0d1117] text-gray-800 dark:text-gray-300" style={{ maxHeight: '400px' }}>
                  <code className={`language-${file.language || 'text'}`}>{file.code || '// No code available'}</code>
                </pre>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}