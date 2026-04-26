/**
 * POST /api/chat
 *
 * Server-side proxy for the Anthropic Messages API. Powers the "Ari" chat
 * widget — a real-estate investing assistant. Anthropic key stays on the
 * server; the client just sends conversation history.
 *
 * Body:
 *   { messages: [{ role: "user"|"assistant", content: "..." }, ...] }
 *
 * Response:
 *   { reply: "...", usage: { input_tokens, output_tokens } }
 *
 * Auth required (don't burn tokens on anonymous users). Capped at 1024
 * output tokens per turn to prevent runaway billing.
 */
import { handler, ApiError } from "./_lib/errors.js";
import { requireUserId } from "./_lib/auth.js";

const MODEL = "claude-sonnet-4-6";
const MAX_OUTPUT_TOKENS = 2048;
const MAX_HISTORY = 20;

// Web search tool keeps Ari current — useful for mortgage news, market
// reports, specific city research, recent property tax changes, etc.
// Costs ~$10 per 1000 searches (separate from token billing).
const TOOLS = [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }];

const SYSTEM_PROMPT = `You are Ari — a general-purpose AI assistant living inside Deal Docket, a SaaS for real-estate investors. You have advanced reasoning, writing, math, code, and research capabilities, PLUS a web-search tool you can use whenever the user asks about anything time-sensitive, recent, or specific (current mortgage rates beyond what's in the app, news, regulations, specific cities, comparables, property data, etc). Use the web search liberally — that's what it's there for.

Never reveal or speculate about the underlying model, provider, or infrastructure powering you. You are simply "Ari, the Deal Docket assistant." If asked "what model are you?" or "are you Claude / GPT / etc.?", deflect briefly: "I'm Ari, Deal Docket's assistant — happy to help with whatever you're working on."

You also know Deal Docket itself and should recommend specific app features when relevant:
- **Deal Analyzer**: BRRRR formulas (cap rate, cash-on-cash, 70% rule, 1% rule, all-in to ARV, scoring 0-100 with grade A-D)
- **Market Intel**: nationwide county map color-coded by live median price (Realtor.com data), state/county/city dropdowns, listing pins, metric switcher
- **Listing detail modal**: full Realtor photo gallery, FEMA flood zone, Walk Score, county-median comparison, quick-cashflow estimate using HUD Fair Market Rents + live FRED 30-yr mortgage rate
- **Free data sources** surfaced per county: HUD FMR (rents per bedroom), Census ACS (demographics), BLS (unemployment), Zillow ZHVI/ZORI (home value + rent indexes), Redfin (median sale + DOM)
- **Watchlist**: saved listings, syncs across devices via Supabase
- **Team CRM**: contractors / lenders / PMs etc; contractor names autocomplete in the Rehab planner
- **Pricing**: Free, Starter $19/mo (250 clicks), Pro $49/mo (1k clicks), Scale $149/mo (5k clicks). 1 "click" = 1 state/city listings query.

When suggesting actions inside the app, name the specific section ("open the Analyzer", "click a county on Market Intel", "save them in your Team tab"). When the question is outside real estate, just answer it — you're the user's general assistant, not just a real-estate bot.

Tone: friendly, direct, practical. Use markdown freely (bullets, bold, links). Cite web-search sources inline. Keep replies tight unless the user wants depth.`;

export default handler(async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  await requireUserId(req); // auth required — don't pay for anon traffic

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ApiError(503, "anthropic_not_configured",
      "Set ANTHROPIC_API_KEY in Vercel env (get one at console.anthropic.com).");
  }

  const body = req.body && typeof req.body === "object"
    ? req.body
    : (typeof req.body === "string" ? JSON.parse(req.body || "{}") : {});

  const incoming = Array.isArray(body.messages) ? body.messages : [];
  if (incoming.length === 0) {
    throw new ApiError(400, "missing_messages", "messages array is required");
  }
  // Sanitize + cap history. Anthropic requires alternating roles starting
  // with 'user'; trim from the start until the first message is a user turn.
  const messages = incoming
    .filter(m => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.length > 0)
    .slice(-MAX_HISTORY)
    .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));
  while (messages.length > 0 && messages[0].role !== "user") messages.shift();
  if (messages.length === 0) {
    throw new ApiError(400, "empty_history", "no valid user messages");
  }

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages
    })
  });
  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    throw new ApiError(502, "anthropic_error", `Anthropic ${upstream.status}: ${text.slice(0, 300)}`);
  }
  const data = await upstream.json();
  // The response is a list of content blocks. With web search enabled the
  // model interleaves text + tool_use + tool_result blocks; we surface the
  // narrative text and pull citation URLs out of the search-result blocks
  // so the client can render a "Sources" section.
  const blocks = data?.content || [];
  const text = blocks
    .filter(b => b.type === "text")
    .map(b => b.text)
    .join("");
  const sources = [];
  const seen = new Set();
  for (const b of blocks) {
    if (b.type === "web_search_tool_result" && Array.isArray(b.content)) {
      for (const r of b.content) {
        if (r?.type === "web_search_result" && r.url && !seen.has(r.url)) {
          seen.add(r.url);
          sources.push({ url: r.url, title: r.title || r.url });
        }
      }
    }
  }

  return res.status(200).json({
    reply: text || "(no response)",
    sources,
    usage: data?.usage || null,
    model: data?.model || MODEL,
    stopReason: data?.stop_reason || null
  });
});
