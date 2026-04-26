/**
 * /api/og — dynamic Open Graph image (1200×630 PNG) for social shares.
 *
 * Renders Deal Docket's branded social card on demand using @vercel/og
 * (Satori under the hood: JSX → SVG → PNG). Means:
 *   - Always matches the live brand colors / typography (no stale PNG)
 *   - Free path to per-page variants later via ?title=… or ?route=…
 *
 * Edge runtime so it serves in <100ms globally and doesn't count against
 * the serverless function time budget. Aggressive cache headers since the
 * image is deterministic for a given query string.
 */
import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

const BRAND = {
  navy: "#0B0F14",
  navyAccent: "#1A2332",
  cream: "#E8E4D9",
  teal: "#0D9488",
  textMuted: "#8A93A0"
};

export default function handler(req) {
  // Allow per-page overrides via query string. Defaults to the marketing
  // headline so the homepage share looks right out of the box.
  const url = new URL(req.url);
  const title = url.searchParams.get("title") || "Deal Docket";
  const subtitle = url.searchParams.get("subtitle")
    || "The real estate investor's end-to-end toolkit";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%",
          display: "flex", flexDirection: "column",
          padding: 80,
          background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyAccent} 100%)`,
          color: BRAND.cream,
          fontFamily: "system-ui, sans-serif",
          position: "relative"
        }}
      >
        {/* Subtle teal accent bar, top left */}
        <div style={{
          position: "absolute", top: 0, left: 0,
          width: 12, height: "100%",
          background: BRAND.teal
        }} />

        {/* Brand mark — building glyph in a rounded square so we don't
            depend on a remote font for a logo SVG. */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 60 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 16,
            background: BRAND.cream, color: BRAND.navy,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 38, fontWeight: 700
          }}>
            DD
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -0.5 }}>
            Deal Docket
          </div>
        </div>

        {/* Headline + subtitle take the middle of the card. flex: 1 pushes
            the footer URL to the bottom edge regardless of how long the
            headline runs. */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 24,
          flex: 1, justifyContent: "center"
        }}>
          <div style={{
            fontSize: title.length > 40 ? 64 : 80,
            fontWeight: 700, lineHeight: 1.05,
            letterSpacing: -1.5,
            maxWidth: 980
          }}>
            {title}
          </div>
          <div style={{
            fontSize: 28, color: BRAND.textMuted,
            lineHeight: 1.4, maxWidth: 900
          }}>
            {subtitle}
          </div>
        </div>

        {/* Footer: feature pills + URL. The pills double as keywords for
            anyone scanning the share preview. */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginTop: 40
        }}>
          <div style={{ display: "flex", gap: 12 }}>
            {["MLS Listings", "Wholesale Leads", "Deal Analyzer", "Ari AI"].map(tag => (
              <div key={tag} style={{
                padding: "8px 16px",
                background: "rgba(13, 148, 136, 0.18)",
                color: BRAND.teal,
                border: `1px solid ${BRAND.teal}`,
                borderRadius: 999,
                fontSize: 18, fontWeight: 600
              }}>
                {tag}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 22, color: BRAND.cream, fontWeight: 600 }}>
            dealdocket.ai
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        // 24h CDN cache — the card is deterministic per query string. If
        // we change the design, deploys bust the cache via the new build's
        // unique URL anyway.
        "cache-control": "public, max-age=86400, s-maxage=86400, immutable"
      }
    }
  );
}
