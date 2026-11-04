import unittest
from unittest.mock import AsyncMock

from agent.recovery import TurnRecovery


class TurnRecoveryTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.now = 0
        self.retry, self.fail = AsyncMock(), AsyncMock()
        self.guard = TurnRecovery(self.retry, self.fail, clock=lambda: self.now, timeout=10)

    async def test_stall_retries_once_then_fails_closed(self):
        self.guard.user_turn()
        self.now = 11
        await self.guard.check()
        self.retry.assert_awaited_once()
        self.fail.assert_not_awaited()
        self.now = 22
        await self.guard.check()
        self.fail.assert_awaited_once()
        self.now = 40
        await self.guard.check()
        self.retry.assert_awaited_once()
        self.fail.assert_awaited_once()

    async def test_completed_reply_is_never_retried(self):
        self.guard.user_turn()
        self.guard.activity()
        self.now = 30
        await self.guard.check()
        self.retry.assert_not_awaited()

    async def test_new_caller_turn_supersedes_old_deadline(self):
        self.guard.user_turn()
        self.now = 9
        self.guard.user_turn()
        self.now = 11
        await self.guard.check()
        self.retry.assert_not_awaited()

    async def test_failed_retry_closes_without_repeated_attempts(self):
        self.retry.side_effect = TimeoutError()
        self.guard.user_turn()
        self.now = 11
        await self.guard.check()
        self.fail.assert_awaited_once()
        await self.guard.check()
        self.retry.assert_awaited_once()
