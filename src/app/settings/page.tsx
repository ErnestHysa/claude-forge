'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, ShieldCheck, Palette, Keyboard, ArrowLeft, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  defaultSettings,
  getSettings,
  saveSettings,
  applyProviderPreset,
  providerPresets,
  type ProviderPreset,
  isEncryptionEnabled,
  setupPassword,
  verifyPassword,
  changePassword,
  removePassword,
  getPasswordState,
  getPasswordHint,
} from '@/lib/settings';
import {
  estimatePasswordStrength,
  getPasswordStrengthColor,
  validatePassword,
  type PasswordValidation,
} from '@/lib/encryption';

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState(defaultSettings);
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Password / Security state
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showSavePasswordPrompt, setShowSavePasswordPrompt] = useState(false);
  const [savePassword, setSavePassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordHint, setPasswordHint] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    isValid: true,
    errors: [],
  });
  const [passwordState, setPasswordState] = useState(getPasswordState());

  useEffect(() => {
    setSettings(getSettings());
    setPasswordState(getPasswordState());
    if (getPasswordHint()) {
      setPasswordHint(getPasswordHint() || '');
    }
  }, []);

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
    // If encryption is enabled and API key is present, need password to save
    if (isEncryptionEnabled() && settings.provider.apiKey) {
      setShowSavePasswordPrompt(true);
      return;
    }

    // No encryption or no API key - save directly
    saveSettings(settings);
    toast.success('Settings saved', {
      description: 'Your preferences have been updated.',
    });
  };

  const handleSaveWithPassword = async () => {
    // Verify the password first
    const isValid = await verifyPassword(savePassword);
    if (!isValid) {
      toast.error('Incorrect password');
      return;
    }

    saveSettings(settings, savePassword);
    toast.success('Settings saved', {
      description: 'Your API key is encrypted and your preferences have been updated.',
    });
    setShowSavePasswordPrompt(false);
    setSavePassword('');
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    toast.info('Settings reset', {
      description: 'All settings have been restored to defaults.',
    });
  };

  // Password strength indicator update
  useEffect(() => {
    if (newPassword) {
      setPasswordValidation(validatePassword(newPassword));
    }
  }, [newPassword]);

  // Handle password setup
  const handleSetupPassword = async () => {
    if (!newPassword) {
      toast.error('Password is required');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      toast.error('Password does not meet requirements', {
        description: validation.errors.join('. '),
      });
      return;
    }

    setIsSavingPassword(true);
    const result = await setupPassword(newPassword, passwordHint || undefined);

    if (result.success) {
      toast.success('Password set successfully', {
        description: 'Your API key is now encrypted.',
      });
      setShowPasswordSetup(false);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordHint('');
      setPasswordState(getPasswordState());
    } else {
      toast.error('Failed to set password', {
        description: result.error,
      });
    }
    setIsSavingPassword(false);
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      toast.error('New password does not meet requirements', {
        description: validation.errors.join('. '),
      });
      return;
    }

    setIsSavingPassword(true);
    const result = await changePassword(
      oldPassword,
      newPassword,
      passwordHint || undefined
    );

    if (result.success) {
      toast.success('Password changed successfully');
      setShowPasswordChange(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordHint('');
    } else {
      toast.error('Failed to change password', {
        description: result.error,
      });
    }
    setIsSavingPassword(false);
  };

  // Handle password removal
  const handleRemovePassword = () => {
    if (confirm('Are you sure? This will decrypt your API key and store it in plain text.')) {
      removePassword();
      toast.success('Password removed', {
        description: 'Your API key is no longer encrypted.',
      });
      setPasswordState(getPasswordState());
    }
  };

  const passwordStrength = estimatePasswordStrength(newPassword);

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
                Your API key is stored locally and never sent anywhere except the configured
                endpoint.
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

        {/* Security Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Security</h2>
              <p className="text-sm text-muted-foreground">
                Encrypt your API key for secure local storage
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-6">
            {/* Security Status */}
            {!passwordState.isSet ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      API Key Not Encrypted
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                      Your API key is stored in plain text. Set a password to encrypt it locally
                      using AES-256 encryption.
                    </p>
                  </div>
                </div>

                {!showPasswordSetup ? (
                  <Button onClick={() => setShowPasswordSetup(true)}>
                    <Lock className="h-4 w-4 mr-2" />
                    Set Up Encryption
                  </Button>
                ) : (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter a strong password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {newPassword && (
                        <div className="flex items-center gap-2 text-xs">
                          <span>Strength:</span>
                          <span className={getPasswordStrengthColor(passwordStrength)}>
                            {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                          </span>
                        </div>
                      )}
                      {passwordValidation.errors.length > 0 && (
                        <ul className="text-xs text-destructive space-y-1">
                          {passwordValidation.errors.map((error, i) => (
                            <li key={i}>• {error}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passwordHint">Password Hint (Optional)</Label>
                      <Input
                        id="passwordHint"
                        placeholder="e.g., My favorite childhood pet"
                        value={passwordHint}
                        onChange={(e) => setPasswordHint(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        A hint to help you remember your password if you forget it
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleSetupPassword} disabled={isSavingPassword}>
                        {isSavingPassword ? 'Setting up...' : 'Set Password'}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowPasswordSetup(false);
                          setNewPassword('');
                          setConfirmPassword('');
                          setPasswordHint('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <Lock className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Encryption Enabled
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Your API key is encrypted and protected by your password
                    </p>
                  </div>
                </div>

                {passwordState.hasHint && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Hint:</span> {getPasswordHint()}
                  </div>
                )}

                {!showPasswordChange ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowPasswordChange(true)}
                    >
                      Change Password
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRemovePassword}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove Encryption
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 pt-2 border-t border-border">
                    <div className="space-y-2">
                      <Label htmlFor="oldPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="oldPassword"
                          type={showOldPassword ? 'text' : 'password'}
                          placeholder="Enter your current password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPasswordChange">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPasswordChange"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter a new strong password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {newPassword && (
                        <div className="flex items-center gap-2 text-xs">
                          <span>Strength:</span>
                          <span className={getPasswordStrengthColor(passwordStrength)}>
                            {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPasswordChange">Confirm New Password</Label>
                      <Input
                        id="confirmPasswordChange"
                        type="password"
                        placeholder="Confirm your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passwordHintChange">New Password Hint (Optional)</Label>
                      <Input
                        id="passwordHintChange"
                        placeholder="e.g., My favorite childhood pet"
                        value={passwordHint}
                        onChange={(e) => setPasswordHint(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleChangePassword} disabled={isSavingPassword}>
                        {isSavingPassword ? 'Changing...' : 'Change Password'}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowPasswordChange(false);
                          setOldPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                          setPasswordHint('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
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
