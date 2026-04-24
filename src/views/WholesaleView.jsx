/* ============================================================================
   WHOLESALE VIEW — distressed/absentee/long-time-owner lead finder with
   skip trace + email outreach. Premium feature (paid plans only).
   ============================================================================ */
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Search, Phone, Mail, Trash2, Star, Crown, Users, Clock,
  Home, Zap, CheckCircle2, MessageSquare, DollarSign, AlertTriangle, X,
  Send
} from "lucide-react";
import { THEME } from "../theme.js";
import { fmtUSD, isMobile } from "../utils.js";
import { Panel } from "../primitives.jsx";
import { useToast } from "../contexts.jsx";
import {
  isSaasMode, useSaasUser,
  searchWholesaleLeads, listWholesaleLeads, saveWholesaleLead,
  skipTraceLead, updateWholesaleLead, deleteWholesaleLead, emailWholesaleLead,
  sendPostcard
} from "../lib/saas.js";
import { STATE_NAMES } from "../market/mapUtils.js";
import { CITIES_BY_STATE } from "../lib/usCities.js";

const STATUSES = [
  { key: "new",         label: "New",         color: THEME.textMuted },
  { key: "contacted",   label: "Contacted",   color: THEME.accent },
  { key: "responded",   label: "Responded",   color: THEME.teal },
  { key: "negotiating", label: "Negotiating", color: THEME.orange },
  { key: "closed",      label: "Closed",      color: THEME.green },
  { key: "passed",      label: "Passed",      color: THEME.textDim }
];
const STATUS_BY_KEY = Object.fromEntries(STATUSES.map(s => [s.key, s]));

const EMAIL_TEMPLATE = (lead) => ({
  subject: `Interested in your property at ${lead.address}`,
  body: `Hi ${(lead.owner_name || "there").split(",")[1]?.trim() || "there"},

My name is [Your Name], and I'm a local real estate investor looking at properties in ${lead.city || "your area"}.

I came across your property at ${lead.address} and wanted to reach out directly. I'm not a realtor — I'm interested in making a cash offer if you're open to selling.

A few things I can offer:
  • Cash close, no financing contingency
  • Flexible closing timeline (as-is, no repairs needed)
  • Zero agent fees

If there's any chance you'd consider selling, I'd love a quick 5-minute call to see if we can make it work. Otherwise, no worries — thanks for reading.

Best,
[Your Name]
[Your Phone]`
});

const POSTCARD_TEMPLATE = (lead) => (
`Hi ${(lead.owner_name || "").split(",")[1]?.trim() || "there"},

I'm a local real estate investor interested in your property at ${lead.address}${lead.city ? ", " + lead.city : ""}. I'm not a realtor — I'd like to make a direct cash offer.

What I can offer:
  - Cash close, no financing contingency
  - Flexible closing timeline, as-is, no repairs needed
  - Zero agent fees

If you'd consider selling, please give me a call — worst case I hand you a free estimate of the current market value of your home.

Thanks for your time,
[Your Name]
[Your Phone]`
);

const PostcardModal = ({ lead, onSend, onClose }) => {
  const [message, setMessage] = useState(POSTCARD_TEMPLATE(lead));
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState(null);

  return (
    <div role="dialog" aria-modal="true" onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      zIndex: 150, padding: 16, overflowY: "auto"
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: THEME.bg, borderRadius: 12, maxWidth: 600, width: "100%",
        marginTop: 40, padding: 24, boxShadow: "0 20px 60px rgba(15,23,42,0.22)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 className="serif" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            Send postcard — {lead.owner_name || "owner"}
          </h2>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: THEME.textMuted }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
          Mails to: <strong>{lead.owner_mailing_address || lead.address}, {lead.owner_mailing_city || lead.city} {lead.owner_mailing_state || lead.state} {lead.owner_mailing_zip || lead.zip}</strong>
          <br />Charged to your Lob account (~$0.69).
        </div>
        <label style={{ display: "block" }}>
          <div className="label-xs" style={{ marginBottom: 4 }}>Back-of-postcard message</div>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={13}
            style={{ width: "100%", padding: "8px 10px", fontSize: 12, fontFamily: "inherit", resize: "vertical" }} />
        </label>
        <div style={{ fontSize: 10, color: THEME.textDim, marginTop: 6 }}>
          Replace <code>[Your Name]</code> / <code>[Your Phone]</code> before sending. Front of postcard uses a default DealTrack-branded "Interested in your home?" header.
        </div>
        {err && <div style={{ marginTop: 10, padding: 10, background: THEME.redDim, color: THEME.red, borderRadius: 6, fontSize: 12 }}>{err}</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: "8px 14px", fontSize: 12 }}>Cancel</button>
          <button className="btn-primary" disabled={sending || !message.trim()}
            onClick={async () => {
              setSending(true); setErr(null);
              try { await onSend({ message }); onClose(); }
              catch (e) { setErr(e.message || "Send failed"); setSending(false); }
            }}
            style={{ padding: "8px 14px", fontSize: 12 }}>
            <Send size={13} /> {sending ? "Sending…" : "Send postcard"}
          </button>
        </div>
      </div>
    </div>
  );
};

