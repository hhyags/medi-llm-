/**
 * MedFlow AI CRM — In-Memory Sliding Window Rate Limiter
 * Protects AI, Outbound Calling, and Webhook endpoints against DDoS and abuse.
 */

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory store for rate limiting by identifier (IP + endpoint)
const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((record, key) => {
      // Remove timestamps older than 15 minutes
      record.timestamps = record.timestamps.filter((ts) => now - ts < 15 * 60 * 1000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    });
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  /** Maximum allowed requests within the time window */
  maxRequests?: number;
  /** Sliding window duration in milliseconds (default: 60,000ms / 1 min) */
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Extracts client IP address from standard proxy/CDN headers or defaults to localhost
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Checks and increments rate limit for a specific client and endpoint.
 */
export function checkRateLimit(
  request: Request,
  endpoint: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const maxRequests = options.maxRequests ?? 60;
  const windowMs = options.windowMs ?? 60 * 1000;
  const now = Date.now();

  const ip = getClientIp(request);
  const key = `${endpoint}:${ip}`;

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter timestamps within current sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldestTs = record.timestamps[0];
    const resetSeconds = Math.ceil((oldestTs + windowMs - now) / 1000);
    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      resetSeconds: Math.max(1, resetSeconds)
    };
  }

  // Record this request
  record.timestamps.push(now);
  const remaining = Math.max(0, maxRequests - record.timestamps.length);
  const resetSeconds = Math.ceil(windowMs / 1000);

  return {
    allowed: true,
    limit: maxRequests,
    remaining,
    resetSeconds
  };
}
