import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './card';
import { Button } from './button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Copy, Check } from 'lucide-react';
import * as shiki from 'shiki';

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
  const [highlightedCode, setHighlightedCode] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHighlighter = async () => {
      try {
        setIsLoading(true);
        // Create a highlighter
        const highlighter = await shiki.getHighlighter({
          theme: 'github-light',
          langs: ['python', 'typescript', 'javascript', 'bash', 'tsx', 'jsx']
        });

        // Highlight all files
        const highlighted: Record<string, string> = {};
        for (const file of files) {
          const html = highlighter.codeToHtml(file.code, { 
            lang: file.language
          });
          highlighted[file.name] = html;
        }

        setHighlightedCode(highlighted);
      } catch (error) {
        console.error('Error highlighting code:', error);
        // Fallback for each file
        const highlighted: Record<string, string> = {};
        for (const file of files) {
          highlighted[file.name] = `<pre><code>${escapeHtml(file.code)}</code></pre>`;
        }
        setHighlightedCode(highlighted);
      } finally {
        setIsLoading(false);
      }
    };

    loadHighlighter();
  }, [files]);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeFile = files.find(file => file.name === activeTab) || files[0];

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-0">
        <div className="border-b border-gray-200 bg-muted px-4 py-2 flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-700">Source Code</h3>
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
                {isLoading ? (
                  <div className="p-4 overflow-auto font-mono text-sm bg-gray-50" style={{ maxHeight: '400px' }}>
                    Loading...
                  </div>
                ) : (
                  <div 
                    className="shiki p-4 overflow-auto font-mono text-sm bg-gray-50" 
                    style={{ maxHeight: '400px' }}
                    dangerouslySetInnerHTML={{ __html: highlightedCode[file.name] || '' }} 
                  />
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Simple function to escape HTML
const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}; 