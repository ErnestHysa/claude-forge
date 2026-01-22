/**
 * Settings Management
 *
 * Manages application settings. User account controls access but
 * settings are stored in plain localStorage (client-side only).
 */

import type { AppSettings, ProviderPreset } from '@/types';

// Export the types for use in other modules
export type { AppSettings, ProviderPreset } from '@/types';

const SETTINGS_KEY = 'claude-forge-settings';

// Default settings
export const defaultSettings: AppSettings = {
  provider: {
    baseUrl: 'https://api.anthropic.com',
    apiKey: '',
    model: 'claude-3-5-sonnet-20241022',
    preset: 'anthropic',
    apiType: 'anthropic',
  },
  appearance: {
    theme: 'system',
    fontSize: 'md',
  },
};

// Provider presets
export const providerPresets: Record<
  ProviderPreset,
  { baseUrl: string; model: string; apiType: 'anthropic' | 'openai' }
> = {
  anthropic: {
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-3-5-sonnet-20241022',
    apiType: 'anthropic',
  },
  'z-ai': {
    baseUrl: 'https://api.z.ai/api/coding/paas/v4',
    model: 'glm-4.7',
    apiType: 'openai',
  },
  glm47: {
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-plus',
    apiType: 'openai',
  },
  custom: {
    baseUrl: '',
    model: '',
    apiType: 'openai',
  },
};

/**
 * Get settings from localStorage
 */
export async function getSettings(): Promise<AppSettings> {
  if (typeof window === 'undefined') return defaultSettings;

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return defaultSettings;

    // Clear corrupted data from old encrypted format
    if (stored.includes('encrypted:') || !stored.trim().startsWith('{')) {
      console.warn('Clearing corrupted settings data from old format');
      localStorage.removeItem(SETTINGS_KEY);
      return defaultSettings;
    }

    const parsed = JSON.parse(stored) as AppSettings;
    return { ...defaultSettings, ...parsed };
  } catch (error) {
    console.error('Failed to load settings:', error);
    // Clear corrupted data
    localStorage.removeItem(SETTINGS_KEY);
    return defaultSettings;
  }
}

/**
 * Save settings to localStorage
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

/**
 * Check if encryption is enabled (always false now - encryption removed)
 */
export function isEncryptionEnabled(): boolean {
  // Encryption feature removed - settings are stored in plain text
  // User account only controls access to the app
  return false;
}

/**
 * Apply provider preset
 */
export function applyProviderPreset(preset: ProviderPreset): Partial<AppSettings['provider']> {
  const config = providerPresets[preset];
  return {
    preset,
    baseUrl: config.baseUrl,
    model: config.model,
    apiType: config.apiType,
  };
}

/**
 * Get effective theme (handles 'system' preference)
 */
export function getEffectiveTheme(theme: AppSettings['appearance']['theme']): 'light' | 'dark' {
  if (theme !== 'system') return theme;

  if (typeof window === 'undefined') return 'dark';

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
