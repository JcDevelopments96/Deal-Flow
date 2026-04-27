/**
 * /api/inspection — uploaded inspection PDFs + Claude-generated summaries.
 *
 * Tied to either a Deal (analyzer) or a Watchlist listing — `context` +
 * `contextId` discriminate. PDFs live in Supabase Storage at
 *   inspections/{user_id}/{inspection_id}/{filename}
 * The base64'd PDF (up to ~30MB / 100 pages) goes straight to Claude as a
 * document content block — Claude reads PDFs natively including photos,
 * so we don't need server-side OCR.
 *
 * Actions (all single-function so we stay under the Vercel Hobby cap):
 *   POST   ?action=upload-url   { filename, context, contextId, address, sizeBytes }
 *                               → { inspectionId, storagePath, signedUploadUrl }
 *   POST   ?action=summarize    { inspectionId }
 *                               → { summary } (also writes to inspections.summary)
 *   GET    ?context=…&contextId=…           → list inspections for that context
 *   GET    ?id=…                            → fetch one (with signed file URL)
 *   DELETE ?id=…                            → delete row + storage object
 */
import { handler, ApiError } from "./_lib/errors.js";
import { requireUserId } from "./_lib/auth.js";
import { adminDb, ensureUser } from "./_lib/db.js";
import { planFor } from "./_lib/plans.js";

const BUCKET = "inspections";

// Inspection AI summaries hit Anthropic per-PDF (~$0.05-0.20/call). All
// plans get access, but free users are capped at a lifetime quota (1)
// to bound exposure. Paid plans get unlimited.

/** Throws 403 if the user is at their plan's lifetime inspection cap.
 *  Counts ALL inspection rows for the user — soft-deleted summaries
 *  still count, since the model call already happened. */
async function enforceInspectionCap(db, user) {
  const plan = planFor(user.plan);
  const cap = plan.inspectionCap;
  if (cap == null) return;                  // unlimited (paid plans)
  const { count, error } = await db
    .from("inspections").select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (error) throw new ApiError(500, "db_read_failed", error.message);
  if ((count || 0) >= cap) {
    throw new ApiError(403, "inspection_cap_reached",
      `Free plan includes ${cap} inspection report. Upgrade to Starter, Pro, or Scale for unlimited reports.`);
  }
}

function parseBody(req) {
  return req.body && typeof req.body === "object"
    ? req.body
    : (typeof req.body === "string" ? JSON.parse(req.body || "{}") : {});
}

const VALID_CONTEXTS = new Set(["deal", "watchlist", "standalone"]);

/* ── Mint a signed upload URL ─────────────────────────────────────────── */
async function handleUploadUrl(body, user) {
  const { filename, context, contextId, address, sizeBytes } = body || {};
  if (!filename || !context || !contextId) {
    throw new ApiError(400, "missing_fields", "filename + context + contextId required");
  }
  if (!VALID_CONTEXTS.has(context)) {
    throw new ApiError(400, "bad_context", "context must be 'deal' or 'watchlist'");
  }
  // 32MB hard cap matches Claude's PDF limit. Well under most inspection
  // report sizes (10-20MB typical).
  if (sizeBytes && Number(sizeBytes) > 32 * 1024 * 1024) {
    throw new ApiError(413, "too_large", "PDF must be 32MB or smaller");
  }

  const db = adminDb();
  // Enforce lifetime inspection cap before minting an upload URL — that
  // way free users at the cap don't even get a signed URL, so they
  // can't bypass the gate and trigger Claude billing on /summarize.
  await enforceInspectionCap(db, user);

  // Create the inspections row first so we have an id for the storage path
  const { data: row, error: insErr } = await db.from("inspections").insert({
    user_id: user.id,
    context,
    context_id: String(contextId),
    filename: String(filename).slice(0, 200),
    storage_path: "", // filled in next
    property_address: address || null,
    file_size_bytes: sizeBytes || null,
    status: "pending"
  }).select().single();
  if (insErr) throw new ApiError(500, "db_insert_failed", insErr.message);

  const safeName = String(filename).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  const storagePath = `${user.id}/${row.id}/${safeName}`;
  await db.from("inspections").update({ storage_path: storagePath }).eq("id", row.id);

  // Mint a signed upload URL — client uploads directly to storage,
  // bypassing the 4.5MB Vercel function body limit.
  const { data: signed, error: signErr } = await db.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath);
  if (signErr) {
    // Most common cause: bucket doesn't exist yet. Surface a clear hint.
    throw new ApiError(503, "storage_not_configured",
      `Couldn't sign upload URL — make sure the "${BUCKET}" bucket exists in Supabase Storage. (${signErr.message})`);
  }

  return {
    inspectionId: row.id,
    storagePath,
    signedUploadUrl: signed.signedUrl,
    token: signed.token
  };
}

