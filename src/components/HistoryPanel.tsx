'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  Trash2,
  Search,
  X,
  Sparkles,
  Code,
  ScrollText,
  Wand2,
  ChevronRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { getHistory, deleteFromHistory, clearHistory, type HistoryItem } from '@/lib/history';
import { cn } from '@/lib/utils';
import type { ArtifactMode } from '@/types';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (item: HistoryItem) => void;
}

const modeIcons: Record<ArtifactMode, React.ReactNode> = {
  skill: <Sparkles className="h-4 w-4" />,
  agent: <Code className="h-4 w-4" />,
  ruleset: <ScrollText className="h-4 w-4" />,
  auto: <Wand2 className="h-4 w-4" />,
};

const modeColors: Record<ArtifactMode, string> = {
  skill: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  agent: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  ruleset: 'bg-green-500/10 text-green-500 border-green-500/20',
  auto: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
};

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function HistoryItemCard({
  item,
  onLoad,
  onDelete,
}: {
  item: HistoryItem;
  onLoad: () => void;
  onDelete: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "group relative p-4 rounded-lg border border-border bg-card transition-all duration-200",
        "hover:border-primary/50 hover:shadow-md hover:bg-accent/50",
        isHovered && "border-primary/50 bg-accent/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className={cn(
            "p-1.5 rounded-md border shrink-0",
            modeColors[item.mode]
          )}>
            {modeIcons[item.mode]}
          </span>
          <h4 className="font-medium text-sm truncate">{item.name}</h4>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {formatDate(item.createdAt)}
        </span>
      </div>

      {/* Preview */}
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
        {truncateText(item.idea, 100)}
      </p>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          {item.template || 'Custom'}
        </Badge>
        <div className={cn(
          "flex items-center gap-1 transition-opacity duration-150",
          isHovered ? "opacity-100" : "opacity-0 sm:opacity-0"
        )}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-7 px-2 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoad}
            className="h-7 px-2 text-muted-foreground hover:text-primary"
          >
            Load <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function HistoryPanel({ isOpen, onClose, onLoad }: HistoryPanelProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Load history when panel opens
  const refreshHistory = () => {
    setHistory(getHistory());
  };

  useEffect(() => {
    if (isOpen) {
      refreshHistory();
    }
  }, [isOpen]);

  // Filter history based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredHistory(history);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredHistory(
        history.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.idea.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, history]);

  const handleLoad = (item: HistoryItem) => {
    onLoad(item);
    onClose();
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setShowClearDialog(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteFromHistory(itemToDelete);
      refreshHistory();
      setItemToDelete(null);
      toast.success('Item deleted');
    }
    setShowClearDialog(false);
  };

  const handleClearAll = () => {
    clearHistory();
    refreshHistory();
    setShowClearDialog(false);
    toast.success('History cleared');
  };

  const isEmpty = history.length === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full sm:w-[400px] bg-background border-l border-border z-50",
          "shadow-2xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold">History</h2>
              <p className="text-xs text-muted-foreground">
                {isEmpty ? 'No items yet' : `${history.length} item${history.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No history yet</h3>
              <p className="text-sm text-muted-foreground max-w-[250px]">
                Your generated artifacts will appear here
              </p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <p className="text-muted-foreground">No results found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <HistoryItemCard
                  key={item.id}
                  item={item}
                  onLoad={() => handleLoad(item)}
                  onDelete={() => handleDelete(item.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isEmpty && (
          <div className="px-4 py-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setItemToDelete(null);
                setShowClearDialog(true);
              }}
              className="w-full text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All History
            </Button>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {itemToDelete ? 'Delete item?' : 'Clear all history?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete
                ? 'This item will be permanently deleted from your history.'
                : 'This will permanently delete all items from your history. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={itemToDelete ? confirmDelete : handleClearAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {itemToDelete ? 'Delete' : 'Clear All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
