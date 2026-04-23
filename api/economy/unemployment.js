/**
 * GET /api/economy/unemployment?stateFips=12&countyFips=086
 *
 * BLS Local Area Unemployment Statistics (LAUS) — free, no key required for
 * public queries (key increases the quota). Returns the latest monthly
 * county unemployment rate plus a year-ago comparison for trend context.
 *
 * BLS LAUS series ID format for county unemployment rate:
 *   LAUCN + stateFips(2) + countyFips(3) + '0000000003'
 * e.g. Miami-Dade = LAUCN120860000000003
 *
 * Response:
 *   {
 *     rate: 3.2,             // latest monthly %
 *     yearAgoRate: 3.8,      // same month prior year
 *     deltaPct: -0.6,        // rate - yearAgoRate
 *     periodLabel: "Mar 2026",
 *     seriesId: "LAUCN120860000000003"
 *   }
 */
import { handler, ApiError } from "../_lib/errors.js";
import { requireUserId } from "../_lib/auth.js";

const CACHE_MS = 12 * 60 * 60 * 1000; // 12h — BLS updates monthly
const _cache = new Map();

export default handler(async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  await requireUserId(req);

  const { stateFips, countyFips } = req.query || {};
  if (!stateFips || !countyFips) {
    throw new ApiError(400, "missing_params", "stateFips + countyFips required");
  }
  const sf = String(stateFips).padStart(2, "0");
  const cf = String(countyFips).padStart(3, "0");
  const seriesId = `LAUCN${sf}${cf}0000000003`;

  const cached = _cache.get(seriesId);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return res.status(200).json({ ...cached.payload, cached: true });
  }

  const currentYear = new Date().getFullYear();
  const body = {
    seriesid: [seriesId],
    startyear: String(currentYear - 1),
    endyear: String(currentYear),
    // registrationkey is optional — public quota is 25 req/day per IP.
    // With a BLS key it's 500/day. Safe to send empty.
    ...(process.env.BLS_API_KEY ? { registrationkey: process.env.BLS_API_KEY } : {})
  };

  const upstream = await fetch("https://api.bls.gov/publicAPI/v2/timeseries/data/", {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(body)
  });
  if (!upstream.ok) {
    const t = await upstream.text().catch(() => "");
    throw new ApiError(502, "bls_error", `BLS ${upstream.status}: ${t.slice(0, 200)}`);
  }
  const data = await upstream.json();
  if (data.status !== "REQUEST_SUCCEEDED") {
    throw new ApiError(502, "bls_error", data.message?.join("; ") || "BLS request failed");
  }

  const series = data.Results?.series?.[0];
  const observations = Array.isArray(series?.data) ? series.data : [];
  if (observations.length === 0) {
    throw new ApiError(404, "no_data", `No BLS data for ${seriesId}`);
  }

  // Observations come newest first. Grab latest + same month a year ago.
  // BLS monthly data period is "M01".."M12"; skip the "M13" annual average.
  const monthly = observations.filter(o => o.period !== "M13");
  const latest = monthly[0];
  const yearAgo = monthly.find(o => o.period === latest.period && Number(o.year) === Number(latest.year) - 1);

  const rate = Number(latest.value);
  const yearAgoRate = yearAgo ? Number(yearAgo.value) : null;
  const deltaPct = yearAgoRate != null ? +(rate - yearAgoRate).toFixed(1) : null;

  const payload = {
    rate,
    yearAgoRate,
    deltaPct,
    periodLabel: `${latest.periodName} ${latest.year}`,
    seriesId
  };
  _cache.set(seriesId, { at: Date.now(), payload });
  return res.status(200).json({ ...payload, cached: false });
});
