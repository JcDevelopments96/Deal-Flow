/* ============================================================================
   ARI — floating Claude-powered chat assistant (bottom-right of every view).
   Real-estate-investing focused; system prompt knows Deal Docket's surfaces.
   Conversation persists in sessionStorage so it survives view changes but
   resets on a fresh tab.
   ============================================================================ */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { THEME } from "./theme.js";
import { isSaasMode, useSaasUser, chatWithAri } from "./lib/saas.js";

const STORAGE_KEY = "dealtrack-ari-history-v1";

const GREETING = {
  role: "assistant",
  content: "Hi, I'm **Ari AI** — your Deal Docket co-pilot. I can answer anything (real estate or otherwise), search the live web for recent info, and point you to the right section of the app. What's on your mind?"
};

// Tiny markdown → JSX renderer. Handles bold, bullets, paragraphs, inline
// code. Skips full markdown to keep the bundle slim — replies are short.
function renderMarkdown(text) {
  const lines = text.split("\n");
  const blocks = [];
  let listBuffer = [];
  const flushList = () => {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} style={{ margin: "6px 0 6px 18px", padding: 0, fontSize: 13, lineHeight: 1.5 }}>
        {listBuffer.map((li, i) => <li key={i}>{renderInline(li)}</li>)}
      </ul>
    );
    listBuffer = [];
  };
  for (const raw of lines) {
    const line = raw.replace(/^\s+|\s+$/g, "");
    if (/^[-*]\s+/.test(line)) {
      listBuffer.push(line.replace(/^[-*]\s+/, ""));
    } else if (line.length === 0) {
      flushList();
      blocks.push(<div key={`sp-${blocks.length}`} style={{ height: 6 }} />);
    } else {
      flushList();
      blocks.push(<p key={`p-${blocks.length}`} style={{ margin: "0 0 6px", fontSize: 13, lineHeight: 1.55 }}>{renderInline(line)}</p>);
    }
  }
  flushList();
  return blocks;
}
function renderInline(text) {
  // Split on **bold** and `code`
  const parts = [];
  let rest = text;
  let i = 0;
  while (rest.length) {
    const bold = rest.match(/\*\*([^*]+)\*\*/);
    const code = rest.match(/`([^`]+)`/);
    const link = rest.match(/\[([^\]]+)\]\(([^)]+)\)/);
    const candidates = [bold, code, link].filter(Boolean).sort((a, b) => a.index - b.index);
    if (candidates.length === 0) { parts.push(rest); break; }
    const m = candidates[0];
    if (m.index > 0) parts.push(rest.slice(0, m.index));
    if (m === bold) parts.push(<strong key={i++}>{m[1]}</strong>);
    else if (m === code) parts.push(<code key={i++} style={{ background: "rgba(15,23,42,0.06)", padding: "1px 4px", borderRadius: 3, fontSize: 12 }}>{m[1]}</code>);
    else if (m === link) parts.push(<a key={i++} href={m[2]} target="_blank" rel="noopener noreferrer" style={{ color: THEME.accent }}>{m[1]}</a>);
    rest = rest.slice(m.index + m[0].length);
  }
  return parts;
}

export const AriChat = () => {
  const saas = useSaasUser();
  const saasOn = isSaasMode();
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [GREETING];
  });
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Persist history per session (clears on new tab)
  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch {}
  }, [history]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, open, sending]);

  // Focus input when opening
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    if (!saasOn || !saas.user) {
      setError("Sign in to chat with Ari AI.");
      return;
    }
    setError(null);
    const next = [...history, { role: "user", content: text }];
    setHistory(next);
    setInput("");
    setSending(true);
    try {
      // Don't include the canned greeting in the wire payload — the system
      // prompt covers tone + context.
      const wire = next.filter(m => m !== GREETING);
      const { reply, sources } = await chatWithAri(saas.getToken, wire);
      setHistory(prev => [...prev, { role: "assistant", content: reply, sources: sources || [] }]);
    } catch (e) {
      console.warn("Ari error:", e);
      setError(e.message || "Ari AI couldn't reply. Try again in a moment.");
      // Keep the user's message in history but rollback the optimistic
      // assistant placeholder if any.
    } finally {
      setSending(false);
    }
  }, [input, sending, saasOn, saas.user, saas.getToken, history]);

  const reset = () => {
    setHistory([GREETING]);
    setError(null);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  };

  // Floating launcher button
  if (!open) {
    return (
      <button
        type="button"
        aria-label="Open Ari AI chat assistant"
        onClick={() => setOpen(true)}
        style={{
          position: "fixed", bottom: 20, right: 20,
          width: 56, height: 56, borderRadius: "50%",
          background: THEME.accent, color: "#FFFFFF",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 6px 20px rgba(15,23,42,0.25)",
          zIndex: 199,
          transition: "transform 0.15s ease"
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.06)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        <Sparkles size={24} />
      </button>
    );
  }

  // Open panel
  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20,
      width: 380, maxWidth: "calc(100vw - 40px)",
      height: 540, maxHeight: "calc(100vh - 100px)",
      background: THEME.bg,
      border: `1px solid ${THEME.border}`,
      borderRadius: 12,
      boxShadow: "0 10px 40px rgba(15,23,42,0.18)",
      display: "flex", flexDirection: "column",
      zIndex: 200,
      overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 14px",
        background: THEME.navy,
        color: "#FFFFFF",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "#FFFFFF", color: THEME.navy,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Sparkles size={16} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1 }}>Ari AI</div>
            <div style={{ fontSize: 10, opacity: 0.7, letterSpacing: "0.06em", marginTop: 2 }}>DEAL DOCKET ASSISTANT</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button type="button" aria-label="New conversation" title="New conversation"
            onClick={reset}
            style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.75)", cursor: "pointer", fontSize: 11, padding: "4px 8px" }}>
            Reset
          </button>
          <button type="button" aria-label="Close Ari AI" onClick={() => setOpen(false)}
            style={{ background: "transparent", border: "none", color: "#FFFFFF", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: "auto",
        padding: "12px 14px",
        background: THEME.bgPanel
      }}>
        {history.map((m, i) => (
          <div key={i} style={{
            marginBottom: 10,
            display: "flex",
            justifyContent: m.role === "user" ? "flex-end" : "flex-start"
          }}>
            <div style={{
              maxWidth: "88%",
              padding: "10px 12px",
              borderRadius: 10,
              background: m.role === "user" ? THEME.accent : THEME.bg,
              color: m.role === "user" ? "#FFFFFF" : THEME.text,
              border: m.role === "user" ? "none" : `1px solid ${THEME.border}`,
              fontSize: 13, lineHeight: 1.5,
              wordWrap: "break-word"
            }}>
              {m.role === "user" ? m.content : renderMarkdown(m.content)}
              {m.role === "assistant" && Array.isArray(m.sources) && m.sources.length > 0 && (
                <div style={{
                  marginTop: 8, paddingTop: 8,
                  borderTop: `1px solid ${THEME.borderLight}`,
                  fontSize: 11, color: THEME.textMuted
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 10 }}>
                    Sources
                  </div>
                  <ol style={{ margin: 0, paddingLeft: 16, lineHeight: 1.5 }}>
                    {m.sources.slice(0, 6).map((s, idx) => (
                      <li key={idx}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer"
                          style={{ color: THEME.accent, wordBreak: "break-all" }}>
                          {s.title || s.url}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
            <div style={{
              padding: "10px 12px", borderRadius: 10,
              background: THEME.bg, border: `1px solid ${THEME.border}`,
              fontSize: 12, color: THEME.textMuted
            }}>
              Ari AI is thinking…
            </div>
          </div>
        )}
        {error && (
          <div style={{
            padding: 10, marginBottom: 10,
            background: THEME.redDim, color: THEME.red,
            borderRadius: 8, fontSize: 11
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); send(); }}
        style={{
          padding: 10, borderTop: `1px solid ${THEME.border}`,
          background: THEME.bg,
          display: "flex", gap: 8
        }}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={saasOn && saas.user ? "Ask Ari AI about a deal, market, or anything…" : "Sign in to chat"}
          disabled={!saasOn || !saas.user || sending}
          style={{
            flex: 1, padding: "9px 12px", fontSize: 13,
            border: `1px solid ${THEME.border}`,
            borderRadius: 6, outline: "none"
          }}
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={!input.trim() || sending || !saas.user}
          className="btn-primary"
          style={{ padding: "9px 12px", fontSize: 12 }}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};
