# Home Assistant Channel Plugin — Design Spec

## Overview

A dedicated OpenClaw channel plugin that provides a ChatGPT-style chat interface inside Home Assistant's sidebar. Users interact with OpenClaw (including HA tools) via a WebSocket connection with token-by-token streaming. A permission model restricts admin-level tools to designated users. The companion app (mobile) is the primary UI target.

## Architecture

### Two Pieces

1. **OpenClaw channel plugin** (`extensions/homeassistant/`) — TypeScript. Registers a WebSocket route on the gateway, handles auth, permission-based tool filtering, conversation persistence, and message streaming. Coexists with the existing HA REST API tools (get states, call services, history, fire events).

2. **HA custom component** (`custom_components/openclaw/`) — Python entry point + LitElement chat panel (JS). Registers a sidebar panel in HA. The panel opens a WebSocket to the OpenClaw gateway on localhost and renders a mobile-first ChatGPT-style chat UI.

### Data Flow

```
HA User -> Chat Panel (LitElement) -> WebSocket (localhost) -> OpenClaw Gateway -> AI Pipeline -> token stream back over WebSocket -> Panel renders incrementally
```

### Deployment

- Same machine — HA and OpenClaw gateway on localhost.
- HA custom component installed at `<ha-config>/custom_components/openclaw/`.
- HACS packaging for easy installation and updates.

## Permission Model

### Config Schema

Added to OpenClaw's `channels.homeassistant` config:

```yaml
channels:
  homeassistant:
    url: "http://localhost:8123"
    token: "<HA long-lived access token>"
    secret: "<shared secret for WebSocket auth>"
    admins:
      - "havnil"
```

### Two Tiers

- **Admin** (HA user ID in `admins` list) — full OpenClaw access, all tools including file operations, shell, system-level tools.
- **Standard** (any authenticated HA user NOT in `admins`) — full OpenClaw + HA tools (lights, services, history, events), but dangerous tools (file edit, shell, system admin) are filtered out before the AI sees them.

### Auth Flow

1. Panel sends `hass.user.id` + `hass.user.name` during WebSocket handshake via query params.
2. OpenClaw verifies the shared secret.
3. OpenClaw checks user ID against `admins` list.
4. Tool scope is set for the session — admin gets everything, standard gets a curated subset.
5. Tool filtering is transparent to the user.

## WebSocket Protocol

### Handshake

Panel opens WebSocket to:

```
ws://localhost:<gateway-port>/homeassistant/ws?secret=<shared_secret>&user_id=<ha_user_id>&user_name=<ha_display_name>
```

### Client to Server

```json
{ "type": "message", "text": "turn on the kitchen lights", "conversation_id": "abc123" }
{ "type": "upload", "file_name": "photo.jpg", "mime_type": "image/jpeg", "data": "<base64>" }
{ "type": "new_conversation" }
{ "type": "load_conversation", "conversation_id": "abc123" }
{ "type": "delete_conversation", "conversation_id": "abc123" }
{ "type": "list_conversations" }
```

### Server to Client

```json
{ "type": "token", "text": "Sure" }
{ "type": "done", "full_text": "Sure, I'll turn on the kitchen lights." }
{ "type": "tool_use", "name": "ha_call_service", "input": { "domain": "light", "service": "turn_on" } }
{ "type": "tool_result", "name": "ha_call_service", "output": "..." }
{ "type": "error", "message": "Something went wrong" }
{ "type": "conversations", "list": [{ "id": "abc123", "title": "Kitchen lights", "updated_at": "..." }] }
{ "type": "conversation_loaded", "id": "abc123", "messages": [...] }
```

### Connection Behavior

- Connection stays open across messages — no reconnect per turn.
- Auto-reconnect on drop with brief "Reconnecting..." toast.
- Ping/pong keepalive every 30 seconds.

## Conversation Persistence

### Storage

- Conversations stored as JSON files on disk under OpenClaw's data directory: `~/.openclaw/homeassistant/conversations/<user_id>/<conversation_id>.json`
- Each conversation file contains metadata (title, timestamps) and full message history.

