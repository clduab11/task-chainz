import ReactGA from 'react-ga4';

// Analytics configuration
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN || '';

// Initialize analytics
export const initAnalytics = () => {
  // Google Analytics 4
  if (GA_MEASUREMENT_ID) {
    ReactGA.initialize(GA_MEASUREMENT_ID);
    console.log('Google Analytics initialized');
  }

  // Mixpanel
  if (MIXPANEL_TOKEN && typeof window !== 'undefined') {
    import('mixpanel-browser').then(mixpanel => {
      mixpanel.default.init(MIXPANEL_TOKEN, {
        track_pageview: true,
        persistence: 'localStorage',
      });
      console.log('Mixpanel initialized');
    });
  }
};

// Track page views
export const trackPageView = (path: string) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.send({ hitType: 'pageview', page: path });
  }
};

// Custom events
export const trackEvent = (category: string, action: string, label?: string, value?: number) => {
  // GA4
  if (GA_MEASUREMENT_ID) {
    ReactGA.event({
      category,
      action,
      label,
      value,
    });
  }

  // Mixpanel
  if (MIXPANEL_TOKEN && typeof window !== 'undefined') {
    import('mixpanel-browser').then(mixpanel => {
      mixpanel.default.track(action, {
        category,
        label,
        value,
      });
    });
  }
};

// User identification
export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  // GA4
  if (GA_MEASUREMENT_ID) {
    ReactGA.set({ userId });
  }

  // Mixpanel
  if (MIXPANEL_TOKEN && typeof window !== 'undefined') {
    import('mixpanel-browser').then(mixpanel => {
      mixpanel.default.identify(userId);
      if (traits) {
        mixpanel.default.people.set(traits);
      }
    });
  }
};

// Pre-defined events for Task Chainz
export const analytics = {
  // Wallet events
  walletConnected: (address: string, chainId: number) => {
    trackEvent('Wallet', 'connected', address, chainId);
    identifyUser(address.toLowerCase());
  },

  walletDisconnected: (address: string) => {
    trackEvent('Wallet', 'disconnected', address);
  },

  networkSwitched: (chainId: number) => {
    trackEvent('Network', 'switched', String(chainId), chainId);
  },

  // Task events
  taskCreated: (taskId: number, bounty: number, category: string) => {
    trackEvent('Task', 'created', category, bounty);
  },

  taskApplied: (taskId: number) => {
    trackEvent('Task', 'applied', String(taskId));
  },

  taskAssigned: (taskId: number) => {
    trackEvent('Task', 'assigned', String(taskId));
  },

  taskSubmitted: (taskId: number) => {
    trackEvent('Task', 'submitted', String(taskId));
  },

  taskCompleted: (taskId: number, bounty: number) => {
    trackEvent('Task', 'completed', String(taskId), bounty);
  },

  taskCancelled: (taskId: number) => {
    trackEvent('Task', 'cancelled', String(taskId));
  },

  // DAO events
  proposalCreated: (proposalId: string) => {
    trackEvent('DAO', 'proposal_created', proposalId);
  },

  voteCast: (proposalId: string, support: boolean) => {
    trackEvent('DAO', 'vote_cast', proposalId, support ? 1 : 0);
  },

  // Gamification events
  achievementUnlocked: (achievementId: string) => {
    trackEvent('Gamification', 'achievement_unlocked', achievementId);
  },

  streakUpdated: (streakDays: number) => {
    trackEvent('Gamification', 'streak_updated', String(streakDays), streakDays);
  },

  challengeJoined: (challengeId: number) => {
    trackEvent('Gamification', 'challenge_joined', String(challengeId));
  },

  // Errors
  errorOccurred: (errorType: string, errorMessage: string) => {
    trackEvent('Error', errorType, errorMessage);
  },

  // Conversion funnel
  tutorialStarted: () => {
    trackEvent('Onboarding', 'tutorial_started');
  },

  tutorialCompleted: () => {
    trackEvent('Onboarding', 'tutorial_completed');
  },

  tutorialSkipped: (step: number) => {
    trackEvent('Onboarding', 'tutorial_skipped', String(step), step);
  },
};
