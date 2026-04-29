interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();
const RATE = 30;
const WINDOW_MS = 60_000;

export function checkRateLimit(ip: string): {
  allowed: boolean;
  retryAfterMs?: number;
} {
  const now = Date.now();
  let bucket = buckets.get(ip);

  if (!bucket) {
    bucket = { tokens: RATE - 1, lastRefill: now };
    buckets.set(ip, bucket);
    return { allowed: true };
  }

  const elapsed = now - bucket.lastRefill;
  const refill = Math.floor((elapsed / WINDOW_MS) * RATE);
  if (refill > 0) {
    bucket.tokens = Math.min(RATE, bucket.tokens + refill);
    bucket.lastRefill = now;
  }

  if (bucket.tokens > 0) {
    bucket.tokens--;
    return { allowed: true };
  }

  const waitMs = Math.ceil(((1 - bucket.tokens) / RATE) * WINDOW_MS);
  return { allowed: false, retryAfterMs: waitMs };
}

setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS * 5;
  for (const [key, bucket] of buckets) {
    if (bucket.lastRefill < cutoff) buckets.delete(key);
  }
}, WINDOW_MS * 2);
