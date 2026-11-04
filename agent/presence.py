"""Conservative idle check-in, separate from recovery of a pending reply."""
import time


class CallerPresence:
    def __init__(self, *, clock=time.monotonic, timeout=25):
        self.clock, self.timeout = clock, timeout
        self.last_activity = clock()
        self.prompted = False
        self.closed = False

    def caller_activity(self):
        self.last_activity = self.clock()
        self.prompted = False

    def observe_pcm(self, samples):
        # A conservative energy gate only postpones idle handling. It does not
        # detect turns, interrupt speech, retain audio, or replace provider VAD.
        if samples and sum(int(v) ** 2 for v in samples) / len(samples) > 250 ** 2:
            self.caller_activity()

    def check(self, *, listening, pending_reply):
        if self.closed:
            return None
        if not listening or pending_reply:
            self.last_activity = self.clock()
            return None
        if self.clock() - self.last_activity < self.timeout:
            return None
        self.last_activity = self.clock()
        if not self.prompted:
            self.prompted = True
            return "check_in"
        self.closed = True
        return "end"
