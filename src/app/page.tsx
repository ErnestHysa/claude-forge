'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Sun, Moon, Hammer, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeSelector } from '@/components/ModeSelector';
import { TemplatePicker } from '@/components/TemplatePicker';
import { IdeaInput } from '@/components/IdeaInput';
import { SplitEditor } from '@/components/SplitEditor';
import { ActionBar } from '@/components/ActionBar';
import { HistoryPanel } from '@/components/HistoryPanel';
import { NetworkBanner } from '@/components/NetworkStatus';
import { PasswordPrompt } from '@/components/PasswordPrompt';
import { getSettings, type AppSettings } from '@/lib/settings';
import { getTemplate } from '@/lib/templates';
import { saveToHistory, extractNameFromContent, type HistoryItem } from '@/lib/history';
import { getUserMessage, logError, createError, ErrorCodes } from '@/lib/error-handling';
import { parseMultiFileResponse } from '@/lib/zip-utils';
import { toast } from 'sonner';
import type { ArtifactMode, EditorFile } from '@/types';

export default function HomePage() {
  const router = useRouter();

  // State
  const [mode, setMode] = useState<ArtifactMode>('skill');
  const [template, setTemplate] = useState<string | undefined>();
  const [idea, setIdea] = useState('');
  const [generated, setGenerated] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [detectedPath, setDetectedPath] = useState('~/.claude/skills/');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Multi-file state
  const [isMultiFile, setIsMultiFile] = useState(false);
  const [editorFiles, setEditorFiles] = useState<EditorFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>('');

  // Check if current template is multi-file
  const currentTemplate = useMemo(() => {
    if (!template) return null;
    return getTemplate(template);
  }, [template]);

  // Check if multi-file mode should be enabled
  useEffect(() => {
    if (currentTemplate?.multiFile) {
      setIsMultiFile(true);
    }
  }, [currentTemplate]);

  // Load settings and theme on mount
  useEffect(() => {
    const loadSettings = async () => {
      const loadedSettings = await getSettings();
      setSettings(loadedSettings);

      // Apply theme
      const applyTheme = () => {
        const theme = loadedSettings.appearance.theme;
        const isDark =
          theme === 'dark' ||
          (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setDarkMode(isDark);
        document.documentElement.classList.toggle('dark', isDark);
      };
      applyTheme();
    };

    loadSettings();

    // Detect git repo for save path
    detectSaveLocation();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e: MediaQueryListEvent) => {
      // Re-fetch settings on theme change to avoid stale state
      getSettings().then((loadedSettings) => {
        const theme = loadedSettings.appearance.theme;
        const isDark =
          theme === 'dark' ||
          (theme === 'system' && e.matches);
        setDarkMode(isDark);
        document.documentElement.classList.toggle('dark', isDark);
      });
    };
    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  // Detect save location (git repo or personal)
  const detectSaveLocation = async () => {
    try {
      const res = await fetch('/api/detect-path');
      if (res.ok) {
        const { path } = await res.json();
        setDetectedPath(path);
      }
    } catch {
      // Use default
    }
  };

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const newValue = !prev;
      document.documentElement.classList.toggle('dark', newValue);
      return newValue;
    });
  }, []);

  // Load item from history
  const handleLoadFromHistory = useCallback((item: HistoryItem) => {
    setMode(item.mode);
    setTemplate(item.template);
    setIdea(item.idea);
    setGenerated(item.content);

    // Check if it's a multi-file artifact
    if (item.isMultiFile && item.files) {
      const files = item.files.map((f, i) => ({
        id: `file-${i}`,
        path: f.path,
        content: f.content,
        language: f.language || 'markdown',
      }));
      setEditorFiles(files);
      setActiveFileId(files[0]?.id || '');
      setIsMultiFile(true);
    } else {
      setIsMultiFile(false);
      setEditorFiles([]);
      setActiveFileId('');
    }

    toast.success('Loaded from history', {
      description: item.name,
    });
  }, []);

  // Multi-file handlers
  const handleFileChange = useCallback((fileId: string, content: string) => {
    setEditorFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, content, isModified: true } : f))
    );
  }, []);

  const handleFileSelect = useCallback((fileId: string) => {
    setActiveFileId(fileId);
  }, []);

  // Reset editor state
  const resetEditorState = useCallback(() => {
    setGenerated('');
    setEditorFiles([]);
    setActiveFileId('');
    setIsMultiFile(false);
  }, []);
  // Generate artifact
  const handleGenerate = async () => {
    if (!idea.trim() || !settings) {
      toast.error('Please enter your API key in settings', {
        description: 'Go to Settings to configure your API provider.',
      });
      return;
    }

    if (!settings.provider.apiKey) {
      toast.error('API key is required', {
        description: 'Please configure your API key in Settings.',
      });
      router.push('/settings');
      return;
    }

    setIsGenerating(true);
    resetEditorState();

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          template,
          idea,
          settings: settings.provider,
          multiFile: isMultiFile || currentTemplate?.multiFile,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate' }));
        throw createError(
          errorData.error || 'Failed to generate artifact',
          errorData.code || ErrorCodes.GENERATION_FAILED
        );
      }

      // Read streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  // Update single-file view during generation
                  setGenerated(fullContent);
                } else if (parsed.error) {
                  throw createError(parsed.error, ErrorCodes.GENERATION_FAILED);
                }
              } catch {
                // Skip invalid JSON lines
              }
            }
          }
        }
      }

      // Check if we got any content
      if (!fullContent) {
        throw createError(
          'No content was generated. Please try again.',
          ErrorCodes.GENERATION_FAILED
        );
      }

      // Parse response for multi-file artifacts
      const parsedResult = parseMultiFileResponse(fullContent);

      if (parsedResult.files.length > 1) {
        // Multi-file artifact
        setEditorFiles(parsedResult.files);
        setActiveFileId(parsedResult.files[0]?.id || '');
        setIsMultiFile(true);
        setGenerated(fullContent); // Store raw response for saving
      } else {
        // Single file artifact
        setIsMultiFile(false);
        setGenerated(parsedResult.files[0]?.content || fullContent);
      }

      // Save to history
      const name = extractNameFromContent(fullContent, mode);
      saveToHistory({
        mode,
        template,
        idea,
        content: fullContent,
        name,
        type: mode === 'auto' ? 'skill' : mode,
        isMultiFile: parsedResult.files.length > 1,
        files: parsedResult.files.length > 1 ? parsedResult.files.map((f) => ({
          path: f.path,
          content: f.content,
          language: f.language,
        })) : undefined,
      } as HistoryItem & { isMultiFile?: boolean; files?: Array<{ path: string; content: string; language: string }> });

      toast.success('Artifact generated!', {
        description: parsedResult.files.length > 1
          ? `${parsedResult.files.length} files created`
          : 'Review and edit before saving.',
      });
    } catch (error) {
      logError(error, 'Generation');
      const userMessage = getUserMessage(error as Error);
      toast.error('Generation failed', {
        description: userMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Save artifact
  const handleSave = useCallback(async () => {
    if (!generated) return;

    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: generated,
          type: mode === 'auto' ? 'skill' : mode,
          location: 'auto',
          isMultiFile,
          files: isMultiFile ? editorFiles.map(f => ({
            path: f.path,
            content: f.content,
            language: f.language,
          })) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save' }));
        throw createError(
          errorData.error || 'Failed to save artifact',
          errorData.code || ErrorCodes.SAVE_FAILED
        );
      }

      const result = await response.json();
      toast.success(`Saved to ${result.path}`, {
        description: isMultiFile
          ? `${result.filesCount || editorFiles.length} files saved successfully.`
          : 'Artifact saved successfully.',
      });
    } catch (error) {
      logError(error, 'Save');
      const userMessage = getUserMessage(error as Error);
      toast.error('Save failed', {
        description: userMessage,
      });
    }
  }, [generated, isMultiFile, editorFiles, mode]);

  // Handle keyboard shortcuts (must be after handleSave declaration)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S - save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (generated) {
          handleSave();
        }
      }
      // Cmd/Ctrl + , - settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        router.push('/settings');
      }
      // Cmd/Ctrl + H - history
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault();
        setIsHistoryOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [generated, router, handleSave]);

  // Handle mode change - reset template if incompatible
  const handleModeChange = (newMode: ArtifactMode) => {
    setMode(newMode);
    if (template && newMode !== 'auto') {
      const tpl = getTemplate(template);
      if (tpl && tpl.type !== newMode) {
        setTemplate(undefined);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Network Status Banner */}
      <NetworkBanner />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Hammer className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-display font-semibold">Claude Forge</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Transform ideas into Claude artifacts
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsHistoryOpen(true)}
              aria-label="History"
            >
              <Clock className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/settings')}
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Mode & Template selection */}
        <section className="space-y-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">Artifact Type</label>
            <ModeSelector value={mode} onChange={handleModeChange} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Template (optional)</label>
            <TemplatePicker
              artifactType={mode}
              value={template}
              onChange={setTemplate}
            />
          </div>
        </section>

        {/* Input area */}
        <section className="space-y-2">
          <label className="text-sm font-medium">
            Describe what you want to build
          </label>
          <IdeaInput
            value={idea}
            onChange={setIdea}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </section>

        {/* Editor */}
        {(generated || editorFiles.length > 0 || isGenerating) ? (
          <section className="space-y-2">
            <label className="text-sm font-medium">
              {isGenerating
                ? 'Generating...'
                : isMultiFile
                  ? `Editing ${editorFiles.length} files`
                  : 'Edit your artifact'}
            </label>
            {isMultiFile && editorFiles.length > 0 ? (
              <SplitEditor
                files={editorFiles}
                activeFileId={activeFileId}
                onFileChange={handleFileChange}
                onFileSelect={handleFileSelect}
                readOnly={isGenerating}
              />
            ) : (
              <SplitEditor
                value={generated}
                onChange={setGenerated}
                readOnly={isGenerating}
              />
            )}
          </section>
        ) : (
          <section className="border-2 border-dashed border-border rounded-xl p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Hammer className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Ready to forge</h3>
                <p className="text-muted-foreground">
                  Enter your idea above and Claude will create a polished artifact for you.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Action bar */}
        {(generated || editorFiles.length > 0) && !isGenerating && (
          <ActionBar
            hasContent={!!generated || editorFiles.length > 0}
            isGenerating={isGenerating}
            onSave={handleSave}
            onRegenerate={handleGenerate}
            detectedPath={detectedPath}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-muted-foreground">
          Claude Forge — Transform ideas into Claude-compatible artifacts
        </div>
      </footer>

      {/* History Panel */}
      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onLoad={handleLoadFromHistory}
      />

      {/* Auth Prompt - shows when user is not logged in */}
      <PasswordPrompt />
    </div>
  );
}
