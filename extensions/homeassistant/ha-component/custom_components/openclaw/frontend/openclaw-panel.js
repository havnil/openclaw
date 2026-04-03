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
    var config = this._panel.config || {};
    var user = this._hass.user || {};

    var root = document.createElement("div");
    root.id = "oc-root";
    root.setAttribute(
      "style",
      "position:fixed;top:0;left:0;right:0;bottom:0;z-index:999;display:flex;flex-direction:column;background:#fafafa;font-family:sans-serif;",
    );

    // Topbar
    root.innerHTML =
      '<div style="display:flex;align-items:center;padding:0 12px;height:52px;border-bottom:1px solid #e0e0e0;background:#fff;gap:8px;flex-shrink:0;">' +
      '<span style="flex:1;font-size:16px;font-weight:600;">OpenClaw</span>' +
      '<span id="oc-status" style="font-size:11px;padding:3px 8px;border-radius:20px;background:#ffebee;color:#c62828;">Connecting...</span>' +
      '<button id="oc-home" style="padding:8px;border:none;background:none;font-size:16px;">🏠</button>' +
      "</div>" +
      '<div id="oc-messages" style="flex:1;overflow-y:auto;padding:16px;"></div>' +
      '<div style="display:flex;align-items:flex-end;padding:8px;border-top:1px solid #e0e0e0;background:#fff;gap:4px;flex-shrink:0;">' +
      '<textarea id="oc-input" style="flex:1;resize:none;border:1px solid #e0e0e0;border-radius:12px;padding:10px 12px;font-size:15px;min-height:44px;font-family:inherit;" placeholder="Message..." rows="1"></textarea>' +
      '<button id="oc-send" style="width:44px;height:44px;border:none;border-radius:12px;background:#03a9f4;color:#fff;font-size:18px;flex-shrink:0;">↑</button>' +
      "</div>";

    var prev = document.getElementById("oc-root");
    if (prev) prev.remove();
    document.body.appendChild(root);

    var status = document.getElementById("oc-status");
    var messages = document.getElementById("oc-messages");
    var input = document.getElementById("oc-input");
    var sendBtn = document.getElementById("oc-send");
    var homeBtn = document.getElementById("oc-home");
    var self = this;
    this._wsReady = false;
    this._pending = {};
    this._streamId = null;

    // Home
    homeBtn.addEventListener("click", function () {
      location.href = "/";
    });

    // Send
    sendBtn.addEventListener("click", function () {
      var text = input.value.trim();
      if (!text || !self._wsReady) return;
      // Add user message
      var um = document.createElement("div");
      um.setAttribute(
        "style",
        "margin:4px 0;padding:10px 14px;border-radius:18px;background:#e3f2fd;color:#0d47a1;max-width:82%;align-self:flex-end;margin-left:auto;",
      );
      um.textContent = text;
      messages.appendChild(um);
      // Add bot placeholder
      var bm = document.createElement("div");
      bm.setAttribute(
        "style",
        "margin:4px 0;padding:10px 14px;border-radius:18px;background:#fff;border:1px solid #e0e0e0;max-width:82%;",
      );
      bm.textContent = "...";
      bm.id = "oc-stream";
      messages.appendChild(bm);
      self._streamId = "oc-stream";
      messages.scrollTop = messages.scrollHeight;
      input.value = "";
      // Send via gateway
      self._req("homeassistant.send", {
        secret: config.secret,
        user_id: user.id,
        user_name: user.name,
        content: text,
        conn_id: self._connId,
      });
    });

    // Gateway connection
    var wsUrl = config.ws_url || "";
    try {
      var ws = new WebSocket(wsUrl);
      this._ws = ws;
      ws.onopen = function () {
        var id = "c" + Math.random().toString(36).slice(2);
        self._pending[id] = function (ok, payload) {
          if (ok) {
            self._connId = payload?.server?.connId;
            self._wsReady = true;
            status.textContent = "Connected";
            status.style.background = "#e8f5e9";
            status.style.color = "#2e7d32";
            // Load conversations
            self._req("homeassistant.conversations", { action: "list", user_id: user.id });
          } else {
            status.textContent = "Auth failed";
          }
        };
        ws.send(
          JSON.stringify({
            type: "req",
            id: id,
            method: "connect",
            params: {
              minProtocol: 3,
              maxProtocol: 3,
              client: {
                id: "openclaw-control-ui",
                version: "1.0",
                platform: "web",
                mode: "webchat",
              },
              role: "operator",
              scopes: ["operator.read", "operator.write"],
              auth: config.secret ? { token: config.secret } : undefined,
            },
          }),
        );
      };
      ws.onmessage = function (e) {
        var f = JSON.parse(e.data);
        if (f.type === "res" && self._pending[f.id]) {
          self._pending[f.id](f.ok, f.payload, f.error);
          delete self._pending[f.id];
        } else if (f.type === "event") {
          if (f.event === "homeassistant.token") {
            var el = document.getElementById("oc-stream");
            if (el) {
              if (el.textContent === "...") el.textContent = "";
              el.textContent += f.payload?.token || "";
              messages.scrollTop = messages.scrollHeight;
            }
          } else if (f.event === "homeassistant.done") {
            self._streamId = null;
          } else if (f.event === "homeassistant.error") {
            var el2 = document.getElementById("oc-stream");
            if (el2) el2.textContent = "Error: " + (f.payload?.error || "unknown");
          }
        }
      };
      ws.onclose = function () {
        status.textContent = "Disconnected";
        status.style.background = "#ffebee";
        status.style.color = "#c62828";
      };
      ws.onerror = function () {
        status.textContent = "Error";
      };
    } catch (e) {
      status.textContent = "WS fail: " + e.message;
    }
  }
  _req(method, params) {
    var id = "r" + Math.random().toString(36).slice(2);
    this._pending[id] = function () {};
    this._ws.send(JSON.stringify({ type: "req", id: id, method: method, params: params }));
  }
  disconnectedCallback() {
    var el = document.getElementById("oc-root");
    if (el) el.remove();
    if (this._ws) this._ws.close();
  }
}
customElements.define("openclaw-panel", OpenClawPanel);
