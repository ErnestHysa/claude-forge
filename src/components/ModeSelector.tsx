'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArtifactMode } from '@/types';
import { Sparkles, Code, ScrollText, Wand2 } from 'lucide-react';

const modes: Array<{
  value: ArtifactMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    value: 'skill',
    label: 'Skill',
    description: 'Create a reusable Claude Code skill',
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    value: 'agent',
    label: 'Agent',
    description: 'Create a full agent system prompt',
    icon: <Code className="h-4 w-4" />,
  },
  {
    value: 'ruleset',
    label: 'Rules',
    description: 'Create a ruleset or guardrails',
    icon: <ScrollText className="h-4 w-4" />,
  },
  {
    value: 'auto',
    label: 'Auto',
    description: 'Let Claude decide the best format',
    icon: <Wand2 className="h-4 w-4" />,
  },
];

interface ModeSelectorProps {
  value: ArtifactMode;
  onChange: (value: ArtifactMode) => void;
}

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {modes.map((mode) => (
        <Button
          key={mode.value}
          variant={value === mode.value ? 'default' : 'outline'}
          onClick={() => onChange(mode.value)}
          className={value === mode.value ? 'shadow-sm' : ''}
        >
          {mode.icon}
          <span className="hidden sm:inline ml-2">{mode.label}</span>
          <span className="sm:hidden ml-2">{mode.label}</span>
        </Button>
      ))}
    </div>
  );
}
