"""Authenticated HTTP boundary: cloud workers never need database credentials."""
import asyncio
import os
import httpx
from livekit.agents import ToolError


class BackendBridge:
    def __init__(self, client=None):
        self.client = client or httpx.AsyncClient(base_url=os.environ["BACKEND_URL"].rstrip("/"),
            headers={"Authorization": "Bearer " + os.environ["AGENT_API_SECRET"]}, timeout=12)

    async def request(self, method, path, payload=None, params=None):
        for attempt in range(3):
            try:
                response = await self.client.request(method, path, json=payload, params=params)
                if response.status_code >= 500:
                    response.raise_for_status()
                data = response.json()
                if response.is_error:
                    raise ToolError(data.get("message", "Request rejected. Check the details and clarify with the caller."))
                return data
            except (httpx.TransportError, httpx.HTTPStatusError):
                if attempt == 2:
                    raise ToolError("The clinic system could not be reached. Do not claim success. Explain the issue and ask the caller to try again.") from None
                await asyncio.sleep(0.3 * (attempt + 1))

    async def close(self):
        await self.client.aclose()
