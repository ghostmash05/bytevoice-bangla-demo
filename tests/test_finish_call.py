import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock

from livekit.agents import StopResponse, ToolError

from agent.main import Receptionist


class FinishCallTests(unittest.IsolatedAsyncioTestCase):
    async def test_waits_for_speech_before_graceful_finish(self):
        events = []

        async def played():
            events.append("speech_finished")

        async def finished():
            events.append("graceful_shutdown")

        agent = Receptionist(None, "fake-call", finished)
        context = SimpleNamespace(wait_for_playout=played)
        with self.assertRaises(StopResponse):
            await agent.finish_call(context, caller_done=True)
        self.assertEqual(events, ["speech_finished", "graceful_shutdown"])

    async def test_does_not_hang_up_without_caller_completion(self):
        finish = AsyncMock()
        context = SimpleNamespace(wait_for_playout=AsyncMock())
        agent = Receptionist(None, "fake-call", finish)
        with self.assertRaises(ToolError):
            await agent.finish_call(context)
        finish.assert_not_awaited()
        context.wait_for_playout.assert_not_awaited()
