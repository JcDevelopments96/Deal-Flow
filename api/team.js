/**
 * /api/team — real estate team contacts per user.
 *
 *   GET    /api/team                               → { contacts: [...] }
 *   POST   /api/team      body: { contact }        → { contact }
 *   PATCH  /api/team?id=  body: { updates }        → { contact }
 *   DELETE /api/team?id=                           → { removed: true }
 *
 * Each user's own team; RLS + service-role writes.
 */
import { handler, ApiError } from "./_lib/errors.js";
import { requireUserId } from "./_lib/auth.js";
import { adminDb, ensureUser } from "./_lib/db.js";

const TABLE = "team_contacts";

const VALID_ROLES = new Set([
  "agent", "lender", "property_manager", "contractor",
  "inspector", "title", "insurance", "attorney", "cpa",
  "wholesaler", "other"
]);

// Fields we allow the client to set / update. Anything else is silently dropped.
const ALLOWED_FIELDS = [
  "role", "name", "company", "phone", "email", "website",
  "city", "state", "notes", "rating"
];

function sanitize(body) {
  const out = {};
  for (const k of ALLOWED_FIELDS) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  // Normalize types
  if (out.rating !== undefined && out.rating !== null) {
    const n = Number(out.rating);
    out.rating = Number.isFinite(n) && n >= 1 && n <= 5 ? Math.round(n) : null;
  }
  if (out.state !== undefined && typeof out.state === "string") out.state = out.state.toUpperCase().slice(0, 2);
  return out;
}

function parseBody(req) {
  return req.body && typeof req.body === "object"
    ? req.body
    : (typeof req.body === "string" ? JSON.parse(req.body || "{}") : {});
}

export default handler(async (req, res) => {
  const { clerkUserId, email } = await requireUserId(req);
  const user = await ensureUser({ clerkUserId, email });
  const db = adminDb();

  if (req.method === "GET") {
    const { data, error } = await db
      .from(TABLE)
      .select("*")
      .eq("user_id", user.id)
      .order("role", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw new ApiError(500, "db_read_failed", error.message);
    return res.status(200).json({ contacts: data || [] });
  }

  if (req.method === "POST") {
    const body = parseBody(req);
    const contact = sanitize(body.contact || body);
    if (!contact.name || !contact.role) {
      throw new ApiError(400, "missing_fields", "name and role are required");
    }
    if (!VALID_ROLES.has(contact.role)) {
      throw new ApiError(400, "bad_role", `role must be one of: ${[...VALID_ROLES].join(", ")}`);
    }
    const { data, error } = await db
      .from(TABLE)
      .insert({ ...contact, user_id: user.id })
      .select()
      .single();
    if (error) throw new ApiError(500, "db_insert_failed", error.message);
    return res.status(200).json({ contact: data });
  }

  if (req.method === "PATCH") {
    const id = req.query?.id;
    if (!id) throw new ApiError(400, "missing_id");
    const body = parseBody(req);
    const updates = sanitize(body.updates || body);
    if (updates.role && !VALID_ROLES.has(updates.role)) {
      throw new ApiError(400, "bad_role");
    }
    updates.updated_at = new Date().toISOString();
    const { data, error } = await db
      .from(TABLE)
      .update(updates)
      .eq("id", String(id))
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) throw new ApiError(500, "db_update_failed", error.message);
    if (!data) throw new ApiError(404, "not_found");
    return res.status(200).json({ contact: data });
  }

  if (req.method === "DELETE") {
    const id = req.query?.id;
    if (!id) throw new ApiError(400, "missing_id");
    const { error } = await db
      .from(TABLE)
      .delete()
      .eq("id", String(id))
      .eq("user_id", user.id);
    if (error) throw new ApiError(500, "db_delete_failed", error.message);
    return res.status(200).json({ removed: true });
  }

  res.setHeader("Allow", "GET, POST, PATCH, DELETE");
  return res.status(405).json({ error: "method_not_allowed" });
});
