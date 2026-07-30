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
var TOOL_LABELS = {
  ha_get_states: "Sjekker enheter...",
  ha_call_service: "Utforer kommando...",
  ha_get_history: "Henter historikk...",
  ha_fire_event: "Sender hendelse...",
  memory_search: "Soker i hukommelse...",
  memory_get: "Henter minne...",
  web_fetch: "Henter fra nett...",
  message: "Sender melding...",
  exec: "Kjorer kommando...",
};
const STYLES = `
  :host, openclaw-panel {
    display: flex !important;
    flex-direction: column;
    height: 100%;
    max-height: 100%;
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
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    transform: translateX(-100%);
    box-shadow: 2px 0 16px rgba(0,0,0,0.15);
  }
  .sidebar.open { transform: translateX(0); }

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

  /* Overlay for sidebar */
  .sidebar-overlay {
    display: block;
    pointer-events: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 199;
    opacity: 0;
    transition: opacity 0.25s;
  }
  .sidebar-overlay.visible { opacity: 1; pointer-events: all; }

  /* ── Main area ── */
  .main {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
    position: relative;
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
    display: flex;
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
  .conn-status.connected { background: rgba(46, 125, 50, 0.15); color: #66bb6a; }
  .conn-status.connecting { background: rgba(245, 127, 23, 0.15); color: #ffa726; }
  .conn-status.disconnected { background: rgba(198, 40, 40, 0.15); color: #ef5350; }

  /* Connection banner */
  .conn-banner {
    display: none;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    text-align: center;
    flex-shrink: 0;
    cursor: pointer;
    transition: all 0.2s;
  }
  .conn-banner.warn {
    display: block;
    background: rgba(245, 127, 23, 0.12);
    color: #ffa726;
  }
  .conn-banner.error {
    display: block;
    background: rgba(198, 40, 40, 0.12);
    color: #ef5350;
  }

  /* ── Messages ── */
  .messages-container {
    flex: 1 1 0;
    overflow-y: scroll;
    -webkit-overflow-scrolling: touch;
    padding: 12px 8px 8px;
    display: block;
    min-height: 0;
  }
  .messages-container > * {
    margin-bottom: 2px;
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
    max-width: 78%;
    margin-bottom: 4px;
  }
  .msg-row.user { align-self: flex-end; align-items: flex-end; }
  .msg-row.assistant { align-self: flex-start; align-items: flex-start; }
  .msg-row.system { align-self: center; max-width: 100%; }

  .msg-bubble {
    padding: 10px 14px;
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
    border-radius: 20px 20px 4px 20px;
  }

  .msg-row.assistant .msg-bubble {
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color, #212121);
    border-radius: 20px 20px 20px 4px;
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
  .tool-pill {
    display: inline-block;
    margin: 0 0 8px;
    padding: 3px 10px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--primary-color, #03a9f4) 14%, transparent);
    color: var(--primary-text-color, #212121);
    font-size: 12px;
    opacity: 0.85;
  }
  .msg-bubble pre {
    background: color-mix(in srgb, var(--primary-text-color, #212121) 8%, transparent);
    border-radius: 8px;
    padding: 10px;
    overflow-x: auto;
    font-size: 13px;
    margin: 6px 0;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .msg-bubble code {
    background: color-mix(in srgb, var(--primary-text-color, #212121) 8%, transparent);
    border-radius: 3px;
    padding: 1px 5px;
    font-size: 13px;
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
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transition: max-height 0.2s, opacity 0.2s;
  }
  .msg-row.show-time .msg-time {
    max-height: 20px;
    opacity: 1;
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

  /* Thinking indicator */
  .thinking-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 0;
  }
  .thinking-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--primary-color, #03a9f4);
    animation: thinking-pulse 1.5s ease-in-out infinite;
    flex-shrink: 0;
  }
  @keyframes thinking-pulse {
    0%, 100% { opacity: 0.3; transform: scale(0.85); }
    50% { opacity: 1; transform: scale(1); }
  }
  .thinking-text {
    font-size: 14px;
    color: var(--secondary-text-color, #757575);
    font-style: italic;
  }

  /* ── Input bar ── */
  .input-bar {
    padding: 8px 12px;
    padding-bottom: max(8px, env(safe-area-inset-bottom));
    background: var(--lovelace-background, var(--ha-background, #fafafa));
    flex-shrink: 0;
  }

  .input-container {
    display: flex;
    align-items: flex-end;
    background: var(--card-background-color, #fff);
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: 22px;
    padding: 4px 4px 4px 16px;
    gap: 4px;
    transition: border-color 0.15s;
  }
  .input-container:focus-within {
    border-color: var(--primary-color, #03a9f4);
  }

  .input-textarea {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font-size: 15px;
    line-height: 1.4;
    padding: 8px 0;
    resize: none;
    max-height: 120px;
    min-height: 22px;
    font-family: inherit;
    color: var(--primary-text-color, #212121);
    overflow-y: auto;
    -webkit-user-select: text;
    user-select: text;
    -webkit-touch-callout: default;
  }
  .input-textarea::placeholder { color: var(--secondary-text-color, #9e9e9e); }
  .input-textarea:disabled { opacity: 0.6; cursor: not-allowed; }

  .input-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    padding-bottom: 2px;
  }

  .input-btn {
    width: 36px;
    height: 36px;
    min-width: 36px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--secondary-text-color, #757575);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.12s, color 0.12s, opacity 0.2s;
    padding: 0;
    flex-shrink: 0;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
  .input-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .input-btn.send-btn {
    background: var(--primary-color, #03a9f4);
    color: #fff;
  }
  .input-btn.send-btn:hover { opacity: 0.9; }

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

  /* ── Scrollbar styling ── */
  .messages-container::-webkit-scrollbar,
  .conv-list::-webkit-scrollbar { width: 4px; }
  .messages-container::-webkit-scrollbar-track,
  .conv-list::-webkit-scrollbar-track { background: transparent; }
  .messages-container::-webkit-scrollbar-thumb,
  .conv-list::-webkit-scrollbar-thumb { background: var(--divider-color, #e0e0e0); border-radius: 4px; }

  /* ══════════ Warm Slate theme (bold restyle) ══════════ */
  :host, openclaw-panel {
    --primary-color: #22c55e;
    --primary-text-color: #eef2f6;
    --secondary-text-color: #94a3b3;
    --card-background-color: #1b2531;
    --sidebar-background-color: #141b24;
    --secondary-background-color: #1b2531;
    --divider-color: #26313f;
    background: radial-gradient(120% 60% at 50% 0%, #16202b 0%, #0f141b 60%) !important;
    color: #eef2f6;
  }
  .topbar {
    background: rgba(15,20,27,0.85);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    border-bottom-color: #26313f;
  }
  .topbar-title { font-weight: 700; letter-spacing: 0.2px; }
  /* connection status as a glowing dot + label */
  .conn-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: transparent !important;
    padding: 4px 6px;
  }
  .conn-status::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 8px currentColor;
  }
  .conn-status.connected { color: #34d399; }
  .conn-status.connecting { color: #fbbf24; }
  .conn-status.disconnected { color: #f87171; }
  .conn-banner.warn { background: rgba(251,191,36,0.12); color: #fbbf24; }
  .conn-banner.error { background: rgba(248,113,113,0.12); color: #f87171; }

  /* user → green bubble */
  .msg-row.user .msg-bubble {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: #04210f;
    font-weight: 550;
    border-radius: 18px 18px 6px 18px;
    box-shadow: 0 6px 18px rgba(34,197,94,0.22);
  }
  /* assistant → plain text (no card) */
  .msg-row.user { margin-left: auto; margin-right: 0; align-items: flex-end; }
  .msg-row.assistant { margin-right: auto; margin-left: 0; align-items: flex-start; max-width: 92%; }
  .msg-row.assistant .msg-bubble {
    background: transparent;
    border: 0;
    padding: 2px 4px;
    border-radius: 0;
    color: #eef2f6;
  }
  .msg-row.assistant .msg-bubble code,
  .msg-row.assistant .msg-bubble pre {
    background: #0c1118;
    border: 1px solid #26313f;
    color: #a7f3d0;
  }
  .msg-row.assistant .msg-bubble blockquote {
    margin: 8px 0;
    padding: 6px 12px;
    border-left: 3px solid #22c55e;
    background: rgba(34,197,94,0.06);
    border-radius: 0 8px 8px 0;
    color: #94a3b3;
    font-style: italic;
  }

  /* input bar */
  .input-bar { background: linear-gradient(0deg, #0f141b 70%, transparent); }
  .input-textarea { color: #eef2f6; }

  /* welcome / suggestion chips */
  .welcome { padding: 10px 6px 4px; }
  .welcome-title { font-size: 24px; font-weight: 750; margin-bottom: 4px; color: #eef2f6; }
  .welcome-sub { font-size: 14px; color: #94a3b3; margin-bottom: 16px; }
  .welcome-chips { display: flex; flex-wrap: wrap; gap: 9px; }
  .welcome-chip {
    padding: 10px 14px;
    border: 1px solid #26313f;
    background: #1b2531;
    color: #eef2f6;
    border-radius: 13px;
    font-size: 13.5px;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }
  .welcome-chip:hover, .welcome-chip:active { border-color: #22c55e; background: #1f2b38; }
`;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}
function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderMarkdown(text) {
  if (!text) return "";
  var html = escapeHtml(text);
  html = html.replace(
    /```(\w*)\n?([\s\S]*?)```/g,
    (_, lang, code) => "<pre><code>" + code + "</code></pre>",
  );
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(
    /^---$/gm,
    '<hr style="border:none;border-top:1px solid var(--divider-color,#e0e0e0);margin:8px 0">',
  );
  html = html.replace(
    /^&gt; (.+)$/gm,
    '<div style="border-left:3px solid var(--divider-color,#e0e0e0);padding-left:10px;margin:4px 0;color:var(--secondary-text-color,#757575)">$1</div>',
  );
  html = html.replace(/\n/g, "<br>");
  return html;
}

