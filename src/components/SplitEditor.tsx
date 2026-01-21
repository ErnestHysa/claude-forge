'use client';

import { useState, useRef, useMemo } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import { Copy, Download, Maximize2, Minimize2, Loader2, Files } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileTabs } from '@/components/FileTabs';
import { FileTree } from '@/components/FileTree';
import { toast } from 'sonner';
import type { editor } from 'monaco-editor';
import type { EditorFile } from '@/types';
import { getLanguageFromPath } from '@/components/FileTabs';

interface SingleFileProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  language?: string;
  files?: never;
  activeFileId?: never;
  onFileChange?: never;
  onFileSelect?: never;
}

interface MultiFileProps {
  value?: never;
  onChange?: never;
  readOnly?: boolean;
  language?: never;
  files: EditorFile[];
  activeFileId: string;
  onFileChange: (fileId: string, content: string) => void;
  onFileSelect: (fileId: string) => void;
}

type SplitEditorProps = SingleFileProps | MultiFileProps;

export function SplitEditor(props: SplitEditorProps) {
  const isMultiFile = 'files' in props && !!props.files;

  const [previewMode, setPreviewMode] = useState<'split' | 'code' | 'preview'>('split');
  const [editorHeight, setEditorHeight] = useState(500);
  const [isLoading, setIsLoading] = useState(true);
  const [showFileTree, setShowFileTree] = useState(isMultiFile);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Derive current file state
  const currentFile = useMemo(() => {
    if (!isMultiFile) return null;
    return props.files.find((f) => f.id === props.activeFileId) || props.files[0];
  }, [isMultiFile, props]);

  // Current content and language
  const currentValue = useMemo(() => {
    if (isMultiFile) {
      return currentFile?.content || '';
    }
    return props.value;
  }, [isMultiFile, currentFile, props]);

  const currentLanguage = useMemo(() => {
    if (isMultiFile) {
      return currentFile?.language || 'markdown';
    }
    return props.language || 'markdown';
  }, [isMultiFile, currentFile, props.language]);

  // Handle content change
  const handleChange = (newValue: string | undefined) => {
    const value = newValue || '';
    if (isMultiFile && currentFile) {
      props.onFileChange(currentFile.id, value);
    } else if (!isMultiFile) {
      props.onChange(value);
    }
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    setIsLoading(false);
    monaco.editor.setTheme('vs');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentValue);
    toast.success('Copied to clipboard');
  };

  const handleDownload = () => {
    if (isMultiFile && props.files.length > 1) {
      // For multi-file, trigger ZIP export
      handleDownloadZip();
      return;
    }

    const fileName = isMultiFile && currentFile
      ? currentFile.path.split('/').pop() || 'artifact.md'
      : 'artifact.md';

    const blob = new Blob([currentValue], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${fileName}`);
  };

  const handleDownloadZip = () => {
    // Trigger ZIP download event that parent can handle
    window.dispatchEvent(new CustomEvent('downloadZip'));
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Editor</span>
          {isMultiFile && currentFile && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                {currentFile.path}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* File tree toggle - only for multi-file */}
          {isMultiFile && props.files.length > 1 && (
            <Button
              variant={showFileTree ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShowFileTree(!showFileTree)}
              className="mr-2"
              title="Toggle file tree"
            >
              <Files className="h-4 w-4" />
            </Button>
          )}

          {/* View mode buttons */}
          <div className="hidden sm:flex items-center border border-border rounded-md overflow-hidden mr-2">
            <Button
              variant={previewMode === 'split' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2 rounded-none"
              onClick={() => setPreviewMode('split')}
              title="Split view"
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
            <Button
              variant={previewMode === 'code' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2 rounded-none border-l"
              onClick={() => setPreviewMode('code')}
              title="Code only"
            >
              Code
            </Button>
            <Button
              variant={previewMode === 'preview' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2 rounded-none border-l"
              onClick={() => setPreviewMode('preview')}
              title="Preview only"
            >
              Preview
            </Button>
          </div>

          <Button variant="ghost" size="sm" onClick={handleCopy} title="Copy to clipboard">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload} title="Download">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* File Tabs - only for multi-file */}
      {isMultiFile && props.files.length > 1 && (
        <FileTabs
          files={props.files}
          activeFileId={props.activeFileId}
          onFileSelect={props.onFileSelect}
        />
      )}

      {/* Main editor area */}
      <div className="flex">
        {/* File Tree - collapsible */}
        {isMultiFile && showFileTree && props.files.length > 1 && (
          <FileTree
            files={props.files}
            activeFileId={props.activeFileId}
            onFileSelect={props.onFileSelect}
          />
        )}

        {/* Editor + Preview */}
        <div className="flex-1">
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

                <Editor
                  height={`${editorHeight}px`}
                  language={currentLanguage}
                  value={currentValue}
                  onChange={handleChange}
                  onMount={handleEditorDidMount}
                  loading={
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  }
                  options={{
                    readOnly: props.readOnly,
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
              </div>
            )}

            {/* Preview */}
            {previewMode !== 'code' && currentLanguage === 'markdown' && (
              <div
                className="overflow-auto"
                style={{ height: `${editorHeight}px` }}
              >
                <div className="p-6 prose prose-sm max-w-none dark:prose-invert">
                  {currentValue ? (
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
                      {currentValue}
                    </ReactMarkdown>
                  ) : (
                    <div className="text-muted-foreground text-center py-12">
                      {isMultiFile ? 'Select a file to view...' : 'Generated artifact will appear here...'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Non-markdown files show code only */}
            {previewMode !== 'code' && currentLanguage !== 'markdown' && (
              <div
                className="flex items-center justify-center bg-muted/30"
                style={{ height: `${editorHeight}px` }}
              >
                <p className="text-sm text-muted-foreground">
                  Preview not available for {currentLanguage} files
                </p>
              </div>
            )}
          </div>
        </div>
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

// Export a convenience wrapper for single-file mode
export function SingleFileEditor(props: {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  language?: string;
}) {
  return (
    <SplitEditor
      value={props.value}
      onChange={props.onChange}
      readOnly={props.readOnly}
      language={props.language}
    />
  );
}

// Export a convenience wrapper for multi-file mode
export function MultiFileEditor(props: {
  files: EditorFile[];
  activeFileId: string;
  onFileChange: (fileId: string, content: string) => void;
  onFileSelect: (fileId: string) => void;
  readOnly?: boolean;
}) {
  return (
    <SplitEditor
      files={props.files}
      activeFileId={props.activeFileId}
      onFileChange={props.onFileChange}
      onFileSelect={props.onFileSelect}
      readOnly={props.readOnly}
    />
  );
}
