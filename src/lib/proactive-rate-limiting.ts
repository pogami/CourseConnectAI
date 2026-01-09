/**
 * Proactive Rate Limiting Strategies
 * Prevents rate limits by managing requests before they hit the API
 */

interface RequestCache {
  key: string;
  response: any;
  timestamp: number;
  expiresAt: number;
}

class ProactiveRateLimiter {
  private requestCache: Map<string, RequestCache> = new Map();
  private userRequestCounts: Map<string, { count: number; resetAt: number }> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  
  // Cache settings
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  // Per-user rate limits (prevent one user from exhausting quota)
  private readonly MAX_REQUESTS_PER_USER_PER_MINUTE = 20;
  private readonly MAX_REQUESTS_PER_USER_PER_5_MINUTES = 50;

  /**
   * Check if we should allow this request based on user limits
   */
  checkUserRateLimit(userId: string): { allowed: boolean; waitTime?: number } {
    const now = Date.now();
    const userKey = userId || 'anonymous';
    
    // Get or create user tracking
    let userStats = this.userRequestCounts.get(userKey);
    if (!userStats || now > userStats.resetAt) {
      userStats = { count: 0, resetAt: now + 60000 }; // Reset every minute
      this.userRequestCounts.set(userKey, userStats);
    }

    // Check per-minute limit
    if (userStats.count >= this.MAX_REQUESTS_PER_USER_PER_MINUTE) {
      const waitTime = userStats.resetAt - now;
      return { allowed: false, waitTime: Math.max(0, waitTime) };
    }

    // Increment counter
    userStats.count++;
    return { allowed: true };
  }

  /**
   * Check cache for similar requests
   */
  getCachedResponse(cacheKey: string): any | null {
    const cached = this.requestCache.get(cacheKey);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.expiresAt) {
      this.requestCache.delete(cacheKey);
      return null;
    }

    return cached.response;
  }

  /**
   * Cache a response
   */
  cacheResponse(cacheKey: string, response: any): void {
    this.requestCache.set(cacheKey, {
      key: cacheKey,
      response,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_TTL
    });

    // Clean up old cache entries (keep cache size manageable)
    if (this.requestCache.size > 100) {
      const now = Date.now();
      for (const [key, entry] of this.requestCache.entries()) {
        if (now > entry.expiresAt) {
          this.requestCache.delete(key);
        }
      }
    }
  }

  /**
   * Deduplicate identical pending requests
   */
  async deduplicateRequest<T>(
    requestKey: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Check if same request is already pending
    const pending = this.pendingRequests.get(requestKey);
    if (pending) {
      return pending;
    }

    // Create new request
    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(requestKey);
    });

    this.pendingRequests.set(requestKey, promise);
    return promise;
  }

  /**
   * Generate cache key from request
   */
  generateCacheKey(question: string, context?: string): string {
    // Normalize: lowercase, trim, remove extra spaces
    const normalized = question.toLowerCase().trim().replace(/\s+/g, ' ');
    const contextHash = context ? context.substring(0, 50) : '';
    return `${normalized}:${contextHash}`;
  }

  /**
   * Clean up old data
   */
  cleanup(): void {
    const now = Date.now();
    
    // Clean expired cache
    for (const [key, entry] of this.requestCache.entries()) {
      if (now > entry.expiresAt) {
        this.requestCache.delete(key);
      }
    }

    // Clean expired user stats
    for (const [key, stats] of this.userRequestCounts.entries()) {
      if (now > stats.resetAt) {
        this.userRequestCounts.delete(key);
      }
    }
  }
}

// Global instance
export const proactiveRateLimiter = new ProactiveRateLimiter();

// Cleanup every 5 minutes (only in Node.js runtime, not Edge)
// Edge runtime doesn't support long-running intervals
if (typeof process !== 'undefined' && process.env.NEXT_RUNTIME !== 'edge') {
  if (typeof setInterval !== 'undefined') {
    setInterval(() => {
      proactiveRateLimiter.cleanup();
    }, 5 * 60 * 1000);
  }
}

/**
 * Debounce function - wait for user to stop typing
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - limit how often function can be called
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

