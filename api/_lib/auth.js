/**
 * Authenticate an incoming request against Clerk. Returns the Clerk user id
 * (`sub` claim). Throws ApiError(401) if the request is unauthenticated or
 * ApiError(503) if Clerk isn't configured yet.
 *
 * The frontend passes the session JWT as `Authorization: Bearer <token>`.
 * We use @clerk/backend's `verifyToken` which is the thin, low-ceremony
 * option for serverless functions.
 */
import { verifyToken } from "@clerk/backend";
import { ApiError } from "./errors.js";

export async function requireUserId(req) {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) {
    throw new ApiError(503, "auth_not_configured",
      "Set CLERK_SECRET_KEY in the Vercel project env.");
  }

  const authHeader = req.headers.authorization || req.headers.Authorization;
  const token = authHeader && authHeader.replace(/^Bearer\s+/i, "");
  if (!token) throw new ApiError(401, "missing_auth");

  try {
    const payload = await verifyToken(token, {
      secretKey: secret,
      // Accept any Clerk-hosted issuer (dev + prod URLs look different).
      authorizedParties: undefined
    });
    if (!payload?.sub) throw new ApiError(401, "invalid_token");
    return {
      clerkUserId: payload.sub,
      email: payload.email || null,
      sessionId: payload.sid || null
    };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(401, "invalid_token", err.message);
  }
}