/* ── Summarize via Claude ─────────────────────────────────────────────── */
async function handleSummarize(body, user) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new ApiError(503, "anthropic_not_configured",
    "Set ANTHROPIC_API_KEY in Vercel env.");

  const { inspectionId } = body || {};
  if (!inspectionId) throw new ApiError(400, "missing_id", "inspectionId required");

  const db = adminDb();
  const { data: row, error: rowErr } = await db
    .from("inspections").select("*")
    .eq("id", inspectionId).eq("user_id", user.id).maybeSingle();
  if (rowErr) throw new ApiError(500, "db_read_failed", rowErr.message);
  if (!row) throw new ApiError(404, "not_found");

  // Mark processing so the UI can show a spinner if the user reopens
  await db.from("inspections")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", inspectionId);

  // Pull the PDF bytes from storage as base64
  const { data: file, error: dlErr } = await db.storage
    .from(BUCKET).download(row.storage_path);
  if (dlErr || !file) {
    await db.from("inspections")
      .update({ status: "failed", error_message: dlErr?.message || "download failed" })
      .eq("id", inspectionId);
    throw new ApiError(502, "storage_download_failed", dlErr?.message || "couldn't fetch PDF");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  const prompt = `You are an expert home inspection reviewer. Read the attached PDF inspection report and produce a JSON summary. Output ONLY valid JSON, no markdown fences, no explanation.

Schema:
{
  "overview": "1-2 sentence high-level summary of property condition",
  "urgent": [
    { "issue": "short description", "location": "where in the home", "estCost": { "min": 500, "max": 1200 } }
  ],
  "immediate": [ /* repairs needed in 0-6 months, same shape */ ],
  "recommended": [ /* repairs in 6-24 months, same shape */ ],
  "deferred": [ /* nice-to-have / cosmetic, same shape */ ],
  "goodCondition": [ "Roof — recent install, no issues", "Electrical panel — modern", ... ],
  "totalEstCostMin": 5000,
  "totalEstCostMax": 12000
}

Rules:
- "urgent" = safety hazards (gas, electrical, structural, roof leaks active)
- "immediate" = will fail soon or affect habitability (broken HVAC, plumbing leaks)
- "recommended" = preventative or efficiency (water heater age, insulation, weatherproofing)
- "deferred" = cosmetic, maintenance, optional upgrades
- Estimate costs conservatively for the geographic market if stated; use null if no reasonable estimate
- totalEstCostMin / totalEstCostMax should sum the urgent + immediate items only
- Be specific: name the system + location, not just "needs repair"`;

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
          { type: "text", text: prompt }
        ]
      }]
    })
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    await db.from("inspections")
      .update({ status: "failed", error_message: `AI provider ${upstream.status}: ${text.slice(0, 200)}` })
      .eq("id", inspectionId);
    throw new ApiError(502, "ai_provider_error", `Ari returned an error (${upstream.status}). Try again in a moment.`);
  }

  const apiResp = await upstream.json();
  const textBlock = apiResp.content?.find(c => c.type === "text")?.text || "";

  // Claude sometimes wraps JSON in fences despite instructions — strip any.
  const cleaned = textBlock
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let summary;
  try {
    summary = JSON.parse(cleaned);
  } catch {
    await db.from("inspections")
      .update({ status: "failed", error_message: "Ari returned non-JSON output" })
      .eq("id", inspectionId);
    throw new ApiError(502, "ai_bad_json",
      "Ari's response wasn't formatted correctly. Try uploading again.");
  }

  await db.from("inspections")
    .update({
      status: "complete", summary,
      error_message: null, updated_at: new Date().toISOString()
    })
    .eq("id", inspectionId);

  return { summary };
}

