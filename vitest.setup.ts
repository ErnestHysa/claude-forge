import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = {
  getItem: (key: string) => null,
  setItem: (key: string, value: string) => {},
  removeItem: (key: string) => {},
  clear: () => {},
  length: 0,
  key: (index: number) => null,
};

global.localStorage = localStorageMock as Storage;

// Mock crypto for Node environment
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    subtle: {
      generateKey: vi.fn().mockResolvedValue({}),
      importKey: vi.fn().mockResolvedValue({}),
      deriveKey: vi.fn().mockResolvedValue({}),
      encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
      decrypt: vi.fn().mockResolvedValue(new TextEncoder().encode('decrypted')),
      // Properly implement SHA-256 digest for testing
      digest: vi.fn().mockImplementation(async (algorithm: string, data: Uint8Array) => {
        // Simple hash implementation for testing - produces consistent 64-char hex string
        // This is NOT cryptographically secure, but produces deterministic hashes
        const input = Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
          const char = input.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32bit integer
        }

        // Create a 32-byte (64 hex chars) deterministic hash from the input
        const hashBytes = new Uint8Array(32);
        const seed = Math.abs(hash);
        for (let i = 0; i < 32; i++) {
          hashBytes[i] = (seed * (i + 1) * 2654435761) % 256;
        }

        return hashBytes.buffer;
      }),
    },
  },
  writable: true,
  configurable: true,
});
