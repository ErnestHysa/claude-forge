import type { AppSettings, ProviderPreset } from '@/types';
import { encryptData, decryptData, type EncryptedData } from './encryption';

// Export the types for use in other modules
export type { AppSettings, ProviderPreset } from '@/types';

const SETTINGS_KEY = 'claude-forge-settings';
const ENCRYPTED_PREFIX = 'encrypted:';
const PASSWORD_HASH_KEY = 'claude-forge-password-hash';
const PASSWORD_HINT_KEY = 'claude-forge-password-hint';

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

/**
 * Check if encryption is enabled (password is set)
 */
export function isEncryptionEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(PASSWORD_HASH_KEY);
}

/**
 * Get settings - handles both encrypted and unencrypted storage
 * If encrypted, requires password to decrypt
 */
export function getSettings(password?: string): AppSettings {
  if (typeof window === 'undefined') return defaultSettings;

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return defaultSettings;

    // Check if settings are encrypted
    if (stored.startsWith(ENCRYPTED_PREFIX)) {
      if (!password) {
        // Return settings with empty API key - user must unlock
        return {
          ...defaultSettings,
          provider: { ...defaultSettings.provider, apiKey: '' },
        };
      }

      // Decrypt the settings
      const encryptedJson = stored.slice(ENCRYPTED_PREFIX.length);
      const encrypted: EncryptedData = JSON.parse(encryptedJson);
      const decryptedJson = decryptData(encrypted, password);
      const settings = JSON.parse(decryptedJson) as AppSettings;

      return { ...defaultSettings, ...settings };
    }

    // Unencrypted storage (backward compatibility)
    return { ...defaultSettings, ...JSON.parse(stored) };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return defaultSettings;
  }
}

/**
 * Save settings - encrypts API key if password is set
 */
export function saveSettings(settings: AppSettings, password?: string): void {
  if (typeof window === 'undefined') return;

  try {
    // If password is set and we have an API key, encrypt the settings
    if (password && settings.provider.apiKey && isEncryptionEnabled()) {
      const settingsToEncrypt = {
        provider: {
          ...settings.provider,
          // Only encrypt the API key, leave other settings unencrypted for UI
          apiKey: settings.provider.apiKey,
        },
      };

      const encrypted = encryptData(JSON.stringify(settingsToEncrypt), password);
      const encryptedJson = JSON.stringify(encrypted);
      localStorage.setItem(SETTINGS_KEY, ENCRYPTED_PREFIX + encryptedJson);
    } else {
      // Store unencrypted (or no API key to encrypt)
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

/**
 * Set up encryption password
 */
export async function setupPassword(
  password: string,
  hint?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Hash the password for verification
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    localStorage.setItem(PASSWORD_HASH_KEY, hash);

    if (hint) {
      localStorage.setItem(PASSWORD_HINT_KEY, hint);
    }

    // Re-encrypt existing settings with new password
    const currentSettings = getSettings();
    if (currentSettings.provider.apiKey && password) {
      saveSettings(currentSettings, password);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to set up password' };
  }
}

/**
 * Verify the password against stored hash
 */
export async function verifyPassword(password: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const storedHash = localStorage.getItem(PASSWORD_HASH_KEY);
    if (!storedHash) return false;

    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return hash === storedHash;
  } catch {
    return false;
  }
}

/**
 * Get password hint
 */
export function getPasswordHint(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PASSWORD_HINT_KEY);
}

/**
 * Remove password and decrypt settings
 */
export function removePassword(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(PASSWORD_HASH_KEY);
  localStorage.removeItem(PASSWORD_HINT_KEY);

  // Note: We keep the encrypted settings as-is
  // User will need to set a new password to access them
}

/**
 * Change password - re-encrypts settings with new password
 */
export async function changePassword(
  oldPassword: string,
  newPassword: string,
  hint?: string
): Promise<{ success: boolean; error?: string }> {
  // Verify old password
  const isValid = await verifyPassword(oldPassword);
  if (!isValid) {
    return { success: false, error: 'Current password is incorrect' };
  }

  // Get current settings (using old password)
  const currentSettings = getSettings(oldPassword);

  // Set up new password
  return setupPassword(newPassword, hint);
}

/**
 * Check if vault has content (encrypted API keys)
 */
export function hasEncryptedContent(): boolean {
  if (typeof window === 'undefined') return false;

  const stored = localStorage.getItem(SETTINGS_KEY);
  return stored?.startsWith(ENCRYPTED_PREFIX) || false;
}

/**
 * Get password state info
 */
export function getPasswordState(): {
  isSet: boolean;
  hasHint: boolean;
  hasEncryptedContent: boolean;
} {
  return {
    isSet: !!localStorage.getItem(PASSWORD_HASH_KEY),
    hasHint: !!localStorage.getItem(PASSWORD_HINT_KEY),
    hasEncryptedContent: hasEncryptedContent(),
  };
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
