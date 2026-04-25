/* ============================================================================
   TEAM VIEW — investor's local real-estate team. Build a roster of
   agents, lenders, property managers, contractors, inspectors, etc.
   per market so the right contact is one click away.
   ============================================================================ */
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Plus, Users, Search, Filter, Phone, Mail, Globe, Edit3, Trash2,
  Star, Building2, X, UserPlus, MapPin, ExternalLink
} from "lucide-react";
import { THEME } from "../theme.js";
import { isMobile } from "../utils.js";
import { Panel } from "../primitives.jsx";
import { useToast } from "../contexts.jsx";
import {
  isSaasMode, useSaasUser,
  fetchTeam, saveTeamContact, updateTeamContact, removeTeamContact,
  fetchLocalPros, fetchProReviews
} from "../lib/saas.js";

// Categories for the "Find Local Pros" panel. Each maps to the Google
// Places search query the server will run, plus the team_contacts.role
// the result will be saved under when the user hits "Add to Team".
const PRO_CATEGORIES = [
  { key: "lender",      label: "Lender",       icon: "💰" },
  { key: "contractor",  label: "Contractor",   icon: "🔨" },
  { key: "plumber",     label: "Plumber",      icon: "🚰" },
  { key: "electrician", label: "Electrician",  icon: "⚡" },
  { key: "roofer",      label: "Roofer",       icon: "🏠" },
  { key: "hvac",        label: "HVAC",         icon: "❄️" },
  { key: "cleaner",     label: "Cleaner",      icon: "🧹" },
  { key: "pm",          label: "Property Mgr", icon: "🔑" },
  { key: "title",       label: "Title Co.",    icon: "📜" },
  { key: "agent",       label: "Realtor",      icon: "🏘" },
  { key: "inspector",   label: "Inspector",    icon: "🔍" },
  { key: "insurance",   label: "Insurance",    icon: "🛡️" },
  { key: "attorney",    label: "Attorney",     icon: "⚖️" }
];

const ROLES = [
  { key: "agent",            label: "Agent",             icon: "🏠", hint: "Investor-friendly realtor" },
  { key: "lender",           label: "Lender",            icon: "💰", hint: "DSCR / conventional / private" },
  { key: "property_manager", label: "Property Manager",  icon: "🔑", hint: "Handles your rental" },
  { key: "contractor",       label: "Contractor",        icon: "🔨", hint: "Rehab / repairs" },
  { key: "inspector",        label: "Inspector",         icon: "🔍", hint: "Home / termite / HVAC" },
  { key: "title",            label: "Title / Escrow",    icon: "📜", hint: "Closing & escrow" },
  { key: "insurance",        label: "Insurance",         icon: "🛡️",  hint: "Property / landlord policy" },
  { key: "attorney",         label: "Attorney",          icon: "⚖️",  hint: "Real estate / eviction" },
  { key: "cpa",              label: "Accountant / CPA",  icon: "📊", hint: "Real estate tax" },
  { key: "wholesaler",       label: "Wholesaler",        icon: "📈", hint: "Off-market deal source" },
  { key: "other",            label: "Other",             icon: "👥", hint: "Anyone else" }
];
const ROLE_BY_KEY = Object.fromEntries(ROLES.map(r => [r.key, r]));

const EMPTY = {
  role: "agent", name: "", company: "", phone: "", email: "",
  website: "", city: "", state: "", notes: "", rating: null
};