### Conversation Structure

```json
{
  "id": "uuid",
  "user_id": "havnil",
  "title": "Kitchen lights",
  "created_at": "2026-04-02T10:00:00Z",
  "updated_at": "2026-04-02T10:05:00Z",
  "messages": [
    { "role": "user", "text": "turn on the kitchen lights", "timestamp": "..." },
    { "role": "assistant", "text": "Sure, I'll turn on the kitchen lights.", "timestamp": "...", "tool_calls": [...] }
  ]
}
```

### Auto-Title

- First conversation message triggers an auto-generated title (via a short AI summarization call).
- Title can be edited by the user.

## Chat Panel UI

### Primary Target: HA Companion App (Mobile)

The panel is designed mobile-first for the HA companion app, with responsive adaptation for desktop/tablet.

### Layout

- **Chat history sidebar** (left) — list of past conversations, "New Chat" button at top, swipe-to-delete on mobile. On mobile, this is a slide-out drawer triggered by a hamburger icon. On desktop, it's a persistent narrow sidebar.
- **Message area** (center) — scrollable message list, newest at bottom.
  - User messages: right-aligned colored bubble.
  - AI messages: left-aligned plain/light bubble with markdown rendering (code blocks, bold, lists, links, tables).
  - Tool calls: collapsible inline cards showing tool name, input, and output.
- **Input bar** (bottom) — fixed to bottom, above keyboard on mobile.
  - Text input field (auto-growing, multi-line).
  - Send button (right).
  - Microphone button (left of send) for voice input.
  - Attachment button (left) for file/image uploads.
  - Enter to send on desktop, send button on mobile.
  - Shift+enter for newline on desktop.

### Mobile-First Details

- Touch-friendly: minimum 44px tap targets.
- Safe area insets: respect notch and home indicator on iOS.
- Keyboard behavior: input bar pushes up with keyboard, message area scrolls to keep latest message visible.
- Pull-to-refresh on conversation list.
- Swipe gestures: swipe left on conversation in sidebar to reveal delete action.
- No tiny buttons or hover-dependent interactions.

### Streaming UX

- Optimistic UI: user message appears instantly in chat.
- Typing indicator (animated dots) shows immediately after sending.
- Tokens replace typing indicator and stream in word-by-word.
- Auto-scroll stays pinned to bottom during streaming, unless user scrolls up.
- "Stop generating" button appears during streaming.

### Theming

- Follows HA's dark/light theme via CSS custom properties (`--primary-color`, `--card-background-color`, `--primary-text-color`, etc.).
- No hardcoded colors.

## Voice Input

- Microphone button in the input bar.
- Uses the browser's Web Speech API (`SpeechRecognition`) for speech-to-text.
- Tap to start recording, tap again to stop (or auto-stop on silence).
- Transcribed text populates the input field — user can review/edit before sending.
- Visual indicator (pulsing mic icon) while recording.
- Fallback: if Web Speech API is unavailable (some Android WebViews), the mic button is hidden.

## File and Image Uploads

- Attachment button in the input bar opens file picker.
- Supports images (jpg, png, gif, webp) and common files (pdf, txt, csv, json).
- Images show as inline thumbnails in the chat bubble.
- Files show as attachment chips with filename and size.
- Files are base64-encoded and sent over WebSocket as `upload` messages.
- Max file size: 10MB per file.
- OpenClaw processes uploads through its media pipeline (image understanding for images, text extraction for documents).

## HA Custom Component Structure

```
custom_components/openclaw/
├── __init__.py              # HA integration setup — registers sidebar panel
├── manifest.json            # HA integration metadata
├── config_flow.py           # Config flow for setup via HA UI
├── const.py                 # Constants (domain, default port, etc.)
├── translations/
│   └── en.json              # UI strings
└── frontend/
    └── openclaw-panel.js    # LitElement chat panel (bundled single file)
```

