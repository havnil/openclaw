import voluptuous as vol
from homeassistant import config_entries
from .const import DOMAIN, DEFAULT_WS_URL, CONF_WS_URL, CONF_SECRET


class OpenClawConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Config flow for OpenClaw."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        errors = {}
        if user_input is not None:
            return self.async_create_entry(title="OpenClaw", data=user_input)

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_WS_URL, default=DEFAULT_WS_URL): str,
                    vol.Required(CONF_SECRET): str,
                }
            ),
            errors=errors,
        )
