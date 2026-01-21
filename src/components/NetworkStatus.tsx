'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { networkManager } from '@/lib/network-utils';

/**
 * Network status indicator component
 * Shows online/offline status and queued operations
 */
export function NetworkStatus() {
  const [status, setStatus] = useState(() => networkManager.getStatus());
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    // Subscribe to network status changes
    const unsubscribe = networkManager.subscribe((newStatus) => {
      setStatus(newStatus);
      setQueuedCount(networkManager.getQueuedOperations().length);
    });

    // Also update queued count periodically
    const interval = setInterval(() => {
      setQueuedCount(networkManager.getQueuedOperations().length);
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Don't show anything if online with no queued operations
  if (status.online && queuedCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 left-4 z-50 max-w-xs">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg border ${
          status.online
            ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
            : 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800'
        }`}
      >
        {status.online ? (
          <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : (
          <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        )}

        <div className="flex-1">
          <p className="text-sm font-medium">
            {status.online ? 'Back online' : 'You are offline'}
          </p>
          {queuedCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {queuedCount} operation{queuedCount > 1 ? 's' : ''} queued
            </p>
          )}
        </div>

        {queuedCount > 0 && (
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
        )}
      </div>

      {!status.online && (
        <div className="mt-2 p-2 bg-background rounded-lg shadow border text-xs text-muted-foreground">
          <p>Changes will be saved locally and synced when you reconnect.</p>
        </div>
      )}
    </div>
  );
}

/**
 * Collapsible network status banner for more detailed information
 */
export function NetworkBanner() {
  const [status, setStatus] = useState(() => networkManager.getStatus());
  const [queuedOps, setQueuedOps] = useState(() => networkManager.getQueuedOperations());
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const unsubscribe = networkManager.subscribe((newStatus) => {
      setStatus(newStatus);
      setQueuedOps(networkManager.getQueuedOperations());
    });

    // Update queued operations periodically
    const interval = setInterval(() => {
      setQueuedOps(networkManager.getQueuedOperations());
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Don't show if online and no queued operations
  if (status.online && queuedOps.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-border bg-muted/50">
      <div
        className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 text-sm">
          {status.online ? (
            <>
              <Wifi className="h-4 w-4 text-green-600" />
              <span className="text-green-700 dark:text-green-400 font-medium">
                Back online
              </span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-amber-600" />
              <span className="text-amber-700 dark:text-amber-400 font-medium">
                Offline mode
              </span>
            </>
          )}

          {queuedOps.length > 0 && (
            <span className="text-muted-foreground">
              — {queuedOps.length} queued operation{queuedOps.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {expanded ? 'Hide' : 'Details'}
        </button>
      </div>

      {expanded && (
        <div className="max-w-7xl mx-auto px-4 py-3 border-t border-border">
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">Status:</span>
              <span className={status.online ? 'text-green-600' : 'text-amber-600'}>
                {status.online ? 'Online' : 'Offline'}
              </span>
            </div>

            {status.effectiveType && (
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">Connection:</span>
                <span>{status.effectiveType.toUpperCase()}</span>
              </div>
            )}

            {queuedOps.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Queued Operations</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                  {queuedOps.map((op) => (
                    <li key={op.id}>
                      {op.options.method || 'POST'} {op.url}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    networkManager.clearQueue();
                    setQueuedOps([]);
                  }}
                  className="mt-2 text-xs text-destructive hover:underline"
                >
                  Clear queue
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
