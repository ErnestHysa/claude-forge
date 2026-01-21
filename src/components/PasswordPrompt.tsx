'use client';

import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  isEncryptionEnabled,
  verifyPassword,
  getPasswordHint,
} from '@/lib/settings';
import { toast } from 'sonner';

interface PasswordPromptProps {
  onSuccess: (password: string) => void;
}

export function PasswordPrompt({ onSuccess }: PasswordPromptProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    // Check if encryption is enabled on mount
    const encryptionEnabled = isEncryptionEnabled();
    if (encryptionEnabled) {
      setHint(getPasswordHint());
      setIsOpen(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsVerifying(true);
    setError('');

    const isValid = await verifyPassword(password);

    if (isValid) {
      setIsOpen(false);
      onSuccess(password);
      toast.success('Vault unlocked', {
        description: 'Your API key is now accessible',
      });
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
      setIsVerifying(false);
    }
  };

  const handleForgotPassword = () => {
    toast.info('Password hint', {
      description: hint || 'No hint set. You may need to clear your data and start over.',
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Unlock API Key</DialogTitle>
              <DialogDescription>
                Enter your password to decrypt your API key
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="unlock-password">Password</Label>
            <div className="relative">
              <Input
                id="unlock-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          {hint && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Forgot your password?</span>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-sm"
                onClick={handleForgotPassword}
              >
                Show hint
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isVerifying || !password} className="flex-1">
              {isVerifying ? 'Verifying...' : 'Unlock'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
