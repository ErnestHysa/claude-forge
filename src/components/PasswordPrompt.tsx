'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getCurrentUser } from '@/lib/user-account';

interface PasswordPromptProps {
  /** Callback invoked when user successfully signs in */
  onSignIn?: () => void;
}

export function PasswordPrompt({ onSignIn }: PasswordPromptProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(() => {
    // Initialize state based on auth status during render
    const user = getCurrentUser();
    return !user;
  });

  const handleGoToLogin = () => {
    setIsOpen(false);
    onSignIn?.();
    router.push('/auth?redirect=' + encodeURIComponent(window.location.pathname));
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
              <DialogTitle>Sign In Required</DialogTitle>
              <DialogDescription>
                Please sign in to continue using Claude Forge
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Claude Forge requires you to sign in with a local account. Your account and data stay on your device.
          </p>

          <Button onClick={handleGoToLogin} className="w-full">
            Go to Sign In
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Don&apos;t have an account? You&apos;ll be able to create one on the sign-in page.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * HOC that wraps a component to require authentication
 */
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
      const checkAuth = () => {
        const user = getCurrentUser();
        if (user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          router.push('/auth?redirect=' + encodeURIComponent(window.location.pathname));
        }
        setIsChecking(false);
      };

      checkAuth();
    }, [router]);

    if (isChecking) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}
