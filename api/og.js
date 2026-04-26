/**
 * /api/og — dynamic Open Graph image (1200×630 PNG) for social shares.
 *
 * Renders Deal Docket's branded social card on demand using @vercel/og
 * (Satori under the hood: element tree → SVG → PNG). Edge runtime so it
 * serves in <100ms globally. Aggressive cache since the image is
 * deterministic per query string.
 *
 * Written without JSX (uses React.createElement directly) so the file
 * stays a plain `.js` and Vercel's edge runtime registers it without
 * any extension-specific routing surprises.
 */
import { ImageResponse } from "@vercel/og";
import React from "react";

export const config = { runtime: "edge" };

const BRAND = {
  navy: "#0B0F14",
  navyAccent: "#1A2332",
  cream: "#E8E4D9",
  teal: "#0D9488",
  textMuted: "#8A93A0"
};

const h = React.createElement;

export default function handler(req) {
  const url = new URL(req.url);
  const title = url.searchParams.get("title") || "Deal Docket";
  const subtitle = url.searchParams.get("subtitle")
    || "The real estate investor's end-to-end toolkit";

  const tags = ["MLS Listings", "Wholesale Leads", "Deal Analyzer", "Ari AI"];

  const tree = h("div", {
    style: {
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      padding: 80,
      background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyAccent} 100%)`,
      color: BRAND.cream,
      fontFamily: "system-ui, sans-serif",
      position: "relative"
    }
  }, [
    // Teal accent bar, full-height left edge
    h("div", {
      key: "rail",
      style: {
        position: "absolute", top: 0, left: 0,
        width: 12, height: "100%",
        background: BRAND.teal
      }
    }),
    // Brand mark + name
    h("div", {
      key: "brand",
      style: { display: "flex", alignItems: "center", gap: 20, marginBottom: 60 }
    }, [
      h("div", {
        key: "mark",
        style: {
          width: 72, height: 72, borderRadius: 16,
          background: BRAND.cream, color: BRAND.navy,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 38, fontWeight: 700
        }
      }, "DD"),
      h("div", {
        key: "name",
        style: { fontSize: 36, fontWeight: 700, letterSpacing: -0.5 }
      }, "Deal Docket")
    ]),
    // Headline + subtitle (flex 1 pushes footer to the bottom)
    h("div", {
      key: "headline",
      style: {
        display: "flex", flexDirection: "column", gap: 24,
        flex: 1, justifyContent: "center"
      }
    }, [
      h("div", {
        key: "title",
        style: {
          fontSize: title.length > 40 ? 64 : 80,
          fontWeight: 700, lineHeight: 1.05,
          letterSpacing: -1.5,
          maxWidth: 980,
          display: "flex"
        }
      }, title),
      h("div", {
        key: "sub",
        style: {
          fontSize: 28, color: BRAND.textMuted,
          lineHeight: 1.4, maxWidth: 900,
          display: "flex"
        }
      }, subtitle)
    ]),
    // Footer: feature pills + URL
    h("div", {
      key: "footer",
      style: {
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginTop: 40
      }
    }, [
      h("div", {
        key: "tags",
        style: { display: "flex", gap: 12 }
      }, tags.map(tag =>
        h("div", {
          key: tag,
          style: {
            padding: "8px 16px",
            background: "rgba(13, 148, 136, 0.18)",
            color: BRAND.teal,
            border: `1px solid ${BRAND.teal}`,
            borderRadius: 999,
            fontSize: 18, fontWeight: 600,
            display: "flex"
          }
        }, tag)
      )),
      h("div", {
        key: "url",
        style: { fontSize: 22, color: BRAND.cream, fontWeight: 600, display: "flex" }
      }, "dealdocket.ai")
    ])
  ]);

  return new ImageResponse(tree, {
    width: 1200,
    height: 630,
    headers: {
      "cache-control": "public, max-age=86400, s-maxage=86400, immutable"
    }
  });
}