### manifest.json

```json
{
  "domain": "openclaw",
  "name": "OpenClaw",
  "version": "1.0.0",
  "documentation": "https://docs.openclaw.ai/channels/homeassistant",
  "requirements": [],
  "codeowners": [],
  "iot_class": "local_push"
}
```

### Panel Registration

`__init__.py` registers the panel via:

```python
hass.components.frontend.async_register_built_in_panel(
    "custom",
    "OpenClaw",
    "mdi:chat",
    frontend_url_path="openclaw",
    config={"ws_url": ws_url, "secret": secret},
)
```

### Config Flow

Setup via HA's Integrations UI:

1. Enter OpenClaw gateway URL (default: `ws://localhost:18789/homeassistant/ws`).
2. Enter shared secret.
3. Test connection.
4. Done — panel appears in sidebar.

## HACS Packaging

```
hacs.json
├── name: "OpenClaw"
├── render_readme: true
├── homeassistant: "2024.1.0"
```

- GitHub releases with versioned zips.
- HACS default repository or custom repository URL.
- README with setup instructions, screenshots.

## OpenClaw Plugin Changes

### Existing (unchanged)

- `ha_get_states` tool
- `ha_call_service` tool
- `ha_get_history` tool
- `ha_fire_event` tool

### New: Channel Registration

The plugin registers as both a tool provider and a channel:

- WebSocket route at `/homeassistant/ws` on the gateway.
- Inbound message handler that dispatches to OpenClaw's AI pipeline.
- Outbound streaming handler that sends tokens back over WebSocket.
- Conversation CRUD operations.

### New: Config Schema Update

```json
{
  "id": "homeassistant",
  "name": "Home Assistant",
  "description": "Home Assistant channel and tools — chat interface and REST API control",
  "enabledByDefault": false,
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "required": ["token"],
    "properties": {
      "url": {
        "type": "string",
        "description": "Base URL of your Home Assistant instance",
        "default": "http://localhost:8123"
      },
      "token": {
        "type": "string",
        "description": "Long-lived access token from your HA profile"
      },
      "secret": {
        "type": "string",
        "description": "Shared secret for WebSocket authentication"
      },
      "admins": {
        "type": "array",
        "items": { "type": "string" },
        "description": "List of HA user IDs with full admin access"
      }
    }
  }
}
```

### New: Tool Filtering

A `restrictedTools` set defines tools that standard users cannot access. At session creation, if the user is not in `admins`, these tools are excluded from the AI's available tool list. The exact set will be determined during implementation by auditing OpenClaw's built-in tools.

## Testing

### Playwright Tests

1. **Login and panel access** — navigate to HA, log in, verify OpenClaw panel appears in sidebar.
2. **Send message and streaming** — open panel, type a message, verify tokens stream in, verify final response renders with markdown.
3. **Tool calls** — send a message that triggers an HA tool (e.g., "what lights are on?"), verify tool call card appears inline.
4. **Conversation persistence** — send messages, reload page, verify conversation is still there.
5. **Chat history sidebar** — create multiple conversations, switch between them, verify correct messages load.
6. **Permission test** — log in as a non-admin user, verify restricted tools are not available.
7. **Voice input** — verify mic button appears, test speech-to-text flow (may require mocking Web Speech API).
8. **File upload** — attach an image, verify it appears as thumbnail and is processed.
9. **Mobile viewport** — run tests at mobile viewport sizes, verify responsive layout and touch targets.

### Unit Tests

- WebSocket auth and secret verification.
- Permission tier resolution.
- Tool filtering logic.
- Conversation CRUD operations.
- Message serialization/deserialization.

## Open Questions (resolved)

- ~~Streaming approach~~ — WebSocket with token-by-token streaming.
- ~~Permission model~~ — explicit `admins` list in config, not HA's `is_admin`.
- ~~UI delivery~~ — dedicated sidebar panel, not HA Assist integration.
- ~~Primary target~~ — HA companion app (mobile-first).
