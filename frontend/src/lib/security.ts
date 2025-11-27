import DOMPurify from 'dompurify';

/**
 * Security utilities for frontend protection
 */

// Sanitize HTML content to prevent XSS
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
};

// Sanitize text content (strip all HTML)
export const sanitizeText = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
};

// Validate Ethereum address
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Validate IPFS CID
export const isValidCID = (cid: string): boolean => {
  return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(cid) || /^bafy[a-z0-9]{55}$/.test(cid);
};

// Check for phishing indicators
export const checkPhishingWarnings = (text: string): string[] => {
  const warnings: string[] = [];
  const lowerText = text.toLowerCase();

  if (lowerText.includes('private key') || lowerText.includes('seed phrase') || lowerText.includes('mnemonic')) {
    warnings.push('Warning: Never share your private key or seed phrase');
  }

  if (lowerText.includes('send') && (lowerText.includes('eth') || lowerText.includes('matic') || lowerText.includes('token'))) {
    warnings.push('Warning: Be cautious of requests to send funds');
  }

  if (lowerText.match(/https?:\/\/[^\s]+/)) {
    warnings.push('Warning: This content contains external links - verify before clicking');
  }

  return warnings;
};

// Network security checks
export const SUPPORTED_CHAIN_IDS = {
  POLYGON_MAINNET: 137,
  POLYGON_MUMBAI: 80001,
  LOCALHOST: 31337,
};

export const isValidChainId = (chainId: number): boolean => {
  return Object.values(SUPPORTED_CHAIN_IDS).includes(chainId);
};

export const getNetworkName = (chainId: number): string => {
  switch (chainId) {
    case SUPPORTED_CHAIN_IDS.POLYGON_MAINNET:
      return 'Polygon Mainnet';
    case SUPPORTED_CHAIN_IDS.POLYGON_MUMBAI:
      return 'Polygon Mumbai';
    case SUPPORTED_CHAIN_IDS.LOCALHOST:
      return 'Local Development';
    default:
      return 'Unknown Network';
  }
};

// Rate limiting tracker
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limit: number;
  private windowMs: number;

  constructor(limit: number = 100, windowMs: number = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    // Remove old timestamps
    const validTimestamps = timestamps.filter(t => now - t < this.windowMs);

    if (validTimestamps.length >= this.limit) {
      return false;
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return true;
  }

  getRemainingRequests(key: string): number {
    const timestamps = this.requests.get(key) || [];
    const now = Date.now();
    const validTimestamps = timestamps.filter(t => now - t < this.windowMs);
    return Math.max(0, this.limit - validTimestamps.length);
  }
}

export const apiRateLimiter = new RateLimiter(100, 60000);

// Content Security Policy helper
export const getCSPMeta = (): string => {
  return `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://cdn.mxpnl.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https: ipfs.io;
    connect-src 'self' https://*.infura.io https://*.alchemy.com wss://*.infura.io wss://*.alchemy.com https://polygon-rpc.com https://rpc-mumbai.maticvigil.com https://api.thegraph.com https://ipfs.infura.io https://*.sentry.io https://api.mixpanel.com https://www.google-analytics.com;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s+/g, ' ').trim();
};

// Secure local storage wrapper
// Note: Never store sensitive data like private keys or secrets in localStorage
// This wrapper provides basic error handling only
export const secureStorage = {
  set: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Storage error:', e);
    }
  },

  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Storage error:', e);
      return null;
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Storage error:', e);
    }
  },
};