/* ── List + fetch + delete ────────────────────────────────────────────── */
async function handleList(req, user) {
  const { context, contextId, id } = req.query || {};
  const db = adminDb();

  if (id) {
    const { data, error } = await db
      .from("inspections").select("*")
      .eq("id", String(id)).eq("user_id", user.id)
      .maybeSingle();
    if (error) throw new ApiError(500, "db_read_failed", error.message);
    if (!data) throw new ApiError(404, "not_found");
    // Mint a signed download URL valid for 5 min so the UI can let the
    // user re-open the original PDF.
    const { data: dl } = await db.storage
      .from(BUCKET).createSignedUrl(data.storage_path, 300);
    return { inspection: { ...data, fileUrl: dl?.signedUrl || null } };
  }

  // No context+id → return ALL of the user's inspections, every context.
  // Used by the standalone Inspections page so the user can see the full
  // history at a glance grouped by where each was uploaded from.
  if (!context && !contextId) {
    const { data, error } = await db
      .from("inspections").select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw new ApiError(500, "db_read_failed", error.message);
    return { inspections: data || [] };
  }
  if (!context || !contextId) {
    throw new ApiError(400, "missing_params", "context + contextId required (or pass id=, or omit both for all-inspections)");
  }
  if (!VALID_CONTEXTS.has(context)) throw new ApiError(400, "bad_context");
  const { data, error } = await db
    .from("inspections").select("*")
    .eq("user_id", user.id)
    .eq("context", context)
    .eq("context_id", String(contextId))
    .order("created_at", { ascending: false });
  if (error) throw new ApiError(500, "db_read_failed", error.message);
  return { inspections: data || [] };
}

async function handleDelete(req, user) {
  const { id } = req.query || {};
  if (!id) throw new ApiError(400, "missing_id");
  const db = adminDb();
  const { data: row } = await db
    .from("inspections").select("storage_path")
    .eq("id", String(id)).eq("user_id", user.id).maybeSingle();
  if (row?.storage_path) {
    await db.storage.from(BUCKET).remove([row.storage_path]).catch(() => {});
  }
  const { error } = await db
    .from("inspections").delete()
    .eq("id", String(id)).eq("user_id", user.id);
  if (error) throw new ApiError(500, "db_delete_failed", error.message);
  return { removed: true };
}

/* ── Router ───────────────────────────────────────────────────────────── */
export default handler(async (req, res) => {
  const { clerkUserId, email } = await requireUserId(req);
  const user = await ensureUser({ clerkUserId, email });

  const action = (req.query?.action || "").toString();
  const body = parseBody(req);

  let payload;
  if (req.method === "GET") {
    payload = await handleList(req, user);
  } else if (req.method === "DELETE") {
    payload = await handleDelete(req, user);
  } else if (req.method === "POST") {
    // Open to all plans — free users get inspections too. Saved-deal cap
    // is the primary upgrade trigger.
    if (action === "upload-url") payload = await handleUploadUrl(body, user);
    else if (action === "summarize") payload = await handleSummarize(body, user);
    else throw new ApiError(400, "unknown_action", "POST action must be upload-url or summarize");
  } else {
    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  return res.status(200).json(payload);
});
