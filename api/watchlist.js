/**
 * /api/watchlist
 *
 * Per-user saved listings. Survives sign-out, new devices, and reinstalls.
 *
 *   GET    /api/watchlist                    → { items: [...] }  (newest first)
 *   POST   /api/watchlist                    body: { listing }   → { item }
 *   POST   /api/watchlist?bulk=1             body: { listings }  → { count }  (local→server migration on first sign-in)
 *   DELETE /api/watchlist?listingId=abc      → { removed: true }
 *
 * `listing_id` is whatever the normalizer put in `listing.id` — stable enough
 * that toggling the same property in/out works predictably across sessions.
 */
import { handler, ApiError } from "./_lib/errors.js";
import { requireUserId } from "./_lib/auth.js";
import { adminDb, ensureUser } from "./_lib/db.js";

const TABLE = "watchlist_items";

export default handler(async (req, res) => {
  const { clerkUserId, email } = await requireUserId(req);
  const user = await ensureUser({ clerkUserId, email });
  const db = adminDb();

  if (req.method === "GET") {
    const { data, error } = await db
      .from(TABLE)
      .select("listing_id, listing_data, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw new ApiError(500, "db_read_failed", error.message);
    const items = (data || []).map(row => ({
      ...row.listing_data,
      id: row.listing_id,
      savedAt: row.created_at
    }));
    return res.status(200).json({ items });
  }

  if (req.method === "POST") {
    const body = req.body && typeof req.body === "object"
      ? req.body
      : (typeof req.body === "string" ? JSON.parse(req.body || "{}") : {});

    // Bulk upload path — used on first sign-in to migrate localStorage items.
    if (req.query?.bulk === "1") {
      const listings = Array.isArray(body.listings) ? body.listings : [];
      if (listings.length === 0) return res.status(200).json({ count: 0 });
      const rows = listings
        .filter(l => l && l.id)
        .map(l => ({
          user_id: user.id,
          listing_id: String(l.id),
          listing_data: l
        }));
      // upsert on (user_id, listing_id) so duplicates become no-ops
      const { error } = await db
        .from(TABLE)
        .upsert(rows, { onConflict: "user_id,listing_id", ignoreDuplicates: true });
      if (error) throw new ApiError(500, "db_insert_failed", error.message);
      return res.status(200).json({ count: rows.length });
    }

    const listing = body.listing;
    if (!listing || !listing.id) {
      throw new ApiError(400, "missing_listing", "Body must be { listing: { id, ... } }");
    }
    const { error } = await db
      .from(TABLE)
      .upsert({
        user_id: user.id,
        listing_id: String(listing.id),
        listing_data: listing
      }, { onConflict: "user_id,listing_id" });
    if (error) throw new ApiError(500, "db_insert_failed", error.message);
    return res.status(200).json({ item: { ...listing, id: listing.id } });
  }

  if (req.method === "DELETE") {
    const listingId = req.query?.listingId;
    if (!listingId) throw new ApiError(400, "missing_listing_id");
    const { error } = await db
      .from(TABLE)
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", String(listingId));
    if (error) throw new ApiError(500, "db_delete_failed", error.message);
    return res.status(200).json({ removed: true });
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  return res.status(405).json({ error: "method_not_allowed" });
});
