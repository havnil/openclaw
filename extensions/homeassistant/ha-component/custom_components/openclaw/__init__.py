from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from homeassistant.components.frontend import async_remove_panel
from homeassistant.components.panel_custom import async_register_panel
from homeassistant.components.http import StaticPathConfig
from .const import DOMAIN, CONF_WS_URL, CONF_SECRET
from .proxy import OpenClawProxyView
import os


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up OpenClaw from a config entry."""
    ws_url = entry.data[CONF_WS_URL]
    secret = entry.data[CONF_SECRET]

    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = {
        "ws_url": ws_url,
        "secret": secret,
    }

    # Panel API proxy: panel talks to HA (same origin); HA forwards to the
    # gateway server-side. Registered once per HA run.
    if not hass.data[DOMAIN].get("proxy_registered"):
        hass.http.register_view(OpenClawProxyView(hass))
        hass.data[DOMAIN]["proxy_registered"] = True

    # Serve the panel JS as a static asset
    panel_path = os.path.join(os.path.dirname(__file__), "frontend")
    await hass.http.async_register_static_paths(
        [StaticPathConfig("/openclaw/frontend", panel_path, cache_headers=False)]
    )

    # Register the custom panel in the sidebar
    await async_register_panel(
        hass,
        frontend_url_path="openclaw",
        webcomponent_name="openclaw-panel",
        sidebar_title="OpenClaw",
        sidebar_icon="mdi:chat",
        module_url="/openclaw/frontend/openclaw-panel.js?v=10",
        config={"ws_url": ws_url, "secret": secret, "api_url": "/api/openclaw_proxy"},
        require_admin=False,
    )

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload OpenClaw config entry."""
    async_remove_panel(hass, "openclaw")
    hass.data[DOMAIN].pop(entry.entry_id, None)
    return True
