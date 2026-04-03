/**
 * OpenClaw Chat Panel — self-contained LitElement-style web component.
 * Single JS file, no build step, no external dependencies.
 * Mobile-first design targeting the HA Companion App.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMarkdown(text) {
  if (!text) return "";
  let html = escapeHtml(text);

  // Triple backtick code blocks (must run before inline code)
  html = html.replace(
    /```(\w*)\n?([\s\S]*?)```/g,
    (_, lang, code) =>
      `<pre><code${lang ? ` class="language-${escapeHtml(lang)}"` : ""}>${code}</code></pre>`,
  );

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Links
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  // Ordered lists — collect consecutive lines starting with "N. "
  html = html.replace(/((?:(?:\d+\. .+)(?:\n|$))+)/g, (block) => {
    const items = block
      .trim()
      .split("\n")
      .map((line) => line.replace(/^\d+\. /, ""))
      .map((item) => `<li>${item}</li>`)
      .join("");
    return `<ol>${items}</ol>`;
  });

  // Unordered lists — collect consecutive lines starting with "- "
  html = html.replace(/((?:(?:- .+)(?:\n|$))+)/g, (block) => {
    const items = block
      .trim()
      .split("\n")
      .map((line) => line.replace(/^- /, ""))
      .map((item) => `<li>${item}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  });

  // Paragraphs — convert double newlines
  html = html
    .split(/\n\n+/)
    .map((p) => {
      if (p.startsWith("<pre>") || p.startsWith("<ul>") || p.startsWith("<ol>")) {
        return p;
      }
      return `<p>${p.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");

  return html;
}

function relativeTime(ts) {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

const ICON = {
  send: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  stop: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`,
  mic: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
  attach: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`,
  hamburger: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
  newchat: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  trash: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
  pencil: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  chevron: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  robot: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M12 2a2 2 0 0 1 2 2v5H10V4a2 2 0 0 1 2-2z"/><circle cx="8.5" cy="16" r="1.5"/><circle cx="15.5" cy="16" r="1.5"/><path d="M8 20h8"/></svg>`,
  close: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  home: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
};

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------

const STYLES = `
  :host, openclaw-panel {
    display: flex !important;
    flex-direction: column;
    height: 100vh;
    max-height: 100vh;
    width: 100%;
    overflow: hidden;
    font-family: var(--ha-font-body, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
    color: var(--primary-text-color, #212121);
    background: var(--lovelace-background, var(--ha-background, #fafafa));
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
    touch-action: manipulation;
  }

  *, *::before, *::after { box-sizing: inherit; }

  /* ── Layout ── */
  .layout {
    display: flex;
    height: 100%;
    overflow: hidden;
    padding-top: env(safe-area-inset-top);
  }

  /* ── Sidebar ── */
  .sidebar {
    width: 280px;
    min-width: 280px;
    display: flex;
    flex-direction: column;
    background: var(--sidebar-background-color, var(--card-background-color, #fff));
    border-right: 1px solid var(--divider-color, #e0e0e0);
    overflow: hidden;
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 200;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 12px 10px;
    border-bottom: 1px solid var(--divider-color, #e0e0e0);
    flex-shrink: 0;
  }

  .sidebar-title {
    font-weight: 600;
    font-size: 16px;
    color: var(--primary-text-color, #212121);
    letter-spacing: 0.01em;
  }

  .btn-new-chat {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: var(--primary-color, #03a9f4);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    min-height: 36px;
    transition: opacity 0.15s;
  }
  .btn-new-chat:active { opacity: 0.8; }

  .conv-list {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 6px 0;
  }

  .conv-item {
    position: relative;
    display: flex;
    align-items: center;
    padding: 10px 12px;
    cursor: pointer;
    border-radius: 8px;
    margin: 2px 6px;
    overflow: hidden;
    transition: background 0.12s;
    min-height: 52px;
    user-select: none;
    -webkit-user-select: none;
  }
  .conv-item:hover { background: var(--secondary-background-color, rgba(0,0,0,0.04)); }
  .conv-item.active { background: color-mix(in srgb, var(--primary-color, #03a9f4) 12%, transparent); }

  .conv-info { flex: 1; min-width: 0; }
  .conv-title {
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--primary-text-color, #212121);
  }
  .conv-time {
    font-size: 11px;
    color: var(--secondary-text-color, #757575);
    margin-top: 2px;
  }

  .conv-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.15s;
    flex-shrink: 0;
  }
  .conv-item:hover .conv-actions,
  .conv-item:focus-within .conv-actions { opacity: 1; }

  .conv-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--secondary-text-color, #757575);
    cursor: pointer;
    padding: 0;
    transition: background 0.12s, color 0.12s;
  }
  .conv-action-btn:hover { background: var(--divider-color, #e0e0e0); color: var(--primary-text-color, #212121); }
  .conv-action-btn.danger:hover { background: #ffebee; color: #f44336; }

  /* Swipe-to-delete (mobile) */
  .conv-delete-reveal {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 72px;
    background: #f44336;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    transform: translateX(100%);
    transition: transform 0.2s;
    border-radius: 0 8px 8px 0;
    cursor: pointer;
  }
  .conv-item.swiped .conv-delete-reveal { transform: translateX(0); }
  .conv-item.swiped .conv-info,
  .conv-item.swiped .conv-actions { transform: translateX(-72px); transition: transform 0.2s; }

  /* Overlay for mobile sidebar */
  .sidebar-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 199;
    opacity: 0;
    transition: opacity 0.25s;
  }

  /* ── Main area ── */
  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
  }

  /* ── Top bar ── */
  .topbar {
    display: flex;
    align-items: center;
    padding: 0 12px;
    height: 52px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--divider-color, #e0e0e0);
    background: var(--card-background-color, #fff);
    gap: 8px;
  }

  .hamburger-btn {
    display: none;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    color: var(--primary-text-color, #212121);
    flex-shrink: 0;
    padding: 0;
  }

  .topbar-title {
    flex: 1;
    font-size: 16px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--primary-text-color, #212121);
  }

  .conn-status {
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 20px;
    flex-shrink: 0;
    font-weight: 500;
  }

  .home-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    color: var(--secondary-text-color, #757575);
    flex-shrink: 0;
    padding: 0;
    margin-left: 4px;
  }
  .home-btn:hover { background: var(--secondary-background-color, #f0f0f0); color: var(--primary-text-color, #212121); }
  .conn-status.connected { background: #e8f5e9; color: #2e7d32; }
  .conn-status.connecting { background: #fff8e1; color: #f57f17; }
  .conn-status.disconnected { background: #ffebee; color: #c62828; }

  /* ── Messages ── */
  .messages-container {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 12px 8px 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .day-divider {
    text-align: center;
    font-size: 11px;
    color: var(--secondary-text-color, #757575);
    padding: 8px 0;
    user-select: none;
  }

  .msg-row {
    display: flex;
    flex-direction: column;
    max-width: 82%;
    margin-bottom: 4px;
  }
  .msg-row.user { align-self: flex-end; align-items: flex-end; }
  .msg-row.assistant { align-self: flex-start; align-items: flex-start; }
  .msg-row.system { align-self: center; max-width: 100%; }

  .msg-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--primary-color, #03a9f4);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 11px;
    margin-bottom: 2px;
    flex-shrink: 0;
  }

  .msg-bubble {
    padding: 10px 14px;
    border-radius: 18px;
    font-size: 14px;
    line-height: 1.5;
    -webkit-user-select: text;
    user-select: text;
    word-break: break-word;
    overflow-wrap: anywhere;
  }

  .msg-row.user .msg-bubble {
    background: var(--primary-color, #03a9f4);
    color: #fff;
    border-bottom-right-radius: 4px;
  }

  .msg-row.assistant .msg-bubble {
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color, #212121);
    border-bottom-left-radius: 4px;
    border: 1px solid var(--divider-color, #e0e0e0);
  }

  .msg-row.system .msg-bubble {
    background: var(--secondary-background-color, #f5f5f5);
    color: var(--secondary-text-color, #757575);
    font-size: 12px;
    border-radius: 8px;
    padding: 6px 12px;
  }

  .msg-bubble p { margin: 0 0 8px; }
  .msg-bubble p:last-child { margin-bottom: 0; }
  .msg-bubble pre {
    background: rgba(0,0,0,0.08);
    border-radius: 6px;
    padding: 10px;
    overflow-x: auto;
    font-size: 12px;
    margin: 6px 0;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .msg-bubble code {
    background: rgba(0,0,0,0.08);
    border-radius: 3px;
    padding: 1px 4px;
    font-size: 12px;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  }
  .msg-bubble pre code { background: none; padding: 0; }
  .msg-bubble a { color: inherit; text-decoration: underline; }
  .msg-bubble ul, .msg-bubble ol { margin: 4px 0 4px 20px; padding: 0; }
  .msg-bubble li { margin: 2px 0; }

  .msg-time {
    font-size: 10px;
    color: var(--secondary-text-color, #757575);
    padding: 2px 4px;
    margin-top: 2px;
  }

  /* Tool call card */
  .tool-card {
    background: var(--ha-card-background, var(--card-background-color, #fff));
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: 10px;
    margin: 4px 0;
    overflow: hidden;
    font-size: 13px;
  }
  .tool-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    cursor: pointer;
    background: var(--secondary-background-color, #f5f5f5);
    user-select: none;
    min-height: 40px;
  }
  .tool-card-name {
    font-family: "SFMono-Regular", Consolas, monospace;
    font-size: 12px;
    font-weight: 600;
    color: var(--primary-color, #03a9f4);
  }
  .tool-card-chevron { transition: transform 0.2s; color: var(--secondary-text-color, #757575); }
  .tool-card.expanded .tool-card-chevron { transform: rotate(180deg); }
  .tool-card-body {
    display: none;
    padding: 10px 12px;
    border-top: 1px solid var(--divider-color, #e0e0e0);
  }
  .tool-card.expanded .tool-card-body { display: block; }
  .tool-section-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--secondary-text-color, #757575);
    margin-bottom: 4px;
  }
  .tool-code {
    background: var(--secondary-background-color, #f5f5f5);
    border-radius: 6px;
    padding: 8px;
    font-family: "SFMono-Regular", Consolas, monospace;
    font-size: 11px;
    white-space: pre-wrap;
    word-break: break-word;
    overflow-x: auto;
    max-height: 200px;
    overflow-y: auto;
  }

  /* Attachments in bubbles */
  .attach-preview-img {
    max-width: 220px;
    max-height: 180px;
    border-radius: 10px;
    display: block;
    margin-bottom: 6px;
    object-fit: cover;
  }
  .attach-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    background: rgba(0,0,0,0.08);
    border-radius: 20px;
    font-size: 12px;
    margin-bottom: 4px;
  }

  /* Typing indicator */
  .typing-indicator {
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 12px 14px;
  }
  .typing-dot {
    width: 7px;
    height: 7px;
    background: var(--secondary-text-color, #9e9e9e);
    border-radius: 50%;
    animation: typing-bounce 1.2s infinite ease-in-out;
  }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes typing-bounce {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-6px); }
  }

  /* ── Input bar ── */
  .input-bar {
    display: flex;
    align-items: flex-end;
    padding: 8px 8px;
    padding-bottom: max(8px, env(safe-area-inset-bottom));
    border-top: 1px solid var(--divider-color, #e0e0e0);
    background: var(--card-background-color, #fff);
    gap: 4px;
    flex-shrink: 0;
  }

  .input-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    min-width: 44px;
    border: none;
    border-radius: 12px;
    background: transparent;
    color: var(--secondary-text-color, #757575);
    cursor: pointer;
    padding: 0;
    transition: background 0.12s, color 0.12s;
    flex-shrink: 0;
  }
  .input-btn:hover { background: var(--secondary-background-color, rgba(0,0,0,0.06)); color: var(--primary-text-color, #212121); }
  .input-btn:active { background: var(--divider-color, #e0e0e0); }
  .input-btn { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
  .input-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .input-btn.mic-active {
    color: #f44336;
    animation: mic-pulse 1.5s infinite;
  }
  @keyframes mic-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(244,67,54,0.4); }
    50% { box-shadow: 0 0 0 8px rgba(244,67,54,0); }
  }
  .input-btn.mic-processing {
    color: var(--primary-color, #03a9f4);
    animation: mic-spin 1s linear infinite;
  }
  @keyframes mic-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .input-btn.send-btn {
    background: var(--primary-color, #03a9f4);
    color: #fff;
    border-radius: 12px;
  }
  .input-btn.send-btn:hover { opacity: 0.9; background: var(--primary-color, #03a9f4); }
  .input-btn.send-btn:disabled { background: var(--divider-color, #bdbdbd); }

  .input-wrap {
    flex: 1;
    min-width: 0;
  }

  .input-textarea {
    width: 100%;
    resize: none;
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: 12px;
    padding: 10px 12px;
    font-size: 15px;
    font-family: inherit;
    line-height: 1.45;
    background: var(--secondary-background-color, #f5f5f5);
    color: var(--primary-text-color, #212121);
    outline: none;
    overflow-y: auto;
    min-height: 44px;
    max-height: calc(5 * 1.45 * 15px + 20px);
    transition: border-color 0.15s;
    display: block;
  }
  .input-textarea { -webkit-user-select: text; user-select: text; -webkit-touch-callout: default; }
  .input-textarea:focus { border-color: var(--primary-color, #03a9f4); background: var(--card-background-color, #fff); }
  .input-textarea::placeholder { color: var(--secondary-text-color, #9e9e9e); }
  .input-textarea:disabled { opacity: 0.6; cursor: not-allowed; }

  /* Attachment staging area */
  .attach-staging {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 6px 8px 0;
  }
  .staging-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--primary-color, #03a9f4) 30%, transparent);
    border-radius: 20px;
    padding: 4px 8px 4px 6px;
    font-size: 12px;
    max-width: 200px;
  }
  .staging-chip-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--primary-text-color, #212121);
  }
  .staging-chip-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border: none;
    background: rgba(0,0,0,0.1);
    border-radius: 50%;
    cursor: pointer;
    padding: 0;
    color: var(--primary-text-color, #212121);
    flex-shrink: 0;
  }
  .staging-img-thumb {
    width: 48px;
    height: 48px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid var(--divider-color, #e0e0e0);
  }

  /* Rename input inline */
  .conv-rename-input {
    flex: 1;
    border: 1px solid var(--primary-color, #03a9f4);
    border-radius: 6px;
    padding: 3px 8px;
    font-size: 13px;
    font-family: inherit;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color, #212121);
    outline: none;
  }

  /* Empty state */
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: var(--secondary-text-color, #9e9e9e);
    padding: 24px;
    text-align: center;
  }
  .empty-state-icon {
    opacity: 0.3;
  }
  .empty-state-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--primary-text-color, #424242);
    opacity: 0.5;
  }
  .empty-state-sub {
    font-size: 13px;
    max-width: 280px;
  }

  /* ── Mobile overrides ── */
  @media (max-width: 768px) {
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      transform: translateX(-100%);
      box-shadow: 2px 0 16px rgba(0,0,0,0.15);
    }
    .sidebar.open { transform: translateX(0); }
    .sidebar-overlay { display: block; }
    .sidebar-overlay.visible { opacity: 1; pointer-events: all; }
    .hamburger-btn { display: flex; }
    .conn-status { display: none; }
  }

  /* ── Scrollbar styling ── */
  .messages-container::-webkit-scrollbar,
  .conv-list::-webkit-scrollbar { width: 4px; }
  .messages-container::-webkit-scrollbar-track,
  .conv-list::-webkit-scrollbar-track { background: transparent; }
  .messages-container::-webkit-scrollbar-thumb,
  .conv-list::-webkit-scrollbar-thumb { background: var(--divider-color, #e0e0e0); border-radius: 4px; }
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

class OpenClawPanel extends HTMLElement {
  constructor() {
    super();
    this._hass = null;
    this._panel = null;
    this._ws = null;
    this._wsReady = false;
    this._reconnectDelay = 1000;
    this._reconnectTimer = null;
    this._pingTimer = null;
    this._pongTimeout = null;
    this._destroyed = false;
    this._rendered = false;

    // State
    this._connStatus = "disconnected"; // connecting | connected | disconnected
    this._conversations = []; // [{id, title, updatedAt}]
    this._activeConvId = null;
    this._messages = {}; // convId -> [{id, role, content, ts, attachments, toolCall}]
    this._streamingMsgId = null;
    this._isStreaming = false;
    this._sidebarOpen = false;
    this._pendingAttachments = []; // [{name, size, type, dataUrl}]
    this._renamingConvId = null;
    this._swipedConvId = null;
    this._micActive = false;
    this._recognition = null;
    this._userScrolledUp = false;
    this._vvResizeHandler = null;

    // Touch tracking for swipe-to-delete
    this._touchStartX = 0;
    this._touchStartY = 0;
  }

  // ── HA lifecycle hooks ──────────────────────────────────────────────────

  set hass(hass) {
    this._hass = hass;
    if (this._rendered) this._updateHassDependent();
    else this._tryInit();
  }

  set panel(panel) {
    this._panel = panel;
    this._tryInit();
  }

  connectedCallback() {
    this._connected = true;
    this._tryInit();
  }

  _tryInit() {
    // Wait for hass, panel, and DOM connection before initializing
    if (this._rendered || !this._connected || !this._hass || !this._panel) return;
    this._buildDOM();
    this._rendered = true;
    this._connectWs();
    this._bindViewportHandler();
  }

  disconnectedCallback() {
    this._destroyed = true;
    this._cleanupWs();
    if (this._vvResizeHandler && window.visualViewport) {
      window.visualViewport.removeEventListener("resize", this._vvResizeHandler);
    }
    if (this._recognition) {
      try {
        this._recognition.stop();
      } catch (_) {}
    }
  }

  // ── DOM construction ────────────────────────────────────────────────────

  _buildDOM() {
    // Use innerHTML instead of shadow DOM for iPhone WKWebView compatibility.
    // Shadow DOM click/touch events don't work reliably in HA companion app on iPhone.
    const root = this;
    // Force dimensions via JS for iPhone where CSS 100vh can be wrong
    root.style.height = window.innerHeight + "px";
    root.style.width = "100%";
    root.style.overflow = "hidden";
    root.style.display = "flex";
    root.style.flexDirection = "column";
    window.addEventListener("resize", () => {
      root.style.height = window.innerHeight + "px";
    });

    const style = document.createElement("style");
    style.textContent = STYLES;
    root.appendChild(style);

    const layout = document.createElement("div");
    layout.className = "layout";
    layout.innerHTML = this._layoutHTML();
    root.appendChild(layout);

    this._dom = {
      shadow: root,
      layout,
      sidebarOverlay: root.querySelector(".sidebar-overlay"),
      sidebar: root.querySelector(".sidebar"),
      convList: root.querySelector(".conv-list"),
      hamburgerBtn: root.querySelector(".hamburger-btn"),
      topbarTitle: root.querySelector(".topbar-title"),
      connStatus: root.querySelector(".conn-status"),
      messagesContainer: root.querySelector(".messages-container"),
      inputTextarea: root.querySelector(".input-textarea"),
      sendBtn: root.querySelector(".send-btn"),
      micBtn: root.querySelector(".mic-btn"),
      attachBtn: root.querySelector(".attach-btn"),
      fileInput: root.querySelector(".file-input"),
      attachStaging: root.querySelector(".attach-staging"),
      homeBtn: root.querySelector(".home-btn"),
    };

    this._bindEvents();
    this._checkSpeechSupport();
    // Debug: verify buttons are found and clickable
    console.log(
      "[openclaw] DOM ready, sendBtn:",
      !!this._dom.sendBtn,
      "homeBtn:",
      !!this._dom.homeBtn,
    );
    // Fallback: direct onclick on send button
    if (this._dom.sendBtn) {
      this._dom.sendBtn.onclick = () => {
        console.log("[openclaw] send clicked");
        if (this._isStreaming) this._stopStreaming();
        else this._sendMessage();
      };
    }
    if (this._dom.homeBtn) {
      this._dom.homeBtn.onclick = () => {
        console.log("[openclaw] home clicked");
        window.history.pushState(null, "", "/");
        window.dispatchEvent(new PopStateEvent("popstate"));
      };
    }
    this._renderConvList();
    this._renderMessages();
  }

  _layoutHTML() {
    return `
      <div class="sidebar-overlay"></div>
      <div class="sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title">OpenClaw</span>
          <button class="btn-new-chat" title="New conversation">
            ${ICON.newchat} New Chat
          </button>
        </div>
        <div class="conv-list"></div>
      </div>

      <div class="main">
        <div class="topbar">
          <button class="hamburger-btn" title="Menu">${ICON.hamburger}</button>
          <span class="topbar-title">OpenClaw</span>
          <span class="conn-status disconnected">Disconnected</span>
          <button class="home-btn" title="Back to Home Assistant">${ICON.home}</button>
        </div>

        <div class="messages-container"></div>

        <div class="attach-staging"></div>

        <div class="input-bar">
          <button class="input-btn attach-btn" title="Attach file">${ICON.attach}</button>
          <input type="file" class="file-input" style="display:none" multiple
            accept="image/*,.pdf,.txt,.csv,.json">
          <div class="input-wrap">
            <textarea class="input-textarea" rows="1"
              placeholder="Message OpenClaw…"></textarea>
          </div>
          <button class="input-btn input-btn mic-btn" title="Voice input">${ICON.mic}</button>
          <button class="input-btn send-btn" title="Send">${ICON.send}</button>
        </div>
      </div>
    `;
  }

  // ── Event binding ────────────────────────────────────────────────────────

  _bindEvents() {
    const d = this._dom;

    // Helper: tap handling for iOS WKWebView shadow DOM compatibility.
    // WKWebView on iPhone may not fire 'click' on buttons inside shadow DOM.
    // Use touchstart/touchend with move detection to avoid scroll conflicts.
    const onTap = (el, fn) => {
      let touchMoved = false;
      el.addEventListener(
        "touchstart",
        () => {
          touchMoved = false;
        },
        { passive: true },
      );
      el.addEventListener(
        "touchmove",
        () => {
          touchMoved = true;
        },
        { passive: true },
      );
      el.addEventListener("touchend", (e) => {
        if (!touchMoved) {
          e.preventDefault();
          fn(e);
        }
      });
      el.addEventListener("click", fn);
    };

    // Sidebar toggle (mobile)
    onTap(d.hamburgerBtn, () => this._toggleSidebar());
    onTap(d.sidebarOverlay, () => this._closeSidebar());

    // Home button — navigate back to HA dashboard
    onTap(d.homeBtn, () => {
      window.history.pushState(null, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    // New chat
    onTap(d.shadow.querySelector(".btn-new-chat"), () => {
      this._newConversation();
      this._closeSidebar();
    });

    // Textarea auto-grow + keyboard shortcuts
    d.inputTextarea.addEventListener("input", () => this._autoResizeTextarea());
    d.inputTextarea.addEventListener("keydown", (e) => {
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      if (!isMobile && e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this._sendMessage();
      }
    });

    // Send / stop
    onTap(d.sendBtn, () => {
      if (this._isStreaming) {
        this._stopStreaming();
      } else {
        this._sendMessage();
      }
    });

    // Mic
    onTap(d.micBtn, () => this._toggleMic());

    // File attach
    onTap(d.attachBtn, () => d.fileInput.click());
    d.fileInput.addEventListener("change", (e) => this._handleFiles(e.target.files));

    // Message container scroll — detect user scroll-up
    d.messagesContainer.addEventListener("scroll", () => {
      const el = d.messagesContainer;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      this._userScrolledUp = !nearBottom;
    });
  }

  _bindViewportHandler() {
    if (!window.visualViewport) return;
    this._vvResizeHandler = () => {
      const bar = this._dom && this._dom.shadow && this._dom.shadow.querySelector(".input-bar");
      if (!bar) return;
      const vvHeight = window.visualViewport.height;
      const windowHeight = window.innerHeight;
      const keyboardHeight = Math.max(0, windowHeight - vvHeight);
      bar.style.paddingBottom =
        keyboardHeight > 0 ? `${keyboardHeight + 8}px` : `max(8px, env(safe-area-inset-bottom))`;
    };
    window.visualViewport.addEventListener("resize", this._vvResizeHandler);
  }

  // ── Sidebar ──────────────────────────────────────────────────────────────

  _toggleSidebar() {
    this._sidebarOpen ? this._closeSidebar() : this._openSidebar();
  }

  _openSidebar() {
    this._sidebarOpen = true;
    this._dom.sidebar.classList.add("open");
    this._dom.sidebarOverlay.classList.add("visible");
  }

  _closeSidebar() {
    this._sidebarOpen = false;
    this._dom.sidebar.classList.remove("open");
    this._dom.sidebarOverlay.classList.remove("visible");
  }

  // ── Conversation management ──────────────────────────────────────────────

  async _newConversation() {
    try {
      const res = await this._gwRequest("homeassistant.conversations", {
        action: "create",
        user_id: this._getUserId(),
      });
      const conv = {
        id: res.id,
        title: res.title || "New Chat",
        updatedAt: new Date().toISOString(),
      };
      this._conversations.unshift(conv);
      this._messages[conv.id] = [];
      this._setActiveConv(conv.id);
      this._renderConvList();
    } catch (err) {
      // Fallback: create locally
      const id = uid();
      this._conversations.unshift({ id, title: "New Chat", updatedAt: new Date().toISOString() });
      this._messages[id] = [];
      this._setActiveConv(id);
      this._renderConvList();
    }
  }

  async _setActiveConv(id) {
    this._activeConvId = id;
    this._streamingMsgId = null;
    this._isStreaming = false;
    const conv = this._conversations.find((c) => c.id === id);
    if (this._dom) {
      this._dom.topbarTitle.textContent = conv ? conv.title : "OpenClaw";
    }
    this._renderMessages();
    this._renderConvList();
    // Load history from server if we don't have messages yet
    if (!this._messages[id] || this._messages[id].length === 0) {
      try {
        const res = await this._gwRequest("homeassistant.conversations", {
          action: "load",
          user_id: this._getUserId(),
          conversation_id: id,
        });
        if (res?.messages) {
          this._messages[id] = res.messages.map((m) => ({
            id: m.id || uid(),
            role: m.role,
            content: m.content || "",
            ts: m.ts || new Date().toISOString(),
          }));
          if (this._activeConvId === id) this._renderMessages();
        }
      } catch (_) {}
    }
  }

  _deleteConversation(id) {
    this._conversations = this._conversations.filter((c) => c.id !== id);
    delete this._messages[id];
    if (this._activeConvId === id) {
      this._activeConvId = this._conversations[0]?.id || null;
      if (this._activeConvId) {
        this._setActiveConv(this._activeConvId);
      } else {
        this._renderMessages();
      }
    }
    this._gwRequest("homeassistant.conversations", {
      action: "delete",
      user_id: this._getUserId(),
      conversation_id: id,
    }).catch(() => {});
    this._renderConvList();
  }

  _renameConversation(id, title) {
    const conv = this._conversations.find((c) => c.id === id);
    if (conv) {
      conv.title = title.trim() || "Chat";
      if (this._activeConvId === id && this._dom) {
        this._dom.topbarTitle.textContent = conv.title;
      }
      this._gwRequest("homeassistant.conversations", {
        action: "rename",
        user_id: this._getUserId(),
        conversation_id: id,
        title: conv.title,
      }).catch(() => {});
      this._renderConvList();
    }
    this._renamingConvId = null;
  }

  // ── Render: conversation list ────────────────────────────────────────────

  _renderConvList() {
    if (!this._dom) return;
    const el = this._dom.convList;
    el.innerHTML = "";

    if (this._conversations.length === 0) {
      const empty = document.createElement("div");
      empty.style.cssText =
        "padding:16px;text-align:center;font-size:12px;color:var(--secondary-text-color,#9e9e9e)";
      empty.textContent = "No conversations yet.";
      el.appendChild(empty);
      return;
    }

    // Sort by most recent
    const sorted = [...this._conversations].sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    );

    for (const conv of sorted) {
      const item = this._buildConvItem(conv);
      el.appendChild(item);
    }
  }

  _buildConvItem(conv) {
    const isActive = conv.id === this._activeConvId;
    const isRenaming = conv.id === this._renamingConvId;

    const item = document.createElement("div");
    item.className = `conv-item${isActive ? " active" : ""}`;
    item.dataset.convId = conv.id;

    if (isRenaming) {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "conv-rename-input";
      input.value = conv.title;
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") this._renameConversation(conv.id, input.value);
        if (e.key === "Escape") {
          this._renamingConvId = null;
          this._renderConvList();
        }
      });
      input.addEventListener("blur", () => this._renameConversation(conv.id, input.value));
      item.appendChild(input);
      requestAnimationFrame(() => {
        input.focus();
        input.select();
      });
    } else {
      const info = document.createElement("div");
      info.className = "conv-info";
      info.innerHTML = `
        <div class="conv-title">${escapeHtml(conv.title)}</div>
        <div class="conv-time">${relativeTime(conv.updatedAt)}</div>
      `;
      item.appendChild(info);

      const actions = document.createElement("div");
      actions.className = "conv-actions";

      const renameBtn = document.createElement("button");
      renameBtn.className = "conv-action-btn";
      renameBtn.title = "Rename";
      renameBtn.innerHTML = ICON.pencil;
      renameBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this._renamingConvId = conv.id;
        this._renderConvList();
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "conv-action-btn danger";
      deleteBtn.title = "Delete";
      deleteBtn.innerHTML = ICON.trash;
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this._deleteConversation(conv.id);
      });

      actions.appendChild(renameBtn);
      actions.appendChild(deleteBtn);
      item.appendChild(actions);

      // Delete reveal overlay (swipe)
      const reveal = document.createElement("div");
      reveal.className = "conv-delete-reveal";
      reveal.textContent = "Delete";
      reveal.addEventListener("click", (e) => {
        e.stopPropagation();
        this._deleteConversation(conv.id);
      });
      item.appendChild(reveal);

      item.addEventListener("click", () => {
        if (this._swipedConvId === conv.id) {
          this._clearSwipe();
          return;
        }
        this._setActiveConv(conv.id);
        this._closeSidebar();
      });

      // Swipe gesture
      this._bindSwipe(item, conv.id);
    }

    return item;
  }

  _bindSwipe(el, convId) {
    let startX = 0;
    let startY = 0;
    let moved = false;

    el.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        moved = false;
      },
      { passive: true },
    );

    el.addEventListener(
      "touchmove",
      (e) => {
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
          moved = true;
          if (dx < -20) {
            this._swipedConvId = convId;
            el.classList.add("swiped");
          } else if (dx > 20) {
            this._clearSwipe();
          }
        }
      },
      { passive: true },
    );

    el.addEventListener(
      "touchend",
      () => {
        if (!moved) this._clearSwipe();
      },
      { passive: true },
    );
  }

  _clearSwipe() {
    if (!this._dom) return;
    this._dom.convList.querySelectorAll(".conv-item.swiped").forEach((el) => {
      el.classList.remove("swiped");
    });
    this._swipedConvId = null;
  }

  // ── Render: messages ────────────────────────────────────────────────────

  _renderMessages() {
    if (!this._dom) return;
    const el = this._dom.messagesContainer;
    const msgs = this._activeConvId ? this._messages[this._activeConvId] || [] : [];

    if (msgs.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${ICON.robot.replace('width="16" height="16"', 'width="56" height="56"')}</div>
          <div class="empty-state-title">OpenClaw</div>
          <div class="empty-state-sub">Ask me anything. I can help with Home Automation, coding, writing, and more.</div>
        </div>
      `;
      return;
    }

    el.innerHTML = "";
    let lastDate = null;

    for (const msg of msgs) {
      const msgDate = msg.ts ? new Date(msg.ts).toDateString() : null;
      if (msgDate && msgDate !== lastDate) {
        const divider = document.createElement("div");
        divider.className = "day-divider";
        divider.textContent = msgDate === new Date().toDateString() ? "Today" : msgDate;
        el.appendChild(divider);
        lastDate = msgDate;
      }
      el.appendChild(this._buildMsgEl(msg));
    }

    if (!this._userScrolledUp) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }

  _buildMsgEl(msg) {
    const row = document.createElement("div");
    row.className = `msg-row ${msg.role}`;
    row.dataset.msgId = msg.id;

    if (msg.role === "assistant") {
      const avatar = document.createElement("div");
      avatar.className = "msg-avatar";
      avatar.innerHTML = ICON.robot;
      row.appendChild(avatar);
    }

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";

    // Attachments
    if (msg.attachments && msg.attachments.length > 0) {
      for (const att of msg.attachments) {
        if (att.type && att.type.startsWith("image/")) {
          const img = document.createElement("img");
          img.className = "attach-preview-img";
          img.src = att.dataUrl || att.url || "";
          img.alt = att.name;
          bubble.appendChild(img);
        } else {
          const chip = document.createElement("div");
          chip.className = "attach-chip";
          chip.innerHTML = `${ICON.attach} <span>${escapeHtml(att.name)}</span> <span style="opacity:0.6">${formatBytes(att.size)}</span>`;
          bubble.appendChild(chip);
        }
      }
    }

    // Tool call card
    if (msg.toolCall) {
      const card = this._buildToolCard(msg.toolCall);
      bubble.appendChild(card);
    }

    // Message text
    if (msg.content !== undefined && msg.content !== null) {
      if (msg.id === this._streamingMsgId && msg.content === "") {
        // Typing indicator
        bubble.innerHTML += `
          <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        `;
      } else if (msg.role === "assistant") {
        const contentDiv = document.createElement("div");
        contentDiv.innerHTML = renderMarkdown(msg.content);
        bubble.appendChild(contentDiv);
      } else {
        const contentDiv = document.createElement("div");
        contentDiv.textContent = msg.content;
        bubble.appendChild(contentDiv);
      }
    }

    row.appendChild(bubble);

    if (msg.ts) {
      const time = document.createElement("div");
      time.className = "msg-time";
      time.textContent = new Date(msg.ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      row.appendChild(time);
    }

    return row;
  }

  _buildToolCard(toolCall) {
    const card = document.createElement("div");
    card.className = "tool-card";

    const header = document.createElement("div");
    header.className = "tool-card-header";
    header.innerHTML = `
      <span class="tool-card-name">${escapeHtml(toolCall.name || "tool")}</span>
      <span class="tool-card-chevron">${ICON.chevron}</span>
    `;
    header.addEventListener("click", () => card.classList.toggle("expanded"));

    const body = document.createElement("div");
    body.className = "tool-card-body";

    if (toolCall.input) {
      body.innerHTML += `
        <div class="tool-section-label">Input</div>
        <div class="tool-code">${escapeHtml(
          typeof toolCall.input === "string"
            ? toolCall.input
            : JSON.stringify(toolCall.input, null, 2),
        )}</div>
      `;
    }

    if (toolCall.output !== undefined) {
      body.innerHTML += `
        <div class="tool-section-label" style="margin-top:8px">Output</div>
        <div class="tool-code">${escapeHtml(
          typeof toolCall.output === "string"
            ? toolCall.output
            : JSON.stringify(toolCall.output, null, 2),
        )}</div>
      `;
    }

    card.appendChild(header);
    card.appendChild(body);
    return card;
  }

  // ── Append / update message helpers ─────────────────────────────────────

  _appendMessage(msg) {
    if (!this._activeConvId) return;
    if (!this._messages[this._activeConvId]) {
      this._messages[this._activeConvId] = [];
    }
    this._messages[this._activeConvId].push(msg);
    this._updateConvTimestamp(this._activeConvId);

    // Incremental DOM append (fast path)
    if (!this._dom) return;
    const el = this._dom.messagesContainer;

    // Remove empty state if present
    const empty = el.querySelector(".empty-state");
    if (empty) el.removeChild(empty);

    el.appendChild(this._buildMsgEl(msg));

    if (!this._userScrolledUp) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }

  _updateStreamingMessage(id, content) {
    if (!this._activeConvId) return;
    const msgs = this._messages[this._activeConvId];
    if (!msgs) return;
    const msg = msgs.find((m) => m.id === id);
    if (!msg) return;
    msg.content = content;

    // Update DOM in place
    if (!this._dom) return;
    const row = this._dom.messagesContainer.querySelector(`[data-msg-id="${id}"]`);
    if (!row) {
      this._renderMessages();
      return;
    }
    const bubble = row.querySelector(".msg-bubble");
    if (!bubble) return;

    // Replace content area (last child after possible avatar/attach content)
    let contentDiv = bubble.querySelector(".streaming-content");
    if (!contentDiv) {
      // Remove typing indicator if present
      const ti = bubble.querySelector(".typing-indicator");
      if (ti) ti.remove();
      contentDiv = document.createElement("div");
      contentDiv.className = "streaming-content";
      bubble.appendChild(contentDiv);
    }
    contentDiv.innerHTML = renderMarkdown(content);

    if (!this._userScrolledUp) {
      requestAnimationFrame(() => {
        const el = this._dom.messagesContainer;
        el.scrollTop = el.scrollHeight;
      });
    }
  }

  _finalizeStreamingMessage(id) {
    if (!this._activeConvId) return;
    const msgs = this._messages[this._activeConvId];
    if (!msgs) return;
    const msg = msgs.find((m) => m.id === id);
    if (!msg) return;

    this._streamingMsgId = null;
    this._isStreaming = false;

    // Re-render row without streaming class
    if (!this._dom) return;
    const row = this._dom.messagesContainer.querySelector(`[data-msg-id="${id}"]`);
    if (row) {
      const newRow = this._buildMsgEl(msg);
      row.replaceWith(newRow);
    }
    this._updateSendBtn();
  }

  _updateConvTimestamp(id) {
    const conv = this._conversations.find((c) => c.id === id);
    if (conv) conv.updatedAt = new Date().toISOString();
    this._renderConvList();
  }

  // ── Sending messages ─────────────────────────────────────────────────────

  _sendMessage() {
    if (!this._dom) return;
    const text = this._dom.inputTextarea.value.trim();
    const attachments = [...this._pendingAttachments];

    if (!text && attachments.length === 0) return;
    if (!this._wsReady) {
      this._showSystemMsg("Not connected. Please wait…");
      return;
    }

    // Ensure we have an active conversation
    if (!this._activeConvId) {
      this._newConversation();
    }

    // Optimistic UI: add user message immediately
    const userMsg = {
      id: uid(),
      role: "user",
      content: text,
      ts: new Date().toISOString(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };
    this._appendMessage(userMsg);

    // Add streaming placeholder
    const streamId = uid();
    this._streamingMsgId = streamId;
    this._isStreaming = true;
    const streamMsg = {
      id: streamId,
      role: "assistant",
      content: "",
      ts: new Date().toISOString(),
    };
    this._appendMessage(streamMsg);
    this._updateSendBtn();

    // Clear input
    this._dom.inputTextarea.value = "";
    this._autoResizeTextarea();
    this._pendingAttachments = [];
    this._renderAttachStaging();

    // Send via gateway method
    this._gwRequest("homeassistant.send", {
      secret: this._getSecret(),
      user_id: this._getUserId(),
      user_name: this._getUserName(),
      conversation_id: this._activeConvId,
      content: text,
      conn_id: this._connId,
    })
      .then((res) => {
        // If a new conversation was created, update state
        if (res?.new_conversation && res?.conversation_id) {
          this._activeConvId = res.conversation_id;
          this._conversations.unshift({
            id: res.conversation_id,
            title: "New conversation",
            updatedAt: new Date().toISOString(),
          });
          this._renderConvList();
        }
      })
      .catch((err) => {
        this._showSystemMsg("Send failed: " + err.message);
        this._finalizeStreamingMessage(streamId);
      });
  }

  _stopStreaming() {
    if (this._streamingMsgId) {
      this._wsSend({ type: "stop_stream", stream_id: this._streamingMsgId });
      this._finalizeStreamingMessage(this._streamingMsgId);
    }
    this._isStreaming = false;
    this._streamingMsgId = null;
    this._updateSendBtn();
  }

  _showSystemMsg(text) {
    const msg = { id: uid(), role: "system", content: text, ts: new Date().toISOString() };
    if (!this._activeConvId) {
      this._newConversation();
    }
    this._appendMessage(msg);
  }

  // ── Send button state ────────────────────────────────────────────────────

  _updateSendBtn() {
    if (!this._dom) return;
    const btn = this._dom.sendBtn;
    if (this._isStreaming) {
      btn.innerHTML = ICON.stop;
      btn.title = "Stop generating";
      btn.classList.add("send-btn");
    } else {
      btn.innerHTML = ICON.send;
      btn.title = "Send";
      btn.classList.add("send-btn");
    }
    this._dom.inputTextarea.disabled = this._isStreaming;
    this._dom.attachBtn.disabled = this._isStreaming;
    this._dom.micBtn.disabled = this._isStreaming;
  }

  // ── Auto-resize textarea ────────────────────────────────────────────────

  _autoResizeTextarea() {
    if (!this._dom) return;
    const ta = this._dom.inputTextarea;
    ta.style.height = "auto";
    const maxH = 5 * 1.45 * 15 + 20; // 5 lines
    ta.style.height = Math.min(ta.scrollHeight, maxH) + "px";
    ta.style.overflowY = ta.scrollHeight > maxH ? "auto" : "hidden";
  }

  // ── File attachments ────────────────────────────────────────────────────

  _handleFiles(files) {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        this._showSystemMsg(`File "${file.name}" exceeds 10 MB limit.`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        this._pendingAttachments.push({
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: e.target.result,
        });
        this._renderAttachStaging();
      };
      reader.readAsDataURL(file);
    }
    // Reset file input so the same file can be selected again
    this._dom.fileInput.value = "";
  }

  _renderAttachStaging() {
    if (!this._dom) return;
    const el = this._dom.attachStaging;
    el.innerHTML = "";
    for (let i = 0; i < this._pendingAttachments.length; i++) {
      const att = this._pendingAttachments[i];
      const chip = document.createElement("div");
      chip.className = "staging-chip";

      if (att.type && att.type.startsWith("image/")) {
        const img = document.createElement("img");
        img.className = "staging-img-thumb";
        img.src = att.dataUrl;
        img.alt = att.name;
        chip.appendChild(img);
      }

      const nameSpan = document.createElement("span");
      nameSpan.className = "staging-chip-name";
      nameSpan.textContent = att.name;
      chip.appendChild(nameSpan);

      const removeBtn = document.createElement("button");
      removeBtn.className = "staging-chip-remove";
      removeBtn.innerHTML = ICON.close.replace('width="20" height="20"', 'width="10" height="10"');
      removeBtn.addEventListener("click", () => {
        this._pendingAttachments.splice(i, 1);
        this._renderAttachStaging();
      });
      chip.appendChild(removeBtn);

      el.appendChild(chip);
    }
  }

  // ── Voice input (server-side transcription via OC media understanding) ───

  _checkSpeechSupport() {
    // MediaRecorder requires secure context (HTTPS). Always show the button
    // but warn on tap if unavailable.
  }

  _toggleMic() {
    if (this._micActive) {
      this._stopMic();
    } else {
      this._startMic();
    }
  }

  async _startMic() {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      this._showSystemMsg("Voice input requires HTTPS. Access HA via Tailscale (https://).");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this._mediaStream = stream;

      // Use webm/opus if supported, fall back to wav
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      this._mediaRecorder = new MediaRecorder(stream, { mimeType });
      this._audioChunks = [];

      this._mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this._audioChunks.push(e.data);
      };

      this._mediaRecorder.onstop = () => {
        this._processRecording();
      };

      this._mediaRecorder.start();
      this._micActive = true;
      if (this._dom) this._dom.micBtn.classList.add("mic-active");
    } catch (err) {
      console.error("Microphone access denied:", err);
      this._showSystemMsg("Microphone access denied. Check browser permissions.");
    }
  }

  _stopMic() {
    if (this._mediaRecorder && this._mediaRecorder.state !== "inactive") {
      this._mediaRecorder.stop();
    }
    if (this._mediaStream) {
      this._mediaStream.getTracks().forEach((t) => t.stop());
      this._mediaStream = null;
    }
    this._micActive = false;
    if (this._dom) this._dom.micBtn.classList.remove("mic-active");
  }

  async _processRecording() {
    if (!this._audioChunks || this._audioChunks.length === 0) return;

    const blob = new Blob(this._audioChunks, { type: "audio/webm" });
    this._audioChunks = [];

    // Show a temporary status
    if (this._dom) {
      this._dom.micBtn.classList.add("mic-processing");
    }

    // Convert to base64
    const buffer = await blob.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ""),
    );

    // Send to server for transcription via gateway method
    this._gwRequest("homeassistant.transcribe", {
      audio: base64,
      mime: "audio/webm",
    })
      .then((res) => {
        this._handleTranscription(res || {});
      })
      .catch((err) => {
        this._handleTranscription({ error: err.message });
      });
  }

  _handleTranscription(data) {
    if (this._dom) {
      this._dom.micBtn.classList.remove("mic-processing");
    }

    if (data.error) {
      this._showSystemMsg("Transcription failed: " + data.error);
      return;
    }

    if (data.retry || !data.text) {
      this._showSystemMsg("Could not understand. Please try again.");
      return;
    }

    // Insert transcribed text into the input
    if (this._dom && data.text) {
      const existing = this._dom.inputTextarea.value;
      this._dom.inputTextarea.value = existing + (existing ? " " : "") + data.text;
      this._autoResizeTextarea();
      this._dom.inputTextarea.focus();
    }
  }

  // ── Gateway WebSocket (uses OC gateway protocol) ─────────────────────────

  _getWsUrl() {
    const config = this._panel?.config || {};
    let url = config.ws_url || "";
    // Convert http(s):// to ws(s)://
    if (url.startsWith("http://")) url = "ws://" + url.slice(7);
    if (url.startsWith("https://")) url = "wss://" + url.slice(8);
    return url;
  }

  _getSecret() {
    return this._panel?.config?.secret || "";
  }

  _getUserId() {
    return this._hass?.user?.id || "";
  }

  _getUserName() {
    return this._hass?.user?.name || "";
  }

  /** Call a gateway method and return the response payload. */
  async _gwRequest(method, params) {
    return new Promise((resolve, reject) => {
      const id = uid();
      this._pendingRequests = this._pendingRequests || {};
      this._pendingRequests[id] = { resolve, reject };
      this._wsSend({ type: "req", id, method, params });
      // Timeout after 30s
      setTimeout(() => {
        if (this._pendingRequests[id]) {
          delete this._pendingRequests[id];
          reject(new Error("Request timeout"));
        }
      }, 30000);
    });
  }

  _connectWs() {
    if (this._destroyed) return;
    if (
      this._ws &&
      (this._ws.readyState === WebSocket.OPEN || this._ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }
    const wsUrl = this._getWsUrl();
    if (!wsUrl) {
      this._setConnStatus("disconnected");
      return;
    }

    this._setConnStatus("connecting");
    this._pendingRequests = {};
    try {
      this._ws = new WebSocket(wsUrl);
    } catch (e) {
      this._setConnStatus("disconnected", "WebSocket create failed: " + wsUrl);
      this._scheduleReconnect();
      return;
    }

    this._ws.addEventListener("open", () => {
      if (this._destroyed) {
        this._ws.close();
        return;
      }
      // Gateway requires a connect handshake before any method calls
      const connectId = uid();
      this._pendingRequests[connectId] = {
        resolve: (hello) => {
          this._connId = hello?.connId;
          this._wsReady = true;
          this._reconnectDelay = 1000;
          this._setConnStatus("connected");
          this._startPing();
          this._loadConversations();
        },
        reject: (err) => {
          console.error("Gateway handshake failed:", err);
          this._setConnStatus("disconnected", err?.message || "handshake failed");
          this._ws.close();
        },
      };
      const connectParams = {
        minProtocol: 3,
        maxProtocol: 3,
        client: { id: "openclaw-control-ui", version: "1.0", platform: "web", mode: "webchat" },
        role: "operator",
        scopes: ["operator.read", "operator.write"],
      };
      const secret = this._getSecret();
      if (secret) {
        connectParams.auth = { token: secret };
      }
      this._ws.send(
        JSON.stringify({ type: "req", id: connectId, method: "connect", params: connectParams }),
      );
    });

    this._ws.addEventListener("message", (e) => {
      try {
        const frame = JSON.parse(e.data);
        this._handleGatewayFrame(frame);
      } catch (_) {}
    });

    this._ws.addEventListener("close", (e) => {
      this._wsReady = false;
      this._setConnStatus("disconnected", e.reason || "connection closed");
      this._stopPing();
      if (!this._destroyed) this._scheduleReconnect();
    });

    this._ws.addEventListener("error", () => {
      this._wsReady = false;
      const wsUrl = this._getWsUrl();
      this._setConnStatus("disconnected", "cannot reach " + wsUrl);
    });
  }

  _handleGatewayFrame(frame) {
    // Gateway response to a request
    if (frame.type === "res" && frame.id && this._pendingRequests?.[frame.id]) {
      const { resolve, reject } = this._pendingRequests[frame.id];
      delete this._pendingRequests[frame.id];
      if (frame.ok) {
        resolve(frame.payload);
      } else {
        reject(new Error(frame.error?.message || "Request failed"));
      }
      return;
    }

    // Gateway event (streaming tokens, title updates, etc.)
    if (frame.type === "event" && frame.event) {
      this._handleGatewayEvent(frame.event, frame.payload || {});
      return;
    }

    // Gateway hello (connection established)
    if (frame.type === "hello") {
      this._connId = frame.connId;
      return;
    }
  }

  _handleGatewayEvent(event, payload) {
    switch (event) {
      case "homeassistant.token": {
        const streamId = this._streamingMsgId;
        if (streamId) {
          const msgs = this._messages[this._activeConvId];
          const msg = msgs && msgs.find((m) => m.id === streamId);
          if (msg) {
            msg.content = (msg.content || "") + (payload.token || "");
            this._updateStreamingMessage(streamId, msg.content);
          }
        }
        break;
      }

      case "homeassistant.done": {
        if (this._streamingMsgId) {
          this._finalizeStreamingMessage(this._streamingMsgId);
        }
        break;
      }

      case "homeassistant.error": {
        if (this._streamingMsgId) {
          const msgs = this._messages[this._activeConvId];
          const msg = msgs && msgs.find((m) => m.id === this._streamingMsgId);
          if (msg) {
            msg.content =
              (msg.content || "") + "\n\n*(Error: " + (payload.error || "unknown") + ")*";
          }
          this._finalizeStreamingMessage(this._streamingMsgId);
        } else {
          this._showSystemMsg("Error: " + (payload.error || "Unknown"));
        }
        break;
      }

      case "homeassistant.title": {
        const convId = payload.conversation_id;
        const title = payload.title;
        const existing = this._conversations.find((c) => c.id === convId);
        if (existing && title) existing.title = title;
        if (this._activeConvId === convId && title && this._dom) {
          this._dom.topbarTitle.textContent = title;
        }
        this._renderConvList();
        break;
      }

      default:
        break;
    }
  }

  async _loadConversations() {
    try {
      const res = await this._gwRequest("homeassistant.conversations", {
        action: "list",
        user_id: this._getUserId(),
      });
      this._conversations = (res?.conversations || []).map((c) => ({
        id: c.id,
        title: c.title || "Chat",
        updatedAt: c.updated_at || new Date().toISOString(),
      }));
      this._renderConvList();
      if (!this._activeConvId && this._conversations.length > 0) {
        this._setActiveConv(this._conversations[0].id);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  }

  _wsSend(payload) {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      try {
        this._ws.send(JSON.stringify(payload));
      } catch (_) {}
    }
  }

  _cleanupWs() {
    this._stopPing();
    if (this._reconnectTimer) clearTimeout(this._reconnectTimer);
    if (this._ws) {
      this._ws.onclose = null;
      this._ws.onerror = null;
      this._ws.onmessage = null;
      this._ws.onopen = null;
      try {
        this._ws.close();
      } catch (_) {}
      this._ws = null;
    }
    this._wsReady = false;
  }

  _scheduleReconnect() {
    if (this._destroyed) return;
    if (this._reconnectTimer) clearTimeout(this._reconnectTimer);
    this._reconnectTimer = setTimeout(() => {
      if (!this._destroyed) this._connectWs();
    }, this._reconnectDelay);
    this._reconnectDelay = Math.min(this._reconnectDelay * 2, 30000);
  }

  _startPing() {
    this._stopPing();
    this._pingTimer = setInterval(() => {
      if (!this._ws || this._ws.readyState !== WebSocket.OPEN) return;
      this._wsSend({ type: "ping" });
      this._pongTimeout = setTimeout(() => {
        // No pong received — reconnect
        if (this._ws) this._ws.close();
      }, 10000);
    }, 30000);
  }

  _stopPing() {
    if (this._pingTimer) clearInterval(this._pingTimer);
    if (this._pongTimeout) clearTimeout(this._pongTimeout);
    this._pingTimer = null;
    this._pongTimeout = null;
  }

  // ── Connection status indicator ──────────────────────────────────────────

  _setConnStatus(status, detail) {
    this._connStatus = status;
    if (!this._dom) return;
    const el = this._dom.connStatus;
    el.className = `conn-status ${status}`;
    const label =
      status === "connected"
        ? "Connected"
        : status === "connecting"
          ? "Connecting…"
          : "Disconnected";
    el.textContent = detail ? `${label} (${detail})` : label;
    // Show connection info in the chat area on failure
    if (status === "disconnected" && detail) {
      this._showSystemMsg("Connection: " + detail);
    }
  }

  // ── HA dependency updates ────────────────────────────────────────────────

  _updateHassDependent() {
    // Re-render relative timestamps periodically handled by render calls
    // Update connection if user changed
  }
}

customElements.define("openclaw-panel", OpenClawPanel);
