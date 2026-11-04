"""Authenticated HTTP boundary: cloud workers never need database credentials."""
import asyncio
import os
import logging
import time
import httpx
from livekit.agents import ToolError

logger = logging.getLogger("clinic-agent.tools")


class BackendBridge:
    def __init__(self, client=None):
        self.client = client or httpx.AsyncClient(base_url=os.environ["BACKEND_URL"].rstrip("/"),
            headers={"Authorization": "Bearer " + os.environ["AGENT_API_SECRET"]}, timeout=5)

    async def request(self, method, path, payload=None, params=None):
        for attempt in range(3):
            started = time.monotonic()
            try:
                if not path.endswith("/turn"):
                    logger.info("Clinic request started method=%s path=%s attempt=%s", method, path, attempt + 1)
                response = await self.client.request(method, path, json=payload, params=params)
                if not path.endswith("/turn"):
                    logger.info("Clinic request finished path=%s status=%s elapsed_s=%.3f", path, response.status_code, time.monotonic() - started)
                if response.status_code >= 500:
                    response.raise_for_status()
                data = response.json()
                if response.is_error:
                    raise ToolError(data.get("message", "Request rejected. Check the details and clarify with the caller."))
                return data
            except (httpx.TransportError, httpx.HTTPStatusError):
                logger.warning("Clinic request unavailable path=%s attempt=%s", path, attempt + 1)
                if attempt == 2:
                    raise ToolError("The clinic system could not be reached. Do not claim success. Explain the issue and ask the caller to try again.") from None
                await asyncio.sleep(0.3 * (attempt + 1))

    async def close(self):
        await self.client.aclose()
