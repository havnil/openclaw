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
  .sidebar-overlay { pointer-events: none;
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
    .sidebar-overlay { pointer-events: none; display: block; }
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
  html = html.replace(/\n/g, "<br>");
  return html;
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
    this._wsReady = false;
    this._pending = {};
    this._connId = null;
    this._streamEl = null;
    this._conversations = [];
    this._activeConvId = null;
    this._messageCache = {};

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
          <button class="hamburger-btn" title="Menu">${ICON.hamburger}</button>
          <span class="topbar-title">OpenClaw</span>
          <span class="conn-status disconnected">Connecting...</span>
          <button class="home-btn" title="Back">${ICON.home}</button>
        </div>
        <div class="messages-container"></div>
        <div class="input-bar">
          <div class="input-wrap">
            <textarea class="input-textarea" rows="1" placeholder="Message OpenClaw…"></textarea>
          </div>
          <button class="input-btn mic-btn" title="Voice input">${ICON.mic}</button>
          <button class="input-btn send-btn" title="Send">${ICON.send}</button>
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
    });

    // Mic button
    this._micBtn = shadow.querySelector(".mic-btn");
    this._micActive = false;
    this._micBtn.addEventListener("click", function () {
      if (self._micActive) self._stopMic();
      else self._startMic();
    });

    this._connectGateway();
  }

  // ── Voice input ──
  _showToast(msg) {
    var el = document.createElement("div");
    el.textContent = msg;
    el.setAttribute(
      "style",
      "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 20px;border-radius:20px;font-size:14px;z-index:10000;",
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
      var res = await this._gwRequest("homeassistant.transcribe", {
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

  // ── Conversations ──
  async _newConversation() {
    try {
      var res = await this._gwRequest("homeassistant.conversations", {
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
      var res = await this._gwRequest("homeassistant.conversations", {
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
    this._gwRequest("homeassistant.conversations", {
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
      this._messagesEl.innerHTML =
        '<div style="text-align:center;padding:40px;color:#9e9e9e;">Start a conversation</div>';
      return;
    }
    msgs.forEach(function (m) {
      var row = document.createElement("div");
      row.className = "msg-row " + (m.role || "assistant");
      var bubble = document.createElement("div");
      bubble.className = "msg-bubble";
      bubble.innerHTML =
        m.role === "assistant"
          ? renderMarkdown(m.content || m.text || "")
          : escapeHtml(m.content || m.text || "");
      row.appendChild(bubble);
      self._messagesEl.appendChild(row);
    });
    this._messagesEl.scrollTop = this._messagesEl.scrollHeight;
  }

  // ── Send ──
  _send() {
    var text = this._input.value.trim();
    if (!text || !this._wsReady) return;
    this._input.value = "";
    this._input.style.height = "auto";

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

    // User message
    this._messageCache[convId].push({ role: "user", content: text });
    var um = document.createElement("div");
    um.className = "msg-row user";
    um.innerHTML = '<div class="msg-bubble">' + escapeHtml(text) + "</div>";
    this._messagesEl.appendChild(um);

    // Bot placeholder
    var bm = document.createElement("div");
    bm.className = "msg-row assistant";
    bm.innerHTML = '<div class="msg-bubble">...</div>';
    this._messagesEl.appendChild(bm);
    this._streamEl = bm.querySelector(".msg-bubble");
    this._streamText = "";
    this._messagesEl.scrollTop = this._messagesEl.scrollHeight;

    // Send
    this._gwRequest("homeassistant.send", {
      secret: this._config.secret,
      user_id: this._user.id,
      user_name: this._user.name,
      conversation_id: convId,
      content: text,
      conn_id: this._connId,
    })
      .then((res) => {
        if (res?.new_conversation && res?.conversation_id) {
          this._activeConvId = res.conversation_id;
          this._messageCache[res.conversation_id] = this._messageCache[convId] || [];
          this._conversations.unshift({
            id: res.conversation_id,
            title: "New Chat",
            updatedAt: new Date().toISOString(),
          });
          this._renderConvList();
        }
      })
      .catch((err) => {
        if (this._streamEl) {
          this._streamEl.innerHTML = "Error: " + escapeHtml(err.message);
          this._streamEl = null;
        }
      });
  }

  // ── Gateway ──
  _gwRequest(method, params) {
    var self = this;
    return new Promise(function (resolve, reject) {
      var id = uid();
      self._pending[id] = { resolve: resolve, reject: reject };
      self._ws.send(JSON.stringify({ type: "req", id: id, method: method, params: params }));
      setTimeout(function () {
        if (self._pending[id]) {
          delete self._pending[id];
          reject(new Error("timeout"));
        }
      }, 30000);
    });
  }

  _connectGateway() {
    var self = this;
    var wsUrl = this._config.ws_url || "";
    try {
      this._ws = new WebSocket(wsUrl);
    } catch (e) {
      this._status.textContent = "WS fail";
      return;
    }

    this._ws.onopen = function () {
      var id = uid();
      self._pending[id] = {
        resolve: function (payload) {
          self._connId = payload?.server?.connId;
          self._wsReady = true;
          self._status.textContent = "Connected";
          self._status.className = "conn-status connected";
          self._loadConversations();
        },
        reject: function (err) {
          self._status.textContent = "Auth failed";
        },
      };
      self._ws.send(
        JSON.stringify({
          type: "req",
          id: id,
          method: "connect",
          params: {
            minProtocol: 3,
            maxProtocol: 3,
            client: { id: "openclaw-control-ui", version: "1.0", platform: "web", mode: "webchat" },
            role: "operator",
            scopes: ["operator.read", "operator.write"],
            auth: self._config.secret ? { token: self._config.secret } : undefined,
          },
        }),
      );
    };

    this._ws.onmessage = function (e) {
      var f = JSON.parse(e.data);
      if (f.type === "res" && self._pending[f.id]) {
        var p = self._pending[f.id];
        delete self._pending[f.id];
        f.ok ? p.resolve(f.payload) : p.reject(new Error(f.error?.message || "failed"));
      } else if (f.type === "event") {
        self._handleEvent(f.event, f.payload || {});
      }
    };

    this._ws.onclose = function () {
      self._wsReady = false;
      self._status.textContent = "Disconnected";
      self._status.className = "conn-status disconnected";
    };
    this._ws.onerror = function () {
      self._status.textContent = "Error";
    };
  }

  _handleEvent(event, payload) {
    if (event === "homeassistant.token" && this._streamEl) {
      if (this._streamEl.textContent === "...") {
        this._streamEl.textContent = "";
        this._streamText = "";
      }
      this._streamText += payload.token || "";
      this._streamEl.innerHTML = renderMarkdown(this._streamText);
      this._messagesEl.scrollTop = this._messagesEl.scrollHeight;
    } else if (event === "homeassistant.done") {
      if (this._streamEl && this._streamText) {
        this._messageCache[this._activeConvId]?.push({
          role: "assistant",
          content: this._streamText,
        });
      }
      this._streamEl = null;
      this._streamText = "";
    } else if (event === "homeassistant.error" && this._streamEl) {
      this._streamEl.innerHTML = "Error: " + escapeHtml(payload.error || "unknown");
      this._streamEl = null;
    } else if (event === "homeassistant.title") {
      var conv = this._conversations.find(function (c) {
        return c.id === payload.conversation_id;
      });
      if (conv) {
        conv.title = payload.title;
        this._renderConvList();
      }
      if (this._activeConvId === payload.conversation_id)
        this._topTitle.textContent = payload.title;
    }
  }

  async _loadConversations() {
    try {
      var res = await this._gwRequest("homeassistant.conversations", {
        action: "list",
        user_id: this._user.id,
      });
      this._conversations = (res?.conversations || []).map(function (c) {
        return { id: c.id, title: c.title || "Chat", updatedAt: c.updated_at };
      });
      this._renderConvList();
      if (this._conversations.length > 0 && !this._activeConvId) {
        this._setActiveConv(this._conversations[0].id);
      }
    } catch (e) {}
  }

  disconnectedCallback() {
    if (this._ws) this._ws.close();
  }
}
customElements.define("openclaw-panel", OpenClawPanel);
