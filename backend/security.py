import hashlib
import hmac
from datetime import timedelta

from sqlalchemy import case, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert

from backend.models import RateBucket, StaffSession
from backend.service import RuleError, utc


def digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def matches(a: str, b: str):
    return hmac.compare_digest(a.encode(), b.encode())


def rate_limit(sessions, key, maximum, seconds, clock):
    """Persistent, atomic fixed-window counter shared by API processes."""
    now = clock()
    cutoff = now - timedelta(seconds=seconds)
    with sessions.begin() as session:
        dialect = session.bind.dialect.name
        insert = sqlite_insert if dialect == "sqlite" else pg_insert
        statement = insert(RateBucket).values(key=key, window_start=now, count=1)
        expired = RateBucket.window_start <= cutoff
        statement = statement.on_conflict_do_update(index_elements=[RateBucket.key], set_={
            "count": case((expired, 1), else_=RateBucket.count + 1),
            "window_start": case((expired, now), else_=RateBucket.window_start),
        }).returning(RateBucket.count)
        count = session.scalar(statement)
    if count > maximum:
        raise RuleError("Too many requests. Please wait and try again.", "rate_limited", 429)


def valid_session(sessions, token, clock):
    if not token:
        return None
    with sessions() as session:
        stored = session.get(StaffSession, digest(token))
        return stored if stored and utc(stored.expires_at) > clock() else None
