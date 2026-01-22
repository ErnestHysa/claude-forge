/**
 * Network utilities for Claude Forge.
 * Handles offline detection, retry logic, and queued operations.
 * All client-side - no data leaves the device.
 */

import { withRetry, createError, ErrorCodes, logError } from './error-handling';

/**
 * Network Connection API interface
 */
interface NetworkConnection {
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
  rtt?: number;
  addEventListener?: (event: string, listener: () => void) => void;
}

/**
 * Extended navigator interface
 */
interface ExtendedNavigator extends Navigator {
  connection?: NetworkConnection;
}

/**
 * Network status
 */
export interface NetworkStatus {
  online: boolean;
  effectiveType?: string; // 'slow-2g', '2g', '3g', '4g'
  saveData?: boolean;
  downlink?: number;
  rtt?: number;
}

/**
 * Queued operation for offline mode
 */
export interface QueuedOperation {
  id: string;
  url: string;
  options: RequestInit;
  timestamp: Date;
  retries: number;
}

/**
 * Network state manager
 */
class NetworkManager {
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private currentStatus: NetworkStatus = { online: true };
  private operationQueue: QueuedOperation[] = [];
  private isProcessingQueue = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    // Initial status check
    this.updateStatus();

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.updateStatus();
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.updateStatus();
    });

    // Listen for network information changes (if available)
    const extendedNavigator = navigator as ExtendedNavigator;
    if (extendedNavigator.connection) {
      extendedNavigator.connection.addEventListener?.('change', () => this.updateStatus());
    }
  }

  private updateStatus() {
    const wasOffline = !this.currentStatus.online;
    const extendedNavigator = navigator as ExtendedNavigator;

    this.currentStatus = {
      online: navigator.onLine,
      effectiveType: extendedNavigator.connection?.effectiveType,
      saveData: extendedNavigator.connection?.saveData,
      downlink: extendedNavigator.connection?.downlink,
      rtt: extendedNavigator.connection?.rtt,
    };

    // Notify listeners
    this.notifyListeners();

    // Log status change
    if (wasOffline && this.currentStatus.online) {
      console.info('[Network] Back online');
    } else if (!wasOffline && !this.currentStatus.online) {
      console.warn('[Network] Gone offline');
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentStatus);
      } catch (err) {
        console.error('[Network] Listener error:', err);
      }
    });
  }

  /**
   * Subscribe to network status changes
   */
  subscribe(callback: (status: NetworkStatus) => void): () => void {
    this.listeners.add(callback);
    // Immediately call with current status
    callback(this.currentStatus);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.currentStatus.online;
  }

  /**
   * Add an operation to the queue (for offline mode)
   */
  queueOperation(url: string, options: RequestInit): string {
    const id = `queued-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const operation: QueuedOperation = {
      id,
      url,
      options,
      timestamp: new Date(),
      retries: 0,
    };

    this.operationQueue.push(operation);
    console.info('[Network] Operation queued:', id);

    return id;
  }

  /**
   * Remove an operation from the queue
   */
  dequeueOperation(id: string): void {
    this.operationQueue = this.operationQueue.filter((op) => op.id !== id);
  }

  /**
   * Get queued operations
   */
  getQueuedOperations(): QueuedOperation[] {
    return [...this.operationQueue];
  }

  /**
   * Clear all queued operations
   */
  clearQueue(): void {
    this.operationQueue = [];
  }

  /**
   * Process queued operations when back online
   */
  private async processQueue() {
    if (!this.currentStatus.online || this.operationQueue.length === 0) {
      return;
    }

    if (this.isProcessingQueue) {
      return;
    }

    this.isProcessingQueue = true;
    console.info('[Network] Processing queue:', this.operationQueue.length, 'operations');

    const operations = [...this.operationQueue];
    this.operationQueue = [];

    for (const operation of operations) {
      try {
        await resilientFetch(operation.url, operation.options, { maxAttempts: 1 });
        console.info('[Network] Queued operation succeeded:', operation.id);
      } catch (err) {
        console.error('[Network] Queued operation failed:', operation.id, err);
        // Re-queue if failed
        this.operationQueue.push(operation);
      }
    }

    this.isProcessingQueue = false;
  }
}

// Global instance
export const networkManager = new NetworkManager();

/**
 * React hook for network status
 * Note: This file is marked as 'use client' safe
 */
export function useNetworkStatus(): NetworkStatus {
  // Use standard React import
  const React = require('react');

  const [status, setStatus] = React.useState(() => networkManager.getStatus());

  React.useEffect(() => {
    return networkManager.subscribe((newStatus) => {
      setStatus(newStatus);
    });
  }, []);

  return status;
}

/**
 * Resilient fetch with retry logic and offline handling
 */
export async function resilientFetch<T = unknown>(
  url: string,
  options: RequestInit = {},
  config: {
    maxAttempts?: number;
    delayMs?: number;
    timeoutMs?: number;
    queueOffline?: boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    timeoutMs = 30000,
    queueOffline = true,
  } = config;

  // Check if offline
  if (!networkManager.isOnline()) {
    if (queueOffline && options.method === 'POST') {
      const id = networkManager.queueOperation(url, options);
      throw createError(
        'You are offline. The operation has been queued and will retry when you reconnect.',
        ErrorCodes.NETWORK_OFFLINE
      );
    }
    throw createError(
      'You are offline. Please check your internet connection.',
      ErrorCodes.NETWORK_OFFLINE
    );
  }

  // Add timeout to the fetch
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await withRetry(
      async () => {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        if (!response.ok) {
          const error = createError(
            `HTTP ${response.status}: ${response.statusText}`,
            ErrorCodes.NETWORK_FAILED
          ) as Error & { dontRetry?: boolean };

          // Don't retry client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            error.dontRetry = true;
          }

          throw error;
        }

        // Try to parse as JSON
        const text = await response.text();
        try {
          return JSON.parse(text) as T;
        } catch {
          return text as unknown as T;
        }
      },
      {
        maxAttempts,
        delayMs,
        onRetry: (attempt, error) => {
          logError(error, 'Network retry');
          // Don't retry if marked
          if ((error as Error & { dontRetry?: boolean }).dontRetry) {
            throw error;
          }
        },
      }
    );

    return result;
  } catch (error) {
    // Handle timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw createError('Request timed out. Please try again.', ErrorCodes.NETWORK_TIMEOUT);
    }

    // Handle offline during request
    if (!networkManager.isOnline() && queueOffline && options.method === 'POST') {
      networkManager.queueOperation(url, options);
      throw createError(
        'Connection lost. The operation has been queued.',
        ErrorCodes.NETWORK_OFFLINE
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Check if the network is slow
 */
export function isSlowConnection(): boolean {
  const status = networkManager.getStatus();
  if (!status.online) return true;

  // Consider slow if: saveData mode, slow-2g, 2g, or high RTT
  return !!(
    status.saveData ||
    status.effectiveType === 'slow-2g' ||
    status.effectiveType === '2g' ||
    (status.rtt && status.rtt > 500)
  );
}

/**
 * Get appropriate timeout based on connection quality
 */
export function getAdaptiveTimeout(defaultTimeout: number): number {
  if (isSlowConnection()) {
    return defaultTimeout * 2; // Double timeout for slow connections
  }
  return defaultTimeout;
}
