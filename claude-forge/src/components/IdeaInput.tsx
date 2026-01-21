'use client';

import { useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface IdeaInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const examples = [
  'I want a skill to redesign the whole app from the current design to Apple-level design',
  'I want an agent that will search the whole codebase, understand it and check every line of every file',
  'I want a skill to test the user flow based on the project',
  'Create a skill that reviews code for security vulnerabilities',
];

export function IdeaInput({ value, onChange, onGenerate, isGenerating }: IdeaInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Handle keyboard shortcut
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (value.trim() && !isGenerating) {
        onGenerate();
      }
    }
    if (e.key === 'Escape') {
      textareaRef.current?.blur();
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you want to build..."
          className="min-h-[160px] resize-y pr-12"
          disabled={isGenerating}
        />
        <div className="absolute bottom-3 right-3 text-xs text-muted-foreground pointer-events-none">
          ⌘⏎ to generate
        </div>
      </div>

      {/* Example prompts */}
      {value === '' && !isGenerating && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Try an example:</p>
          <div className="flex flex-wrap gap-2">
            {examples.map((example, i) => (
              <button
                key={i}
                onClick={() => onChange(example)}
                className="text-xs text-left px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors max-w-[300px] truncate"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Generate button */}
      <div className="flex justify-end">
        <Button
          onClick={onGenerate}
          disabled={!value.trim() || isGenerating}
          size="lg"
          className="min-w-[160px]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              Generate ⌘⏎
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
