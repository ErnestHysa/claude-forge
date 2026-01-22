/**
 * User Account System Types
 */

export interface UserAccount {
  username: string;
  passwordHash: string;
  createdAt: number;
  lastLogin?: number;
}

export interface UserSession {
  username: string;
  loginTime: number;
}

export interface AuthResult {
  success: boolean;
  username?: string;
  error?: string;
}

export interface PasswordStrengthResult {
  valid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  errors: string[];
}

// Storage keys
export const USERS_STORAGE_KEY = 'claude-forge-users';
export const SESSION_STORAGE_KEY = 'claude-forge-session';
