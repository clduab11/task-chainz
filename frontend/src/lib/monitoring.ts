import * as Sentry from '@sentry/react';

// Sentry configuration
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';

// Initialize Sentry
export const initMonitoring = () => {
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: import.meta.env.MODE,
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      integrations: [
        new Sentry.BrowserTracing({
          tracePropagationTargets: ['localhost', /^https:\/\/api\.taskchainz\.io/],
        }),
        new Sentry.Replay(),
      ],
      beforeSend(event, hint) {
        // Don't send events in development
        if (import.meta.env.DEV) {
          console.log('Sentry event (dev):', event);
          return null;
        }

        // Filter out known non-critical errors
        const error = hint.originalException as Error;
        if (error?.message?.includes('MetaMask')) {
          // User rejected transaction - not an error
          return null;
        }

        return event;
      },
    });
    console.log('Sentry monitoring initialized');
  }
};

// Set user context
export const setUser = (address: string) => {
  if (SENTRY_DSN) {
    Sentry.setUser({ id: address.toLowerCase() });
  }
};

// Clear user context
export const clearUser = () => {
  if (SENTRY_DSN) {
    Sentry.setUser(null);
  }
};

// Capture exceptions
export const captureException = (error: Error, context?: Record<string, any>) => {
  console.error('Error:', error);

  if (SENTRY_DSN) {
    Sentry.withScope(scope => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      Sentry.captureException(error);
    });
  }
};

// Capture messages
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  if (SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  }
};

// Add breadcrumb for debugging
export const addBreadcrumb = (message: string, category: string, data?: Record<string, any>) => {
  if (SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }
};

// Transaction performance tracking
export const startTransaction = (name: string, op: string) => {
  if (SENTRY_DSN) {
    return Sentry.startTransaction({ name, op });
  }
  return null;
};

// Custom error boundary wrapper
export const ErrorBoundary = Sentry.ErrorBoundary;

// Pre-defined monitoring helpers
export const monitoring = {
  // Web3 errors
  web3Error: (error: Error, context?: { method?: string; params?: any }) => {
    captureException(error, {
      category: 'web3',
      ...context,
    });
  },

  // API errors
  apiError: (error: Error, endpoint: string, status?: number) => {
    captureException(error, {
      category: 'api',
      endpoint,
      status,
    });
  },

  // Transaction errors
  transactionError: (error: Error, txHash?: string, method?: string) => {
    captureException(error, {
      category: 'transaction',
      txHash,
      method,
    });
  },

  // Performance marks
  markTaskCreation: () => {
    if (typeof performance !== 'undefined') {
      performance.mark('task-creation-start');
    }
  },

  measureTaskCreation: () => {
    if (typeof performance !== 'undefined') {
      performance.mark('task-creation-end');
      performance.measure('task-creation', 'task-creation-start', 'task-creation-end');
    }
  },
};
