import os
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from agent.config import ROOT


class Base(DeclarativeBase):
    pass


def make_engine(url: str | None = None):
    (ROOT / ".local").mkdir(exist_ok=True)
    url = url or os.getenv("DATABASE_URL") or f"sqlite:///{(ROOT / '.local' / 'clinic.db').as_posix()}"
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    kwargs = {"pool_pre_ping": True}
    if url.startswith("sqlite:"):
        kwargs["connect_args"] = {"check_same_thread": False, "timeout": 30}
    engine = create_engine(url, **kwargs)
    if engine.dialect.name == "sqlite":
        @event.listens_for(engine, "connect")
        def foreign_keys(connection, _):
            connection.execute("PRAGMA foreign_keys=ON")
    return engine


def make_sessions(engine):
    return sessionmaker(bind=engine, expire_on_commit=False)
