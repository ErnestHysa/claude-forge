'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Check, RefreshCw, FolderOpen } from 'lucide-react';
import { useState } from 'react';

interface ActionBarProps {
  hasContent: boolean;
  isGenerating: boolean;
  onSave: () => Promise<void>;
  onRegenerate: () => void;
  detectedPath?: string;
}

export function ActionBar({
  hasContent,
  isGenerating,
  onSave,
  onRegenerate,
  detectedPath,
}: ActionBarProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleSaveClick = () => {
    setShowSaveDialog(true);
  };

  const handleConfirmSave = async () => {
    setShowSaveDialog(false);
    await onSave();
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border">
        {/* Primary action */}
        <Button
          onClick={handleSaveClick}
          disabled={!hasContent || isGenerating}
          size="lg"
          className="flex-1 sm:flex-none"
        >
          <Check className="h-4 w-4 mr-2" />
          Approve & Install
        </Button>

        {/* Secondary actions */}
        <Button
          onClick={onRegenerate}
          disabled={!hasContent || isGenerating}
          variant="outline"
          size="lg"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
          Regenerate
        </Button>

        {/* Detected path indicator */}
        {detectedPath && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-sm">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Save to:</span>
            <code className="text-xs bg-background px-2 py-0.5 rounded">
              {detectedPath}
            </code>
          </div>
        )}
      </div>

      {/* Save confirmation dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install Artifact</DialogTitle>
            <DialogDescription>
              Your artifact will be saved to your Claude skills directory.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Location</span>
                <Badge variant="secondary">
                  {detectedPath?.includes('.claude') ? 'Project' : 'Personal'}
                </Badge>
              </div>
              <code className="block text-sm bg-background p-2 rounded">
                {detectedPath || '~/.claude/skills/'}
              </code>
            </div>

            <p className="text-sm text-muted-foreground">
              After saving, reload Claude Code to see your new skill.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSave}>Install</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
