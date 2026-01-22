/**
 * Settings Module Tests
 *
 * Tests for the settings module (simplified, no encryption).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  defaultSettings,
  getSettings,
  saveSettings,
  applyProviderPreset,
  isEncryptionEnabled,
  getEffectiveTheme,
  type AppSettings,
} from '../settings';

// Mock localStorage
const mockLocalStorage = {
  store: new Map<string, string>(),
  getItem: (key: string) => mockLocalStorage.store.get(key) || null,
  setItem: (key: string, value: string) => mockLocalStorage.store.set(key, value),
  removeItem: (key: string) => mockLocalStorage.store.delete(key),
  clear: () => mockLocalStorage.store.clear(),
};

global.localStorage = mockLocalStorage as unknown as Storage;

describe('Settings Module', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe('defaultSettings', () => {
    it('should have the correct structure', () => {
      expect(defaultSettings).toHaveProperty('provider');
      expect(defaultSettings).toHaveProperty('appearance');
      expect(defaultSettings.provider).toHaveProperty('baseUrl');
      expect(defaultSettings.provider).toHaveProperty('apiKey');
      expect(defaultSettings.provider).toHaveProperty('model');
      expect(defaultSettings.appearance).toHaveProperty('theme');
      expect(defaultSettings.appearance).toHaveProperty('fontSize');
    });

    it('should have Anthropic as default provider', () => {
      expect(defaultSettings.provider.baseUrl).toBe('https://api.anthropic.com');
      expect(defaultSettings.provider.model).toBe('claude-3-5-sonnet-20241022');
      expect(defaultSettings.provider.preset).toBe('anthropic');
      expect(defaultSettings.provider.apiType).toBe('anthropic');
    });
  });

  describe('getSettings', () => {
    it('should return default settings when nothing is stored', async () => {
      const settings = await getSettings();
      expect(settings).toEqual(defaultSettings);
    });

    it('should return stored settings', async () => {
      const customSettings: AppSettings = {
        provider: {
          baseUrl: 'https://custom.api.com',
          apiKey: 'test-key',
          model: 'custom-model',
          preset: 'custom',
          apiType: 'openai',
        },
        appearance: {
          theme: 'dark',
          fontSize: 'lg',
        },
      };

      mockLocalStorage.store.set('claude-forge-settings', JSON.stringify(customSettings));

      const settings = await getSettings();
      expect(settings.provider.baseUrl).toBe('https://custom.api.com');
      expect(settings.provider.apiKey).toBe('test-key');
    });

    it('should merge with defaults when partial settings stored', async () => {
      const partialSettings = {
        provider: {
          baseUrl: 'https://partial.com',
          apiKey: 'partial-key',
          model: 'claude-3-5-sonnet-20241022',
          preset: 'anthropic',
          apiType: 'anthropic',
        },
        appearance: {
          theme: 'system',
          fontSize: 'md',
        },
      };

      mockLocalStorage.store.set('claude-forge-settings', JSON.stringify(partialSettings));

      const settings = await getSettings();
      expect(settings.provider.baseUrl).toBe('https://partial.com');
      expect(settings.provider.apiKey).toBe('partial-key');
    });
  });

  describe('saveSettings', () => {
    it('should save settings to localStorage', async () => {
      const settings: AppSettings = {
        provider: {
          baseUrl: 'https://test.api.com',
          apiKey: 'test-key',
          model: 'test-model',
          preset: 'custom',
          apiType: 'openai',
        },
        appearance: {
          theme: 'light',
          fontSize: 'sm',
        },
      };

      await saveSettings(settings);

      const stored = mockLocalStorage.store.get('claude-forge-settings');
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored);
      expect(parsed.provider.baseUrl).toBe('https://test.api.com');
      expect(parsed.provider.apiKey).toBe('test-key');
    });

    it('should overwrite existing settings', async () => {
      const firstSettings: AppSettings = {
        provider: {
          ...defaultSettings.provider,
          apiKey: 'first-key',
        },
        appearance: defaultSettings.appearance,
      };

      const secondSettings: AppSettings = {
        provider: {
          ...defaultSettings.provider,
          apiKey: 'second-key',
        },
        appearance: defaultSettings.appearance,
      };

      await saveSettings(firstSettings);
      await saveSettings(secondSettings);

      const stored = mockLocalStorage.store.get('claude-forge-settings');
      const parsed = JSON.parse(stored);
      expect(parsed.provider.apiKey).toBe('second-key');
    });
  });

  describe('isEncryptionEnabled', () => {
    it('should always return false (encryption removed)', () => {
      expect(isEncryptionEnabled()).toBe(false);
    });
  });

  describe('applyProviderPreset', () => {
    it('should apply Anthropic preset correctly', () => {
      const result = applyProviderPreset('anthropic');
      expect(result).toEqual({
        preset: 'anthropic',
        baseUrl: 'https://api.anthropic.com',
        model: 'claude-3-5-sonnet-20241022',
        apiType: 'anthropic',
      });
    });

    it('should apply Z.ai preset correctly', () => {
      const result = applyProviderPreset('z-ai');
      expect(result.baseUrl).toBe('https://api.z.ai/api/coding/paas/v4');
      expect(result.model).toBe('glm-4.7');
      expect(result.apiType).toBe('openai');
    });

    it('should apply custom preset correctly', () => {
      const result = applyProviderPreset('custom');
      expect(result.preset).toBe('custom');
      expect(result.baseUrl).toBe('');
      expect(result.model).toBe('');
      expect(result.apiType).toBe('openai');
    });

    it('should apply GLM-4.7 preset correctly', () => {
      const result = applyProviderPreset('glm47');
      expect(result.baseUrl).toBe('https://open.bigmodel.cn/api/paas/v4');
      expect(result.model).toBe('glm-4-plus');
      expect(result.apiType).toBe('openai');
    });
  });

  describe('getEffectiveTheme', () => {
    it('should return light theme when set to light', () => {
      expect(getEffectiveTheme('light')).toBe('light');
    });

    it('should return dark theme when set to dark', () => {
      expect(getEffectiveTheme('dark')).toBe('dark');
    });

    it('should return system preference when set to system', () => {
      // Mock window.matchMedia
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const result = getEffectiveTheme('system');
      expect(result).toBe('dark');

      window.matchMedia = originalMatchMedia;
    });
  });

  describe('Error handling', () => {
    it('should return defaults when localStorage has invalid JSON', async () => {
      mockLocalStorage.store.set('claude-forge-settings', 'invalid json');

      const settings = await getSettings();
      expect(settings).toEqual(defaultSettings);
    });

    it('should handle save errors gracefully', async () => {
      // Make localStorage.setItem throw
      const originalSetItem = mockLocalStorage.store.set;
      mockLocalStorage.store.set = () => {
        throw new Error('Storage full');
      };

      // Should not throw
      await expect(saveSettings(defaultSettings)).resolves.not.toThrow();

      // Restore
      mockLocalStorage.store.set = originalSetItem;
    });
  });
});
