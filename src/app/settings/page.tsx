'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Palette,
  Keyboard,
  ArrowLeft,
  User,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  defaultSettings,
  getSettings,
  saveSettings,
  applyProviderPreset,
  type ProviderPreset,
} from '@/lib/settings';
import {
  getCurrentUser,
  logout,
  changePassword,
  verifyPasswordStrength,
  deleteAccount,
} from '@/lib/user-account';

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState(defaultSettings);
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // User account state
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getCurrentUser>>(null);

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const loadedSettings = await getSettings();
    setSettings(loadedSettings);
    setCurrentUser(getCurrentUser());
  };

  const handlePresetChange = (preset: ProviderPreset) => {
    const presetConfig = applyProviderPreset(preset);
    setSettings({
      ...settings,
      provider: { ...settings.provider, ...presetConfig },
    });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestStatus('idle');

    try {
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings.provider),
      });

      if (response.ok) {
        setTestStatus('success');
        toast.success('Connection successful!', {
          description: 'Your API credentials are working correctly.',
        });
      } else {
        const error = await response.json();
        setTestStatus('error');
        toast.error('Connection failed', {
          description: error.error || 'Please check your credentials and try again.',
        });
      }
    } catch {
      setTestStatus('error');
      toast.error('Connection failed', {
        description: 'Could not reach the API endpoint.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    await saveSettings(settings);
    toast.success('Settings saved', {
      description: 'Your preferences have been updated.',
    });
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    toast.info('Settings reset', {
      description: 'All settings have been restored to defaults.',
    });
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    const strengthCheck = verifyPasswordStrength(newPassword);
    if (!strengthCheck.valid) {
      toast.error('New password too weak', {
        description: strengthCheck.errors[0],
      });
      return;
    }

    setIsChangingPassword(true);
    const result = await changePassword(currentPassword, newPassword);

    if (result.success) {
      toast.success('Password changed successfully');
      setShowPasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error('Password change failed', {
        description: result.error,
      });
    }
    setIsChangingPassword(false);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    const passwordToDelete = prompt('Enter your password to delete your account:');
    if (!passwordToDelete) return;

    const confirmed = confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    if (!confirmed) return;

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

  const passwordStrength = newPassword ? verifyPasswordStrength(newPassword) : null;

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'medium':
        return 'text-amber-600 dark:text-amber-400';
      default:
        return 'text-red-600 dark:text-red-400';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-display font-semibold">Settings</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* User Account Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Account</h2>
              <p className="text-sm text-muted-foreground">
                Manage your local account
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-6">
            {currentUser ? (
              <>
                {/* User Info */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{currentUser.username}</p>
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(currentUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                  >
                    Change Password
                  </Button>
                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDeleteAccount}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    Delete Account
                  </Button>
                </div>

                {/* Password Change Form */}
                {showPasswordChange && (
                  <div className="pt-4 border-t border-border space-y-4">
                    <h3 className="text-sm font-medium">Change Password</h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                          id="current-password"
                          type="password"
                          placeholder="Enter current password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        {passwordStrength && newPassword && (
                          <p className={`text-xs ${getStrengthColor(passwordStrength.strength)}`}>
                            Password strength: {passwordStrength.strength}
                          </p>
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
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handlePasswordChange}
                          disabled={
                            isChangingPassword ||
                            !currentPassword ||
                            !newPassword ||
                            !confirmPassword ||
                            !passwordStrength?.valid ||
                            newPassword !== confirmPassword
                          }
                        >
                          {isChangingPassword ? 'Changing...' : 'Change Password'}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setShowPasswordChange(false);
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Not Signed In</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Sign in to access Claude Forge. Your account and data stay on your device.
                </p>
                <Button onClick={() => router.push('/auth?redirect=/settings')}>
                  Go to Sign In
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* AI Provider Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">AI Provider</h2>
              <p className="text-sm text-muted-foreground">
                Configure your Claude-compatible API endpoint
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-6">
            {/* Preset Selector */}
            <div className="space-y-2">
              <Label htmlFor="preset">Provider Preset</Label>
              <Select
                value={settings.provider.preset}
                onValueChange={(value) => handlePresetChange(value as ProviderPreset)}
              >
                <SelectTrigger id="preset">
                  <SelectValue placeholder="Select a preset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anthropic">Anthropic (Official)</SelectItem>
                  <SelectItem value="z-ai">Z.ai</SelectItem>
                  <SelectItem value="glm47">GLM-4.7</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Quick-fill common provider configurations
              </p>
            </div>

            {/* Base URL */}
            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                type="url"
                placeholder="https://api.anthropic.com"
                value={settings.provider.baseUrl}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    provider: { ...settings.provider, baseUrl: e.target.value },
                  })
                }
              />
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-ant-..."
                value={settings.provider.apiKey}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    provider: { ...settings.provider, apiKey: e.target.value },
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Your API key is stored locally on your device.
              </p>
            </div>

            {/* Model */}
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                placeholder="claude-3-5-sonnet-20241022"
                value={settings.provider.model}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    provider: { ...settings.provider, model: e.target.value },
                  })
                }
              />
            </div>

            {/* Test Connection */}
            <div className="flex items-center gap-4 pt-2">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing || !settings.provider.apiKey}
                className="w-full sm:w-auto"
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>
              {testStatus === 'success' && (
                <span className="flex items-center gap-2 text-sm text-success">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  Connected successfully
                </span>
              )}
              {testStatus === 'error' && (
                <span className="flex items-center gap-2 text-sm text-destructive">
                  <span className="w-2 h-2 rounded-full bg-destructive" />
                  Connection failed
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Appearance</h2>
              <p className="text-sm text-muted-foreground">
                Customize how Claude Forge looks
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-6">
            {/* Theme */}
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={settings.appearance.theme}
                onValueChange={(value: 'light' | 'dark' | 'system') =>
                  setSettings({
                    ...settings,
                    appearance: { ...settings.appearance, theme: value },
                  })
                }
              >
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <Label htmlFor="fontSize">Font Size</Label>
              <Select
                value={settings.appearance.fontSize}
                onValueChange={(value: 'sm' | 'md' | 'lg') =>
                  setSettings({
                    ...settings,
                    appearance: { ...settings.appearance, fontSize: value },
                  })
                }
              >
                <SelectTrigger id="fontSize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Keyboard Shortcuts */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Keyboard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
              <p className="text-sm text-muted-foreground">
                Power user commands
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ShortcutCombo keys={['⌘', '⏎']} action="Generate artifact" />
              <ShortcutCombo keys={['⌘', 'S']} action="Save artifact" />
              <ShortcutCombo keys={['⌘', 'H']} action="Open history" />
              <ShortcutCombo keys={['⌘', ',']} action="Open settings" />
              <ShortcutCombo keys={['Esc']} action="Close modal / cancel" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ShortcutCombo({ keys, action }: { keys: string[]; action: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <span className="text-sm">{action}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <kbd
            key={i}
            className="px-2 py-1 text-xs font-mono font-medium bg-background border border-border rounded min-w-[24px] text-center"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