const EmailModal = ({ lead, onSend, onClose }) => {
  const [subject, setSubject] = useState(EMAIL_TEMPLATE(lead).subject);
  const [body, setBody] = useState(EMAIL_TEMPLATE(lead).body);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState(null);

  return (
    <div role="dialog" aria-modal="true" onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        zIndex: 150, padding: 16, overflowY: "auto"
      }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: THEME.bg, borderRadius: 12, maxWidth: 600, width: "100%",
        marginTop: 40, padding: 24,
        boxShadow: "0 20px 60px rgba(15,23,42,0.22)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 className="serif" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            Email {lead.owner_name || "owner"}
          </h2>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: THEME.textMuted }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12 }}>
          To: <strong>{lead.owner_email}</strong>
        </div>
        <label style={{ display: "block", marginBottom: 12 }}>
          <div className="label-xs" style={{ marginBottom: 4 }}>Subject</div>
          <input value={subject} onChange={(e) => setSubject(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", fontSize: 13 }} />
        </label>
        <label style={{ display: "block" }}>
          <div className="label-xs" style={{ marginBottom: 4 }}>Message</div>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={14}
            style={{ width: "100%", padding: "8px 10px", fontSize: 12, fontFamily: "inherit", resize: "vertical" }} />
        </label>
        <div style={{ fontSize: 10, color: THEME.textDim, marginTop: 8, lineHeight: 1.5 }}>
          Tip: replace the <code>[Your Name]</code> / <code>[Your Phone]</code> placeholders before sending. A CAN-SPAM footer with your sender info is added automatically.
        </div>
        {err && (
          <div style={{ marginTop: 10, padding: 10, background: THEME.redDim, color: THEME.red, borderRadius: 6, fontSize: 12 }}>
            {err}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: "8px 14px", fontSize: 12 }}>Cancel</button>
          <button
            className="btn-primary"
            disabled={sending || !subject.trim() || !body.trim()}
            onClick={async () => {
              setSending(true); setErr(null);
              try { await onSend({ subject, body }); onClose(); }
              catch (e) { setErr(e.message || "Send failed"); setSending(false); }
            }}
            style={{ padding: "8px 14px", fontSize: 12 }}>
            <Mail size={13} /> {sending ? "Sending…" : "Send email"}
          </button>
        </div>
      </div>
    </div>
  );
};

/** Full-detail modal — opened by clicking a lead card. Surfaces every
 * field ATTOM + skip-trace + Google gave us, with inline actions. */
