import type { AppSettings, ProviderPreset } from '@/types';

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
    baseUrl: 'https://api.z.ai/api/coding/paas/v4', // GLM Coding Plan endpoint
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
    apiType: 'openai', // Default to OpenAI-compatible
  },
};

// Get settings from localStorage
export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return defaultSettings;

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }

  return defaultSettings;
}

// Save settings to localStorage
export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

// Apply provider preset
export function applyProviderPreset(preset: ProviderPreset): Partial<AppSettings['provider']> {
  const config = providerPresets[preset];
  return {
    preset,
    baseUrl: config.baseUrl,
    model: config.model,
    apiType: config.apiType,
  };
}

// Get effective theme (handles 'system' preference)
export function getEffectiveTheme(theme: AppSettings['appearance']['theme']): 'light' | 'dark' {
  if (theme !== 'system') return theme;

  if (typeof window === 'undefined') return 'dark';

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
