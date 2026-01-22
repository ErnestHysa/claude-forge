/**
 * User Account System Tests
 *
 * TDD RED Phase: These tests define the expected behavior of the user account system.
 * All tests should fail initially since the implementation doesn't exist yet.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createAccount,
  login,
  logout,
  getCurrentUser,
  isLoggedIn,
  getAllUsers,
  deleteAccount,
  verifyPasswordStrength,
} from '../user-account';
import { USERS_STORAGE_KEY } from '../user-account-types';

// Mock localStorage
const mockLocalStorage = {
  store: new Map<string, string>(),
  getItem: (key: string) => mockLocalStorage.store.get(key) || null,
  setItem: (key: string, value: string) => mockLocalStorage.store.set(key, value),
  removeItem: (key: string) => mockLocalStorage.store.delete(key),
  clear: () => mockLocalStorage.store.clear(),
};

global.localStorage = mockLocalStorage as unknown as Storage;

// Mock sessionStorage
const mockSessionStorage = {
  store: new Map<string, string>(),
  getItem: (key: string) => mockSessionStorage.store.get(key) || null,
  setItem: (key: string, value: string) => mockSessionStorage.store.set(key, value),
  removeItem: (key: string) => mockSessionStorage.store.delete(key),
  clear: () => mockSessionStorage.store.clear(),
};

global.sessionStorage = mockSessionStorage as unknown as Storage;

// Helper to get raw users (with password hash) for testing
function getRawUsers() {
  const stored = mockLocalStorage.store.get(USERS_STORAGE_KEY);
  if (!stored) return [];
  return JSON.parse(stored);
}

describe('User Account System', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    mockSessionStorage.clear();
  });

  afterEach(() => {
    logout();
    mockLocalStorage.clear(); // Ensure clean state between tests
    mockSessionStorage.clear();
  });

  describe('createAccount', () => {
    it('should create a new account with username and password', async () => {
      const result = await createAccount('testuser', 'SecurePass123!');
      expect(result.success).toBe(true);
      expect(result.username).toBe('testuser');
      expect(result.error).toBeUndefined();
    });

    it('should store password hash, not plain password', async () => {
      await createAccount('testuser', 'SecurePass123!');
      const users = getRawUsers();
      const user = users.find((u: { username: string }) => u.username === 'testuser');

      expect(user).toBeDefined();
      expect(user?.passwordHash).not.toBe('SecurePass123!');
      expect(user?.passwordHash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash format
    });

    it('should reject duplicate usernames', async () => {
      await createAccount('testuser', 'SecurePass123!');
      const result = await createAccount('testuser', 'DifferentPass456!');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should reject weak passwords', async () => {
      const result = await createAccount('testuser', '123');

      expect(result.success).toBe(false);
      expect(result.error?.toLowerCase()).toContain('password');
    });

    it('should reject empty username', async () => {
      const result = await createAccount('', 'SecurePass123!');

      expect(result.success).toBe(false);
      expect(result.error?.toLowerCase()).toContain('username');
    });

    it('should automatically login after account creation', async () => {
      await createAccount('testuser', 'SecurePass123!');
      expect(isLoggedIn()).toBe(true);
      expect(getCurrentUser()?.username).toBe('testuser');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await createAccount('testuser', 'SecurePass123!');
      logout(); // Logout so we can test login
    });

    it('should login with correct credentials', async () => {
      const result = await login('testuser', 'SecurePass123!');
      expect(result.success).toBe(true);
      expect(result.username).toBe('testuser');
      expect(isLoggedIn()).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const result = await login('testuser', 'WrongPassword123!');
      expect(result.success).toBe(false);
      expect(result.error?.toLowerCase()).toContain('password');
      expect(isLoggedIn()).toBe(false);
    });

    it('should reject non-existent username', async () => {
      const result = await login('nonexistent', 'SecurePass123!');
      expect(result.success).toBe(false);
      expect(result.error?.toLowerCase()).toContain('username');
      expect(isLoggedIn()).toBe(false);
    });

    it('should reject empty credentials', async () => {
      const result = await login('', '');
      expect(result.success).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear current session', async () => {
      await createAccount('testuser', 'SecurePass123!');
      expect(isLoggedIn()).toBe(true);

      logout();
      expect(isLoggedIn()).toBe(false);
      expect(getCurrentUser()).toBeNull();
    });

    it('should be safe to call when not logged in', () => {
      expect(() => logout()).not.toThrow();
      expect(isLoggedIn()).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user when logged in', async () => {
      await createAccount('testuser', 'SecurePass123!');
      const user = getCurrentUser();

      expect(user).toBeDefined();
      expect(user?.username).toBe('testuser');
      expect(user?.passwordHash).toBeUndefined(); // Password hash should not be exposed
    });

    it('should return null when not logged in', () => {
      const user = getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('isLoggedIn', () => {
    it('should return true when user is logged in', async () => {
      await createAccount('testuser', 'SecurePass123!');
      expect(isLoggedIn()).toBe(true);
    });

    it('should return false when no user is logged in', () => {
      expect(isLoggedIn()).toBe(false);
    });

    it('should return false after logout', async () => {
      await createAccount('testuser', 'SecurePass123!');
      logout();
      expect(isLoggedIn()).toBe(false);
    });
  });

  describe('getAllUsers', () => {
    it('should return empty array when no users exist', () => {
      const users = getAllUsers();
      expect(users).toEqual([]);
    });

    it('should return all created users (without password hashes)', async () => {
      await createAccount('user1', 'SecurePass123!');
      logout();
      await createAccount('user2', 'DifferentPass456!');

      const users = getAllUsers();
      expect(users).toHaveLength(2);

      // Password hashes should not be exposed
      expect(users[0].passwordHash).toBeUndefined();
      expect(users[1].passwordHash).toBeUndefined();
    });
  });

  describe('deleteAccount', () => {
    it('should delete the specified account', async () => {
      await createAccount('testuser', 'SecurePass123!');
      expect(getAllUsers()).toHaveLength(1);

      const result = await deleteAccount('testuser', 'SecurePass123!');
      expect(result.success).toBe(true);
      expect(getAllUsers()).toHaveLength(0);
    });

    it('should require correct password to delete', async () => {
      await createAccount('testuser', 'SecurePass123!');

      const result = await deleteAccount('testuser', 'WrongPassword!');
      expect(result.success).toBe(false);
      expect(getAllUsers()).toHaveLength(1);
    });

    it('should logout if deleting current account', async () => {
      await createAccount('testuser', 'SecurePass123!');
      expect(isLoggedIn()).toBe(true);

      await deleteAccount('testuser', 'SecurePass123!');
      expect(isLoggedIn()).toBe(false);
    });

    it('should reject non-existent username', async () => {
      const result = await deleteAccount('nonexistent', 'password');
      expect(result.success).toBe(false);
    });
  });

  describe('verifyPasswordStrength', () => {
    it('should accept strong passwords', () => {
      const result = verifyPasswordStrength('SecurePass123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject passwords shorter than 8 characters', () => {
      const result = verifyPasswordStrength('Short1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject passwords without uppercase letters', () => {
      const result = verifyPasswordStrength('lowercase123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject passwords without lowercase letters', () => {
      const result = verifyPasswordStrength('UPPERCASE123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject passwords without numbers', () => {
      const result = verifyPasswordStrength('NoNumbers!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject passwords without special characters', () => {
      const result = verifyPasswordStrength('NoSpecial123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should provide multiple error messages for weak passwords', () => {
      const result = verifyPasswordStrength('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('Session Persistence', () => {
    it('should persist login state across operations', async () => {
      await createAccount('testuser', 'SecurePass123!');
      expect(isLoggedIn()).toBe(true);

      // Simulate some operations
      const user = getCurrentUser();
      expect(user?.username).toBe('testuser');
      expect(isLoggedIn()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle usernames with special characters', async () => {
      const result = await createAccount('user-123', 'SecurePass123!');
      expect(result.success).toBe(true);
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'VerySecurePassword123!' + 'x'.repeat(100);
      const result = await createAccount('testuser', longPassword);
      expect(result.success).toBe(true);
    });

    it('should handle concurrent account creation differently', async () => {
      const result1 = await createAccount('user1', 'SecurePass123!');
      const result2 = await createAccount('user2', 'SecurePass123!');
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(getAllUsers()).toHaveLength(2);
    });
  });
});
