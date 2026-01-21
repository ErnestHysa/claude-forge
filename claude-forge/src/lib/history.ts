import type { ArtifactMode } from '@/types';

const HISTORY_KEY = 'claude-forge-history';
const MAX_HISTORY_ITEMS = 50;

export interface HistoryItem {
  id: string;
  mode: ArtifactMode;
  template?: string;
  idea: string;
  content: string;
  name: string;
  createdAt: string;
  type: 'skill' | 'agent' | 'ruleset';
}

// Get all history items
export function getHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      const items = JSON.parse(stored) as HistoryItem[];
      // Sort by date descending
      return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch (error) {
    console.error('Failed to load history:', error);
  }

  return [];
}

// Save a new item to history
export function saveToHistory(item: Omit<HistoryItem, 'id' | 'createdAt'>): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getHistory();
    const newItem: HistoryItem = {
      ...item,
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    // Add to beginning, limit total items
    const updated = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save to history:', error);
  }
}

// Delete a single item
export function deleteFromHistory(id: string): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getHistory();
    const updated = history.filter((item) => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to delete from history:', error);
  }
}

// Clear all history
export function clearHistory(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
}

// Extract name from content (YAML frontmatter or first heading)
export function extractNameFromContent(content: string, mode: ArtifactMode): string {
  // Try to extract from YAML frontmatter
  const nameMatch = content.match(/^name:\s*["']?([^"'\n]+)["']?\s*$/m);
  if (nameMatch) {
    return nameMatch[1];
  }

  // Try to extract from first heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    return titleMatch[1];
  }

  // Fallback: generate name from mode
  const modeLabel = mode === 'auto' ? 'skill' : mode;
  return `Untitled ${modeLabel}`;
}

// Search history
export function searchHistory(query: string): HistoryItem[] {
  const history = getHistory();
  if (!query.trim()) return history;

  const lowerQuery = query.toLowerCase();
  return history.filter(
    (item) =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.idea.toLowerCase().includes(lowerQuery) ||
      item.content.toLowerCase().includes(lowerQuery)
  );
}
