/**
 * User Account System
 *
 * A simple client-side user account system using localStorage.
 * All data stays on the client - nothing is sent to any server.
 *
 * Features:
 * - Account creation with username/password
 * - Login with credentials
 * - Session management
 * - Password strength validation
 * - Multiple accounts support
 */

import type {
  UserAccount,
  UserSession,
  AuthResult,
  PasswordStrengthResult,
} from './user-account-types';

// Re-export for convenience
export type { PasswordStrengthResult };

import {
  USERS_STORAGE_KEY,
  SESSION_STORAGE_KEY,
} from './user-account-types';

/**
 * Hash a password using SHA-256
 * Exported for use by settings module
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get all users from localStorage
 */
function getAllUsersRaw(): UserAccount[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as UserAccount[];
  } catch {
    return [];
  }
}

/**
 * Save users to localStorage
 */
function saveUsers(users: UserAccount[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {
    // Storage might be full or unavailable
  }
}

/**
 * Get current session from sessionStorage
 */
function getSession(): UserSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as UserSession;
  } catch {
    return null;
  }
}

/**
 * Save session to sessionStorage
 */
function saveSession(session: UserSession): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // SessionStorage might be unavailable
  }
}

/**
 * Clear session from sessionStorage
 */
function clearSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Verify password strength
 */
export function verifyPasswordStrength(password: string): PasswordStrengthResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  const valid = errors.length === 0;

  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (valid && password.length >= 12) {
    strength = 'strong';
  } else if (valid || errors.length <= 2) {
    strength = 'medium';
  }

  return { valid, strength, errors };
}

/**
 * Create a new account
 */
export async function createAccount(
  username: string,
  password: string
): Promise<AuthResult> {
  // Validate username
  if (!username || username.trim().length === 0) {
    return { success: false, error: 'Username is required' };
  }

  const normalizedUsername = username.trim();

  // Check for duplicate username
  const users = getAllUsersRaw();
  if (users.some((u) => u.username === normalizedUsername)) {
    return { success: false, error: 'Username already exists' };
  }

  // Validate password strength
  const passwordCheck = verifyPasswordStrength(password);
  if (!passwordCheck.valid) {
    return { success: false, error: `Password requirements not met: ${passwordCheck.errors.join(', ')}` };
  }

  // Create account
  const passwordHash = await hashPassword(password);
  const newUser: UserAccount = {
    username: normalizedUsername,
    passwordHash,
    createdAt: Date.now(),
  };

  users.push(newUser);
  saveUsers(users);

  // Auto-login after account creation
  saveSession({
    username: normalizedUsername,
    loginTime: Date.now(),
  });

  // Store encryption key in sessionStorage (derived from password hash)
  const encryptionKey = passwordHash.substring(0, 32);
  try {
    sessionStorage.setItem('claude-forge-encryption-key', encryptionKey);
  } catch {
    // SessionStorage might not be available
  }

  return { success: true, username: normalizedUsername };
}

/**
 * Login with username and password
 */
export async function login(username: string, password: string): Promise<AuthResult> {
  // Validate inputs
  if (!username || !password) {
    return { success: false, error: 'Username and password are required' };
  }

  const normalizedUsername = username.trim();
  const users = getAllUsersRaw();
  const user = users.find((u) => u.username === normalizedUsername);

  if (!user) {
    return { success: false, error: 'Username not found' };
  }

  // Verify password
  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.passwordHash) {
    return { success: false, error: 'Incorrect password' };
  }

  // Update last login
  user.lastLogin = Date.now();
  saveUsers(users);

  // Create session
  saveSession({
    username: normalizedUsername,
    loginTime: Date.now(),
  });

  // Store encryption key in sessionStorage (derived from password hash)
  // This is used to encrypt/decrypt the API key
  const encryptionKey = passwordHash.substring(0, 32);
  try {
    sessionStorage.setItem('claude-forge-encryption-key', encryptionKey);
  } catch {
    // SessionStorage might not be available
  }

  return { success: true, username: normalizedUsername };
}

/**
 * Logout current user
 */
export function logout(): void {
  clearSession();
  // Also clear encryption key
  try {
    sessionStorage.removeItem('claude-forge-encryption-key');
  } catch {
    // SessionStorage might not be available
  }
}

/**
 * Get current logged in user (without password hash)
 */
export function getCurrentUser(): { username: string; createdAt: number; lastLogin?: number } | null {
  const session = getSession();
  if (!session) return null;

  const users = getAllUsersRaw();
  const user = users.find((u) => u.username === session.username);

  if (!user) {
    // Session exists but user doesn't - clear invalid session
    clearSession();
    return null;
  }

  // Return user without password hash
  return {
    username: user.username,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  };
}

/**
 * Check if a user is currently logged in
 */
export function isLoggedIn(): boolean {
  return getSession() !== null;
}

/**
 * Get all users (without password hashes)
 */
export function getAllUsers(): Array<{ username: string; createdAt: number; lastLogin?: number }> {
  const users = getAllUsersRaw();
  return users.map((u) => ({
    username: u.username,
    createdAt: u.createdAt,
    lastLogin: u.lastLogin,
  }));
}

/**
 * Delete an account
 */
export async function deleteAccount(username: string, password: string): Promise<AuthResult> {
  const users = getAllUsersRaw();
  const userIndex = users.findIndex((u) => u.username === username);

  if (userIndex === -1) {
    return { success: false, error: 'Username not found' };
  }

  const user = users[userIndex];

  // Verify password
  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.passwordHash) {
    return { success: false, error: 'Incorrect password' };
  }

  // Check if deleting current user
  const session = getSession();
  const isCurrentUser = session?.username === username;

  // Remove user
  users.splice(userIndex, 1);
  saveUsers(users);

  // Logout if deleting current account
  if (isCurrentUser) {
    clearSession();
  }

  return { success: true, username };
}

/**
 * Change password for current user
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<AuthResult> {
  const session = getSession();
  if (!session) {
    return { success: false, error: 'Not logged in' };
  }

  const users = getAllUsersRaw();
  const user = users.find((u) => u.username === session.username);

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // Verify current password
  const currentHash = await hashPassword(currentPassword);
  if (currentHash !== user.passwordHash) {
    return { success: false, error: 'Current password is incorrect' };
  }

  // Validate new password
  const passwordCheck = verifyPasswordStrength(newPassword);
  if (!passwordCheck.valid) {
    return { success: false, error: `Password requirements not met: ${passwordCheck.errors.join(', ')}` };
  }

  // Update password
  user.passwordHash = await hashPassword(newPassword);
  saveUsers(users);

  return { success: true, username: session.username };
}
