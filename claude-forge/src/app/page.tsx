'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Sun, Moon, Hammer, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeSelector } from '@/components/ModeSelector';
import { TemplatePicker } from '@/components/TemplatePicker';
import { IdeaInput } from '@/components/IdeaInput';
import { SplitEditor } from '@/components/SplitEditor';
import { ActionBar } from '@/components/ActionBar';
import { HistoryPanel } from '@/components/HistoryPanel';
import { getSettings, type AppSettings } from '@/lib/settings';
import { getTemplate, templates } from '@/lib/templates';
import { saveToHistory, extractNameFromContent, type HistoryItem } from '@/lib/history';
import { toast } from 'sonner';
import type { ArtifactMode, Artifact } from '@/types';

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

  // Load settings and theme on mount
  useEffect(() => {
    const loadedSettings = getSettings();
    setSettings(loadedSettings);

    // Detect git repo for save path
    detectSaveLocation();

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

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
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

  // Handle keyboard shortcuts
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
  }, [generated, router]);

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
    toast.success('Loaded from history', {
      description: item.name,
    });
  }, []);

  // Generate artifact
  const handleGenerate = async () => {
    if (!idea.trim() || !settings) return;

    setIsGenerating(true);
    setGenerated('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          template,
          idea,
          settings: settings.provider,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate');
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
                  setGenerated(fullContent);
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
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
      });

      toast.success('Artifact generated!', {
        description: 'Review and edit before saving.',
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Generation failed', {
        description: 'Please check your settings and try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Save artifact
  const handleSave = async () => {
    if (!generated) return;

    toast.promise(
      fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: generated,
          type: mode === 'auto' ? 'skill' : mode,
          location: 'auto',
        }),
      }).then(async (res) => {
        if (!res.ok) throw new Error('Save failed');
        const result = await res.json();
        return result;
      }),
      {
        loading: 'Saving artifact...',
        success: (result) => `Saved to ${result.path}`,
        error: 'Failed to save artifact',
      }
    );
  };

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
        {generated || isGenerating ? (
          <section className="space-y-2">
            <label className="text-sm font-medium">
              {isGenerating ? 'Generating...' : 'Edit your artifact'}
            </label>
            <SplitEditor
              value={generated}
              onChange={setGenerated}
              readOnly={isGenerating}
            />
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
        {generated && !isGenerating && (
          <ActionBar
            hasContent={!!generated}
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
    </div>
  );
}
