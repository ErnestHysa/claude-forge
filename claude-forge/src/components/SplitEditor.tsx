'use client';

import { useState, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import ReactMarkdown from 'react-markdown';
import { Copy, Download, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { editor } from 'monaco-editor';

interface SplitEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  language?: string;
}

export function SplitEditor({ value, onChange, readOnly = false, language = 'markdown' }: SplitEditorProps) {
  const [previewMode, setPreviewMode] = useState<'split' | 'code' | 'preview'>('split');
  const [editorHeight, setEditorHeight] = useState(500);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    setIsLoading(false);

    // Configure Monaco for YAML + Markdown
    monaco.editor.setTheme('vs');
  };

  const handleEditorError = (error: Error) => {
    console.error('Monaco initialization error:', error);
    setIsLoading(false);
    setHasError(true);
    toast.error('Editor failed to load', {
      description: 'Please refresh the page.',
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast.success('Copied to clipboard');
  };

  const handleDownload = () => {
    const blob = new Blob([value], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'artifact.md';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded artifact.md');
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Editor</span>
          <span className="text-xs text-muted-foreground">YAML + Markdown</span>
        </div>
        <div className="flex items-center gap-1">
          {/* View mode buttons */}
          <div className="hidden sm:flex items-center border border-border rounded-md overflow-hidden mr-2">
            <Button
              variant={previewMode === 'split' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2 rounded-none"
              onClick={() => setPreviewMode('split')}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
            <Button
              variant={previewMode === 'code' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2 rounded-none border-l"
              onClick={() => setPreviewMode('code')}
            >
              Code
            </Button>
            <Button
              variant={previewMode === 'preview' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2 rounded-none border-l"
              onClick={() => setPreviewMode('preview')}
            >
              Preview
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor area */}
      <div
        className="grid"
        style={{
          gridTemplateColumns:
            previewMode === 'split'
              ? '1fr 1fr'
              : previewMode === 'code'
                ? '1fr'
                : '0fr 1fr',
          height: `${editorHeight}px`,
        }}
      >
        {/* Code editor */}
        {previewMode !== 'preview' && (
          <div
            className="border-r border-border overflow-hidden relative"
            style={{ height: `${editorHeight}px` }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-card z-10">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Loading editor...</span>
                </div>
              </div>
            )}

            {hasError ? (
              <div className="h-full flex items-center justify-center p-6">
                <div className="text-center">
                  <p className="text-destructive mb-2">Editor failed to load</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHasError(false);
                      setIsLoading(true);
                      window.location.reload();
                    }}
                  >
                    Refresh Page
                  </Button>
                </div>
              </div>
            ) : (
              <Editor
                height={`${editorHeight}px`}
                language={language}
                value={value}
                onChange={(v) => onChange(v || '')}
                onMount={handleEditorDidMount}
                onError={handleEditorError}
                loading={<div className="flex items-center justify-center h-full">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>}
                options={{
                  readOnly,
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineHeight: 1.6,
                  padding: { top: 16, bottom: 16 },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  renderLineHighlight: 'all',
                  cursorStyle: 'line',
                  folding: true,
                  bracketPairColorization: { enabled: true },
                  smoothScrolling: true,
                  fontFamily: "'IBM Plex Sans', monospace",
                  automaticLayout: true,
                }}
                theme="vs"
                className="text-sm"
              />
            )}
          </div>
        )}

        {/* Preview */}
        {previewMode !== 'code' && (
          <div
            className="overflow-auto"
            style={{ height: `${editorHeight}px` }}
          >
            <div className="p-6 prose prose-sm max-w-none dark:prose-invert">
              {value ? (
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-display font-semibold mt-0">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl font-display font-semibold">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg font-display font-medium">{children}</h3>
                    ),
                    code: ({ className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const isInline = !match;
                      return isInline ? (
                        <code className="px-1.5 py-0.5 rounded bg-muted text-sm" {...props}>
                          {children}
                        </code>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => (
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto">{children}</pre>
                    ),
                  }}
                >
                  {value}
                </ReactMarkdown>
              ) : (
                <div className="text-muted-foreground text-center py-12">
                  Generated artifact will appear here...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Resize handle */}
      <div
        className="h-1 bg-muted/50 hover:bg-primary/50 cursor-row-resize transition-colors"
        onMouseDown={(e) => {
          e.preventDefault();
          const startY = e.clientY;
          const startHeight = editorHeight;

          const handleMouseMove = (e: MouseEvent) => {
            const diff = startY - e.clientY;
            setEditorHeight(Math.max(200, Math.min(800, startHeight + diff)));
          };

          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      />
    </div>
  );
}
