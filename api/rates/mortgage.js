/**
 * GET /api/rates/mortgage
 *
 * Live 30-year fixed-rate mortgage via FRED (Federal Reserve Economic Data).
 * Series `MORTGAGE30US` updates weekly on Thursdays.
 *
 * Free, unlimited — just needs FRED_API_KEY in env.
 *
 * Cached in-module for 12h so we're not hitting FRED on every page load.
 * Serverless cold starts refresh the cache; warm instances reuse it.
 *
 * Response:
 *   { rate: 7.12, asOf: "2026-04-18", series: "MORTGAGE30US" }
 */
import { handler, ApiError } from "../_lib/errors.js";
import { requireUserId } from "../_lib/auth.js";

const CACHE_MS = 12 * 60 * 60 * 1000; // 12h
let _cache = null; // { at: epoch_ms, payload: {...} }

export default handler(async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  // Auth required (prevents scraping the endpoint) but not metered —
  // FRED is free + cached, so it doesn't consume click quota.
  await requireUserId(req);

  if (_cache && Date.now() - _cache.at < CACHE_MS) {
    return res.status(200).json({ ..._cache.payload, cached: true });
  }

  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    throw new ApiError(503, "fred_not_configured",
      "Set FRED_API_KEY in Vercel env (free at https://fred.stlouisfed.org/docs/api/api_key.html)");
  }

  const url = `https://api.stlouisfed.org/fred/series/observations`
    + `?series_id=MORTGAGE30US&api_key=${apiKey}`
    + `&file_type=json&sort_order=desc&limit=1`;

  const upstream = await fetch(url, { headers: { accept: "application/json" } });
  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    throw new ApiError(502, "upstream_error", `FRED ${upstream.status}: ${text.slice(0, 200)}`);
  }
  const data = await upstream.json();
  const obs = data?.observations?.[0];
  if (!obs) throw new ApiError(502, "fred_empty", "No observations returned");

  const rate = Number(obs.value);
  if (!Number.isFinite(rate)) throw new ApiError(502, "fred_bad_value", obs.value);

  const payload = { rate, asOf: obs.date, series: "MORTGAGE30US" };
  _cache = { at: Date.now(), payload };

  return res.status(200).json({ ...payload, cached: false });
});
