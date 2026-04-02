from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from homeassistant.components.frontend import async_register_built_in_panel, async_remove_panel
from homeassistant.components.http import StaticPathConfig
from .const import DOMAIN, CONF_WS_URL, CONF_SECRET
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

    # Register the frontend panel
    panel_path = os.path.join(os.path.dirname(__file__), "frontend")
    await hass.http.async_register_static_paths(
        [StaticPathConfig("/openclaw/frontend", panel_path, cache_headers=False)]
    )

    async_register_built_in_panel(
        hass,
        "custom",
        sidebar_title="OpenClaw",
        sidebar_icon="mdi:chat",
        frontend_url_path="openclaw",
        config={"ws_url": ws_url, "secret": secret},
        require_admin=False,
    )

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload OpenClaw config entry."""
    async_remove_panel(hass, "openclaw")
    hass.data[DOMAIN].pop(entry.entry_id, None)
    return True
