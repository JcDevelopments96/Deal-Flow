/**
 * Small helper so every API function returns consistent error shapes.
 * All user-visible errors come through ApiError; anything else is logged
 * and returned as a generic 500 without leaking internals.
 */

export class ApiError extends Error {
  constructor(status, code, detail) {
    super(code);
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

export function sendError(res, err) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.code, detail: err.detail || undefined });
  }
  console.error("[api] unexpected error", err);
  return res.status(500).json({ error: "internal_error" });
}

// Small wrapper that lets handlers just `throw new ApiError(...)` naturally.
// Rate-limit check runs FIRST so a flood of requests gets throttled before
// it reaches the auth/DB layers.
export function handler(fn) {
  return async (req, res) => {
    try {
      // Lazy import to avoid a circular dependency through rateLimit.js
      const { rateLimit } = await import("./rateLimit.js");
      rateLimit(req);
      await fn(req, res);
    } catch (err) {
      sendError(res, err);
    }
  };
}