const WholesaleDetailModal = ({ lead, onClose, onSkipTrace, onEmail, onPostcard, onStatusChange, onSave, busy }) => {
  const status = STATUS_BY_KEY[lead.status] || STATUS_BY_KEY.new;
  const isSearchResult = !!lead.__isSearchResult;
  const flags = [];
  if (lead.is_tax_delinquent) flags.push({ label: "Pre-foreclosure / tax distressed", color: THEME.red, icon: <DollarSign size={11} /> });
  if (lead.is_absentee) flags.push({ label: "Absentee owner", color: THEME.accent, icon: <Home size={11} /> });
  if (lead.is_long_time_owner) flags.push({ label: `Held ${lead.years_owned}+ years`, color: THEME.orange, icon: <Clock size={11} /> });

  const [view, setView] = useState("street");
  const activeSrc = view === "satellite" ? lead.satellite_url : lead.streetview_url;

  const kv = (label, value, opts = {}) => value ? (
    <div style={{ padding: "6px 0", borderBottom: `1px solid ${THEME.borderLight}` }}>
      <div style={{ fontSize: 10, color: THEME.textMuted, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: opts.bold ? 700 : 500, color: opts.color || THEME.text, marginTop: 2 }}>{value}</div>
    </div>
  ) : null;

  return (
    <div role="dialog" aria-modal="true" onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        zIndex: 150, padding: 16, overflowY: "auto"
      }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: THEME.bg, borderRadius: 12, maxWidth: 780, width: "100%",
        marginTop: 40, marginBottom: 40,
        boxShadow: "0 20px 60px rgba(15,23,42,0.22)", overflow: "hidden"
      }}>
        {/* Hero */}
        {(lead.streetview_url || lead.satellite_url) && (
          <div style={{ position: "relative", aspectRatio: "16 / 9", background: THEME.bgPanel }}>
            {activeSrc && (
              <img src={activeSrc} alt={lead.address} loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
            {lead.streetview_url && lead.satellite_url && (
              <div style={{ position: "absolute", top: 12, right: 12, display: "flex",
                background: "rgba(15,23,42,0.78)", borderRadius: 999, padding: 2, fontSize: 10, fontWeight: 700 }}>
                {[
                  { key: "street", label: "Street" },
                  { key: "satellite", label: "Aerial" }
                ].map(opt => (
                  <button key={opt.key} onClick={() => setView(opt.key)}
                    style={{
                      padding: "3px 10px", border: "none", cursor: "pointer",
                      background: view === opt.key ? "#FFFFFF" : "transparent",
                      color: view === opt.key ? THEME.navy : "#FFFFFF",
                      borderRadius: 999, letterSpacing: "0.04em", textTransform: "uppercase"
                    }}>{opt.label}</button>
                ))}
              </div>
            )}
            <button onClick={onClose} aria-label="Close"
              style={{
                position: "absolute", top: 12, left: 12,
                width: 34, height: 34, borderRadius: "50%",
                background: "rgba(15,23,42,0.72)", color: "#fff",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
              <X size={16} />
            </button>
          </div>
        )}

        <div style={{ padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
            <div>
              <h2 className="serif" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{lead.address}</h2>
              <div style={{ fontSize: 13, color: THEME.textMuted, marginTop: 2 }}>
                {[lead.city, lead.state, lead.zip].filter(Boolean).join(", ")}
              </div>
            </div>
            <div style={{
              padding: "4px 10px", fontSize: 12, fontWeight: 700,
              background: lead.lead_score >= 60 ? THEME.greenDim : lead.lead_score >= 40 ? THEME.bgOrange : THEME.bgRaised,
              color: lead.lead_score >= 60 ? THEME.green : lead.lead_score >= 40 ? THEME.orange : THEME.textMuted,
              borderRadius: 6, flexShrink: 0
            }}>
              Score {lead.lead_score}/100
            </div>
          </div>

          {/* Flags */}
          {flags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {flags.map((f, i) => (
                <span key={i} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 9px", fontSize: 11, fontWeight: 700,
                  background: f.color === THEME.red ? THEME.redDim : f.color === THEME.accent ? THEME.bgRaised : THEME.bgOrange,
                  color: f.color, borderRadius: 4
                }}>{f.icon}{f.label}</span>
              ))}
            </div>
          )}

          {/* Contact block — prominent, what the investor actually needs */}
          <div style={{
            padding: 14, marginBottom: 16,
            background: (lead.owner_phone || lead.owner_email) ? THEME.bgTeal : THEME.bgPanel,
            border: `1px solid ${(lead.owner_phone || lead.owner_email) ? THEME.teal : THEME.border}`,
            borderRadius: 8
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
              color: (lead.owner_phone || lead.owner_email) ? THEME.teal : THEME.textMuted, marginBottom: 8 }}>
              Owner contact
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{lead.owner_name || "—"}</div>
            {lead.owner_mailing_address && (
              <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 8, lineHeight: 1.4 }}>
                Mailing: {lead.owner_mailing_address}
                {(lead.owner_mailing_city || lead.owner_mailing_state) && (
                  <>, {[lead.owner_mailing_city, lead.owner_mailing_state, lead.owner_mailing_zip].filter(Boolean).join(", ")}</>
                )}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {lead.owner_phone ? (
                <a href={`tel:${lead.owner_phone}`} style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: 14, fontWeight: 700, color: THEME.teal, textDecoration: "none"
                }}>
                  <Phone size={14} /> {lead.owner_phone}
                </a>
              ) : null}
              {lead.owner_email ? (
                <a href={`mailto:${lead.owner_email}`} style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: 14, fontWeight: 700, color: THEME.teal, textDecoration: "none",
                  wordBreak: "break-all"
                }}>
                  <Mail size={14} /> {lead.owner_email}
                </a>
              ) : null}
              {!lead.owner_phone && !lead.owner_email && !isSearchResult && (
                <button onClick={() => onSkipTrace(lead.id)} disabled={busy}
                  className="btn-primary" style={{ padding: "6px 12px", fontSize: 12 }}>
                  <Zap size={12} /> Run skip trace to find phone / email
                </button>
              )}
              {!lead.owner_phone && !lead.owner_email && isSearchResult && (
                <span style={{ fontSize: 11, color: THEME.textMuted }}>
                  Save as lead first, then run skip trace to find phone/email.
                </span>
              )}
            </div>
          </div>

          {/* Property detail grid */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: THEME.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Property</div>
              {kv("Type", lead.property_type)}
              {kv("Year built", lead.year_built)}
              {kv("Bedrooms / Bathrooms", `${lead.bedrooms || "?"} / ${lead.bathrooms || "?"}`)}
              {kv("Square footage", lead.sqft ? lead.sqft.toLocaleString() : null)}
              {kv("County", lead.county)}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: THEME.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Financials</div>
              {kv("Market value", lead.market_value ? fmtUSD(lead.market_value) : null, { bold: true })}
              {kv("Assessed value", lead.assessed_value ? fmtUSD(lead.assessed_value) : null)}
              {kv("Last sale price", lead.last_sale_price ? fmtUSD(lead.last_sale_price) : null, { bold: true, color: THEME.accent })}
              {kv("Last sale date", lead.last_sale_date)}
              {kv("Years owned", lead.years_owned != null ? `${lead.years_owned} years` : null)}
            </div>
          </div>

          {/* Status + notes (only for saved leads) */}
          {!isSearchResult && (
            <div style={{ padding: 12, background: THEME.bgPanel, borderRadius: 8, border: `1px solid ${THEME.border}`, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginBottom: lead.notes ? 8 : 0 }}>
                <span style={{ color: THEME.textMuted }}>Status:</span>
                <select value={lead.status} onChange={(e) => onStatusChange(lead.id, e.target.value)}
                  style={{
                    padding: "4px 8px", fontSize: 12, borderRadius: 4,
                    border: `1px solid ${status.color}`, background: THEME.bg, color: status.color, fontWeight: 700
                  }}>
                  {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              {lead.notes && (
                <div style={{ fontSize: 12, color: THEME.textMuted, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                  <strong style={{ color: THEME.text }}>Notes:</strong> {lead.notes}
                </div>
              )}
            </div>
          )}

          {/* Action row */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {isSearchResult ? (
              <button onClick={() => onSave && onSave(lead)} className="btn-primary"
                style={{ padding: "8px 14px", fontSize: 12 }}>
                <Star size={13} /> Save as lead
              </button>
            ) : (
              <>
                <button onClick={() => onPostcard(lead)} className="btn-secondary" style={{ padding: "8px 14px", fontSize: 12 }}>
                  <Send size={13} /> Send postcard
                </button>
                {lead.owner_email && (
                  <button onClick={() => onEmail(lead)} className="btn-secondary" style={{ padding: "8px 14px", fontSize: 12 }}>
                    <Mail size={13} /> Email owner
                  </button>
                )}
                {!lead.skip_traced_at && (
                  <button onClick={() => onSkipTrace(lead.id)} disabled={busy}
                    className="btn-primary" style={{ padding: "8px 14px", fontSize: 12 }}>
                    <Zap size={13} /> Skip trace
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PropertyPhoto = ({ streetSrc, satelliteSrc, alt, aspectRatio = "4 / 3" }) => {
  const [view, setView] = useState("street");        // "street" | "satellite"
  const [errored, setErrored] = useState({ street: false, satellite: false });
  const src = view === "satellite" ? satelliteSrc : streetSrc;
  const thisErrored = errored[view];
  const hasBoth = !!streetSrc && !!satelliteSrc;

  if ((!src || thisErrored) && (!streetSrc && !satelliteSrc)) {
    return (
      <div style={{
        width: "100%", aspectRatio,
        background: THEME.bgPanel, borderRadius: 6,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: THEME.textDim
      }}>
        <Home size={24} />
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio, borderRadius: 6, overflow: "hidden" }}>
      {src && !thisErrored ? (
        <img
          src={src} alt={alt}
          onError={() => setErrored(e => ({ ...e, [view]: true }))}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", background: THEME.bgPanel, display: "block" }}
        />
      ) : (
        <div style={{
          width: "100%", height: "100%", background: THEME.bgPanel,
          display: "flex", alignItems: "center", justifyContent: "center", color: THEME.textDim
        }}>
          <Home size={24} />
        </div>
      )}

      {hasBoth && (
        <div style={{
          position: "absolute", top: 8, right: 8,
          display: "flex", background: "rgba(15, 23, 42, 0.78)",
          borderRadius: 999, padding: 2, fontSize: 10, fontWeight: 700
        }}>
          {[
            { key: "street", label: "Street" },
            { key: "satellite", label: "Aerial" }
          ].map(opt => (
            <button
              key={opt.key}
              onClick={(e) => { e.stopPropagation(); setView(opt.key); }}
              style={{
                padding: "3px 8px", border: "none", cursor: "pointer",
                background: view === opt.key ? "#FFFFFF" : "transparent",
                color: view === opt.key ? THEME.navy : "#FFFFFF",
                borderRadius: 999,
                letterSpacing: "0.04em", textTransform: "uppercase"
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const LeadCard = ({ lead, onSkipTrace, onStatusChange, onDelete, onEmail, onPostcard, onOpen, busy }) => {
  const status = STATUS_BY_KEY[lead.status] || STATUS_BY_KEY.new;
  const flags = [];
  if (lead.is_tax_delinquent) flags.push({ icon: <DollarSign size={10} />, label: "Tax delinquent", color: THEME.red });
  if (lead.is_absentee) flags.push({ icon: <Home size={10} />, label: "Absentee", color: THEME.accent });
  if (lead.is_long_time_owner) flags.push({ icon: <Clock size={10} />, label: `${lead.years_owned}yr+`, color: THEME.orange });

  const stop = (e) => e.stopPropagation();

  return (
    <div onClick={() => onOpen && onOpen(lead)} style={{
      border: `1px solid ${THEME.border}`, borderRadius: 8, padding: 14,
      background: THEME.bg, display: "flex", flexDirection: "column", gap: 10,
      cursor: onOpen ? "pointer" : "default"
    }}>
      <PropertyPhoto streetSrc={lead.streetview_url} satelliteSrc={lead.satellite_url} alt={lead.address} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{lead.address}</div>
          <div style={{ fontSize: 11, color: THEME.textMuted }}>
            {[lead.city, lead.state, lead.zip].filter(Boolean).join(", ")}
          </div>
        </div>
        <div style={{
          padding: "3px 8px", fontSize: 10, fontWeight: 700,
          background: lead.lead_score >= 60 ? THEME.greenDim : lead.lead_score >= 40 ? THEME.bgOrange : THEME.bgRaised,
          color: lead.lead_score >= 60 ? THEME.green : lead.lead_score >= 40 ? THEME.orange : THEME.textMuted,
          borderRadius: 4
        }}>
          {lead.lead_score}/100
        </div>
      </div>

      {flags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {flags.map((f, i) => (
            <span key={i} style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              padding: "2px 6px", fontSize: 10, fontWeight: 700,
              background: f.color === THEME.red ? THEME.redDim
                : f.color === THEME.accent ? THEME.bgRaised
                : THEME.bgOrange,
              color: f.color, borderRadius: 4
            }}>
              {f.icon}{f.label}
            </span>
          ))}
        </div>
      )}

      {/* Owner block — name + mailing address are PUBLIC record (ATTOM).
          Phone/email only appear once the user skip-traces the lead. */}
      <div style={{
        padding: "8px 10px", background: THEME.bgPanel,
        border: `1px solid ${THEME.borderLight}`, borderRadius: 6, fontSize: 11
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: THEME.textMuted, marginBottom: 4 }}>
          Owner
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{lead.owner_name || "—"}</div>
        {lead.owner_mailing_address && (
          <div style={{ fontSize: 11, color: THEME.textMuted, lineHeight: 1.4 }}>
            {lead.owner_mailing_address}
            {(lead.owner_mailing_city || lead.owner_mailing_state) && <>
              <br />
              {[lead.owner_mailing_city, lead.owner_mailing_state, lead.owner_mailing_zip].filter(Boolean).join(", ")}
            </>}
            {lead.is_absentee && <span style={{ marginLeft: 6, color: THEME.accent, fontWeight: 600 }}>· absentee</span>}
          </div>
        )}
      </div>

      <div style={{ fontSize: 11, color: THEME.textMuted, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
        <div><strong>Built:</strong> {lead.year_built || "—"}</div>
        <div><strong>Sqft:</strong> {lead.sqft ? lead.sqft.toLocaleString() : "—"}</div>
        <div><strong>Beds/Bath:</strong> {lead.bedrooms || "?"}/{lead.bathrooms || "?"}</div>
        {lead.years_owned != null && <div><strong>Held:</strong> {lead.years_owned}yr</div>}
        {lead.market_value && <div><strong>Value:</strong> {fmtUSD(lead.market_value, { short: true })}</div>}
        {lead.last_sale_price && <div><strong>Bought:</strong> {fmtUSD(lead.last_sale_price, { short: true })}</div>}
      </div>

      {/* Contact info (after skip trace) */}
      {(lead.owner_phone || lead.owner_email) && (
        <div style={{ padding: "8px 10px", background: THEME.bgTeal, border: `1px solid ${THEME.teal}`, borderRadius: 6, fontSize: 12 }}>
          {lead.owner_phone && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
              <Phone size={11} color={THEME.teal} />
              <a href={`tel:${lead.owner_phone}`} onClick={stop} style={{ color: THEME.teal, fontWeight: 600, textDecoration: "none" }}>
                {lead.owner_phone}
              </a>
            </div>
          )}
          {lead.owner_email && (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Mail size={11} color={THEME.teal} />
              <span style={{ color: THEME.teal, wordBreak: "break-all" }}>{lead.owner_email}</span>
            </div>
          )}
        </div>
      )}

      <div onClick={stop} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: "auto" }}>
        <select
          value={lead.status}
          onChange={(e) => onStatusChange(lead.id, e.target.value)}
          onClick={stop}
          style={{
            padding: "5px 8px", fontSize: 11, borderRadius: 4,
            border: `1px solid ${status.color}`, background: THEME.bg, color: status.color,
            fontWeight: 700
          }}
        >
          {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>

        {!lead.skip_traced_at ? (
          <button onClick={(e) => { stop(e); onSkipTrace(lead.id); }} disabled={busy}
            className="btn-secondary" style={{ padding: "5px 9px", fontSize: 11 }}>
            <Zap size={11} /> Skip trace
          </button>
        ) : (
          <span style={{ fontSize: 10, color: THEME.textMuted, display: "inline-flex", alignItems: "center", gap: 3 }}>
            <CheckCircle2 size={11} color={THEME.green} />
            {lead.owner_phone || lead.owner_email ? "Traced" : "Traced — no match"}
          </span>
        )}

        {lead.owner_phone && (
          <a href={`tel:${lead.owner_phone}`} onClick={stop} className="btn-secondary" style={{ padding: "5px 9px", fontSize: 11 }}>
            <Phone size={11} /> Call
          </a>
        )}
        {lead.owner_email && (
          <button onClick={(e) => { stop(e); onEmail(lead); }} className="btn-secondary" style={{ padding: "5px 9px", fontSize: 11 }}>
            <Mail size={11} /> Email
          </button>
        )}
        {(lead.owner_mailing_address || lead.address) && (
          <button onClick={(e) => { stop(e); onPostcard(lead); }} className="btn-secondary" style={{ padding: "5px 9px", fontSize: 11 }}>
            <Send size={11} /> Postcard
          </button>
        )}
        <button onClick={(e) => { stop(e); onDelete(lead.id); }} className="btn-ghost"
          style={{ padding: "5px 9px", fontSize: 11, color: THEME.red, marginLeft: "auto" }}>
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
};

export const WholesaleView = () => {
  const saas = useSaasUser();
  const saasOn = isSaasMode();
  const toast = useToast();
  const plan = saas.usage?.plan;
  const isPaid = plan && plan !== "free";

  const [zip, setZip] = useState("");
  const [searchState, setSearchState] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [taxDelinquentOnly, setTaxDelinquentOnly] = useState(false);
  const [detailLead, setDetailLead] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [busyIds, setBusyIds] = useState(new Set());
  const [emailingLead, setEmailingLead] = useState(null);
  const [postcardLead, setPostcardLead] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const onSendPostcard = async ({ message }) => {
    if (!postcardLead) return;
    await sendPostcard(saas.getToken, { leadId: postcardLead.id, message });
    const { lead } = await updateWholesaleLead(saas.getToken, postcardLead.id, { status: "contacted" }).catch(() => ({}));
    if (lead) setLeads(prev => prev.map(l => l.id === lead.id ? lead : l));
    toast.push("Postcard queued with Lob", "success");
  };

  const loadLeads = useCallback(async () => {
    if (!saasOn || !saas.user || !isPaid) { setLeads([]); setLoadingLeads(false); return; }
    try {
      setLoadingLeads(true);
      const list = await listWholesaleLeads(saas.getToken);
      setLeads(list);
    } catch (e) { console.warn(e); } finally { setLoadingLeads(false); }
  }, [saasOn, saas.user, saas.getToken, isPaid]);
  useEffect(() => { loadLeads(); }, [loadLeads]);

  const setBusy = (id, on) => setBusyIds(prev => {
    const next = new Set(prev); if (on) next.add(id); else next.delete(id); return next;
  });

  const onSearch = async () => {
    const hasZip = /^\d{5}$/.test(zip);
    const hasCityState = !!searchCity && !!searchState;
    if (!hasZip && !hasCityState) {
      setSearchError("Pick a state + city, or enter a 5-digit ZIP.");
      return;
    }
    setSearching(true); setSearchError(null);
    try {
      const { results } = await searchWholesaleLeads(saas.getToken, {
        zip: hasZip ? zip : undefined,
        city: hasZip ? undefined : searchCity,
        state: hasZip ? undefined : searchState,
        taxDelinquentOnly
      });
      setSearchResults(results || []);
      if (!results || results.length === 0) setSearchError("No matching properties for that location.");
    } catch (e) {
      setSearchError(e.message || "Search failed");
    } finally { setSearching(false); }
  };

  const onSaveSearchResult = async (property) => {
    try {
      const { lead } = await saveWholesaleLead(saas.getToken, property);
      setLeads(prev => [lead, ...prev.filter(l => l.id !== lead.id)]);
      toast.push("Lead saved", "success");
      setSearchResults(prev => prev.filter(p => p.address !== property.address));
    } catch (e) { toast.push(e.message || "Save failed", "error"); }
  };

  const onSkipTrace = async (leadId) => {
    setBusy(leadId, true);
    try {
      const { lead, phoneFound, emailFound } = await skipTraceLead(saas.getToken, leadId);
      setLeads(prev => prev.map(l => l.id === leadId ? lead : l));
      toast.push(
        phoneFound || emailFound ? "Skip trace complete — contact info found" : "Skip trace ran — no match",
        phoneFound || emailFound ? "success" : "info"
      );
    } catch (e) { toast.push(e.message || "Skip trace failed", "error"); }
    finally { setBusy(leadId, false); }
  };

  const onStatusChange = async (id, status) => {
    try {
      const { lead } = await updateWholesaleLead(saas.getToken, id, { status });
      setLeads(prev => prev.map(l => l.id === id ? lead : l));
    } catch (e) { toast.push(e.message, "error"); }
  };

  const onDeleteLead = async (id) => {
    if (!confirm("Delete this lead?")) return;
    try {
      await deleteWholesaleLead(saas.getToken, id);
      setLeads(prev => prev.filter(l => l.id !== id));
      toast.push("Lead removed", "info");
    } catch (e) { toast.push(e.message, "error"); }
  };

  const onSendEmail = async ({ subject, body }) => {
    if (!emailingLead) return;
    await emailWholesaleLead(saas.getToken, { leadId: emailingLead.id, subject, body });
    // Refresh lead to pick up status change to "contacted"
    const { lead } = await updateWholesaleLead(saas.getToken, emailingLead.id, { status: "contacted" }).catch(() => ({}));
    if (lead) setLeads(prev => prev.map(l => l.id === lead.id ? lead : l));
    toast.push("Email sent", "success");
  };

  const filteredLeads = useMemo(() => {
    if (statusFilter === "all") return leads;
    return leads.filter(l => l.status === statusFilter);
  }, [leads, statusFilter]);

  /* ── Paywall ─────────────────────────────────────────────────────── */
  if (saasOn && !saas.user) {
    return (
      <div style={{ maxWidth: 560, margin: "60px auto", padding: 24, textAlign: "center" }}>
        <Crown size={32} color={THEME.textDim} style={{ marginBottom: 12 }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Sign in to use the lead finder</h2>
        <p style={{ fontSize: 13, color: THEME.textMuted }}>Wholesaling tools are included on paid plans.</p>
      </div>
    );
  }

  if (saasOn && !isPaid) {
    return (
      <div style={{ maxWidth: 700, margin: "60px auto", padding: 32, textAlign: "center",
        border: `2px solid ${THEME.accent}`, borderRadius: 12, background: THEME.bgTeal }}>
        <Crown size={40} color={THEME.accent} style={{ marginBottom: 14 }} />
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>Wholesaling is a premium feature</h2>
        <p style={{ fontSize: 14, color: THEME.textMuted, maxWidth: 500, margin: "0 auto 20px", lineHeight: 1.6 }}>
          Find absentee owners, long-time holders, and distressed properties by ZIP. Skip-trace for phone/email.
          Send outreach emails in-app. All included on <strong>Starter, Pro, and Scale</strong>.
        </p>
        <a href="#" onClick={(e) => { e.preventDefault(); window.location.hash = ""; }} className="btn-primary"
          style={{ padding: "10px 20px", fontSize: 13 }}>
          <Crown size={14} /> See plans
        </a>
      </div>
    );
  }

  /* ── Main UI ─────────────────────────────────────────────────────── */
  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile() ? 16 : "24px 28px" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 className="serif" style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>
          <Crown size={20} style={{ display: "inline", verticalAlign: "-4px", marginRight: 8, color: THEME.accent }} />
          Wholesale Lead Finder
        </h1>
        <p style={{ fontSize: 13, color: THEME.textMuted, margin: "4px 0 0" }}>
          Absentee owners, long-time holders, and distressed properties by ZIP. Send direct-mail postcards or skip-trace for phone/email.
        </p>
      </div>

      <Panel title="Find leads" icon={<Search size={16} />} accent style={{ marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "160px 1fr 140px auto", gap: 10, alignItems: "end" }}>
          <div>
            <div className="label-xs" style={{ marginBottom: 4 }}>State</div>
            <select value={searchState}
              onChange={(e) => { setSearchState(e.target.value); setSearchCity(""); }}
              style={{ width: "100%", padding: "9px 10px", fontSize: 14, background: THEME.bg }}>
              <option value="">Select state…</option>
              {Object.keys(STATE_NAMES).sort((a, b) => STATE_NAMES[a].localeCompare(STATE_NAMES[b])).map(code => (
                <option key={code} value={code}>{STATE_NAMES[code]}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="label-xs" style={{ marginBottom: 4 }}>
              City <span style={{ color: THEME.textDim, fontWeight: 400 }}>(type any)</span>
            </div>
            <input
              list="wholesale-city-suggestions"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              disabled={!searchState}
              placeholder={searchState ? "Miami, Fort Myers, Naples…" : "Pick a state first"}
              style={{ width: "100%", padding: "9px 10px", fontSize: 14, background: THEME.bg,
                opacity: searchState ? 1 : 0.5 }} />
            <datalist id="wholesale-city-suggestions">
              {(CITIES_BY_STATE[searchState] || []).map(c => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <div className="label-xs" style={{ marginBottom: 4 }}>
              ZIP <span style={{ color: THEME.textDim, fontWeight: 400 }}>(overrides)</span>
            </div>
            <input value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder="33101" maxLength={5}
              style={{ width: "100%", padding: "9px 10px", fontSize: 14 }} />
          </div>
          <button onClick={onSearch} disabled={searching} className="btn-primary"
            style={{ padding: "10px 16px", fontSize: 13 }}>
            <Search size={14} /> {searching ? "Searching…" : "Search"}
          </button>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginTop: 10 }}
          title="Cross-references ATTOM's foreclosure + pre-foreclosure feeds">
          <input type="checkbox" checked={taxDelinquentOnly} onChange={(e) => setTaxDelinquentOnly(e.target.checked)} />
          <span>Pre-foreclosure / tax-distressed only</span>
        </label>
        {searchError && (
          <div style={{ marginTop: 10, padding: 10, background: THEME.bgOrange, color: THEME.orange,
            borderRadius: 6, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={12} /> {searchError}
          </div>
        )}
      </Panel>

      {searchResults.length > 0 && (
        <Panel title={`Search results (${searchResults.length})`} icon={<Home size={16} />} style={{ marginBottom: 24 }}
          action={
            <button onClick={() => setSearchResults([])} className="btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }}>
              Clear
            </button>
          }>
          <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))", gap: 10 }}>
            {searchResults.map((p, idx) => (
              <div key={idx}
                onClick={() => setDetailLead({ ...p, id: `search-${idx}`, status: "new", __isSearchResult: true })}
                style={{
                  border: `1px solid ${THEME.border}`, borderRadius: 8, padding: 12,
                  background: THEME.bgPanel, display: "flex", flexDirection: "column", gap: 8,
                  cursor: "pointer"
                }}>
                <PropertyPhoto streetSrc={p.streetview_url} satelliteSrc={p.satellite_url} alt={p.address} aspectRatio="16 / 9" />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{p.address}</div>
                  <div style={{ fontSize: 10, color: THEME.textMuted }}>
                    {[p.city, p.state, p.zip].filter(Boolean).join(", ")}
                  </div>
                </div>
                {p.owner_name && (
                  <div style={{ fontSize: 11 }}>
                    <strong>Owner:</strong> <span style={{ color: THEME.textMuted }}>{p.owner_name}</span>
                    {p.owner_mailing_address && p.is_absentee && (
                      <div style={{ fontSize: 10, color: THEME.textMuted, marginTop: 2 }}>
                        Mail: {p.owner_mailing_address}, {[p.owner_mailing_city, p.owner_mailing_state, p.owner_mailing_zip].filter(Boolean).join(", ")}
                      </div>
                    )}
                  </div>
                )}
                <div style={{ fontSize: 10, color: THEME.textMuted }}>
                  Score <strong style={{ color: THEME.accent }}>{p.lead_score}/100</strong>
                  {p.years_owned != null && <> · {p.years_owned}yr owned</>}
                  {p.is_absentee && <> · absentee</>}
                  {p.market_value && <> · {fmtUSD(p.market_value, { short: true })}</>}
                </div>
                <button onClick={(e) => { e.stopPropagation(); onSaveSearchResult(p); }} className="btn-primary"
                  style={{ padding: "6px 10px", fontSize: 11, width: "100%", justifyContent: "center", marginTop: "auto" }}>
                  <Star size={11} /> Save lead
                </button>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel
        title={`Your Leads (${filteredLeads.length})`}
        icon={<Users size={16} />}
        action={
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "4px 8px", fontSize: 11, borderRadius: 4 }}>
            <option value="all">All statuses</option>
            {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        }>
        {loadingLeads ? (
          <div style={{ padding: 40, textAlign: "center", color: THEME.textMuted, fontSize: 13 }}>Loading leads…</div>
        ) : leads.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <MessageSquare size={30} color={THEME.textDim} style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>No leads yet</div>
            <p style={{ fontSize: 12, color: THEME.textMuted, margin: 0 }}>
              Search a ZIP above to find properties with 20+ years of ownership, absentee owners, or other lead signals.
            </p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: THEME.textMuted, fontSize: 13 }}>
            No leads with status "{STATUS_BY_KEY[statusFilter]?.label}".
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
            {filteredLeads.map(lead => (
              <LeadCard key={lead.id} lead={lead}
                busy={busyIds.has(lead.id)}
                onSkipTrace={onSkipTrace}
                onStatusChange={onStatusChange}
                onDelete={onDeleteLead}
                onEmail={setEmailingLead}
                onPostcard={setPostcardLead}
                onOpen={setDetailLead}
              />
            ))}
          </div>
        )}
      </Panel>

      {emailingLead && (
        <EmailModal
          lead={emailingLead}
          onSend={onSendEmail}
          onClose={() => setEmailingLead(null)}
        />
      )}

      {postcardLead && (
        <PostcardModal
          lead={postcardLead}
          onSend={onSendPostcard}
          onClose={() => setPostcardLead(null)}
        />
      )}

      {detailLead && (
        <WholesaleDetailModal
          lead={detailLead.__isSearchResult ? detailLead : (leads.find(l => l.id === detailLead.id) || detailLead)}
          busy={busyIds.has(detailLead.id)}
          onClose={() => setDetailLead(null)}
          onSkipTrace={onSkipTrace}
          onStatusChange={onStatusChange}
          onEmail={(l) => { setEmailingLead(l); setDetailLead(null); }}
          onPostcard={(l) => { setPostcardLead(l); setDetailLead(null); }}
          onSave={async (l) => {
            const { __isSearchResult, id, ...property } = l;
            await onSaveSearchResult(property);
            setDetailLead(null);
          }}
        />
      )}

      <div style={{ marginTop: 24, padding: "14px 18px", background: THEME.bgPanel, borderRadius: 8, border: `1px solid ${THEME.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: THEME.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
          Legal heads-up
        </div>
        <div style={{ fontSize: 11, color: THEME.textMuted, lineHeight: 1.6 }}>
          Cold outreach is subject to <strong>CAN-SPAM</strong> (emails) and <strong>TCPA</strong> (calls / SMS).
          A compliant footer is added to every email automatically. For cold calls, respect the National DNC registry;
          don't use auto-dialers or SMS without explicit prior consent. This is lead-research data, not a guarantee
          of seller interest — please be respectful.
        </div>
      </div>
    </div>
  );
};
