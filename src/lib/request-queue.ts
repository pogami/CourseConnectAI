/**
 * Request Queue and Throttling System
 * Prevents overwhelming the API with too many simultaneous requests
 */

interface QueuedRequest<T> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  timestamp: number;
}

class RequestQueue {
  private queue: QueuedRequest<any>[] = [];
  private processing = false;
  private readonly maxRequestsPerSecond: number;
  private readonly maxConcurrentRequests: number;
  private activeRequests = 0;
  private requestTimestamps: number[] = [];

  constructor(
    maxRequestsPerSecond: number = 10,
    maxConcurrentRequests: number = 5
  ) {
    this.maxRequestsPerSecond = maxRequestsPerSecond;
    this.maxConcurrentRequests = maxConcurrentRequests;
  }

  /**
   * Add a request to the queue
   */
  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        fn,
        resolve,
        reject,
        timestamp: Date.now()
      });

      this.processQueue();
    });
  }

  /**
   * Process the queue with rate limiting
   */
  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      // Check if we can make more requests
      if (this.activeRequests >= this.maxConcurrentRequests) {
        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      // Check rate limit (requests per second)
      const now = Date.now();
      this.requestTimestamps = this.requestTimestamps.filter(
        ts => now - ts < 1000
      );

      if (this.requestTimestamps.length >= this.maxRequestsPerSecond) {
        // Wait until we can make another request
        const oldestRequest = this.requestTimestamps[0];
        const waitTime = 1000 - (now - oldestRequest) + 50; // Add 50ms buffer
        await new Promise(resolve => setTimeout(resolve, Math.max(0, waitTime)));
        continue;
      }

      // Process next request
      const request = this.queue.shift();
      if (!request) break;

      this.activeRequests++;
      this.requestTimestamps.push(Date.now());

      // Execute request
      request.fn()
        .then(result => {
          this.activeRequests--;
          request.resolve(result);
          this.processQueue(); // Continue processing
        })
        .catch(error => {
          this.activeRequests--;
          request.reject(error);
          this.processQueue(); // Continue processing
        });
    }

    this.processing = false;
  }

  /**
   * Get current queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      maxConcurrent: this.maxConcurrentRequests,
      requestsInLastSecond: this.requestTimestamps.length,
      maxPerSecond: this.maxRequestsPerSecond
    };
  }

  /**
   * Clear the queue
   */
  clear() {
    this.queue.forEach(req => {
      req.reject(new Error('Request queue cleared'));
    });
    this.queue = [];
  }
}

// Global request queue instance
export const apiRequestQueue = new RequestQueue(10, 5); // 10 req/sec, max 5 concurrent

/**
 * Wrapper function to queue API requests
 */
export async function queueRequest<T>(fn: () => Promise<T>): Promise<T> {
  return apiRequestQueue.enqueue(fn);
}


