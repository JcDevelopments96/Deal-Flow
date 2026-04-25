/**
 * In-memory per-IP rate limiter — defense-in-depth against probing,
 * scraping, and brute-force credential testing.
 *
 * Why in-memory and not Redis? Vercel's free Hobby plan doesn't include
 * a managed KV store; Upstash Redis would be the right upgrade if abuse
 * volume warrants it. In-memory is imperfect (each warm function instance
 * has its own counter, cold starts reset) but still catches the common
 * case: one IP hammering one function over a few seconds.
 *
 * Tuning: 120 req/min/IP across all routes via the global `handler()`
 * wrapper. The Stripe webhook bypasses this because Stripe legitimately
 * spams retries on failure and we'd lock ourselves out of billing.
 */
import { ApiError } from "./errors.js";

const WINDOW_MS = 60 * 1000;            // 1 minute window
const MAX_REQ_PER_WINDOW = 120;         // ~2 req/sec sustained, plenty for legit usage
const _buckets = new Map();             // ip -> { count, windowStart }
const _swept = { at: 0 };

// Periodic cleanup so Map doesn't grow forever — sweeps stale buckets
// every 5 minutes during normal traffic.
function maybeSweep(now) {
  if (now - _swept.at < 5 * 60 * 1000) return;
  _swept.at = now;
  for (const [ip, b] of _buckets.entries()) {
    if (now - b.windowStart > WINDOW_MS * 2) _buckets.delete(ip);
  }
}

function clientIp(req) {
  // Vercel sets x-forwarded-for; the first hop is the real client IP.
  // Fall back to a hash of the user-agent so traffic without a known IP
  // (e.g., direct fetch from server-side rendering) still gets bucketed
  // somewhere — better than letting it bypass.
  const xff = (req.headers?.["x-forwarded-for"] || "").toString();
  const first = xff.split(",")[0]?.trim();
  if (first) return first;
  const real = req.headers?.["x-real-ip"];
  if (real) return String(real);
  return "unknown";
}

export function rateLimit(req) {
  // Stripe webhook hits us hard on retries — exempt it from throttling
  // since Stripe signs every request anyway.
  const url = req.url || "";
  if (url.startsWith("/api/stripe/webhook")) return;

  const now = Date.now();
  maybeSweep(now);

  const ip = clientIp(req);
  let bucket = _buckets.get(ip);
  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    bucket = { count: 0, windowStart: now };
    _buckets.set(ip, bucket);
  }
  bucket.count += 1;

  if (bucket.count > MAX_REQ_PER_WINDOW) {
    throw new ApiError(429, "rate_limited", {
      message: "Too many requests — slow down.",
      retryAfterSeconds: Math.ceil((WINDOW_MS - (now - bucket.windowStart)) / 1000)
    });
  }
}
