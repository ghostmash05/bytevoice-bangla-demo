"""Bound a stalled reply without retrying a completed or superseded turn."""
import time


class TurnRecovery:
    def __init__(self, recover, fail, *, clock=time.monotonic, timeout=18):
        self.recover, self.fail, self.clock, self.timeout = recover, fail, clock, timeout
        self.generation = 0
        self.pending = False
        self.retried = False
        self.deadline = 0.0

    def user_turn(self):
        self.generation += 1
        self.pending, self.retried = True, False
        self.deadline = self.clock() + self.timeout

    def activity(self):
        self.generation += 1
        self.pending = False

    async def check(self):
        if not self.pending or self.clock() < self.deadline:
            return
        generation = self.generation
        if self.retried:
            self.pending = False
            await self.fail()
            return
        self.retried = True
        self.deadline = self.clock() + self.timeout
        try:
            await self.recover()
        except Exception:
            if self.pending and self.generation == generation:
                self.pending = False
                await self.fail()
