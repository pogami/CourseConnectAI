/**
 * Test utility for simulating rate limit errors
 * Use this to test retry logic and user-friendly error messages
 */

/**
 * Simulate a 429 rate limit error for testing
 * Set TEST_RATE_LIMIT=true in your environment to enable
 */
export function shouldSimulateRateLimit(): boolean {
  return process.env.TEST_RATE_LIMIT === 'true';
}

/**
 * Get the attempt number for rate limit simulation
 * Returns attempt number (1-5), or 0 if should succeed
 */
export function getSimulatedRateLimitAttempt(): number {
  const maxAttempts = parseInt(process.env.TEST_RATE_LIMIT_ATTEMPTS || '3', 10);
  const currentAttempt = parseInt(process.env.TEST_RATE_LIMIT_CURRENT || '0', 10);
  
  if (currentAttempt < maxAttempts) {
    return currentAttempt + 1;
  }
  
  return 0; // Succeed after max attempts
}

/**
 * Simulate rate limit error in fetch calls
 */
export async function simulateRateLimitIfEnabled(): Promise<void> {
  if (!shouldSimulateRateLimit()) {
    return;
  }
  
  const attempt = getSimulatedRateLimitAttempt();
  if (attempt > 0) {
    // Simulate rate limit error
    const error = new Error(`Rate limit exceeded (429). Retrying automatically...`);
    (error as any).status = 429;
    (error as any).retryAfter = 2; // 2 seconds
    throw error;
  }
  
  // After max attempts, allow request to proceed
}


