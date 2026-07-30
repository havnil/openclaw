"""Server-side proxy: panel → Home Assistant → OpenClaw gateway.

The panel historically called the gateway directly (via the Tailscale
hostname), which made chat depend on each device's VPN state. This view
lets the panel talk only to Home Assistant (same origin it is served
from); HA forwards to the gateway over the container→host bridge — the
same path the project's rest_commands use. Authentication is unchanged:
the client still supplies the channel secret, and the gateway enforces it.
"""

from __future__ import annotations

import aiohttp
from aiohttp import web

from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

# Same upstream the rest_commands use — no Tailscale dependency server-side.
UPSTREAM_BASE = "http://host.docker.internal:18789/api/homeassistant"

_FORWARD_REQUEST_HEADERS = ("content-type", "x-openclaw-secret", "last-event-id")


class OpenClawProxyView(HomeAssistantView):
    """Forward panel API calls to the OpenClaw gateway."""

    url = "/api/openclaw_proxy/api/homeassistant/{tail}"
    name = "api:openclaw_proxy"
    # The gateway enforces the shared channel secret on every route; this
    # view only changes the transport, not the auth model. EventSource
    # cannot send HA auth headers, so HA-session auth is not usable here.
    requires_auth = False

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def get(self, request: web.Request, tail: str) -> web.StreamResponse:
        if tail == "stream":
            return await self._proxy_sse(request, tail)
        return await self._proxy_plain(request, tail)

    async def post(self, request: web.Request, tail: str) -> web.StreamResponse:
        return await self._proxy_plain(request, tail)

    def _upstream_url(self, request: web.Request, tail: str) -> str:
        qs = request.query_string
        return f"{UPSTREAM_BASE}/{tail}" + (f"?{qs}" if qs else "")

    def _forward_headers(self, request: web.Request) -> dict[str, str]:
        return {
            k: v
            for k, v in request.headers.items()
            if k.lower() in _FORWARD_REQUEST_HEADERS
        }

    async def _proxy_plain(self, request: web.Request, tail: str) -> web.Response:
        session = aiohttp.ClientSession()
        try:
            body = await request.read() if request.can_read_body else None
            async with session.request(
                request.method,
                self._upstream_url(request, tail),
                data=body,
                headers=self._forward_headers(request),
                timeout=aiohttp.ClientTimeout(total=60),
            ) as upstream:
                payload = await upstream.read()
                return web.Response(
                    status=upstream.status,
                    body=payload,
                    content_type=upstream.content_type,
                )
        finally:
            await session.close()

    async def _proxy_sse(self, request: web.Request, tail: str) -> web.StreamResponse:
        """Pump the gateway's SSE stream through to the panel unbuffered."""
        session = aiohttp.ClientSession()
        try:
            upstream = await session.get(
                self._upstream_url(request, tail),
                headers=self._forward_headers(request),
                timeout=aiohttp.ClientTimeout(total=None, sock_read=None),
            )
            if upstream.status != 200:
                payload = await upstream.read()
                upstream.close()
                return web.Response(
                    status=upstream.status,
                    body=payload,
                    content_type=upstream.content_type,
                )
            response = web.StreamResponse(
                status=200,
                headers={
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    "X-Accel-Buffering": "no",
                },
            )
            await response.prepare(request)
            try:
                async for chunk in upstream.content.iter_any():
                    await response.write(chunk)
            except (aiohttp.ClientError, ConnectionResetError):
                pass
            finally:
                upstream.close()
            return response
        finally:
            await session.close()
