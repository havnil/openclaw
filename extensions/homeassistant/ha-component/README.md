# OpenClaw for Home Assistant

A ChatGPT-style AI chat panel for Home Assistant, powered by OpenClaw.

## Features

- ChatGPT-style chat interface in HA sidebar
- Token-by-token streaming responses
- Conversation history with persistence
- Voice input (speech-to-text)
- File and image uploads
- Per-user permissions (admin vs standard)
- Works great on HA Companion App (mobile-first design)
- Dark/light theme support

## Installation

### HACS (recommended)

1. Open HACS in your HA instance
2. Add this repository as a custom repository
3. Search for "OpenClaw" and install
4. Restart Home Assistant
5. Go to Settings > Integrations > Add Integration > OpenClaw
6. Enter your OpenClaw gateway WebSocket URL and shared secret

### Manual

1. Copy `custom_components/openclaw/` to your HA config directory
2. Restart Home Assistant
3. Go to Settings > Integrations > Add Integration > OpenClaw
4. Enter your OpenClaw gateway WebSocket URL and shared secret

## OpenClaw Configuration

In your OpenClaw config, enable the Home Assistant plugin:

```yaml
plugins:
  homeassistant:
    enabled: true
    url: "http://localhost:8123"
    token: "<your-ha-long-lived-access-token>"
    secret: "<shared-secret>"
    admins:
      - "<your-ha-user-id>"
```

Admin users get full OpenClaw access. Other HA users get OpenClaw + HA tools but without file/shell/system access.