var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Auto-format chat titles as "dd.Mon: topic" (idempotent).
function formatChatTitle(raw, dateIso) {
  var topic = (raw || "Chat").trim();
  if (/^\d{1,2}\.[A-Za-z]{3}:\s/.test(topic)) return topic; // already formatted
  var d = dateIso ? new Date(dateIso) : new Date();
  if (isNaN(d.getTime())) d = new Date();
  var day = String(d.getDate()).padStart(2, "0");
  return day + "." + MONTHS[d.getMonth()] + ": " + topic;
}

class OpenClawPanel extends HTMLElement {
  constructor() {
    super();
    this._hass = null;
    this._panel = null;
  }
  set hass(h) {
    this._hass = h;
    this._try();
  }
  set panel(p) {
    this._panel = p;
    this._try();
  }
  connectedCallback() {
    this._conn = true;
    this._try();
  }

  _try() {
    if (this._done || !this._conn || !this._hass || !this._panel) return;
    this._done = true;
    this._config = this._panel.config || {};
    this._user = this._hass.user || {};
    this._streamEl = null;
    this._conversations = [];
    this._activeConvId = null;
    this._messageCache = {};
    this._thinkingEl = null;
    this._renderTimer = null;
    this._es = null;
    this._esConv = null;

    // Derive HTTP base from ws_url when api_url is not set
    this._base = (this._config.api_url || this._config.ws_url.replace(/^ws/, "http")).replace(
      /\/$/,
      "",
    );
    this._secret = this._config.secret;
    this._apiRoot = this._base + "/api/homeassistant";

    var shadow = this.attachShadow({ mode: "open" });
    var style = document.createElement("style");
    style.textContent = STYLES;
    shadow.appendChild(style);

    var layout = document.createElement("div");
    layout.className = "layout";
    layout.innerHTML = `
      <div class="sidebar-overlay"></div>
      <div class="sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title">OpenClaw</span>
          <button class="btn-new-chat" title="New conversation">${ICON.newchat} New Chat</button>
        </div>
        <div class="conv-list"></div>
      </div>
      <div class="main">
        <div class="topbar">
          <button class="home-btn" title="Back">${ICON.home}</button>
          <button class="hamburger-btn" title="Chat history">${ICON.hamburger}</button>
          <span class="topbar-title">OpenClaw</span>
          <span class="conn-status connecting">Connecting...</span>
        </div>
        <div class="conn-banner"></div>
        <div class="messages-container"></div>
        <div class="input-bar">
          <div class="input-container">
            <textarea class="input-textarea" rows="1" placeholder="Melding..."></textarea>
            <div class="input-actions">
              <button class="input-btn mic-btn" title="Stemmeinndata">${ICON.mic}</button>
              <button class="input-btn send-btn" title="Send" style="display:none">${ICON.send}</button>
            </div>
          </div>
        </div>
      </div>
    `;
    shadow.appendChild(layout);

    this._shadow = shadow;
    this._status = shadow.querySelector(".conn-status");
    this._messagesEl = shadow.querySelector(".messages-container");
    this._input = shadow.querySelector(".input-textarea");
    this._convList = shadow.querySelector(".conv-list");
    this._sidebar = shadow.querySelector(".sidebar");
    this._overlay = shadow.querySelector(".sidebar-overlay");
    this._topTitle = shadow.querySelector(".topbar-title");
    this._banner = shadow.querySelector(".conn-banner");

    var self = this;
    shadow.querySelector(".home-btn").addEventListener("click", function () {
      location.href = "/";
    });
    shadow.querySelector(".send-btn").addEventListener("click", function () {
      self._send();
    });
    shadow.querySelector(".hamburger-btn").addEventListener("click", function () {
      self._toggleSidebar();
    });
    this._overlay.addEventListener("click", function () {
      self._closeSidebar();
    });
    shadow.querySelector(".btn-new-chat").addEventListener("click", function () {
      self._newConversation();
      self._closeSidebar();
    });
    this._input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        self._send();
      }
    });
    this._input.addEventListener("input", function () {
      self._input.style.height = "auto";
      self._input.style.height = Math.min(self._input.scrollHeight, 120) + "px";
      // Toggle mic/send buttons
      var hasText = self._input.value.trim().length > 0;
      self._micBtn.style.display = hasText ? "none" : "flex";
      shadow.querySelector(".send-btn").style.display = hasText ? "flex" : "none";
    });

    // Mic button
    this._micBtn = shadow.querySelector(".mic-btn");
    this._micActive = false;
    this._micBtn.addEventListener("click", function () {
      if (self._micActive) self._stopMic();
      else self._startMic();
    });

    this._setConn("connecting");
    this._loadConversations();

    // iOS keyboard handling — WKWebView + Safari
    var host = this;
    var messagesEl = this._messagesEl;
    if (window.visualViewport) {
      var lastHeight = window.visualViewport.height;
      var onResize = function () {
        var vh = window.visualViewport.height;
        host.style.height = vh + "px";
        // Keyboard opened — scroll messages to bottom and prevent page scroll
        if (vh < lastHeight) {
          window.scrollTo(0, 0);
          messagesEl.scrollTop = messagesEl.scrollHeight;
        }
        lastHeight = vh;
      };
      window.visualViewport.addEventListener("resize", onResize);
      window.visualViewport.addEventListener("scroll", function () {
        // Prevent iOS from scrolling the whole page when keyboard is open
        window.scrollTo(0, 0);
        host.style.height = window.visualViewport.height + "px";
      });
      onResize();
    } else {
      this.style.height = window.innerHeight + "px";
    }
    // Prevent body scroll on iOS
    this._input.addEventListener("focus", function () {
      setTimeout(function () {
        window.scrollTo(0, 0);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }, 300);
    });
  }

  // ── Voice input ──
  _showToast(msg) {
    var el = document.createElement("div");
    el.textContent = msg;
    el.setAttribute(
      "style",
      "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--primary-text-color,#333);color:var(--lovelace-background,#fff);padding:10px 20px;border-radius:20px;font-size:14px;z-index:10000;",
    );
    (this._shadow || document.body).appendChild(el);
    setTimeout(function () {
      el.remove();
    }, 3000);
  }

  async _startMic() {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      this._showToast("Voice input requires HTTPS");
      return;
    }
    try {
      var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this._mediaStream = stream;
      // Detect supported audio format — iOS Safari doesn't support webm
      var mimeType = "";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus"))
        mimeType = "audio/webm;codecs=opus";
      else if (MediaRecorder.isTypeSupported("audio/webm")) mimeType = "audio/webm";
      else if (MediaRecorder.isTypeSupported("audio/mp4")) mimeType = "audio/mp4";
      else if (MediaRecorder.isTypeSupported("audio/aac")) mimeType = "audio/aac";
      // If no mime detected, let browser pick default
      var recorderOpts = mimeType ? { mimeType: mimeType } : {};
      this._recorderMime = mimeType || "audio/mp4";
      this._mediaRecorder = new MediaRecorder(stream, recorderOpts);
      this._audioChunks = [];
      var self = this;
      this._mediaRecorder.ondataavailable = function (e) {
        if (e.data.size > 0) self._audioChunks.push(e.data);
      };
      this._mediaRecorder.onstop = function () {
        self._processRecording();
      };
      this._mediaRecorder.start();
      this._micActive = true;
      this._micBtn.classList.add("mic-active");
      this._showToast("Recording...");
    } catch (err) {
      this._showToast("Microphone access denied");
    }
  }

  _stopMic() {
    if (this._mediaRecorder && this._mediaRecorder.state !== "inactive") this._mediaRecorder.stop();
    if (this._mediaStream) {
      this._mediaStream.getTracks().forEach(function (t) {
        t.stop();
      });
      this._mediaStream = null;
    }
    this._micActive = false;
    this._micBtn.classList.remove("mic-active");
  }

  async _processRecording() {
    if (!this._audioChunks || this._audioChunks.length === 0) {
      this._showToast("No audio recorded");
      return;
    }
    var mime = this._recorderMime || "audio/mp4";
    var blob = new Blob(this._audioChunks, { type: mime });
    this._audioChunks = [];
    this._micBtn.classList.add("mic-processing");
    this._showToast("Transcribing...");

    var buffer = await blob.arrayBuffer();
    var bytes = new Uint8Array(buffer);
    var binary = "";
    for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    var base64 = btoa(binary);

    try {
      var res = await this._gwRequest("/transcribe", {
        audio: base64,
        mime: mime,
      });
      this._micBtn.classList.remove("mic-processing");
      if (res.retry || !res.text) {
        this._showToast("Couldn't understand. Try again.");
      } else {
        var existing = this._input.value;
        this._input.value = existing + (existing ? " " : "") + res.text;
        this._input.focus();
      }
    } catch (err) {
      this._micBtn.classList.remove("mic-processing");
      this._showToast("Transcription failed");
    }
  }

  // ── Sidebar ──
  _toggleSidebar() {
    this._sidebar.classList.toggle("open");
    this._overlay.classList.toggle("visible");
  }
  _closeSidebar() {
    this._sidebar.classList.remove("open");
    this._overlay.classList.remove("visible");
  }

  _showBanner(msg, type) {
    this._banner.textContent = msg;
    this._banner.className = "conn-banner " + type;
    this._banner.onclick = null;
  }

  _hideBanner() {
    this._banner.className = "conn-banner";
    this._banner.textContent = "";
    this._banner.onclick = null;
  }

  // Update the connection status pill and banner based on SSE state.
  _setConn(state) {
    var labels = {
      connected: "Connected",
      connecting: "Connecting...",
      disconnected: "Disconnected",
    };
    this._status.textContent = labels[state] || state;
    this._status.className = "conn-status " + state;
    if (state === "connected") {
      this._hideBanner();
    } else if (state === "connecting") {
      this._showBanner("Kobler til...", "warn");
    } else {
      this._showBanner("Frakoblet — EventSource kobler til automatisk...", "warn");
    }
  }

  // ── Conversations ──
  async _newConversation() {
    try {
      var res = await this._gwRequest("/conversations", {
        action: "create",
        user_id: this._user.id,
      });
      this._conversations.unshift({
        id: res.id,
        title: res.title || "New Chat",
        updatedAt: new Date().toISOString(),
      });
      this._messageCache[res.id] = [];
      this._setActiveConv(res.id);
    } catch (e) {
      // Fallback
      var id = uid();
      this._conversations.unshift({
        id: id,
        title: "New Chat",
        updatedAt: new Date().toISOString(),
      });
      this._messageCache[id] = [];
      this._setActiveConv(id);
    }
    this._renderConvList();
  }

  _setActiveConv(id) {
    this._activeConvId = id;
    this._streamEl = null;
    this._ensureStream(id);
    var conv = this._conversations.find(function (c) {
      return c.id === id;
    });
    this._topTitle.textContent = conv ? conv.title : "OpenClaw";
    this._renderMessages();
    this._renderConvList();
    if (!this._messageCache[id]) {
      this._loadHistory(id);
    }
  }

  async _loadHistory(id) {
    try {
      var res = await this._gwRequest("/conversations", {
        action: "load",
        user_id: this._user.id,
        conversation_id: id,
      });
      if (res && res.messages) {
        this._messageCache[id] = res.messages;
        if (this._activeConvId === id) this._renderMessages();
      }
    } catch (e) {}
  }

  async _deleteConversation(id) {
    this._conversations = this._conversations.filter(function (c) {
      return c.id !== id;
    });
    delete this._messageCache[id];
    if (this._activeConvId === id) {
      this._activeConvId = this._conversations[0]?.id || null;
      if (this._activeConvId) this._setActiveConv(this._activeConvId);
      else this._renderMessages();
    }
    this._renderConvList();
    this._gwRequest("/conversations", {
      action: "delete",
      user_id: this._user.id,
      conversation_id: id,
    }).catch(function () {});
  }

  _renderConvList() {
    var self = this;
    this._convList.innerHTML = "";
    this._conversations.forEach(function (conv) {
      var el = document.createElement("div");
      el.className = "conv-item" + (conv.id === self._activeConvId ? " active" : "");
      el.innerHTML =
        '<div class="conv-info"><div class="conv-title">' +
        escapeHtml(conv.title) +
        "</div></div>" +
        '<div class="conv-actions"><button class="conv-action-btn" title="Delete">' +
        ICON.trash +
        "</button></div>";
      el.querySelector(".conv-info").addEventListener("click", function () {
        self._setActiveConv(conv.id);
        self._closeSidebar();
      });
      el.querySelector(".conv-action-btn").addEventListener("click", function (e) {
        e.stopPropagation();
        self._deleteConversation(conv.id);
      });
      self._convList.appendChild(el);
    });
  }

  _renderMessages() {
    this._messagesEl.innerHTML = "";
    var msgs = this._messageCache[this._activeConvId] || [];
    var self = this;
    if (msgs.length === 0) {
      var hour = new Date().getHours();
      var greet =
        hour < 5 ? "God natt" : hour < 11 ? "God morgen" : hour < 18 ? "Hei" : "God kveld";
      var firstName =
        self._user && self._user.name ? ", " + escapeHtml(self._user.name.split(" ")[0]) : "";
      this._messagesEl.innerHTML =
        '<div class="welcome">' +
        '<div class="welcome-title">' +
        greet +
        firstName +
        " 👋</div>" +
        '<div class="welcome-sub">Hva kan jeg hjelpe deg med?</div>' +
        '<div class="welcome-chips">' +
        '<span class="welcome-chip">Skru av alle lys</span>' +
        '<span class="welcome-chip">Hvilke lys er på?</span>' +
        '<span class="welcome-chip">Temperatur inne?</span>' +
        "</div></div>";
      this._messagesEl.querySelectorAll(".welcome-chip").forEach(function (chip) {
        chip.addEventListener("click", function () {
          self._input.value = chip.textContent;
          self._send();
        });
      });
      return;
    }
    msgs.forEach(function (m) {
      var row = document.createElement("div");
      row.className = "msg-row " + (m.role || "assistant");
      var bubble = document.createElement("div");
      bubble.className = "msg-bubble";
      var body =
        m.role === "assistant"
          ? renderMarkdown(m.content || m.text || "")
          : escapeHtml(m.content || m.text || "");
      var toolPills = "";
      var tc = Number(m.tool_count) || 0;
      for (var i = 0; i < tc; i++) {
        toolPills += '<div class="tool-pill">🛠 Verktøy brukt</div>';
      }
      bubble.innerHTML = toolPills + body;
      row.appendChild(bubble);
      if (m.ts) {
        var time = document.createElement("div");
        time.className = "msg-time";
        time.textContent = new Date(m.ts).toLocaleTimeString("nb-NO", {
          hour: "2-digit",
          minute: "2-digit",
        });
        row.appendChild(time);
      }
      bubble.addEventListener("click", function () {
        row.classList.toggle("show-time");
      });
      self._messagesEl.appendChild(row);
    });
    this._messagesEl.scrollTop = this._messagesEl.scrollHeight;
  }

  // ── Send ──
  _send() {
    var text = this._input.value.trim();
    if (!text) return;
    this._input.value = "";
    this._input.style.height = "auto";
    this._micBtn.style.display = "flex";
    this._shadow.querySelector(".send-btn").style.display = "none";

    // Ensure active conversation
    if (!this._activeConvId) {
      this._newConversation().then(() => this._doSend(text));
      return;
    }
    this._doSend(text);
  }

  _doSend(text) {
    var convId = this._activeConvId;
    if (!this._messageCache[convId]) this._messageCache[convId] = [];

    // Clear the welcome / empty state before the first message renders.
    var welcomeEl = this._messagesEl.querySelector(".welcome, .empty-state");
    if (welcomeEl) this._messagesEl.innerHTML = "";

    // User message
    this._messageCache[convId].push({ role: "user", content: text });
    var um = document.createElement("div");
    um.className = "msg-row user";
    um.innerHTML = '<div class="msg-bubble">' + escapeHtml(text) + "</div>";
    this._messagesEl.appendChild(um);

    // Bot placeholder — thinking indicator
    var bm = document.createElement("div");
    bm.className = "msg-row assistant";
    bm.innerHTML =
      '<div class="msg-bubble thinking-bubble"><div class="thinking-indicator"><span class="thinking-dot"></span><span class="thinking-text">Tenker...</span></div></div>';
    this._messagesEl.appendChild(bm);
    this._streamEl = bm.querySelector(".msg-bubble");
    this._thinkingEl = bm.querySelector(".thinking-text");
    this._streamText = "";
    this._messagesEl.scrollTop = this._messagesEl.scrollHeight;

    // Ensure SSE stream is open for this conversation before sending
    this._ensureStream(convId);

    // Watchdog: if the reply never arrives over SSE (dropped stream, dead connection),
    // recover it from the store so the UI never sticks on "Tenker…" forever.
    this._startWatchdog();

    // POST /send — returns immediately; reply arrives via SSE
    var self = this;
    this._gwRequest("/send", {
      conversation_id: convId,
      text: text,
      user_id: this._user.id,
      user_name: this._user.name,
    })
      .then(function (res) {
        if (res && res.new_conversation && res.conversation_id) {
          // Server created a new conversation — switch to it
          var newId = res.conversation_id;
          self._messageCache[newId] = self._messageCache[convId] || [];
          self._activeConvId = newId;
          self._conversations.unshift({
            id: newId,
            title: "New Chat",
            updatedAt: new Date().toISOString(),
          });
          self._renderConvList();
          // Re-open SSE stream for the new conversation id
          self._ensureStream(newId);
        }
      })
      .catch(function (err) {
        if (self._streamEl) {
          self._streamEl.innerHTML = "Error: " + escapeHtml(err.message);
          self._streamEl = null;
        }
      });
  }

  // ── HTTP transport ──

  // POST to the plugin HTTP API; returns parsed JSON.
  async _gwRequest(path, body) {
    var res = await fetch(this._apiRoot + path, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-openclaw-secret": this._secret,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  }

  // Open (or reuse) an SSE stream for a given conversation.
  _ensureStream(convId) {
    // A browser permanently closes an EventSource on non-retryable HTTP
    // responses (e.g. 503 while the gateway restarts). A CLOSED stream must
    // never satisfy the reuse check, or the panel keeps a dead object and
    // silently stops receiving live events forever.
    var isLive = this._es && this._es.readyState !== EventSource.CLOSED;
    if (isLive && this._esConv === convId) return;
    if (this._es) this._es.close();
    this._esConv = convId;
    var url =
      this._apiRoot +
      "/stream?conversation_id=" +
      encodeURIComponent(convId) +
      "&secret=" +
      encodeURIComponent(this._secret);
    var self = this;
    this._es = new EventSource(url);
    this._es.onopen = function () {
      self._setConn("connected");
    };
    this._es.onerror = function () {
      // EventSource auto-reconnects on transient errors; reflect the state.
      self._setConn("connecting");
      // But on non-retryable responses the browser closes it for good —
      // recreate with a short backoff so the stream always comes back.
      if (self._es && self._es.readyState === EventSource.CLOSED) {
        var deadConv = self._esConv;
        self._es = null;
        self._esConv = null;
        setTimeout(function () {
          var current = self._activeConvId || deadConv;
          if (current) self._ensureStream(current);
        }, 3000);
      }
    };
    this._es.onmessage = function (ev) {
      var e;
      try {
        e = JSON.parse(ev.data);
      } catch (err) {
        return;
      }
      if (e.type === "token") self._onStreamToken(e.token);
      else if (e.type === "tool") self._onStreamTool();
      else if (e.type === "done") self._onStreamDone(e.full_text);
      else if (e.type === "error") self._onStreamError(e.error);
      else if (e.type === "title") self._onStreamTitle(e.title, e.conversation_id);
    };
  }

  // ── Stream render helpers (called from SSE onmessage) ──

  _onStreamToken(token) {
    this._bumpWatchdog();
    if (!this._streamEl) return;
    // First token — remove thinking indicator, start streaming
    if (this._thinkingEl) {
      this._streamEl.innerHTML = "";
      this._thinkingEl = null;
    }
    this._streamText += token || "";
    if (!this._renderTimer) {
      var self = this;
      this._renderTimer = requestAnimationFrame(function () {
        // The stream element can be torn down (done/error/conversation switch)
        // between scheduling and this frame — especially during SSE replay
        // bursts where token+done arrive together. A crash here breaks the
        // whole panel (uncaught in WebKit), so guard every deferred access.
        self._renderTimer = null;
        if (!self._streamEl) return;
        self._streamEl.innerHTML = renderMarkdown(self._streamText);
        if (self._messagesEl) {
          self._messagesEl.scrollTop = self._messagesEl.scrollHeight;
        }
      });
    }
  }

  // Tool activity: the server emits a bare `tool` event (it cannot expose
  // the tool name/args via the dispatcher seam yet). Render a visible pill
  // in the message stream so users can see that the agent is acting — not
  // just "Tenker…" while it silently calls services.
  _onStreamTool() {
    this._bumpWatchdog();
    this._streamToolCount = (this._streamToolCount || 0) + 1;
    if (this._thinkingEl) {
      this._thinkingEl.textContent = "Bruker verktøy…";
    }
    if (!this._streamEl) return;
    // One pill per call, appended above any text already streamed in.
    var pill = document.createElement("div");
    pill.className = "tool-pill";
    pill.textContent = "🛠 Verktøy brukt";
    if (this._streamEl.firstChild) {
      this._streamEl.insertBefore(pill, this._streamEl.firstChild);
    } else {
      this._streamEl.appendChild(pill);
    }
    this._messagesEl.scrollTop = this._messagesEl.scrollHeight;
  }

  _onStreamDone(fullText) {
    this._clearWatchdog();
    // The done event must PAINT the final text itself — never rely on a
    // pending rAF, which early-returns after teardown and leaves the
    // message blank until the conversation is reloaded.
    if (this._renderTimer) {
      cancelAnimationFrame(this._renderTimer);
      this._renderTimer = null;
    }
    var finalText = fullText || this._streamText;
    if (this._streamEl) {
      this._streamEl.innerHTML = renderMarkdown(finalText);
      if (this._messagesEl) this._messagesEl.scrollTop = this._messagesEl.scrollHeight;
      if (this._messageCache[this._activeConvId]) {
        this._messageCache[this._activeConvId].push({
          role: "assistant",
          content: finalText,
          tool_count: this._streamToolCount || 0,
        });
      }
    }
    this._streamEl = null;
    this._thinkingEl = null;
    this._streamText = "";
    this._streamToolCount = 0;
  }

  _onStreamError(error) {
    this._clearWatchdog();
    if (this._streamEl) {
      this._streamEl.innerHTML = "Error: " + escapeHtml(error || "unknown");
      this._streamEl = null;
    }
    this._thinkingEl = null;
    this._renderTimer = null;
  }

  // ── Reply watchdog ──
  // The reply is always persisted server-side, so even if SSE never delivers it (dead
  // connection, blocked EventSource), we can fetch it from the store. This guarantees the
  // "Tenker…" indicator always resolves to either the streamed reply or the stored one.

  _startWatchdog() {
    this._clearWatchdog();
    var self = this;
    this._watchdog = setTimeout(function () {
      self._watchdog = null;
      self._recoverReply(self._activeConvId);
    }, 75000);
  }

  _bumpWatchdog() {
    // Activity means the stream is alive — restart the idle timer.
    if (this._watchdog) this._startWatchdog();
  }

  _clearWatchdog() {
    if (this._watchdog) {
      clearTimeout(this._watchdog);
      this._watchdog = null;
    }
  }

  async _recoverReply(convId) {
    // Only recover if we're still waiting (the thinking bubble is still showing).
    if (!this._streamEl) return;
    var content = null;
    try {
      var res = await this._gwRequest("/conversations", {
        action: "load",
        conversation_id: convId,
        user_id: this._user.id,
      });
      var msgs = (res && res.messages) || [];
      for (var i = msgs.length - 1; i >= 0; i--) {
        // Stored messages use `text`; older protocol shapes used `content`.
        // Reading only `content` made watchdog recovery permanently blind.
        var body = msgs[i].text || msgs[i].content;
        if (msgs[i].role === "assistant" && body) {
          content = body;
          break;
        }
      }
    } catch (err) {
      content = null;
    }
    if (!this._streamEl) return; // a late SSE event resolved it while we fetched
    this._thinkingEl = null;
    if (content) {
      this._streamText = content;
      this._streamEl.innerHTML = renderMarkdown(content);
      if (this._messageCache[this._activeConvId]) {
        this._messageCache[this._activeConvId].push({ role: "assistant", content: content });
      }
    } else {
      this._streamEl.innerHTML = "<em>Svaret tok for lang tid — prøv igjen.</em>";
    }
    this._streamEl = null;
    this._streamText = "";
    this._streamToolCount = 0;
    this._messagesEl.scrollTop = this._messagesEl.scrollHeight;
  }

  _onStreamTitle(title, convId) {
    var targetId = convId || this._activeConvId;
    var conv = this._conversations.find(function (c) {
      return c.id === targetId;
    });
    if (conv) {
      conv.title = formatChatTitle(title, conv.updatedAt);
      this._renderConvList();
    }
    if (this._activeConvId === targetId)
      this._topTitle.textContent = formatChatTitle(title, conv && conv.updatedAt);
  }

  async _loadConversations() {
    try {
      var res = await this._gwRequest("/conversations", {
        action: "list",
        user_id: this._user.id,
      });
      this._conversations = (res && res.conversations ? res.conversations : []).map(function (c) {
        return {
          id: c.id,
          title: formatChatTitle(c.title || "Chat", c.updated_at),
          updatedAt: c.updated_at,
        };
      });
      this._renderConvList();
      // API responded — we are reachable even without an SSE stream.
      this._setConn("connected");
      // Open a fresh chat by default; past chats stay available in the sidebar.
      if (!this._activeConvId) {
        this._topTitle.textContent = "New Chat";
        this._renderMessages();
      }
    } catch (e) {
      this._setConn("disconnected");
    }
  }

  disconnectedCallback() {
    if (this._es) this._es.close();
  }
}
// Guard: HA can re-import this module (e.g. after a version bump) into a page
// where a previous version already registered the element. Re-defining throws
// and kills the whole module; the existing element keeps working until a full
// frontend reload picks up this file exclusively.
if (!customElements.get("openclaw-panel")) {
  customElements.define("openclaw-panel", OpenClawPanel);
}
