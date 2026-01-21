/**
 * Client-side encryption utilities for Claude Forge.
 * All encryption happens locally - no data leaves the device.
 * Uses Web Crypto API with PBKDF2 and AES-GCM.
 */

export interface EncryptedData {
  data: string;        // Base64 encrypted content
  salt: string;        // Base64 salt for key derivation
  iv: string;          // Base64 initialization vector
  version: number;     // Encryption version for future compatibility
}

export interface PasswordState {
  isSet: boolean;      // Whether a password has been configured
  isUnlocked: boolean; // Whether the vault is currently unlocked
  hasEncryptedData: boolean; // Whether encrypted data exists
}

const ENCRYPTION_VERSION = 1;
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;

/**
 * Generate a random salt for key derivation
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Generate a random IV for AES-GCM
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Convert Uint8Array to Base64 string
 */
function arrayToBase64(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer));
}

/**
 * Convert Base64 string to Uint8Array
 */
function base64ToArray(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

/**
 * Derive a cryptographic key from a password and salt using PBKDF2
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-GCM
 */
export async function encryptData(
  data: string,
  password: string
): Promise<EncryptedData> {
  const salt = generateSalt();
  const iv = generateIV();

  const key = await deriveKey(password, salt);
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(data);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  );

  return {
    data: arrayToBase64(new Uint8Array(encrypted)),
    salt: arrayToBase64(salt),
    iv: arrayToBase64(iv),
    version: ENCRYPTION_VERSION,
  };
}

/**
 * Decrypt data using AES-GCM
 */
export async function decryptData(
  encryptedData: EncryptedData,
  password: string
): Promise<string> {
  const salt = base64ToArray(encryptedData.salt);
  const iv = base64ToArray(encryptedData.iv);
  const ciphertext = base64ToArray(encryptedData.data);

  const key = await deriveKey(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Check if a password is correct without fully decrypting
 * by attempting to decrypt the first few bytes
 */
export async function verifyPassword(
  encryptedData: EncryptedData,
  password: string
): Promise<boolean> {
  try {
    await decryptData(encryptedData, password);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a random password for the user
 */
export function generateRandomPassword(length: number = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}

/**
 * Hash a password for storage (only for verification, not encryption key)
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Estimate password strength
 */
export function estimatePasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length < 8) return 'weak';

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  const variety = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;

  if (variety >= 3 && password.length >= 12) return 'strong';
  if (variety >= 2 && password.length >= 10) return 'medium';
  return 'weak';
}

/**
 * Get password strength color for UI
 */
export function getPasswordStrengthColor(strength: string): string {
  switch (strength) {
    case 'strong':
      return 'text-green-600';
    case 'medium':
      return 'text-yellow-600';
    case 'weak':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Validate password against requirements
 */
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Key derivation info (for display/debugging)
 */
export function getEncryptionInfo() {
  return {
    algorithm: 'AES-GCM',
    keyLength: KEY_LENGTH,
    pbkdf2Iterations: PBKDF2_ITERATIONS,
    hash: 'SHA-256',
    version: ENCRYPTION_VERSION,
  };
}
