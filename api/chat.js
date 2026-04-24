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
const MAX_OUTPUT_TOKENS = 1024;
const MAX_HISTORY = 20; // user/assistant pairs we'll forward to keep cost predictable

const SYSTEM_PROMPT = `You are Ari, the real-estate investing assistant inside DealTrack — a SaaS app that helps investors analyze BRRRR deals, browse the US market, screen properties, and build a local team.

Tone: friendly, direct, practical. Avoid fluff. If a number is a rule of thumb, label it as such. If a question is outside real estate / personal finance, redirect briefly.

Things you know about DealTrack:
- Deal Analyzer (BRRRR formulas: cap rate, cash-on-cash, 70% rule, 1% rule, all-in to ARV, scoring 0-100 with grade A-D)
- Market Intel: nationwide county map, color-coded by live median price (Realtor.com data), state/county/city dropdowns, listing pins
- Listing detail modal: full Realtor photo gallery, FEMA flood zone, Walk Score, county-median comparison, quick-cashflow estimate using HUD Fair Market Rents + live FRED 30-yr mortgage rate
- Free data sources surfaced: HUD FMR (rents per bedroom), Census ACS (demographics), BLS (unemployment), Zillow ZHVI/ZORI (home value + rent indexes), Redfin (median sale + DOM)
- Watchlist (saved listings, syncs across devices)
- Team CRM (contractors, lenders, PMs etc — and contractor names autocomplete in the rehab planner)
- Pricing: Free, Starter $19/mo (250 clicks), Pro $49/mo (1k clicks), Scale $149/mo (5k clicks). One "click" = one state/city listings query.

When suggesting actions, name the specific app section ("open the Analyzer", "click a county on Market Intel", "save them in your Team tab", etc).

Keep replies under 200 words unless the user asks for depth. Use markdown when it improves readability (bullets, bold for key numbers).`;

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
      messages
    })
  });
  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    throw new ApiError(502, "anthropic_error", `Anthropic ${upstream.status}: ${text.slice(0, 300)}`);
  }
  const data = await upstream.json();
  const text = (data?.content || [])
    .filter(b => b.type === "text")
    .map(b => b.text)
    .join("");

  return res.status(200).json({
    reply: text || "(no response)",
    usage: data?.usage || null,
    model: data?.model || MODEL
  });
});