function ContactFormModal({ initial, onSave, onClose, onDelete }) {
  const [draft, setDraft] = useState(initial || EMPTY);
  const [busy, setBusy] = useState(false);
  const update = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    if (!draft.name || !draft.role) return;
    setBusy(true);
    try { await onSave(draft); onClose(); }
    finally { setBusy(false); }
  };
  return (
    <div
      role="dialog" aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        zIndex: 150, padding: 16, overflowY: "auto"
      }}
    >
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} style={{
        background: THEME.bg, borderRadius: 12, maxWidth: 560, width: "100%",
        marginTop: 40, marginBottom: 40, padding: 24,
        boxShadow: "0 20px 60px rgba(15,23,42,0.22)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 className="serif" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
            {initial?.id ? "Edit Contact" : "Add Contact"}
          </h2>
          <button type="button" onClick={onClose} style={{
            border: "none", background: "transparent", cursor: "pointer", color: THEME.textMuted
          }} aria-label="Close"><X size={18} /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "1fr 1fr", gap: 10 }}>
          <label style={{ gridColumn: "1 / -1" }}>
            <div className="label-xs" style={{ marginBottom: 4 }}>Role *</div>
            <select value={draft.role} onChange={(e) => update("role", e.target.value)}
              style={{ width: "100%", padding: "8px 10px", fontSize: 13 }} required>
              {ROLES.map(r => <option key={r.key} value={r.key}>{r.icon}  {r.label} — {r.hint}</option>)}
            </select>
          </label>
          <label>
            <div className="label-xs" style={{ marginBottom: 4 }}>Name *</div>
            <input required value={draft.name} onChange={(e) => update("name", e.target.value)}
              style={{ width: "100%", padding: "8px 10px", fontSize: 13 }} />
          </label>
          <label>
            <div className="label-xs" style={{ marginBottom: 4 }}>Company</div>
            <input value={draft.company || ""} onChange={(e) => update("company", e.target.value)}
              style={{ width: "100%", padding: "8px 10px", fontSize: 13 }} />
          </label>
          <label>
            <div className="label-xs" style={{ marginBottom: 4 }}>Phone</div>
            <input type="tel" value={draft.phone || ""} onChange={(e) => update("phone", e.target.value)}
              placeholder="(555) 123-4567"
              style={{ width: "100%", padding: "8px 10px", fontSize: 13 }} />
          </label>
          <label>
            <div className="label-xs" style={{ marginBottom: 4 }}>Email</div>
            <input type="email" value={draft.email || ""} onChange={(e) => update("email", e.target.value)}
              style={{ width: "100%", padding: "8px 10px", fontSize: 13 }} />
          </label>
          <label>
            <div className="label-xs" style={{ marginBottom: 4 }}>Website</div>
            <input type="url" value={draft.website || ""} onChange={(e) => update("website", e.target.value)}
              placeholder="https://…"
              style={{ width: "100%", padding: "8px 10px", fontSize: 13 }} />
          </label>
          <label>
            <div className="label-xs" style={{ marginBottom: 4 }}>Rating (optional)</div>
            <select value={draft.rating ?? ""} onChange={(e) => update("rating", e.target.value === "" ? null : Number(e.target.value))}
              style={{ width: "100%", padding: "8px 10px", fontSize: 13 }}>
              <option value="">—</option>
              <option value="5">★★★★★</option>
              <option value="4">★★★★</option>
              <option value="3">★★★</option>
              <option value="2">★★</option>
              <option value="1">★</option>
            </select>
          </label>
          <label>
            <div className="label-xs" style={{ marginBottom: 4 }}>City</div>
            <input value={draft.city || ""} onChange={(e) => update("city", e.target.value)}
              style={{ width: "100%", padding: "8px 10px", fontSize: 13 }} />
          </label>
          <label>
            <div className="label-xs" style={{ marginBottom: 4 }}>State</div>
            <input value={draft.state || ""} onChange={(e) => update("state", e.target.value.toUpperCase())}
              maxLength={2} placeholder="FL"
              style={{ width: "100%", padding: "8px 10px", fontSize: 13, textTransform: "uppercase" }} />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            <div className="label-xs" style={{ marginBottom: 4 }}>Notes</div>
            <textarea rows={3} value={draft.notes || ""} onChange={(e) => update("notes", e.target.value)}
              placeholder="Specialty, best time to reach, referral fee arrangement, anything you want to remember"
              style={{ width: "100%", padding: "8px 10px", fontSize: 13, resize: "vertical" }} />
          </label>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "space-between" }}>
          <div>
            {initial?.id && (
              <button type="button" onClick={onDelete}
                className="btn-danger" style={{ padding: "8px 14px", fontSize: 12 }}>
                <Trash2 size={12} /> Delete
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: "8px 14px", fontSize: 12 }}>
              Cancel
            </button>
            <button type="submit" disabled={busy} className="btn-primary" style={{ padding: "8px 14px", fontSize: 12 }}>
              {busy ? "Saving…" : (initial?.id ? "Save changes" : "Add Contact")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

const ContactCard = ({ contact, onEdit }) => {
  const role = ROLE_BY_KEY[contact.role] || ROLE_BY_KEY.other;
  return (
    <div
      onClick={() => onEdit(contact)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onEdit(contact); } }}
      style={{
        border: `1px solid ${THEME.border}`,
        borderRadius: 8,
        padding: 14,
        background: THEME.bg,
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s"
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = THEME.accent;
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(15,23,42,0.06)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = THEME.border;
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <div style={{
            display: "inline-block", padding: "2px 7px", fontSize: 10, fontWeight: 700,
            background: THEME.bgTeal, color: THEME.teal,
            borderRadius: 4, letterSpacing: "0.06em", textTransform: "uppercase"
          }}>
            {role.icon} {role.label}
          </div>
        </div>
        <Edit3 size={14} color={THEME.textDim} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{contact.name}</div>
      {contact.company && <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 8 }}>{contact.company}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {contact.phone && (
          <a href={`tel:${contact.phone}`} onClick={(e) => e.stopPropagation()}
            style={{ fontSize: 12, color: THEME.accent, display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none" }}>
            <Phone size={11} /> {contact.phone}
          </a>
        )}
        {contact.email && (
          <a href={`mailto:${contact.email}`} onClick={(e) => e.stopPropagation()}
            style={{ fontSize: 12, color: THEME.accent, display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none", wordBreak: "break-all" }}>
            <Mail size={11} /> {contact.email}
          </a>
        )}
        {contact.website && (
          <a href={contact.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
            style={{ fontSize: 12, color: THEME.accent, display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none" }}>
            <Globe size={11} /> {contact.website.replace(/^https?:\/\//, "").slice(0, 30)}
          </a>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 8, borderTop: `1px solid ${THEME.borderLight}` }}>
        <span style={{ fontSize: 11, color: THEME.textMuted }}>
          {(contact.city || contact.state) ? [contact.city, contact.state].filter(Boolean).join(", ") : "—"}
        </span>
        {contact.rating ? (
          <span style={{ fontSize: 11, color: "#F59E0B", fontWeight: 700 }}>{"★".repeat(contact.rating)}</span>
        ) : null}
      </div>
      {contact.notes && (
        <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 8, lineHeight: 1.4,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {contact.notes}
        </div>
      )}
    </div>
  );
};

/**
 * ProReviewsModal — opens when a user clicks a pro result card. Fans out
 * to Google Place Details + Yelp Reviews server-side and renders the
 * merged review list with author, rating, source, and timestamp.
 */
function ProReviewsModal({ pro, getToken, onClose, onAdd, alreadyAdded }) {
  const [reviews, setReviews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const body = await fetchProReviews(getToken, {
          // For dual-source results, placeId is the Google one; for yelp-only
          // it's "yelp:<id>" — server-side detects and ignores accordingly.
          placeId: pro.placeId && !pro.placeId.startsWith("yelp:") ? pro.placeId : null,
          yelpId: pro.yelpId || null
        });
        if (!cancelled) setReviews(body);
      } catch (e) {
        if (!cancelled) setErr(e.message || "Couldn't load reviews");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pro.placeId, pro.yelpId, getToken]);

  const sources = pro.sources || ["google"];
  const isVerified = sources.length > 1;

  return (
    <div role="dialog" aria-modal="true" onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      zIndex: 150, padding: 16, overflowY: "auto"
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: THEME.bg, borderRadius: 12, maxWidth: 640, width: "100%",
        marginTop: 40, marginBottom: 40,
        boxShadow: "0 20px 60px rgba(15,23,42,0.22)", overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{ padding: "18px 22px 14px", borderBottom: `1px solid ${THEME.borderLight}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 className="serif" style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>
                {pro.name}
              </h2>
              {pro.address && (
                <div style={{ fontSize: 12, color: THEME.textMuted, lineHeight: 1.4 }}>{pro.address}</div>
              )}
            </div>
            <button onClick={onClose} aria-label="Close"
              style={{ border: "none", background: "transparent", cursor: "pointer", color: THEME.textMuted, padding: 4 }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            {pro.rating && (
              <span style={{ fontSize: 13, color: "#F59E0B", fontWeight: 700 }}>
                ★ {pro.rating} <span style={{ color: THEME.textDim, fontWeight: 500 }}>({pro.ratingCount} reviews)</span>
              </span>
            )}
            {isVerified && (
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                padding: "2px 6px", background: THEME.greenDim, color: THEME.green, borderRadius: 3
              }}>
                ✓ Verified · Google + Yelp
              </span>
            )}
          </div>

          {/* Quick actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {pro.phone && (
              <a href={`tel:${pro.phone}`} className="btn-secondary" style={{ padding: "6px 11px", fontSize: 11 }}>
                <Phone size={11} /> Call
              </a>
            )}
            {pro.website && (
              <a href={pro.website} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: "6px 11px", fontSize: 11 }}>
                <Globe size={11} /> Website
              </a>
            )}
            <button
              onClick={() => onAdd(pro)}
              disabled={alreadyAdded}
              className={alreadyAdded ? "btn-secondary" : "btn-primary"}
              style={{ padding: "6px 11px", fontSize: 11 }}>
              {alreadyAdded ? "✓ Already in your team" : "+ Add to Team"}
            </button>
          </div>
        </div>

        {/* Reviews body */}
        <div style={{ padding: "16px 22px 22px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: THEME.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
            Reviews
          </div>

          {loading && (
            <div style={{ padding: 40, textAlign: "center", color: THEME.textMuted, fontSize: 13 }}>
              Loading reviews…
            </div>
          )}
          {err && (
            <div style={{ padding: 12, background: THEME.bgOrange, color: THEME.orange, borderRadius: 6, fontSize: 12 }}>
              {err}
            </div>
          )}
          {reviews && !loading && reviews.reviews.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: THEME.textMuted, fontSize: 12 }}>
              No reviews available for this business yet.
            </div>
          )}
          {reviews && reviews.reviews.length > 0 && (
            <>
              <div style={{ fontSize: 10, color: THEME.textDim, marginBottom: 10 }}>
                {reviews.sources.google + reviews.sources.yelp} reviews ·
                {reviews.sources.google > 0 && ` ${reviews.sources.google} from Google`}
                {reviews.sources.google > 0 && reviews.sources.yelp > 0 && " ·"}
                {reviews.sources.yelp > 0 && ` ${reviews.sources.yelp} from Yelp`}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {reviews.reviews.map((r, i) => (
                  <div key={i} style={{
                    padding: 12, border: `1px solid ${THEME.borderLight}`,
                    borderRadius: 8, background: THEME.bgPanel
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {r.authorPhoto ? (
                          <img src={r.authorPhoto} alt=""
                            style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
                            onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        ) : (
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: THEME.bgRaised, color: THEME.textMuted,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 700
                          }}>
                            {(r.author || "?").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700 }}>{r.author}</div>
                          <div style={{ fontSize: 10, color: THEME.textDim }}>
                            {r.rating != null && <span style={{ color: "#F59E0B", fontWeight: 700 }}>{"★".repeat(Math.round(r.rating))}</span>}
                            {r.relativeTime && <span> · {r.relativeTime}</span>}
                          </div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                        padding: "2px 6px", borderRadius: 3,
                        background: r.source === "yelp" ? "#FEE2E2" : "#DBEAFE",
                        color:      r.source === "yelp" ? "#991B1B" : "#1E40AF"
                      }}>
                        {r.source}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: THEME.text, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                      {r.text}
                    </div>
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noopener noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, color: THEME.accent, textDecoration: "none", marginTop: 6 }}>
                        <ExternalLink size={10} /> Read on Yelp
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * FindProsPanel — pulls local businesses from Google Places by category +
 * ZIP, with a one-click "Add to Team" button per result.
 */
function FindProsPanel({ getToken, onAdd, savedNames }) {
  const [zip, setZip] = useState("");
  const [category, setCategory] = useState("contractor");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [meta, setMeta] = useState(null); // last { category, zip } we ran
  const [reviewing, setReviewing] = useState(null); // pro currently in reviews modal

  const onSearch = async (cat) => {
    if (!/^\d{5}$/.test(zip)) {
      setErr("Enter a 5-digit ZIP first.");
      return;
    }
    setBusy(true); setErr(null);
    try {
      const body = await fetchLocalPros(getToken, { category: cat, zip });
      setResults(body.results || []);
      setMeta({ category: cat, zip });
      setCategory(cat);
      if (!body.results || body.results.length === 0) {
        setErr("No matches for that area. Try a nearby ZIP.");
      }
    } catch (e) {
      setErr(e.message || "Search failed");
      setResults([]);
    } finally { setBusy(false); }
  };

  return (
    <Panel title="Find Local Pros" icon={<MapPin size={16} />} accent style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12 }}>
        Pick a category + ZIP. We'll surface the top businesses nearby — one click adds them to your team.
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <input
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
          placeholder="ZIP"
          maxLength={5}
          style={{ width: 90, padding: "8px 10px", fontSize: 13 }}
        />
        <span style={{ fontSize: 11, color: THEME.textDim }}>
          {meta ? `Last search: ${meta.category} near ${meta.zip}` : ""}
        </span>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {PRO_CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => onSearch(c.key)}
            disabled={busy}
            style={{
              padding: "6px 10px", fontSize: 11, fontWeight: 700,
              border: `1px solid ${category === c.key && results.length > 0 ? THEME.accent : THEME.border}`,
              background: category === c.key && results.length > 0 ? THEME.bgRaised : THEME.bg,
              color: category === c.key && results.length > 0 ? THEME.accent : THEME.text,
              borderRadius: 999, cursor: busy ? "wait" : "pointer",
              display: "inline-flex", alignItems: "center", gap: 4
            }}>
            <span>{c.icon}</span> {c.label}
          </button>
        ))}
      </div>

      {err && (
        <div style={{ padding: 10, marginBottom: 10, background: THEME.bgOrange, color: THEME.orange, borderRadius: 6, fontSize: 12 }}>
          {err}
        </div>
      )}

      {results.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
          {results.map(r => {
            const alreadyAdded = savedNames.has(r.name.toLowerCase());
            const sources = r.sources || ["google"];
            const isVerified = sources.length > 1; // appears in both Google + Yelp
            return (
              <div key={r.placeId}
                onClick={() => setReviewing(r)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setReviewing(r); } }}
                title="Click to read reviews"
                style={{
                  border: `1px solid ${isVerified ? THEME.green : THEME.border}`, borderRadius: 8, padding: 12,
                  background: THEME.bg, display: "flex", flexDirection: "column", gap: 6,
                  cursor: "pointer", transition: "border-color 0.15s, transform 0.15s, box-shadow 0.15s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = THEME.accent;
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(15,23,42,0.08)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isVerified ? THEME.green : THEME.border;
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{r.name}</div>
                  {r.rating && (
                    <span style={{ fontSize: 11, color: "#F59E0B", fontWeight: 700, whiteSpace: "nowrap" }}>
                      ★ {r.rating} <span style={{ color: THEME.textDim, fontWeight: 500 }}>({r.ratingCount})</span>
                    </span>
                  )}
                </div>

                {/* Source badges — green "Verified" when both Google + Yelp matched */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {isVerified && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                      padding: "2px 6px", background: THEME.greenDim, color: THEME.green, borderRadius: 3
                    }}>
                      ✓ Verified · Google + Yelp
                    </span>
                  )}
                  {!isVerified && sources.includes("yelp") && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                      padding: "2px 6px", background: THEME.bgRaised, color: THEME.textMuted, borderRadius: 3
                    }}>
                      Yelp
                    </span>
                  )}
                  {!isVerified && sources.includes("google") && !sources.includes("yelp") && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                      padding: "2px 6px", background: THEME.bgRaised, color: THEME.textMuted, borderRadius: 3
                    }}>
                      Google
                    </span>
                  )}
                </div>

                {r.address && (
                  <div style={{ fontSize: 11, color: THEME.textMuted, lineHeight: 1.4 }}>{r.address}</div>
                )}
                <div style={{ display: "flex", gap: 8, fontSize: 11, color: THEME.accent, flexWrap: "wrap" }}>
                  {r.phone && (
                    <a href={`tel:${r.phone}`} onClick={(e) => e.stopPropagation()} style={{ color: THEME.accent, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <Phone size={11} /> {r.phone}
                    </a>
                  )}
                  {r.website && (
                    <a href={r.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: THEME.accent, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <Globe size={11} /> Site
                    </a>
                  )}
                  {r.mapsUrl && (
                    <a href={r.mapsUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: THEME.accent, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <ExternalLink size={11} /> Maps
                    </a>
                  )}
                  {r.yelpUrl && (
                    <a href={r.yelpUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: THEME.accent, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <ExternalLink size={11} /> Yelp
                    </a>
                  )}
                </div>

                {/* NMLS verify link — only on lender results. Opens a Google
                    site-search of nmlsconsumeraccess.org so the user can
                    confirm the license. */}
                {r.nmlsVerifyUrl && (
                  <a href={r.nmlsVerifyUrl} target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "4px 8px", fontSize: 10, fontWeight: 700,
                      background: THEME.bgTeal, color: THEME.teal,
                      border: `1px solid ${THEME.teal}`, borderRadius: 4,
                      textDecoration: "none", alignSelf: "flex-start"
                    }}>
                    🔒 Verify NMLS license →
                  </a>
                )}

                <button
                  onClick={(e) => { e.stopPropagation(); onAdd(r); }}
                  disabled={alreadyAdded}
                  className={alreadyAdded ? "btn-secondary" : "btn-primary"}
                  style={{ marginTop: "auto", padding: "6px 10px", fontSize: 11, justifyContent: "center" }}>
                  {alreadyAdded ? "✓ Already in your team" : "+ Add to Team"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {meta && results.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 10, color: THEME.textDim }}>
          Click any result to read reviews · Sources: Google Places{results.some(r => r.sources?.includes("yelp")) ? " + Yelp Fusion" : ""}
          {category === "lender" && " · NMLS verify links open the federal Consumer Access registry"}
        </div>
      )}

      {reviewing && (
        <ProReviewsModal
          pro={reviewing}
          getToken={getToken}
          onClose={() => setReviewing(null)}
          onAdd={(pro) => { onAdd(pro); setReviewing(null); }}
          alreadyAdded={savedNames.has(reviewing.name.toLowerCase())}
        />
      )}
    </Panel>
  );
}

export const TeamView = () => {
  const saas = useSaasUser();
  const saasOn = isSaasMode();
  const toast = useToast();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null); // null = closed, {} = new, contact = edit

  const load = useCallback(async () => {
    if (!saasOn || !saas.user) { setContacts([]); setLoading(false); return; }
    try {
      setLoading(true);
      const list = await fetchTeam(saas.getToken);
      setContacts(list);
    } catch (e) {
      console.warn("team load failed:", e);
    } finally { setLoading(false); }
  }, [saasOn, saas.user, saas.getToken]);
  useEffect(() => { load(); }, [load]);

  const handleSave = async (draft) => {
    try {
      if (draft.id) {
        const { id, created_at, updated_at, user_id, ...updates } = draft;
        const { contact } = await updateTeamContact(saas.getToken, id, updates);
        setContacts(prev => prev.map(c => c.id === id ? contact : c));
        toast.push("Contact updated", "success");
      } else {
        const { contact } = await saveTeamContact(saas.getToken, draft);
        setContacts(prev => [...prev, contact]);
        toast.push("Contact added", "success");
      }
    } catch (e) {
      toast.push(e.message || "Save failed", "error");
      throw e;
    }
  };
  const handleDelete = async () => {
    if (!editing?.id) return;
    if (!confirm(`Delete ${editing.name}?`)) return;
    try {
      await removeTeamContact(saas.getToken, editing.id);
      setContacts(prev => prev.filter(c => c.id !== editing.id));
      toast.push("Contact removed", "info");
      setEditing(null);
    } catch (e) {
      toast.push(e.message || "Delete failed", "error");
    }
  };

  const states = useMemo(() => {
    const s = new Set(contacts.map(c => c.state).filter(Boolean));
    return [...s].sort();
  }, [contacts]);

  // Names already saved (lowercased) — used by FindProsPanel to dim the
  // "Add to Team" button on duplicates.
  const savedNames = useMemo(
    () => new Set(contacts.map(c => (c.name || "").toLowerCase()).filter(Boolean)),
    [contacts]
  );

  // Hand a Google Places result to /api/team. Splits the address into
  // city/state when possible, otherwise leaves them blank for the user to fill.
  const handleAddPro = async (pro) => {
    const m = (pro.address || "").match(/,\s*([^,]+),\s*([A-Z]{2})/);
    const city = m ? m[1].trim() : "";
    const state = m ? m[2].trim() : "";
    const draft = {
      role: pro.role || "other",
      name: pro.name,
      company: pro.name,
      phone: pro.phone || "",
      email: "",
      website: pro.website || "",
      city, state,
      notes: `Added from Find Local Pros · ${pro.address || ""}`.trim(),
      rating: pro.rating ? Math.round(pro.rating) : null
    };
    try {
      const { contact } = await saveTeamContact(saas.getToken, draft);
      setContacts(prev => [...prev, contact]);
      toast.push(`${pro.name} added to your team`, "success");
    } catch (e) {
      toast.push(e.message || "Add failed", "error");
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contacts.filter(c => {
      if (roleFilter !== "all" && c.role !== roleFilter) return false;
      if (stateFilter !== "all" && c.state !== stateFilter) return false;
      if (!q) return true;
      const hay = [c.name, c.company, c.city, c.notes].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [contacts, roleFilter, stateFilter, query]);

  const grouped = useMemo(() => {
    const out = {};
    for (const c of filtered) {
      const role = c.role || "other";
      if (!out[role]) out[role] = [];
      out[role].push(c);
    }
    return out;
  }, [filtered]);

  if (!saasOn || !saas.user) {
    return (
      <div style={{ maxWidth: 560, margin: "60px auto", padding: 24, textAlign: "center" }}>
        <Users size={32} color={THEME.textDim} style={{ marginBottom: 12 }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Sign in to build your team</h2>
        <p style={{ fontSize: 13, color: THEME.textMuted }}>
          Store agents, lenders, PMs, contractors, and more — synced across devices.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile() ? "16px" : "24px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Your Real Estate Team</h1>
          <p style={{ fontSize: 13, color: THEME.textMuted, margin: "4px 0 0" }}>
            The local pros you trust — one click away for every deal.
          </p>
        </div>
        <button onClick={() => setEditing({})} className="btn-primary" style={{ padding: "10px 16px", fontSize: 13 }}>
          <UserPlus size={14} /> Add Contact
        </button>
      </div>

      <FindProsPanel
        getToken={saas.getToken}
        onAdd={handleAddPro}
        savedNames={savedNames}
      />

      <Panel title="Filters" icon={<Filter size={16} />} accent style={{ marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "2fr 1fr 1fr", gap: 10 }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: THEME.textMuted }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, company, city, notes…"
              style={{ width: "100%", padding: "9px 10px 9px 32px", fontSize: 13 }} />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            style={{ padding: "9px 10px", fontSize: 13 }}>
            <option value="all">All roles</option>
            {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}
            style={{ padding: "9px 10px", fontSize: 13 }} disabled={states.length === 0}>
            <option value="all">All states</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </Panel>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: THEME.textMuted, fontSize: 13 }}>
          Loading your team…
        </div>
      ) : contacts.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center", background: THEME.bgPanel, border: `1px dashed ${THEME.border}`, borderRadius: 10 }}>
          <Building2 size={32} color={THEME.textDim} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No contacts yet</div>
          <p style={{ fontSize: 12, color: THEME.textMuted, maxWidth: 380, margin: "0 auto 16px" }}>
            Real-estate investing is a team sport. Start adding the agents, lenders, PMs, and contractors you lean on for each market.
          </p>
          <button onClick={() => setEditing({})} className="btn-primary" style={{ padding: "9px 14px", fontSize: 13 }}>
            <Plus size={13} /> Add your first contact
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", color: THEME.textMuted, fontSize: 13 }}>
          No contacts match the current filters.{" "}
          <button
            onClick={() => { setQuery(""); setRoleFilter("all"); setStateFilter("all"); }}
            style={{
              border: "none", background: "transparent", padding: 0,
              color: THEME.accent, fontSize: 13, fontWeight: 600,
              cursor: "pointer", textDecoration: "underline"
            }}>
            Clear filters
          </button>
        </div>
      ) : (
        ROLES.filter(r => grouped[r.key]?.length > 0).map(role => (
          <div key={role.key} style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: THEME.accent,
              textTransform: "uppercase", letterSpacing: "0.1em",
              marginBottom: 10, display: "flex", alignItems: "center", gap: 6
            }}>
              {role.icon} {role.label} ({grouped[role.key].length})
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile() ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 12
            }}>
              {grouped[role.key].map(c => (
                <ContactCard key={c.id} contact={c} onEdit={setEditing} />
              ))}
            </div>
          </div>
        ))
      )}

      {editing !== null && (
        <ContactFormModal
          initial={editing.id ? editing : null}
          onSave={handleSave}
          onClose={() => setEditing(null)}
          onDelete={handleDelete}
        />
      )}

      <Panel title="Don't have the team yet?" icon={<Users size={16} />} style={{ marginTop: 24 }}>
        <div style={{ fontSize: 13, color: THEME.textMuted, lineHeight: 1.6 }}>
          <p style={{ margin: "0 0 10px" }}>Where investor-focused pros tend to hang out:</p>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
            <li><strong>BiggerPockets</strong> — forums + referral threads by state → <a href="https://www.biggerpockets.com/forums" target="_blank" rel="noopener noreferrer" style={{ color: THEME.accent }}>biggerpockets.com/forums</a></li>
            <li><strong>Local REIA</strong> (Real Estate Investors Association) meetups — searchable at <a href="https://nationalreia.org/membership/find-a-reia/" target="_blank" rel="noopener noreferrer" style={{ color: THEME.accent }}>nationalreia.org</a></li>
            <li><strong>Zillow Premier Agent directory</strong> for agents by zip → <a href="https://www.zillow.com/professionals/real-estate-agent-reviews/" target="_blank" rel="noopener noreferrer" style={{ color: THEME.accent }}>zillow.com/professionals</a></li>
            <li><strong>DSCR-loan specialists</strong>: Kiavi, Visio, RCN Capital, Lima One — they all have broker programs with lender lists</li>
            <li><strong>Facebook groups</strong>: "[State] Real Estate Investors" groups are surprisingly active for PM / contractor referrals</li>
          </ul>
        </div>
      </Panel>
    </div>
  );
};
