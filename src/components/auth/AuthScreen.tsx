'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  createAccount,
  login,
  logout,
  getCurrentUser,
  isLoggedIn,
  changePassword,
  verifyPasswordStrength,
  type PasswordStrengthResult,
} from '@/lib/user-account';

interface AuthScreenProps {
  redirectTo?: string;
}

export function AuthScreen({ redirectTo = '/' }: AuthScreenProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup' | 'manage'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthResult | null>(null);

  // For password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const currentUser = getCurrentUser();

  useEffect(() => {
    if (isLoggedIn() && currentUser) {
      setMode('manage');
    }
  }, [currentUser]);

  // Password strength indicator
  useEffect(() => {
    if (mode === 'signup' && newPassword) {
      setPasswordStrength(verifyPasswordStrength(newPassword));
    } else if (mode === 'signup' && password) {
      setPasswordStrength(verifyPasswordStrength(password));
    } else if (mode === 'manage' && newPassword) {
      setPasswordStrength(verifyPasswordStrength(newPassword));
    } else {
      setPasswordStrength(null);
    }
  }, [password, newPassword, mode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    const result = await login(username.trim(), password);

    if (result.success) {
      toast.success('Welcome back!', {
        description: `Logged in as ${result.username}`,
      });
      router.push(redirectTo);
    } else {
      toast.error('Login failed', {
        description: result.error,
      });
    }
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const strengthCheck = verifyPasswordStrength(password);
    if (!strengthCheck.valid) {
      toast.error('Password too weak', {
        description: strengthCheck.errors[0],
      });
      return;
    }

    setIsLoading(true);
    const result = await createAccount(username.trim(), password);

    if (result.success) {
      toast.success('Account created!', {
        description: `Welcome, ${result.username}!`,
      });
      router.push(redirectTo);
    } else {
      toast.error('Sign up failed', {
        description: result.error,
      });
    }
    setIsLoading(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    const strengthCheck = verifyPasswordStrength(newPassword);
    if (!strengthCheck.valid) {
      toast.error('Password too weak', {
        description: strengthCheck.errors[0],
      });
      return;
    }

    setIsLoading(true);
    const result = await changePassword(currentPassword, newPassword);

    if (result.success) {
      toast.success('Password changed!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error('Password change failed', {
        description: result.error,
      });
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    setMode('login');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleDeleteAccount = async () => {
    const passwordToDelete = prompt('Enter your password to delete your account:');
    if (!passwordToDelete) return;

    const confirmed = confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    if (!confirmed) return;

    const { deleteAccount } = await import('@/lib/user-account');
    const result = await deleteAccount(currentUser!.username, passwordToDelete);

    if (result.success) {
      toast.success('Account deleted');
      router.push('/');
    } else {
      toast.error('Deletion failed', {
        description: result.error,
      });
    }
  };

  // Password strength colors
  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800';
      case 'medium':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800';
      default:
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-semibold">Claude Forge</h1>
          <p className="text-muted-foreground mt-1">
            {mode === 'manage' ? 'Manage your account' : 'Sign in to continue'}
          </p>
        </div>

        {/* Mode Tabs */}
        {mode !== 'manage' && (
          <div className="flex gap-2 mb-6 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                mode === 'login'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="login-username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-12"
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="signup-username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-12"
                    autoComplete="username"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This will be visible only on your device
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {passwordStrength && password && (
                  <div className="flex items-center gap-2">
                    <div
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border ${getStrengthColor(passwordStrength.strength)}`}
                    >
                      {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                    </div>
                    {!passwordStrength.valid && (
                      <span className="text-xs text-muted-foreground">
                        {passwordStrength.errors[0]}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="signup-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-12"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-xs font-medium text-foreground">Password requirements:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <span className={password?.length >= 8 ? 'text-emerald-500' : ''}>•</span>
                    At least 8 characters
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={/[A-Z]/.test(password) ? 'text-emerald-500' : ''}>•</span>
                    One uppercase letter
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={/[a-z]/.test(password) ? 'text-emerald-500' : ''}>•</span>
                    One lowercase letter
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={/[0-9]/.test(password) ? 'text-emerald-500' : ''}>•</span>
                    One number
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-emerald-500' : ''}>•</span>
                    One special character
                  </li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full h-12"
                disabled={isLoading || !passwordStrength?.valid || password !== confirmPassword}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          )}

          {mode === 'manage' && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{currentUser?.username}</p>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(currentUser?.createdAt || 0).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Change Password Form */}
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <h3 className="text-sm font-medium">Change Password</h3>

                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pr-10 h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pr-10 h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordStrength && newPassword && (
                    <div className="flex items-center gap-2">
                      <div
                        className={`px-2 py-1 rounded-md text-xs font-medium border ${getStrengthColor(passwordStrength.strength)}`}
                      >
                        {passwordStrength.strength}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11"
                  />
                </div>

                <Button
                  type="submit"
                  variant="outline"
                  className="w-full"
                  disabled={isLoading || !currentPassword || !newPassword || !passwordStrength?.valid || newPassword !== confirmPassword}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Danger Zone */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleLogout} className="flex-1">
                    Sign Out
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDeleteAccount}
                    className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Back to home */}
        {mode !== 'manage' && (
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
