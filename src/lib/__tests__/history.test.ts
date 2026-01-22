/**
 * Unit tests for history utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getHistory,
  saveToHistory,
  deleteFromHistory,
  clearHistory,
  extractNameFromContent,
  searchHistory,
  type HistoryItem,
} from '../history';

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: (key: string) => mockLocalStorage.store[key] || null,
  setItem: (key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  },
  removeItem: (key: string) => {
    delete mockLocalStorage.store[key];
  },
  clear: () => {
    mockLocalStorage.store = {};
  },
  length: 0,
  key: (index: number) => Object.keys(mockLocalStorage.store)[index] || null,
};

global.localStorage = mockLocalStorage as Storage;

describe('History Module', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe('getHistory', () => {
    it('should return empty array when nothing is stored', () => {
      const history = getHistory();
      expect(history).toEqual([]);
    });

    it('should return stored history items', () => {
      const mockHistory: HistoryItem[] = [
        {
          id: '1',
          mode: 'skill',
          idea: 'Test idea',
          content: 'Test content',
          name: 'Test Skill',
          createdAt: '2024-01-01T00:00:00.000Z',
          type: 'skill',
        },
      ];
      mockLocalStorage.setItem('claude-forge-history', JSON.stringify(mockHistory));

      const history = getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].name).toBe('Test Skill');
    });

    it('should sort history by date descending', () => {
      const mockHistory: HistoryItem[] = [
        {
          id: '1',
          mode: 'skill',
          idea: 'Old idea',
          content: 'Old content',
          name: 'Old Skill',
          createdAt: '2024-01-01T00:00:00.000Z',
          type: 'skill',
        },
        {
          id: '2',
          mode: 'skill',
          idea: 'New idea',
          content: 'New content',
          name: 'New Skill',
          createdAt: '2024-01-02T00:00:00.000Z',
          type: 'skill',
        },
      ];
      mockLocalStorage.setItem('claude-forge-history', JSON.stringify(mockHistory));

      const history = getHistory();
      expect(history[0].id).toBe('2');
      expect(history[1].id).toBe('1');
    });
  });

  describe('saveToHistory', () => {
    it('should save new history item', () => {
      const item = {
        mode: 'skill' as const,
        idea: 'Test idea',
        content: 'Test content',
        name: 'Test Skill',
        type: 'skill' as const,
      };

      saveToHistory(item);

      const history = getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].idea).toBe('Test idea');
    });

    it('should generate unique ID for each item', () => {
      saveToHistory({
        mode: 'skill',
        idea: 'Idea 1',
        content: 'Content 1',
        name: 'Skill 1',
        type: 'skill',
      });
      saveToHistory({
        mode: 'skill',
        idea: 'Idea 2',
        content: 'Content 2',
        name: 'Skill 2',
        type: 'skill',
      });

      const history = getHistory();
      expect(history[0].id).not.toBe(history[1].id);
    });

    it('should add timestamp to new items', () => {
      saveToHistory({
        mode: 'skill',
        idea: 'Test idea',
        content: 'Test content',
        name: 'Test Skill',
        type: 'skill',
      });

      const history = getHistory();
      expect(history[0].createdAt).toBeTruthy();
      expect(new Date(history[0].createdAt)).toBeInstanceOf(Date);
    });

    it('should limit history to 50 items', () => {
      // Add 51 items
      for (let i = 0; i < 51; i++) {
        saveToHistory({
          mode: 'skill',
          idea: `Idea ${i}`,
          content: `Content ${i}`,
          name: `Skill ${i}`,
          type: 'skill',
        });
      }

      const history = getHistory();
      expect(history.length).toBeLessThanOrEqual(50);
    });

    it('should put newest items at the beginning', () => {
      saveToHistory({
        mode: 'skill',
        idea: 'First idea',
        content: 'First content',
        name: 'First Skill',
        type: 'skill',
      });
      saveToHistory({
        mode: 'skill',
        idea: 'Second idea',
        content: 'Second content',
        name: 'Second Skill',
        type: 'skill',
      });

      const history = getHistory();
      expect(history[0].idea).toBe('Second idea');
    });
  });

  describe('deleteFromHistory', () => {
    it('should delete item by ID', () => {
      saveToHistory({
        mode: 'skill',
        idea: 'Keep',
        content: 'Keep content',
        name: 'Keep Skill',
        type: 'skill',
      });
      saveToHistory({
        mode: 'skill',
        idea: 'Delete',
        content: 'Delete content',
        name: 'Delete Skill',
        type: 'skill',
      });

      const historyBefore = getHistory();
      const idToDelete = historyBefore[0].id;

      deleteFromHistory(idToDelete);

      const historyAfter = getHistory();
      expect(historyAfter).toHaveLength(1);
      expect(historyAfter[0].idea).toBe('Keep');
    });

    it('should handle non-existent ID gracefully', () => {
      saveToHistory({
        mode: 'skill',
        idea: 'Test',
        content: 'Test content',
        name: 'Test Skill',
        type: 'skill',
      });

      deleteFromHistory('non-existent-id');

      const history = getHistory();
      expect(history).toHaveLength(1);
    });
  });

  describe('clearHistory', () => {
    it('should clear all history items', () => {
      saveToHistory({
        mode: 'skill',
        idea: 'Test',
        content: 'Test content',
        name: 'Test Skill',
        type: 'skill',
      });

      expect(getHistory()).toHaveLength(1);

      clearHistory();

      expect(getHistory()).toHaveLength(0);
    });
  });

  describe('extractNameFromContent', () => {
    it('should extract name from YAML frontmatter', () => {
      const content = `---
name: My Custom Skill
description: A test skill
---
This is the content`;

      const name = extractNameFromContent(content, 'skill');
      expect(name).toBe('My Custom Skill');
    });

    it('should extract name from first heading', () => {
      const content = `# My Heading

Some content here`;

      const name = extractNameFromContent(content, 'skill');
      expect(name).toBe('My Heading');
    });

    it('should return default name for auto mode', () => {
      const content = `Just some content without headers`;

      const name = extractNameFromContent(content, 'auto');
      expect(name).toBe('Untitled skill');
    });

    it('should return default name for agent mode', () => {
      const content = `Just some content`;

      const name = extractNameFromContent(content, 'agent');
      expect(name).toBe('Untitled agent');
    });
  });

  describe('searchHistory', () => {
    beforeEach(() => {
      saveToHistory({
        mode: 'skill',
        idea: 'Code review automation',
        content: 'A skill for reviewing code',
        name: 'Code Reviewer',
        type: 'skill',
      });
      saveToHistory({
        mode: 'agent',
        idea: 'Test automation agent',
        content: 'An agent for testing',
        name: 'Test Agent',
        type: 'agent',
      });
      saveToHistory({
        mode: 'ruleset',
        idea: 'Security rules',
        content: 'Security guidelines',
        name: 'Security Rules',
        type: 'ruleset',
      });
    });

    it('should search by name', () => {
      const results = searchHistory('code');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Code Reviewer');
    });

    it('should search by idea', () => {
      const results = searchHistory('automation');
      expect(results).toHaveLength(2);
    });

    it('should search by content', () => {
      const results = searchHistory('security');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Security Rules');
    });

    it('should be case insensitive', () => {
      const results = searchHistory('CODE');
      expect(results).toHaveLength(1);
    });

    it('should return all items for empty query', () => {
      const results = searchHistory('');
      expect(results.length).toBeGreaterThanOrEqual(3);
    });
  });
});
